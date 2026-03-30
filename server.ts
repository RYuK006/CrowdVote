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

  app.get("/api/constituencies", (req, res) => {
    res.json(CONSTITUENCIES);
  });

  app.get("/api/constituencies/:id", (req, res) => {
    res.json(CONSTITUENCY_DETAILS[req.params.id] || null);
  });

  // Middleware to authenticate
  async function authenticateToken(req: any, res: any, next: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const token = authHeader.split('Bearer ')[1];
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  app.post("/api/predict", authenticateToken, async (req: any, res: any) => {
    const { constituencyId, predictedParty, confidence } = req.body;
    const uid = req.user.uid;
    const name = req.user.name || req.user.phone_number || req.user.email || 'User';

    try {
      // Create user if not exists
      const userRef = db.collection('users').doc(uid);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        await userRef.set({
          uid,
          displayName: name,
          predictabilityScore: 0,
          influencePoints: 0
        });
      }

      const predId = `${uid}_${constituencyId}`;
      await db.collection("predictions").doc(predId).set({
        userId: uid,
        constituencyId,
        predictedParty,
        confidence,
        timestamp: new Date().toISOString(),
        weight: confidence / 100 // Normalized weight factor
      });

      res.json({ success: true, message: "Prediction locked via backend" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/leaderboard/:id", async (req: any, res: any) => {
    if (!db) return res.json([]);
    const id = req.params.id;
    try {
      const predsSnap = await db.collection("predictions").where("constituencyId", "==", id).limit(10).get();
      const userIds = predsSnap.docs.map(i => i.data().userId);
      if (userIds.length === 0) return res.json([]);
      
      const usersSnap = await db.collection("users").where("uid", "in", userIds.slice(0, 10)).get();
      const users = usersSnap.docs.map(doc => doc.data());
      // Sort by points (leaderboard logic)
      users.sort((a, b) => b.predictabilityScore - a.predictabilityScore);
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/activity/global", async (req: any, res: any) => {
    if (!db) return res.json([]);
    try {
      const snap = await db.collection("predictions").orderBy("timestamp", "desc").limit(10).get();
      res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/user/predictions", authenticateToken, async (req: any, res: any) => {
    if (!db) return res.json({});
    const uid = req.user.uid;
    try {
      const snap = await db.collection("predictions").where("userId", "==", uid).get();
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
      const snap = await db.collection("predictions").get();
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
