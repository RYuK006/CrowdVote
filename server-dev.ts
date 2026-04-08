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
  let serviceAccount: any;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log("📡 Using Firebase Service Account from environment variables");
  } else {
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      console.log("📂 Using Firebase Service Account from local file");
    } else {
      console.warn("⚠️ No service account credentials found. Backend will run in restricted mode.");
    }
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log("🔥 Firebase Admin Initialized");
  }
} catch (error) {
  console.error("Failed to init Firebase Admin:", error);
}

const CURRENT_PHASE: "pre_election" | "campaign" | "final" | "exit" = "pre_election";

// In-Memory Data Structures
let CONSTITUENCIES: any[] = [];
let CONSTITUENCY_DETAILS: Record<string, any> = {};

function initData() {
  const results: any[] = [];
  const csvPath = path.join(process.cwd(), 'server', 'data', 'master_data.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error("❌ Master data CSV not found at:", csvPath);
    return;
  }

  fs.createReadStream(csvPath)
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
        population: "N/A",
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

const app = express();
app.use(express.json());

// Initialize data
initData();

// Middleware to authenticate
async function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
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
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.email !== "aaronalexmathew48@gmail.com") {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
}

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

app.get("/api/user/check", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  const uid = req.user.uid;
  const email = req.user.email || "";
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const exists = userDoc.exists;
    const userData = userDoc.data();
    const isAdmin = (email === "aaronalexmathew48@gmail.com");
    res.json({ exists, uid, isAdmin, user: exists ? userData : null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/user/register", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  const { displayName } = req.body;
  const uid = req.user.uid;
  const email = req.user.email || "";
  try {
    await db.collection('users').doc(uid).set({
      uid, displayName, email, createdAt: new Date().toISOString()
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
      const userDoc = await transaction.get(userRef);
      const predictionDoc = await transaction.get(predictionRef);
      if (predictionDoc.exists) throw new Error("ALREADY_LOCKED");

      if (!userDoc.exists) {
        transaction.set(userRef, { uid, displayName: "Neural Predictor", createdAt: new Date().toISOString() });
      }

      const predictionData: any = {
        constituencyId, predictedParty, confidence,
        timestamp: new Date().toISOString(), phase: CURRENT_PHASE
      };
      if (predictedCandidate) predictionData.predictedCandidate = predictedCandidate;
      transaction.set(predictionRef, predictionData);

      const globalPredRef = db.collection("global_predictions").doc();
      const globalPredictionData: any = {
        constituencyId, predictedParty, confidence,
        userId: uid, timestamp: new Date().toISOString()
      };
      if (predictedCandidate) globalPredictionData.predictedCandidate = predictedCandidate;
      transaction.set(globalPredRef, globalPredictionData);
    });
    res.json({ success: true, message: "Prediction synced to neural mesh." });
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
    const predsSnap = await db.collectionGroup("predictions").get();
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
    
    res.json({ partyShare: partyVotes, districtStats: districtList.sort((a, b) => b.count - a.count), totalSignals: predsSnap.size });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Routes (Simplified for restoration)
app.get("/api/admin/metrics", authenticateToken, requireAdmin, async (req: any, res: any) => {
  res.json({ message: "Metrics endpoint" });
});

// --- VITE MIDDLEWARE ---
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then(vite => {
    app.use(vite.middlewares);
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Only listen locally, Vercel handles the serverless execution
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
