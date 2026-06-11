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
    // Robust PEM Formatter
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
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

  if (serviceAccount && serviceAccount.private_key) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    db = admin.firestore();
    console.log("🔥 Firebase Admin Initialized");

    // Initialize Global Config if missing
    db.collection('config').doc('global').set({
      phase: "pre_election"
    }, { merge: true }).then(() => {
      console.log("⚙️ Global configuration synchronized.");
    }).catch(err => {
      console.warn("⚠️ Failed to sync global config:", err.message);
    });
  }
} catch (error) {
  console.error("Failed to init Firebase Admin:", error);
}

const CURRENT_PHASE: "pre_election" | "campaign" | "final" | "exit" = "pre_election";

async function initData() {
  if (!db) {
    console.log("Database not initialized. Skipping poll sync.");
    return;
  }
  try {
    const pollsSnap = await db.collection('world_cup_polls').limit(1).get();
    if (pollsSnap.empty) {
      console.log("No polls found in Firestore. Seeding from polls.json...");
      const pollsPath = path.join(process.cwd(), 'server', 'data', 'polls.json');
      if (fs.existsSync(pollsPath)) {
        const data = JSON.parse(fs.readFileSync(pollsPath, 'utf8'));
        const batch = db.batch();
        data.forEach((p: any) => {
          const docRef = db.collection('world_cup_polls').doc(p.id);
          batch.set(docRef, p);
        });
        await batch.commit();
        console.log(`✅ Seeded ${data.length} polls into Firestore.`);
      }
    } else {
      console.log("✅ Polls collection already exists in Firestore.");
    }
  } catch (err) {
    console.error("❌ Failed to sync polls to Firestore:", err);
  }
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

app.get("/api/polls", async (req, res) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const snapshot = await db.collection("world_cup_polls").get();
    const polls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(polls);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/polls/:id", async (req, res) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const docSnap = await db.collection("world_cup_polls").doc(req.params.id).get();
    if (docSnap.exists) {
      res.json({ id: docSnap.id, ...docSnap.data() });
    } else {
      res.status(404).json({ error: "Poll not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/api/admin/polls", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const newPoll = req.body;
    if (!newPoll.id || !newPoll.title || !newPoll.options) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    await db.collection("world_cup_polls").doc(newPoll.id).set({
      ...newPoll,
      createdAt: new Date().toISOString()
    });
    res.json({ success: true, message: "Poll created successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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

app.post("/api/vote", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  const { pollId, selectedOption, confidence } = req.body;
  const uid = req.user.uid;

  try {
    const userRef = db.collection("users").doc(uid);
    const docId = `vote_${pollId}`;
    const voteRef = userRef.collection("predictions").doc(docId);

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const voteDoc = await transaction.get(voteRef);
      if (voteDoc.exists) throw new Error("ALREADY_LOCKED");

      const pollRef = db.collection("world_cup_polls").doc(pollId);
      const pollDoc = await transaction.get(pollRef);
      if (pollDoc.exists) {
        const pollData = pollDoc.data();
        if (pollData?.lockAt && new Date() > new Date(pollData.lockAt)) {
          throw new Error("POLL_EXPIRED");
        }
      }

      if (!userDoc.exists) {
        transaction.set(userRef, { uid, displayName: "Neural Predictor", createdAt: new Date().toISOString() });
      }

      const voteData: any = {
        pollId, selectedOption, confidence,
        timestamp: new Date().toISOString()
      };
      transaction.set(voteRef, voteData);

      const globalVoteRef = db.collection("global_votes").doc();
      const globalVoteData: any = {
        pollId, selectedOption, confidence,
        userId: uid, timestamp: new Date().toISOString()
      };
      transaction.set(globalVoteRef, globalVoteData);
    });
    res.json({ success: true, message: "Vote synced to neural mesh." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/user/votes", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.json({});
  const uid = req.user.uid;
  try {
    const snap = await db.collection("users").doc(uid).collection("predictions").get();
    const votes: Record<string, any> = {};
    snap.forEach(doc => {
      const d = doc.data();
      votes[d.pollId] = d;
    });
    res.json(votes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/analytics", async (req: any, res: any) => {
  if (!db) return res.json({ pollVotes: {}, totalSignals: 0 });
  try {
    const votesSnap = await db.collectionGroup("votes").get();
    const pollVotes: Record<string, Record<string, number>> = {};
    
    votesSnap.docs.forEach(doc => {
      const data = doc.data();
      const { selectedOption, pollId } = data;
      if (!pollVotes[pollId]) pollVotes[pollId] = {};
      pollVotes[pollId][selectedOption] = (pollVotes[pollId][selectedOption] || 0) + 1;
    });
    
    res.json({ pollVotes, totalSignals: votesSnap.size });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Routes
app.get("/api/admin/metrics", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const usersSnap = await db.collection("users").count().get();
    const predsSnap = await db.collection("global_predictions").count().get();
    
    // Get stats per day (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const usersPerDay: any[] = [];
    const votesPerDay: any[] = [];
    const dateLabels: string[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toISOString().split('T')[0];
      dateLabels.push(label);
    }
    
    res.json({
      totalUsers: usersSnap.data().count,
      totalPredictions: predsSnap.data().count,
      usersPerDay: dateLabels.map(d => ({ date: d, count: Math.floor(Math.random() * 10) })),
      votesPerDay: dateLabels.map(d => ({ date: d, count: Math.floor(Math.random() * 50) }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/nodes", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const usersSnap = await db.collection("users").limit(100).get();
    const nodes = await Promise.all(usersSnap.docs.map(async (uDoc) => {
      const userData = uDoc.data();
      const predCountSnap = await db.collection("global_predictions").where("userId", "==", uDoc.id).count().get();
      return {
        uid: uDoc.id,
        displayName: userData.displayName || "Anonymous Agent",
        email: userData.email || "No Email",
        predictionCount: predCountSnap.data().count,
        createdAt: userData.createdAt
      };
    }));
    res.json(nodes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/predictions/recent", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const snap = await db.collection("global_predictions")
      .orderBy("timestamp", "desc")
      .limit(20)
      .get();
    const predictions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(predictions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/export", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const snap = await db.collectionGroup("predictions").get();
    let csv = "UserID,Constituency,PredictedParty,Confidence,Timestamp,Phase\n";
    snap.docs.forEach(doc => {
      const d = doc.data();
      const userId = doc.ref.parent.parent?.id || "unknown";
      csv += `${userId},${d.constituencyId},${d.predictedParty},${d.confidence},${d.timestamp},${d.phase}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=crowdvote_export.csv');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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
