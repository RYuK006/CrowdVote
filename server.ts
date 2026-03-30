import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from 'firebase-admin';
import * as fs from 'fs';
import csvParser from 'csv-parser';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let db: admin.firestore.Firestore;
try {
  const serviceAccount = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'serviceAccountKey.json'), 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  db = admin.firestore();
  console.log("🔥 Firebase Admin Initialized");
} catch (error) {
  console.error("Failed to init Firebase Admin:", error);
}

const CURRENT_PHASE = "pre_election";

// In-Memory Data Structures
let CONSTITUENCIES: any[] = [];
let CONSTITUENCY_DETAILS: Record<string, any> = {};

function initData() {
  const results: any[] = [];
  
  fs.createReadStream(path.join(process.cwd(), 'server', 'data', 'master_data.csv'))
    .pipe(csvParser())
    .on('data', (row) => {
      const id = String(row['Constituency_ID']);
      const name = row['Constituency_Name'];
      const district = row['District'];
      
      CONSTITUENCIES.push({ id, name, district });
      
      const othersText = row['2026_OTH_Candidates'];
      const othersList = othersText && othersText.trim() !== "" ? othersText.split(' | ') : [];

      CONSTITUENCY_DETAILS[id] = {
        population: "N/A", // Hard to infer
        demographics: { male: "N/A", female: "N/A", others: "N/A" },
        results2021: {
          winner: { name: row['2021_Winner_Name'], front: row['2021_Winner_Front'], votes: row['2021_Winner_TotalVotes'] },
          runnerUp: { name: row['2021_RunnerUp_Name'], front: "N/A", votes: row['2021_RunnerUp_TotalVotes'] },
          margin: row['2021_Margin'],
          turnout: row['2021_Turnout'],
          electors: row['2021_Electors']
        },
        candidates2026: {
          ldf: { name: row['2026_LDF_Candidate'], party: row['2026_LDF_Party'] },
          udf: { name: row['2026_UDF_Candidate'], party: row['2026_UDF_Party'] },
          nda: { name: row['2026_NDA_Candidate'], party: row['2026_NDA_Party'] },
          others: othersList
        }
      };
    })
    .on('end', () => {
      console.log(`✅ Loaded ${CONSTITUENCIES.length} constituencies into memory.`);
    });
}
initData();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- ADMIN API ROUTES (Registered Early) ---

  app.get("/api/admin/metrics", authenticateToken, requireAdmin, async (req: any, res: any) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    try {
      // Fetch all users and predictions
      const [usersSnap, predsSnap] = await Promise.all([
        db.collection("users").get(),
        db.collectionGroup("predictions").get()
      ]);

      const users = usersSnap.docs.map(d => d.data());
      const preds = predsSnap.docs.map(d => d.data());

      const groupByDate = (data: any[], dateField: string) => {
        const groups: Record<string, number> = {};
        data.forEach(item => {
          const date = item[dateField]?.split('T')[0];
          if (date) groups[date] = (groups[date] || 0) + 1;
        });
        return Object.entries(groups).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
      };

      const groupByHour = (data: any[], dateField: string) => {
        const groups: Record<string, number> = {};
        data.forEach(item => {
           const timestamp = item[dateField];
           if (timestamp) {
             const hour = new Date(timestamp).getHours();
             groups[hour] = (groups[hour] || 0) + 1;
           }
        });
        return Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, count: groups[i] || 0 }));
      };

      res.json({
        totalUsers: users.length,
        totalPredictions: preds.length,
        votesPerDay: groupByDate(preds, 'timestamp'),
        votesPerHour: groupByHour(preds, 'timestamp'),
        usersPerDay: groupByDate(users, 'createdAt')
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/nodes", authenticateToken, requireAdmin, async (req: any, res: any) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    try {
      const usersSnap = await db.collection("users").get();
      const users: any[] = [];
      
      for (const doc of usersSnap.docs) {
        const userData = doc.data();
        const predsSnap = await doc.ref.collection("predictions").get();
        users.push({
          ...userData,
          predictionCount: predsSnap.size
        });
      }
      
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/export", authenticateToken, requireAdmin, async (req: any, res: any) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    try {
      const predsSnap = await db.collectionGroup("predictions").get();
      const userCache: Record<string, any> = {};
      
      const csvRows = [
        "User_ID,Phone_Number,Constituency_ID,Predicted_Party,Confidence,Timestamp,Phase"
      ];

      for (const doc of predsSnap.docs) {
        const pred = doc.data();
        const userId = doc.ref.parent.parent?.id;
        
        if (userId && !userCache[userId]) {
          const userDoc = await db.collection("users").doc(userId).get();
          userCache[userId] = userDoc.data() || { phoneNumber: "Unknown" };
        }
        
        const user = userCache[userId || ""] || { phoneNumber: "Unknown" };
        
        csvRows.push([
          userId,
          user.phoneNumber,
          pred.constituencyId,
          pred.predictedParty,
          pred.confidence,
          pred.timestamp,
          pred.phase
        ].join(','));
      }

      const csvContent = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=crowdvote_predictions_export.csv');
      res.send(csvContent);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/constituencies", (req, res) => {
    res.json(CONSTITUENCIES);
  });

  app.get("/api/constituencies/:id", (req, res) => {
    res.json(CONSTITUENCY_DETAILS[req.params.id] || null);
  });

  // Middleware to authenticate
  async function authenticateToken(req: any, res: any, next: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.log("[DEBUG] Auth failed: No Bearer token");
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const token = authHeader.split('Bearer ')[1];
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      console.error("[DEBUG] Token verification failed:", error);
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  // Middleware to require admin privileges
  async function requireAdmin(req: any, res: any, next: any) {
    if (!req.user) {
      console.log("[DEBUG] Admin check failed: No user in request");
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const adminDoc = await db.collection("admins").doc(req.user.uid).get();
      if (!adminDoc.exists) {
        console.log(`[DEBUG] Admin check failed: UID ${req.user.uid} not in admins collection`);
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
      next();
    } catch (error) {
      console.error("[DEBUG] Admin check error:", error);
      res.status(500).json({ error: 'Internal Server Error during admin check' });
    }
  }

  app.post("/api/admin/config", authenticateToken, requireAdmin, async (req: any, res: any) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    try {
      const updates = req.body;
      await db.collection("config").doc("global").update({
        ...updates,
        lastUpdated: new Date().toISOString(),
        updatedBy: req.user.uid
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/user/check", authenticateToken, async (req: any, res: any) => {
    const uid = req.user.uid;
    const phoneNumber = req.user.phone_number || "";
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      const exists = userDoc.exists;
      const userData = userDoc.data();
      
      // Check admins collection
      const adminDoc = await db.collection("admins").doc(uid).get();
      const isAdmin = adminDoc.exists;
      
      console.log(`[DEBUG] Check User: ${uid}, isAdmin: ${isAdmin}`);
      
      res.json({ 
        exists, 
        uid, 
        isAdmin,
        user: exists ? userData : null 
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/user/register", authenticateToken, async (req: any, res: any) => {
    const { displayName } = req.body;
    const uid = req.user.uid;
    const phoneNumber = req.user.phone_number || "";

    try {
      await db.collection('users').doc(uid).set({
        uid,
        displayName,
        phoneNumber,
        predictabilityScore: 0,
        influencePoints: 100,
        createdAt: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/predict", authenticateToken, async (req: any, res: any) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    const { constituencyId, predictedParty, confidence } = req.body;
    const uid = req.user.uid;

    try {
      const docId = `${CURRENT_PHASE}_${constituencyId}`;
      const docRef = db.collection("users").doc(uid).collection("predictions").doc(docId);
      const existingDoc = await docRef.get();
      
      if (existingDoc.exists) {
        return res.status(400).json({ error: "Prediction already locked for this phase and constituency." });
      }

      await docRef.set({
        constituencyId,
        predictedParty,
        confidence,
        timestamp: new Date().toISOString(),
        phase: CURRENT_PHASE
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/leaderboard/:id", async (req: any, res: any) => {
    if (!db) return res.json([]);
    const id = req.params.id;
    try {
      // Use collectionGroup to find predictions for this constituency across all users
      const predsSnap = await db.collectionGroup("predictions")
        .where("constituencyId", "==", id)
        .orderBy("timestamp", "desc")
        .limit(20)
        .get();
      
      const userIds = new Set<string>();
      predsSnap.docs.forEach(doc => {
        // Parent of 'predictions' doc is 'users/{uid}'
        const userId = doc.ref.parent.parent?.id;
        if (userId) userIds.add(userId);
      });

      if (userIds.size === 0) return res.json([]);
      
      const usersSnap = await db.collection("users").where("uid", "in", Array.from(userIds).slice(0, 10)).get();
      const users = usersSnap.docs.map(doc => doc.data());
      users.sort((a, b) => b.predictabilityScore - a.predictabilityScore);
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/activity/global", async (req: any, res: any) => {
    if (!db) return res.json([]);
    try {
      const snap = await db.collectionGroup("predictions").orderBy("timestamp", "desc").limit(15).get();
      res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data(), userId: doc.ref.parent.parent?.id })));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/user/predictions", authenticateToken, async (req: any, res: any) => {
    if (!db) return res.json({});
    const uid = req.user.uid;
    try {
      const snap = await db.collection("users").doc(uid).collection("predictions").get();
      const preds: Record<string, any> = {};
      snap.forEach(doc => {
        const d = doc.data();
        preds[d.constituencyId] = d;
      });
      res.json(preds);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/analytics", async (req: any, res: any) => {
    if (!db) return res.json({ partyShare: [], districtStats: [] });
    try {
      const snap = await db.collectionGroup("predictions").get();
      const predictions = snap.docs.map(d => d.data());
      
      const partyWeights: Record<string, number> = {};
      const districtMap: Record<string, Record<string, number>> = {};
      
      predictions.forEach(p => {
        const weight = p.weight || (p.confidence ? p.confidence / 100 : 0.5);
        partyWeights[p.predictedParty] = (partyWeights[p.predictedParty] || 0) + weight;
        
        const constituency = CONSTITUENCIES.find(c => c.id === p.constituencyId);
        if (constituency) {
          if (!districtMap[constituency.district]) districtMap[constituency.district] = {};
          districtMap[constituency.district][p.predictedParty] = (districtMap[constituency.district][p.predictedParty] || 0) + weight;
        }
      });
      
      const districtList = Object.entries(districtMap).map(([name, counts]) => {
        const winner = Object.entries(counts).reduce((a, b) => b[1] > a[1] ? b : a, ["", 0]);
        return { name, winner: winner[0], count: Math.round(winner[1] * 10) / 10 };
      });

      res.json({
        partyShare: partyWeights,
        districtStats: districtList.sort((a, b) => b.count - a.count),
        totalSignals: predictions.length
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/leaderboard/global", async (req: any, res: any) => {
    if (!db) return res.json([]);
    try {
      const snap = await db.collection("users").orderBy("predictabilityScore", "desc").limit(50).get();
      const users = snap.docs.map(doc => doc.data());
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });



  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
