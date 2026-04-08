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

const CURRENT_PHASE: "pre_election" | "campaign" | "final" | "exit" = "pre_election";



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
      const state = row['State'];
      const district = row['District'];
      
      CONSTITUENCIES.push({ id, name, state, district });
      
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
        "User_ID,Email,Constituency_ID,Predicted_Party,Confidence,Timestamp,Phase"
      ];

      for (const doc of predsSnap.docs) {
        const pred = doc.data();
        const userId = doc.ref.parent.parent?.id;
        
        if (userId && !userCache[userId]) {
          const userDoc = await db.collection("users").doc(userId).get();
          userCache[userId] = userDoc.data() || { email: "Unknown" };
        }
        
        const user = userCache[userId || ""] || { email: "Unknown" };
        
        csvRows.push([
          userId,
          user.email,
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
    // STRICT ADMIN ENFORCEMENT
    if (req.user.email !== "aaronalexmathew48@gmail.com") {
      console.log(`[DEBUG] Admin check failed: Email ${req.user.email} is not authorized.`);
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  }

  app.post("/api/admin/config", authenticateToken, requireAdmin, async (req: any, res: any) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    try {
      const updates = req.body;
      await db.collection("config").doc("global").set({
        ...updates,
        lastUpdated: new Date().toISOString(),
        updatedBy: req.user.uid
      }, { merge: true });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/predictions/recent", authenticateToken, requireAdmin, async (req: any, res: any) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    try {
      const predictionsSnap = await db.collectionGroup("predictions")
        .orderBy("timestamp", "desc")
        .limit(15)
        .get();
      
      const predictions = predictionsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      res.json(predictions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/user/check", authenticateToken, async (req: any, res: any) => {
    const uid = req.user.uid;
    const email = req.user.email || "";
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      const exists = userDoc.exists;
      const userData = userDoc.data();
      
      const isAdmin = (email === "aaronalexmathew48@gmail.com");
      
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
    const email = req.user.email || "";

    try {
      await db.collection('users').doc(uid).set({
        uid,
        displayName,
        email,
        createdAt: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/predict", authenticateToken, async (req: any, res: any) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    const { constituencyId, predictedParty, predictedCandidate, confidence } = req.body;
    const uid = req.user.uid;



    try {
      const userRef = db.collection("users").doc(uid);
      const docId = `${CURRENT_PHASE}_${constituencyId}`;
      const predictionRef = userRef.collection("predictions").doc(docId);

      await db.runTransaction(async (transaction) => {
        // 1. ALL READS FIRST (Strict Firestore Rule)
        const userDoc = await transaction.get(userRef);
        const predictionDoc = await transaction.get(predictionRef);

        // 3. Logic & Validations
        if (predictionDoc.exists) {
          throw new Error("ALREADY_LOCKED");
        }

        // 3. ALL WRITES AFTER ALL READS
        if (!userDoc.exists) {
          // Auto-register session user
          transaction.set(userRef, {
            uid,
            displayName: "Neural Predictor",
            createdAt: new Date().toISOString()
          });
        }

        // 4. All WRITES after all reads
        const predictionData: any = {
          constituencyId,
          predictedParty,
          confidence,
          timestamp: new Date().toISOString(),
          phase: CURRENT_PHASE
        };
        if (predictedCandidate) {
          predictionData.predictedCandidate = predictedCandidate;
        }
        transaction.set(predictionRef, predictionData);

        const globalPredRef = db.collection("global_predictions").doc();
        const globalPredictionData: any = {
          constituencyId,
          predictedParty,
          confidence,
          userId: uid,
          timestamp: new Date().toISOString()
        };
        if (predictedCandidate) {
          globalPredictionData.predictedCandidate = predictedCandidate;
        }
        transaction.set(globalPredRef, globalPredictionData);
      });

      res.json({ success: true, message: "Prediction synced to neural mesh." });
    } catch (err: any) {
      if (err.message === "ALREADY_LOCKED") {
        return res.status(400).json({ error: "Prediction already locked for this phase and constituency." });
      }
      console.error("Predict logic error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/leaderboard/:id", async (req: any, res: any) => {
    if (!db) return res.json([]);
    const id = req.params.id;
    try {
      const predsSnap = await db.collection("global_predictions")
        .where("constituencyId", "==", id)
        .limit(20)
        .get();
      
      const docs = predsSnap.docs.map(doc => doc.data());
      docs.sort((a: any, b: any) => (b.timestamp || "").localeCompare(a.timestamp || ""));

      const userIds = Array.from(new Set(docs.map((d: any) => d.userId))).filter(uid => !!uid);
      if (userIds.length === 0) return res.json([]);
      
      const users: any[] = [];
      const userRefs = userIds.slice(0, 10).map((uid: string) => db.collection("users").doc(uid));
      
      if (userRefs.length > 0) {
        const userDocs = await db.getAll(...userRefs);
        userDocs.forEach(uDoc => {
          if (uDoc.exists) users.push(uDoc.data());
        });
      }
      
      users.sort((a: any, b: any) => (b.predictionCount || 0) - (a.predictionCount || 0));
      res.json(users);
    } catch (err: any) {
      console.error("Leaderboard error:", err);
      res.json([]); // Return empty array on error to prevent frontend crash
    }
  });

  app.get("/api/activity/global", async (req: any, res: any) => {
    if (!db) return res.json([]);
    try {
      const snap = await db.collection("global_predictions").limit(50).get();
      const docs = snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data()
      }));
      docs.sort((a: any, b: any) => (b.timestamp || "").localeCompare(a.timestamp || ""));
      res.json(docs.slice(0, 15));
    } catch (err: any) {
      console.error("Global activity error:", err);
      res.json([]); // Return empty array on error
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
      const predsSnap = await db.collection("predictions").get();
      const partyVotes: Record<string, number> = {};
      const districtMap: Record<string, Record<string, number>> = {};
      
      predsSnap.docs.forEach(doc => {
        const data = doc.data();
        const { predictedParty, constituencyId } = data;
        
        partyVotes[predictedParty] = (partyVotes[predictedParty] || 0) + 1;
        
        const constituency = CONSTITUENCIES.find(c => c.id === constituencyId);
        if (constituency) {
          if (!districtMap[constituency.district]) districtMap[constituency.district] = {};
          districtMap[constituency.district][predictedParty] = (districtMap[constituency.district][predictedParty] || 0) + 1;
        }
      });
      
      const districtList = Object.entries(districtMap).map(([name, counts]) => {
        const winner = Object.entries(counts).reduce((a, b) => b[1] > a[1] ? b : a, ["", 0]);
        return { name, winner: winner[0], count: winner[1] };
      });
      
      const totalSignals = predsSnap.size;

      res.json({
        partyShare: partyVotes,
        districtStats: districtList.sort((a, b) => b.count - a.count),
        totalSignals
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/leaderboard/global", async (req: any, res: any) => {
    if (!db) return res.json([]);
    try {
      const snap = await db.collection("users").orderBy("predictionCount", "desc").limit(50).get();
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
