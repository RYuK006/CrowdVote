import express from "express";
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
    
    // Robust PEM Formatter: Fixes mangled newlines in the private key
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
    // Only initialize if we haven't already (prevents multiple app errors in serverless)
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

  } else {
    console.error("❌ Firebase Admin could not be initialized: Missing private_key");
  }
} catch (error) {
  console.error("Failed to init Firebase Admin:", error);
}

const CURRENT_PHASE: "pre_election" | "campaign" | "final" | "exit" = "pre_election";

let accuracyMap: Record<string, number> = {};
function loadAccuracyScores() {
  const targetPath = path.join(__dirname, '..', 'result.csv');
  if (fs.existsSync(targetPath)) {
    fs.createReadStream(targetPath)
      .pipe(csvParser())
      .on('data', (row: any) => {
        const email = row['Email'];
        const score = parseInt(row['Accuracy Points'], 10);
        if (email && !isNaN(score)) {
          accuracyMap[email] = score === 0 ? 100 : score;
        }
      })
      .on('end', () => {
        console.log(`Loaded ${Object.keys(accuracyMap).length} accuracy scores from result.csv`);
      });
  } else {
    console.warn("⚠️ result.csv not found at", targetPath);
  }
}
loadAccuracyScores();

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
const ADMIN_EMAILS = ["aaronalexmathew48@gmail.com", "prems4u@gmail.com"];

async function requireAdmin(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (!ADMIN_EMAILS.includes(req.user.email)) {
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
      const pollData = docSnap.data();
      
      const votesSnap = await db.collection("global_votes").where("pollId", "==", req.params.id).get();
      
      const userIds = [...new Set(votesSnap.docs.map((doc: any) => doc.data().userId))];
      const userScores: Record<string, number> = {};
      
      if (userIds.length > 0) {
        const usersSnap = await db.collection("users").get();
        usersSnap.docs.forEach((d: any) => {
          const u = d.data();
          const email = u.email;
          if (email && accuracyMap[email] !== undefined) {
            userScores[d.id] = accuracyMap[email];
          } else {
            userScores[d.id] = 100;
          }
        });
      }

      const optionScores: Record<string, number> = {};
      votesSnap.docs.forEach((doc: any) => {
        const vote = doc.data();
        const userScore = userScores[vote.userId] || 0;
        optionScores[vote.selectedOption] = (optionScores[vote.selectedOption] || 0) + userScore;
      });

      res.json({ id: docSnap.id, ...pollData, optionScores });
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

app.put("/api/admin/polls/:id", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const pollId = req.params.id;
    const updates = req.body;
    
    await db.collection("world_cup_polls").doc(pollId).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    res.json({ success: true, message: "Poll updated successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/polls/:id", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const pollId = req.params.id;
    await db.collection("world_cup_polls").doc(pollId).delete();
    res.json({ success: true, message: "Poll deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/polls/:id/resolve", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const pollId = req.params.id;
    const { winningOptionId } = req.body;
    
    // Update the poll
    await db.collection("world_cup_polls").doc(pollId).update({
      status: "closed",
      winningOptionId,
      resolvedAt: new Date().toISOString()
    });

    // Distribute points
    const votesSnapshot = await db.collection("global_votes").where("pollId", "==", pollId).get();
    
    const batch = db.batch();
    votesSnapshot.docs.forEach((doc: any) => {
      const vote = doc.data();
      if (vote.selectedOption === winningOptionId) {
        const userRef = db.collection("users").doc(vote.userId);
        // We use FieldValue.increment to safely add points
        batch.update(userRef, {
          points: require("firebase-admin/firestore").FieldValue.increment(100),
          correctPredictions: require("firebase-admin/firestore").FieldValue.increment(1)
        });
      }
    });

    await batch.commit();

    res.json({ success: true, message: "Poll resolved and points distributed successfully" });
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
    const isAdmin = ADMIN_EMAILS.includes(email);
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

app.get("/api/leaderboard/global", async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const usersSnap = await db.collection("users").get();
    let users = usersSnap.docs.map((doc: any) => doc.data());
    users.sort((a: any, b: any) => {
      const aTotal = (a.points || 0) + (a.score || 0);
      const bTotal = (b.points || 0) + (b.score || 0);
      if (aTotal !== bTotal) return bTotal - aTotal;
      const aCount = a.predictionCount || 0;
      const bCount = b.predictionCount || 0;
      return bCount - aCount;
    });
    // Attach the combined points back to the user object so the frontend displays it
    const rankedUsers = users.slice(0, 100).map((u: any) => ({
      ...u,
      points: (u.points || 0) + (u.score || 0)
    }));
    res.json(rankedUsers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/analytics", async (req: any, res: any) => {
  if (!db) return res.json({ pollVotes: {}, totalSignals: 0, globalWinRate: 0 });
  try {
    const votesSnap = await db.collection("global_votes").get();
    const pollVotes: Record<string, Record<string, number>> = {};
    
    votesSnap.docs.forEach((doc: any) => {
      const data = doc.data();
      const { selectedOption, pollId } = data;
      if (!pollVotes[pollId]) pollVotes[pollId] = {};
      pollVotes[pollId][selectedOption] = (pollVotes[pollId][selectedOption] || 0) + 1;
    });
    
    // Simulate a global win-rate for resolved polls
    const globalWinRate = votesSnap.size > 0 ? 68.4 : 0;

    res.json({ pollVotes, totalSignals: votesSnap.size, globalWinRate });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Routes
app.get("/api/admin/metrics", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const usersSnap = await db.collection("users").count().get();
    const predsSnap = await db.collection("global_votes").count().get();
    
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
    
    // In a real high-scale app, we'd use aggregation or scheduled counts.
    // For this context, we'll provide the global totals and mock the trends for visual consistency.
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
    const nodes = usersSnap.docs.map((uDoc) => {
      const userData = uDoc.data();
      return {
        uid: uDoc.id,
        displayName: userData.displayName || "Anonymous Agent",
        email: userData.email || "No Email",
        predictionCount: userData.predictionCount || 0,
        createdAt: userData.createdAt
      };
    });
    res.json(nodes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/predictions/recent", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const snap = await db.collection("global_votes")
      .orderBy("timestamp", "desc")
      .limit(20)
      .get();
    const predictions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(predictions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/nodes/:uid/activity", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const uid = req.params.uid;
    const [worldCupSnap, electionSnap] = await Promise.all([
      db.collection("global_votes").where("userId", "==", uid).get(),
      db.collection("global_predictions").where("userId", "==", uid).get()
    ]);
    
    const worldCupVotes = worldCupSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const electionPredictions = electionSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    res.json({ worldCupVotes, electionPredictions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/export", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const snap = await db.collection("global_votes").get();
    
    const usersSnap = await db.collection("users").get();
    const usersMap = new Map();
    usersSnap.docs.forEach(doc => usersMap.set(doc.id, doc.data()));

    const pollsSnap = await db.collection("world_cup_polls").get();
    const pollsMap = new Map();
    pollsSnap.docs.forEach(doc => pollsMap.set(doc.id, doc.data()));

    let csv = "UserName,Email,AccuracyScore,PollName,SelectedOption,Timestamp\n";
    snap.docs.forEach(doc => {
      const d = doc.data();
      const user = usersMap.get(d.userId) || {};
      const userName = user.displayName || user.email || d.userId;
      const userEmail = user.email || "Unknown";
      const accuracyScore = user.accuracyScore !== undefined ? user.accuracyScore : 100;
      
      const poll = pollsMap.get(d.pollId);
      const pollName = poll ? poll.title : d.pollId;
      let optionName = d.selectedOption;
      if (poll && poll.options) {
        const opt = poll.options.find((o: any) => o.id === d.selectedOption);
        if (opt) optionName = opt.name || opt.text;
      }
      
      const safeUserName = `"${String(userName).replace(/"/g, '""')}"`;
      const safeEmail = `"${String(userEmail).replace(/"/g, '""')}"`;
      const safePollName = `"${String(pollName).replace(/"/g, '""')}"`;
      const safeOptionName = `"${String(optionName).replace(/"/g, '""')}"`;

      csv += `${safeUserName},${safeEmail},${accuracyScore},${safePollName},${safeOptionName},${d.timestamp}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=crowdvote_export.csv');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/results/actual", (req, res) => {
  const results: any[] = [];
  const csvPath = path.join(process.cwd(), 'kerala_election_results_2026.csv');
  
  if (!fs.existsSync(csvPath)) {
    return res.json([]);
  }

  fs.createReadStream(csvPath)
    .pipe(csvParser())
    .on('data', (row) => {
      results.push(row);
    })
    .on('end', () => {
      res.json(results);
    });
});

// --- VITE MIDDLEWARE ---
// In production on Vercel, static files are handled by vercel.json rewrites.
const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Only listen locally, Vercel handles the serverless execution
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
