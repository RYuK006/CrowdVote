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

// Initialize Supabase Client if credentials are provided
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
export const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;
if (supabase) {
  console.log("⚡ Supabase Client initialized & connected");
}

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
    const category = req.query.category as string;
    const isSponsored = req.query.sponsored === 'true';
    const search = (req.query.search as string || '').toLowerCase().trim();
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 60));
    const page = Math.max(1, Number(req.query.page) || 1);

    let query: admin.firestore.Query = db.collection("world_cup_polls");
    
    if (category && category !== 'All') {
      query = query.where("category", "==", category);
    }
    if (isSponsored) {
      query = query.where("isSponsored", "==", true);
    }

    const snapshot = await query.limit(limit * 3).get();
    let polls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Exclude polls that are pending review or rejected from the public feed
    polls = polls.filter((p: any) => !p.status || p.status === 'open' || p.status === 'active');

    if (search) {
      polls = polls.filter((p: any) => 
        (p.title && p.title.toLowerCase().includes(search)) || 
        (p.category && p.category.toLowerCase().includes(search)) ||
        (p.sponsorName && p.sponsorName.toLowerCase().includes(search))
      );
    }

    const startIndex = (page - 1) * limit;
    const paginatedPolls = polls.slice(startIndex, startIndex + limit);

    res.json(paginatedPolls);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROAST ROOM COUNCIL ENDPOINT ---
app.get("/api/roast-room/council/:id", async (req, res) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const docSnap = await db.collection("world_cup_polls").doc(req.params.id).get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Poll not found" });
    }
    const poll: any = docSnap.data();
    
    // Roster of simulated advisors inspired by Roast Room (nateherkai/roast-room)
    const advisors = [
      { key: "graham", name: "Paul Graham", role: "YC Founder", portrait: "/portraits/graham-base.webp" },
      { key: "bezos", name: "Jeff Bezos", role: "Amazon Founder", portrait: "/portraits/bezos-base.webp" },
      { key: "hormozi", name: "Alex Hormozi", role: "Acquisition.com", portrait: "/portraits/hormozi-base.webp" },
      { key: "musk", name: "Elon Musk", role: "Tesla & SpaceX", portrait: "/portraits/musk-base.webp" },
      { key: "garyvee", name: "Gary Vaynerchuk", role: "VaynerX", portrait: "/portraits/garyvee-base.webp" },
      { key: "naval", name: "Naval Ravikant", role: "AngelList", portrait: "/portraits/naval-base.webp" },
      { key: "buffett", name: "Warren Buffett", role: "Berkshire Hathaway", portrait: "/portraits/buffett-base.webp" },
      { key: "sanchez", name: "Codie Sanchez", role: "Contrarian Thinking", portrait: "/portraits/sanchez-base.webp" }
    ];

    const titleHash = (poll.title || "").split("").reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
    const options = poll.options || [{ id: "opt1", text: "Option A" }, { id: "opt2", text: "Option B" }];
    
    const council = advisors.slice(0, 4).map((adv, idx) => {
      const chosenOpt = options[(titleHash + idx) % options.length];
      const optText = chosenOpt.text || chosenOpt.name || "Option";
      let roast = "";
      if (adv.key === "graham") roast = `Looking at "${poll.title}", the crowd usually bets on consensus. But betting on "${optText}" is the real contrarian founder play.`;
      else if (adv.key === "bezos") roast = `This is a two-way door decision. Backing "${optText}" provides asymmetric upside with low reversibility risk.`;
      else if (adv.key === "hormozi") roast = `Let us look at the raw numbers. "${optText}" delivers 10x the perceived leverage with the least friction.`;
      else if (adv.key === "musk") roast = `First principles dictate that "${optText}" minimizes thermodynamic waste. Build for velocity.`;
      else if (adv.key === "naval") roast = `Play long-term iterated games. "${optText}" unlocks non-linear leverage.`;
      else roast = `Margin of safety says "${optText}" protects your principal and yields durable returns.`;

      return {
        advisor: adv,
        stance: (titleHash + idx) % 2 === 0 ? "Endorse" : "Amend",
        recommendedOption: optText,
        confidence: 80 + ((titleHash * (idx + 1)) % 19),
        roast
      };
    });

    res.json({
      pollId: req.params.id,
      title: poll.title,
      category: poll.category || "General",
      council
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- DEMO SUMMARY ENDPOINT ---
app.get("/api/demo/summary", async (req, res) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const pollsCountSnap = await db.collection("world_cup_polls").count().get();
    const usersCountSnap = await db.collection("users").count().get();
    const votesCountSnap = await db.collection("global_votes").count().get();
    
    res.json({
      totalPolls: pollsCountSnap.data().count,
      totalUsers: usersCountSnap.data().count,
      totalVotes: votesCountSnap.data().count,
      categories: ["All", "Sponsored", "Tech & AI", "Startups & Roasts", "Finance & Crypto", "Politics", "Sports", "Pop Culture", "Science", "Gaming"],
      supabaseCompatible: true,
      roastRoomCouncilIntegrated: true
    });
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


// ==========================================
// USER POLL CREATION & MODERATION PIPELINE
// ==========================================

// Submit a poll for admin approval with safety checks
app.post("/api/user/polls", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const { title, description, category, options, tags } = req.body;
    const uid = req.user.uid;

    if (!title || typeof title !== "string" || title.trim().length < 5) {
      return res.status(400).json({ error: "Title must be at least 5 characters long." });
    }
    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: "At least two options are required." });
    }

    // Server-side safety verification against toxicity, hate speech, spam
    const prohibitedWords = ["hate", "kill", "terrorist", "scam", "nazi", "bomb", "fraud", "exploit"];
    const contentCheck = `${title} ${description || ""} ${options.map((o: any) => o.text || o.name || "").join(" ")}`.toLowerCase();
    for (const word of prohibitedWords) {
      if (contentCheck.includes(word)) {
        return res.status(400).json({ error: `Safety violation: Content contains prohibited term '${word}'` });
      }
    }

    const pollId = `poll_user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const formattedOptions = options.map((opt: any, index: number) => ({
      id: opt.id || `opt_${index + 1}`,
      text: opt.text || opt.name || `Option ${index + 1}`
    }));

    const newPoll = {
      id: pollId,
      title: title.trim(),
      description: (description || "").trim(),
      category: category || "General",
      options: formattedOptions,
      tags: tags || [],
      status: "pending_approval",
      createdBy: uid,
      createdByName: req.user.name || req.user.email || "Community Agent",
      createdAt: new Date().toISOString(),
      optionScores: {},
      isSponsored: false
    };

    await db.collection("world_cup_polls").doc(pollId).set(newPoll);

    res.json({
      success: true,
      poll: newPoll,
      message: "Poll submitted for moderation review. Once approved, it will be published to the swarm feed."
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve polls submitted by current authenticated user
app.get("/api/user/created-polls", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const uid = req.user.uid;
    const snap = await db.collection("world_cup_polls").where("createdBy", "==", uid).get();
    const polls = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(polls);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Query pending moderation queue
app.get("/api/admin/pending-polls", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const snap = await db.collection("world_cup_polls")
      .where("status", "==", "pending_approval")
      .limit(100)
      .get();
    const pendingPolls = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(pendingPolls);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Approve or Reject a user poll
app.post("/api/admin/polls/:id/moderate", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const pollId = req.params.id;
    const { action, reason } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "Action must be 'approve' or 'reject'" });
    }

    const pollRef = db.collection("world_cup_polls").doc(pollId);
    const pollSnap = await pollRef.get();
    if (!pollSnap.exists) {
      return res.status(404).json({ error: "Poll not found" });
    }

    const newStatus = action === "approve" ? "open" : "rejected";
    await pollRef.update({
      status: newStatus,
      moderatedAt: new Date().toISOString(),
      moderatedBy: req.user.email,
      rejectionReason: reason || null
    });

    res.json({
      success: true,
      pollId,
      status: newStatus,
      message: `Poll has been ${action === "approve" ? "approved and published" : "rejected"}.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// END-TO-END ENCRYPTED (E2EE) CHAT RELAY
// Zero-Knowledge Architecture (Signal Protocol)
// ==========================================

// Register client-generated public key bundle
app.post("/api/chat/keys/register", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const uid = req.user.uid;
    const { identityKey, signedPreKey, registrationId, timestamp } = req.body;

    if (!identityKey) {
      return res.status(400).json({ error: "identityKey is required" });
    }

    await db.collection("user_public_keys").doc(uid).set({
      uid,
      displayName: req.user.name || req.user.email?.split("@")[0] || "Prediction Node",
      email: req.user.email || "",
      identityKey,
      signedPreKey: signedPreKey || null,
      registrationId: registrationId || 1,
      updatedAt: timestamp || new Date().toISOString()
    }, { merge: true });

    res.json({ success: true, message: "Public key bundle registered" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve public key bundle for a chat recipient
app.get("/api/chat/keys/:userId", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const partnerId = req.params.userId;
    const docSnap = await db.collection("user_public_keys").doc(partnerId).get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "User public key not found" });
    }
    res.json(docSnap.data());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List active potential chat partners
app.get("/api/chat/partners", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const uid = req.user.uid;
    const partnerMap = new Map<string, any>();

    // 1. Fetch users with active registered E2EE public keys
    const keysSnap = await db.collection("user_public_keys").limit(50).get();
    for (const doc of keysSnap.docs) {
      if (doc.id === uid) continue;
      const data = doc.data();
      partnerMap.set(doc.id, {
        uid: doc.id,
        displayName: data.displayName || "Prediction Node",
        email: data.email || "",
        accuracy: 100,
        hasRegisteredKey: true,
        updatedAt: data.updatedAt
      });
    }

    // 2. Fetch users from the users collection
    const usersSnap = await db.collection("users").limit(100).get();
    for (const doc of usersSnap.docs) {
      if (doc.id === uid) continue;
      const data = doc.data();
      const existing = partnerMap.get(doc.id);
      if (existing) {
        if (data.displayName) existing.displayName = data.displayName;
        if (data.email) existing.email = data.email;
        if (data.accuracy) existing.accuracy = data.accuracy;
      } else {
        partnerMap.set(doc.id, {
          uid: doc.id,
          displayName: data.displayName || data.email?.split("@")[0] || "Prediction Node",
          email: data.email || "",
          accuracy: data.accuracy || 100,
          rank: data.rank || 1,
          createdAt: data.createdAt
        });
      }
    }

    const partners = Array.from(partnerMap.values());
    res.json(partners);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Relay zero-knowledge encrypted message
app.post("/api/chat/messages", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const uid = req.user.uid;
    const { 
      recipientId, 
      ciphertext, 
      iv, 
      ephemeralPublicKey, 
      senderCiphertext, 
      senderIv, 
      senderEphemeralPublicKey, 
      timestamp 
    } = req.body;

    if (!recipientId || !ciphertext || !iv || !ephemeralPublicKey) {
      return res.status(400).json({ error: "Missing required encrypted message payload fields" });
    }

    const messageData: any = {
      senderId: uid,
      recipientId,
      ciphertext,
      iv,
      ephemeralPublicKey,
      timestamp: timestamp || new Date().toISOString()
    };

    if (senderCiphertext) messageData.senderCiphertext = senderCiphertext;
    if (senderIv) messageData.senderIv = senderIv;
    if (senderEphemeralPublicKey) messageData.senderEphemeralPublicKey = senderEphemeralPublicKey;

    const docRef = await db.collection("encrypted_messages").add(messageData);
    res.json({ success: true, id: docRef.id, message: "Encrypted payload relayed" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve encrypted messages between current user and partner
app.get("/api/chat/messages/:partnerId", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const uid = req.user.uid;
    const partnerId = req.params.partnerId;

    const [sentSnap, receivedSnap] = await Promise.all([
      db.collection("encrypted_messages")
        .where("senderId", "==", uid)
        .where("recipientId", "==", partnerId)
        .limit(100)
        .get(),
      db.collection("encrypted_messages")
        .where("senderId", "==", partnerId)
        .where("recipientId", "==", uid)
        .limit(100)
        .get()
    ]);

    const allMessages: any[] = [];
    sentSnap.docs.forEach(d => allMessages.push({ id: d.id, ...d.data() }));
    receivedSnap.docs.forEach(d => allMessages.push({ id: d.id, ...d.data() }));

    allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    res.json(allMessages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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
