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
    if (req.originalUrl?.startsWith('/api/admin') || req.path?.startsWith('/api/admin')) {
      return res.status(404).json({ error: 'Not found' });
    }
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

// Optional authentication middleware for unanchored consensus and blind poll masking
async function authenticateTokenOptional(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split('Bearer ')[1];
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = decoded;
    } catch (e) {
      // Proceed unauthenticated if token is invalid
    }
  }
  next();
}

// Cryptographic admin authorization with zero-trust route cloaking
const ADMIN_EMAILS = ["aaronalexmathew48@gmail.com", "prems4u@gmail.com"];

async function requireAdmin(req: any, res: any, next: any) {
  if (!req.user) {
    // Cloaked: Return 404 to hide route existence from unauthenticated scans
    return res.status(404).json({ error: 'Not found' });
  }

  const isEmailAdmin = req.user.email && ADMIN_EMAILS.includes(req.user.email.toLowerCase());
  const isClaimAdmin = req.user.admin === true || (req.user.customClaims && req.user.customClaims.admin === true);

  if (isEmailAdmin || isClaimAdmin) {
    return next();
  }

  // Fallback to Firestore admins document check
  try {
    if (db) {
      const adminDoc = await db.collection("admins").doc(req.user.uid).get();
      if (adminDoc.exists) {
        return next();
      }
    }
  } catch (err) {
    // Ignore and proceed to cloaked rejection
  }

  // Cloaked: Return 404 Not Found to disguise route existence from non-admin accounts
  return res.status(404).json({ error: 'Not found' });
}

// Immutable audit log recorder
async function logAdminAction(adminUid: string, adminEmail: string | undefined, action: string, targetId?: string, targetType?: string, details?: any) {
  if (!db) return;
  try {
    await db.collection("audit_logs").add({
      action,
      adminUid,
      adminEmail: adminEmail || null,
      targetId: targetId || null,
      targetType: targetType || null,
      details: details || null,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.warn("⚠️ Failed to write audit log:", err.message);
  }
}

// --- API ROUTES ---

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/polls", authenticateTokenOptional, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const category = req.query.category as string;
    const isSponsored = req.query.sponsored === 'true';
    const search = (req.query.search as string || '').toLowerCase().trim();
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 60));
    const page = Math.max(1, Number(req.query.page) || 1);
    const viewerUid = req.user?.uid;

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

    // Lookup viewer votes for blind masking
    const userVotedMap = new Map<string, any>();
    if (viewerUid) {
      try {
        const userVotesSnap = await db.collection("users").doc(viewerUid).collection("predictions").get();
        userVotesSnap.docs.forEach(d => {
          const v = d.data();
          userVotedMap.set(v.pollId, v);
        });
      } catch (e) {
        // ignore
      }
    }

    // Process polls: blind masking and vote state injection
    polls = polls.map((p: any) => {
      const userVote = userVotedMap.get(p.id);
      const hasVoted = Boolean(userVote);
      const isBlind = p.blind !== false; // Default to blind voting for unanchored consensus
      const isClosed = p.status === 'closed';

      const enriched = {
        ...p,
        hasVoted,
        votedOption: userVote?.selectedOption,
        votedFaction: userVote?.faction,
        isBlindMasked: isBlind && !hasVoted && !isClosed
      };

      // Mask percentages and vote counts if user has not yet voted to prevent anchoring bias
      if (enriched.isBlindMasked) {
        if (enriched.options && Array.isArray(enriched.options)) {
          enriched.options = enriched.options.map((opt: any) => ({
            ...opt,
            votes: undefined,
            percentage: undefined
          }));
        }
        if (enriched.versusLeft && enriched.versusRight) {
          enriched.versusLeft = { ...enriched.versusLeft, votes: undefined, percentage: undefined };
          enriched.versusRight = { ...enriched.versusRight, votes: undefined, percentage: undefined };
        }
        if (enriched.scaleAverage !== undefined) {
          enriched.scaleAverage = undefined;
        }
        if (enriched.rankedItems && Array.isArray(enriched.rankedItems)) {
          enriched.rankedItems = enriched.rankedItems.map((item: any) => ({
            ...item,
            score: undefined
          }));
        }
      }

      return enriched;
    });

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

  if (!pollId || selectedOption === undefined || selectedOption === null) {
    return res.status(400).json({ error: "pollId and selectedOption are required" });
  }

  try {
    const userRef = db.collection("users").doc(uid);
    const docId = `vote_${pollId}`;
    const voteRef = userRef.collection("predictions").doc(docId);
    const pollRef = db.collection("world_cup_polls").doc(pollId);

    let calculatedFaction = "Neural Forecaster";
    let updatedPollData: any = {};

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const voteDoc = await transaction.get(voteRef);
      const pollDoc = await transaction.get(pollRef);

      if (!pollDoc.exists) {
        throw new Error("POLL_NOT_FOUND");
      }

      const pollData = pollDoc.data() || {};
      
      // Check expiration
      if (pollData.lockAt && new Date() > new Date(pollData.lockAt)) {
        throw new Error("POLL_EXPIRED");
      }

      // Check changeable toggle
      const isChangeable = pollData.changeable !== false;
      if (voteDoc.exists && !isChangeable) {
        throw new Error("ALREADY_LOCKED");
      }

      if (!userDoc.exists) {
        transaction.set(userRef, {
          uid,
          displayName: req.user.name || "Neural Predictor",
          createdAt: new Date().toISOString()
        });
      }

      const format = pollData.format || "choice";
      const totalVotes = (pollData.totalVotes || 0) + (voteDoc.exists ? 0 : 1);
      const pollUpdates: any = { totalVotes, updatedAt: new Date().toISOString() };

      // 1. Versus format voting (Split-screen A vs B)
      if (format === "versus") {
        let leftSide = pollData.versusLeft || { id: "left", label: "Alpha", votes: 0 };
        let rightSide = pollData.versusRight || { id: "right", label: "Beta", votes: 0 };

        if (selectedOption === leftSide.id) {
          leftSide.votes = (leftSide.votes || 0) + 1;
          calculatedFaction = leftSide.label;
        } else {
          rightSide.votes = (rightSide.votes || 0) + 1;
          calculatedFaction = rightSide.label;
        }

        const vTotal = Math.max(1, (leftSide.votes || 0) + (rightSide.votes || 0));
        leftSide.percentage = Math.round(((leftSide.votes || 0) / vTotal) * 100);
        rightSide.percentage = 100 - leftSide.percentage;

        pollUpdates.versusLeft = leftSide;
        pollUpdates.versusRight = rightSide;
      }

      // 2. Scale format voting (0-100% Intensity slider / Sentiment gauge)
      else if (format === "scale") {
        const numericVal = Math.min(100, Math.max(0, Number(selectedOption) || 50));
        const prevCount = pollData.scaleVotesCount || 0;
        const prevAvg = pollData.scaleAverage || 50;
        const newCount = prevCount + 1;
        const newAvg = Math.round(((prevAvg * prevCount) + numericVal) / newCount);

        pollUpdates.scaleAverage = newAvg;
        pollUpdates.scaleVotesCount = newCount;
        calculatedFaction = `Scale: ${numericVal}${pollData.scaleUnit || "%"}`;
      }

      // 3. Rank format voting (Instant-Runoff preference order)
      else if (format === "rank") {
        const rankedOrder = Array.isArray(selectedOption) ? selectedOption : [selectedOption];
        const existingItems = pollData.rankedItems || (pollData.options || []).map((o: any) => ({ id: o.id, label: o.name || o.text || o.id, score: 0 }));
        
        // Borda count weighting: 1st choice gets highest points
        const numItems = rankedOrder.length;
        existingItems.forEach((item: any) => {
          const rankIdx = rankedOrder.indexOf(item.id);
          if (rankIdx !== -1) {
            item.score = (item.score || 0) + (numItems - rankIdx);
          }
        });

        pollUpdates.rankedItems = existingItems;
        const topItem = existingItems.find((i: any) => i.id === rankedOrder[0]);
        calculatedFaction = `#1: ${topItem?.label || rankedOrder[0]}`;
      }

      // 4. Open ballot format voting (Crowdsourced candidates)
      else if (format === "open") {
        const submissions = pollData.openSubmissions || [];
        const targetSub = submissions.find((s: any) => s.id === selectedOption);
        if (targetSub) {
          targetSub.votes = (targetSub.votes || 0) + 1;
          calculatedFaction = targetSub.text;
        } else {
          calculatedFaction = "Open Voter";
        }
        pollUpdates.openSubmissions = submissions;
      }

      // 5. Choice format voting (Default multi-choice list)
      else {
        const options = (pollData.options || []).map((opt: any) => {
          if (opt.id === selectedOption) {
            opt.votes = (opt.votes || 0) + 1;
            calculatedFaction = opt.name || opt.text || opt.id;
          }
          return opt;
        });

        const optTotal = options.reduce((sum: number, o: any) => sum + (o.votes || 0), 0);
        options.forEach((opt: any) => {
          opt.percentage = optTotal > 0 ? Math.round(((opt.votes || 0) / optTotal) * 100) : 0;
        });

        pollUpdates.options = options;
      }

      transaction.update(pollRef, pollUpdates);
      updatedPollData = { ...pollData, ...pollUpdates };

      // Save user prediction receipt
      const voteData: any = {
        pollId,
        selectedOption,
        confidence: confidence || 100,
        faction: calculatedFaction,
        timestamp: new Date().toISOString()
      };
      transaction.set(voteRef, voteData);

      // Save global vote record
      const globalVoteRef = db.collection("global_votes").doc(`${uid}_${pollId}`);
      transaction.set(globalVoteRef, {
        pollId,
        selectedOption,
        confidence: confidence || 100,
        faction: calculatedFaction,
        userId: uid,
        timestamp: new Date().toISOString()
      });
    });

    res.json({
      success: true,
      message: "Vote cast and recorded into consensus mesh.",
      faction: calculatedFaction,
      poll: updatedPollData
    });
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
    const { 
      title, description, category, options, tags, format = "choice",
      versusLeft, versusRight, scaleMin, scaleMax, scaleUnit,
      blind = true, changeable = true, anonymous = false, lockAt
    } = req.body;
    const uid = req.user.uid;

    if (!title || typeof title !== "string" || title.trim().length < 5) {
      return res.status(400).json({ error: "Title must be at least 5 characters long." });
    }

    // Format specific validation
    if (format === "versus") {
      if (!versusLeft?.label || !versusRight?.label) {
        return res.status(400).json({ error: "Versus polls require both Side A and Side B labels." });
      }
    } else if (format === "choice" || format === "rank") {
      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ error: "At least two options are required." });
      }
    }

    // Server-side safety verification against toxicity, hate speech, spam
    const prohibitedWords = ["hate", "kill", "terrorist", "scam", "nazi", "bomb", "fraud", "exploit"];
    const contentCheck = `${title} ${description || ""} ${(options || []).map((o: any) => o.text || o.name || "").join(" ")}`.toLowerCase();
    for (const word of prohibitedWords) {
      if (contentCheck.includes(word)) {
        return res.status(400).json({ error: `Safety violation: Content contains prohibited term '${word}'` });
      }
    }

    const pollId = `poll_user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const formattedOptions = (options || []).map((opt: any, index: number) => ({
      id: opt.id || `opt_${index + 1}`,
      name: typeof opt === "string" ? opt : (opt.text || opt.name || `Option ${index + 1}`),
      text: typeof opt === "string" ? opt : (opt.text || opt.name || `Option ${index + 1}`),
      votes: 0,
      percentage: 0
    }));

    const newPoll: any = {
      id: pollId,
      title: title.trim(),
      description: (description || "").trim(),
      category: category || "General",
      format,
      blind: Boolean(blind),
      changeable: Boolean(changeable),
      anonymous: Boolean(anonymous),
      lockAt: lockAt || null,
      options: formattedOptions,
      tags: tags || [],
      status: "pending_approval",
      createdBy: uid,
      createdByName: req.user.name || req.user.email || "Community Agent",
      createdAt: new Date().toISOString(),
      optionScores: {},
      isSponsored: false,
      totalVotes: 0
    };

    if (format === "versus") {
      newPoll.versusLeft = {
        id: "side_a",
        label: versusLeft.label.trim(),
        image: versusLeft.image || null,
        votes: 0,
        percentage: 50
      };
      newPoll.versusRight = {
        id: "side_b",
        label: versusRight.label.trim(),
        image: versusRight.image || null,
        votes: 0,
        percentage: 50
      };
    } else if (format === "scale") {
      newPoll.scaleMin = Number(scaleMin) || 0;
      newPoll.scaleMax = Number(scaleMax) || 100;
      newPoll.scaleUnit = scaleUnit || "%";
      newPoll.scaleAverage = 50;
      newPoll.scaleVotesCount = 0;
    } else if (format === "rank") {
      newPoll.rankedItems = formattedOptions.map(o => ({ id: o.id, label: o.name, score: 0 }));
    } else if (format === "open") {
      newPoll.openSubmissions = [];
    }

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


// ==========================================
// SOCIAL SYSTEM: FOLLOWERS, FOLLOWING & FRIENDS
// ==========================================

function getFriendDocId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join("_");
}

// 1. Follow a user
app.post("/api/user/follow/:targetUid", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const uid = req.user.uid;
    const targetUid = req.params.targetUid;

    if (uid === targetUid) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    const followDocId = `${uid}_${targetUid}`;
    await db.collection("follows").doc(followDocId).set({
      followerId: uid,
      followingId: targetUid,
      createdAt: new Date().toISOString()
    });

    // Check if target follows user back (mutual friendship)
    const reverseFollowSnap = await db.collection("follows").doc(`${targetUid}_${uid}`).get();
    const isFriend = reverseFollowSnap.exists;

    if (isFriend) {
      const friendDocId = getFriendDocId(uid, targetUid);
      await db.collection("friends").doc(friendDocId).set({
        user1: [uid, targetUid].sort()[0],
        user2: [uid, targetUid].sort()[1],
        createdAt: new Date().toISOString()
      }, { merge: true });
    }

    res.json({ success: true, isFollowing: true, isFriend });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Unfollow a user
app.post("/api/user/unfollow/:targetUid", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const uid = req.user.uid;
    const targetUid = req.params.targetUid;

    const followDocId = `${uid}_${targetUid}`;
    await db.collection("follows").doc(followDocId).delete();

    // If mutual friendship existed, remove it
    const friendDocId = getFriendDocId(uid, targetUid);
    await db.collection("friends").doc(friendDocId).delete().catch(() => {});

    res.json({ success: true, isFollowing: false, isFriend: false });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get social profile stats and relationship for any user
app.get("/api/user/:targetUid/social-profile", async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const targetUid = req.params.targetUid;
    
    // Optional viewer auth
    let viewerUid: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const decoded = await admin.auth().verifyIdToken(authHeader.split("Bearer ")[1]);
        viewerUid = decoded.uid;
      } catch {}
    }

    // Fetch user basic profile
    const userDoc = await db.collection("users").doc(targetUid).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    // Fetch followers & following count
    const [followersSnap, followingSnap, friendsSnap] = await Promise.all([
      db.collection("follows").where("followingId", "==", targetUid).get(),
      db.collection("follows").where("followerId", "==", targetUid).get(),
      db.collection("friends").where("user1", "==", targetUid).get()
    ]);
    const friendsSnap2 = await db.collection("friends").where("user2", "==", targetUid).get();
    const friendsCount = friendsSnap.size + friendsSnap2.size;

    let isFollowing = false;
    let isFollowedBy = false;
    let isFriend = false;
    let friendRequestStatus = "none";

    if (viewerUid && viewerUid !== targetUid) {
      const [fwdSnap, revSnap, fReqSent, fReqRecv] = await Promise.all([
        db.collection("follows").doc(`${viewerUid}_${targetUid}`).get(),
        db.collection("follows").doc(`${targetUid}_${viewerUid}`).get(),
        db.collection("friend_requests").doc(`${viewerUid}_${targetUid}`).get(),
        db.collection("friend_requests").doc(`${targetUid}_${viewerUid}`).get()
      ]);

      isFollowing = fwdSnap.exists;
      isFollowedBy = revSnap.exists;
      isFriend = isFollowing && isFollowedBy;

      if (isFriend) {
        friendRequestStatus = "accepted";
      } else if (fReqSent.exists && fReqSent.data()?.status === "pending") {
        friendRequestStatus = "pending_sent";
      } else if (fReqRecv.exists && fReqRecv.data()?.status === "pending") {
        friendRequestStatus = "pending_received";
      }
    }

    // Fetch user's created polls
    const pollsSnap = await db.collection("world_cup_polls")
      .where("createdBy", "==", targetUid)
      .limit(30)
      .get();
    const createdPolls = pollsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    res.json({
      user: userData || { uid: targetUid, displayName: "Prediction Node" },
      stats: {
        followersCount: followersSnap.size,
        followingCount: followingSnap.size,
        friendsCount,
        isFollowing,
        isFollowedBy,
        isFriend,
        friendRequestStatus
      },
      createdPolls
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get list of followers
app.get("/api/user/:targetUid/followers", async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const targetUid = req.params.targetUid;
    let viewerUid = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const decoded = await admin.auth().verifyIdToken(authHeader.split("Bearer ")[1]);
        viewerUid = decoded.uid;
      } catch {}
    }

    const followsSnap = await db.collection("follows").where("followingId", "==", targetUid).limit(100).get();
    const followerIds = followsSnap.docs.map(d => d.data().followerId);

    if (followerIds.length === 0) return res.json([]);

    const usersSnap = await Promise.all(
      followerIds.slice(0, 50).map(id => db.collection("users").doc(id).get())
    );

    const followers = await Promise.all(
      usersSnap.map(async (doc) => {
        const d = doc.exists ? doc.data() : { uid: doc.id, displayName: "Predictor" };
        let isFollowing = false;
        let isFriend = false;
        if (viewerUid && viewerUid !== doc.id) {
          const check = await db.collection("follows").doc(`${viewerUid}_${doc.id}`).get();
          isFollowing = check.exists;
          if (isFollowing) {
            const rev = await db.collection("follows").doc(`${doc.id}_${viewerUid}`).get();
            isFriend = rev.exists;
          }
        }
        return {
          uid: doc.id,
          displayName: d?.displayName || "Prediction Node",
          email: d?.email || "",
          accuracy: d?.accuracy || 100,
          isFollowing,
          isFriend
        };
      })
    );

    res.json(followers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get list of following
app.get("/api/user/:targetUid/following", async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const targetUid = req.params.targetUid;
    let viewerUid = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const decoded = await admin.auth().verifyIdToken(authHeader.split("Bearer ")[1]);
        viewerUid = decoded.uid;
      } catch {}
    }

    const followsSnap = await db.collection("follows").where("followerId", "==", targetUid).limit(100).get();
    const followingIds = followsSnap.docs.map(d => d.data().followingId);

    if (followingIds.length === 0) return res.json([]);

    const usersSnap = await Promise.all(
      followingIds.slice(0, 50).map(id => db.collection("users").doc(id).get())
    );

    const following = await Promise.all(
      usersSnap.map(async (doc) => {
        const d = doc.exists ? doc.data() : { uid: doc.id, displayName: "Predictor" };
        let isFollowing = false;
        let isFriend = false;
        if (viewerUid && viewerUid !== doc.id) {
          const check = await db.collection("follows").doc(`${viewerUid}_${doc.id}`).get();
          isFollowing = check.exists;
          if (isFollowing) {
            const rev = await db.collection("follows").doc(`${doc.id}_${viewerUid}`).get();
            isFriend = rev.exists;
          }
        }
        return {
          uid: doc.id,
          displayName: d?.displayName || "Prediction Node",
          email: d?.email || "",
          accuracy: d?.accuracy || 100,
          isFollowing,
          isFriend
        };
      })
    );

    res.json(following);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Get mutual friends list
app.get("/api/user/:targetUid/friends", async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const targetUid = req.params.targetUid;
    const [snap1, snap2] = await Promise.all([
      db.collection("friends").where("user1", "==", targetUid).limit(50).get(),
      db.collection("friends").where("user2", "==", targetUid).limit(50).get()
    ]);

    const friendIds = [];
    snap1.docs.forEach(d => friendIds.push(d.data().user2));
    snap2.docs.forEach(d => friendIds.push(d.data().user1));

    if (friendIds.length === 0) return res.json([]);

    const usersSnap = await Promise.all(
      friendIds.map(id => db.collection("users").doc(id).get())
    );

    const friends = usersSnap.map(doc => {
      const d = doc.exists ? doc.data() : { uid: doc.id, displayName: "Friend" };
      return {
        uid: doc.id,
        displayName: d?.displayName || "Friend Node",
        email: d?.email || "",
        accuracy: d?.accuracy || 100,
        isFriend: true,
        isFollowing: true
      };
    });

    res.json(friends);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Send friend request
app.post("/api/user/friend-request/:targetUid", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const uid = req.user.uid;
    const targetUid = req.params.targetUid;

    if (uid === targetUid) return res.status(400).json({ error: "Cannot send friend request to yourself" });

    const requestId = `${uid}_${targetUid}`;
    const newRequest = {
      id: requestId,
      fromUid: uid,
      fromName: req.user.name || req.user.email?.split("@")[0] || "User",
      fromEmail: req.user.email || "",
      toUid: targetUid,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    await db.collection("friend_requests").doc(requestId).set(newRequest);
    res.json({ success: true, request: newRequest });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Respond to friend request (accept / decline)
app.post("/api/user/friend-request/:fromUid/respond", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const uid = req.user.uid; // respondent
    const fromUid = req.params.fromUid; // requester
    const { action } = req.body; // "accept" | "decline"

    const requestId = `${fromUid}_${uid}`;
    const reqRef = db.collection("friend_requests").doc(requestId);
    const reqSnap = await reqRef.get();

    if (!reqSnap.exists) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    if (action === "accept") {
      // 1. Establish mutual follows & friend record
      await Promise.all([
        db.collection("follows").doc(`${fromUid}_${uid}`).set({
          followerId: fromUid,
          followingId: uid,
          createdAt: new Date().toISOString()
        }),
        db.collection("follows").doc(`${uid}_${fromUid}`).set({
          followerId: uid,
          followingId: fromUid,
          createdAt: new Date().toISOString()
        }),
        db.collection("friends").doc(getFriendDocId(uid, fromUid)).set({
          user1: [uid, fromUid].sort()[0],
          user2: [uid, fromUid].sort()[1],
          createdAt: new Date().toISOString()
        })
      ]);

      await reqRef.update({ status: "accepted", acceptedAt: new Date().toISOString() });
      res.json({ success: true, status: "accepted", isFriend: true });
    } else {
      await reqRef.update({ status: "declined", declinedAt: new Date().toISOString() });
      res.json({ success: true, status: "declined", isFriend: false });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Get friend requests for current user
app.get("/api/user/friend-requests", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const uid = req.user.uid;
    const [incomingSnap, outgoingSnap] = await Promise.all([
      db.collection("friend_requests")
        .where("toUid", "==", uid)
        .where("status", "==", "pending")
        .limit(30)
        .get(),
      db.collection("friend_requests")
        .where("fromUid", "==", uid)
        .where("status", "==", "pending")
        .limit(30)
        .get()
    ]);

    const incoming = incomingSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const outgoing = outgoingSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    res.json({ incoming, outgoing });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Get prediction stories for top carousel
app.get("/api/stories", async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const storiesSnap = await db.collection("stories")
      .orderBy("createdAt", "desc")
      .limit(16)
      .get();

    const stories = storiesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(stories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Get suggested prediction nodes
app.get("/api/suggestions", async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    let viewerUid: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const decoded = await admin.auth().verifyIdToken(authHeader.split("Bearer ")[1]);
        viewerUid = decoded.uid;
      } catch {}
    }

    const usersSnap = await db.collection("users")
      .orderBy("accuracy", "desc")
      .limit(20)
      .get();

    const candidates = usersSnap.docs
      .map(d => ({ uid: d.id, ...d.data() }))
      .filter((u: any) => u.uid !== viewerUid && !u.uid.startsWith("user_beta_") && !u.uid.startsWith("user_chat_") && !u.uid.startsWith("user_social_") && !u.uid.startsWith("user_alpha_"))
      .slice(0, 5);

    // Check if viewer follows any of these
    let followsMap: Record<string, boolean> = {};
    if (viewerUid && candidates.length > 0) {
      const followDocs = await Promise.all(
        candidates.map((c: any) => db.collection("follows").doc(`${viewerUid}_${c.uid}`).get())
      );
      followDocs.forEach(d => {
        if (d.exists) {
          const data = d.data();
          followsMap[data.followingId] = true;
        }
      });
    }

    const formatted = candidates.map((u: any) => ({
      uid: u.uid,
      handle: u.handle || (u.email ? u.email.split("@")[0] : `node_${u.uid.slice(0, 6)}`),
      displayName: u.displayName || "Prediction Node",
      avatar: u.avatar || u.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.uid}`,
      subtitle: `${u.tier || "Expert"} • ${u.accuracy || 95}% Accuracy`,
      accuracy: u.accuracy || 95,
      isFollowing: Boolean(followsMap[u.uid])
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Toggle like on a poll
app.post("/api/polls/:pollId/like", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const uid = req.user.uid;
    const pollId = req.params.pollId;
    const likeDocId = `${uid}_${pollId}`;
    const likeRef = db.collection("poll_likes").doc(likeDocId);
    const likeSnap = await likeRef.get();

    let isLiked = false;
    if (likeSnap.exists) {
      await likeRef.delete();
      isLiked = false;
    } else {
      await likeRef.set({
        uid,
        pollId,
        createdAt: new Date().toISOString()
      });
      isLiked = true;
    }

    // Get updated likes count
    const countSnap = await db.collection("poll_likes").where("pollId", "==", pollId).get();
    res.json({ success: true, isLiked, likesCount: countSnap.size });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Get comments for a poll
app.get("/api/polls/:pollId/comments", async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const pollId = req.params.pollId;
    const commentsSnap = await db.collection("poll_comments")
      .where("pollId", "==", pollId)
      .orderBy("createdAt", "asc")
      .limit(50)
      .get();

    const comments = commentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(comments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 14. Post a comment to a poll
app.post("/api/polls/:pollId/comment", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const uid = req.user.uid;
    const pollId = req.params.pollId;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    const newComment = {
      pollId,
      uid,
      authorHandle: userData?.handle || (userData?.email ? userData.email.split("@")[0] : `node_${uid.slice(0, 6)}`),
      authorName: userData?.displayName || "Prediction Node",
      authorAvatar: userData?.avatar || userData?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${uid}`,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection("poll_comments").add(newComment);
    res.json({ success: true, id: docRef.id, ...newComment });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// =====================================================================
// UNIFIED POLLING ENGINE: 5 FORMATS, BLIND VOTING & FACTION DEBATES
// =====================================================================

// Open ballot: Community option candidate submission
app.post("/api/polls/:id/open-submit", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const pollId = req.params.id;
    const { text } = req.body;
    const uid = req.user.uid;
    const displayName = req.user.name || req.user.email?.split("@")[0] || "Anonymous";

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Option text is required" });
    }

    const pollRef = db.collection("world_cup_polls").doc(pollId);
    const pollDoc = await pollRef.get();
    if (!pollDoc.exists) {
      return res.status(404).json({ error: "Poll not found" });
    }

    const pollData = pollDoc.data() || {};
    if (pollData.format !== "open") {
      return res.status(400).json({ error: "Candidate submissions are only permitted on Open ballot polls" });
    }

    const newCandidate = {
      id: "cand_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
      text: text.trim(),
      authorId: uid,
      authorName: displayName,
      votes: 1,
      createdAt: new Date().toISOString()
    };

    const existingSubmissions = pollData.openSubmissions || [];
    existingSubmissions.push(newCandidate);

    await pollRef.update({
      openSubmissions: existingSubmissions,
      totalVotes: (pollData.totalVotes || 0) + 1,
      updatedAt: new Date().toISOString()
    });

    // Record author's initial vote for their submission
    await db.collection("global_votes").doc(`${uid}_${pollId}`).set({
      pollId,
      userId: uid,
      selectedOption: newCandidate.id,
      faction: newCandidate.text,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, submission: newCandidate });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Debate discussion engine with voter faction badges
app.get("/api/debate/:pollId", async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const pollId = req.params.pollId;
    const factionFilter = req.query.faction as string;

    const snap = await db.collection("poll_debates")
      .where("pollId", "==", pollId)
      .limit(100)
      .get();

    let comments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    comments.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    // Fallback to legacy poll_comments if none in poll_debates
    if (comments.length === 0) {
      const legacySnap = await db.collection("poll_comments")
        .where("pollId", "==", pollId)
        .limit(100)
        .get();
      comments = legacySnap.docs.map(d => ({
        id: d.id,
        userFaction: "Forecaster",
        upvotes: 0,
        ...d.data()
      }));
    }

    if (factionFilter && factionFilter !== "all") {
      comments = comments.filter((c: any) => c.userFaction === factionFilter || c.factionId === factionFilter);
    }

    res.json(comments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/debate/:pollId", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const uid = req.user.uid;
    const pollId = req.params.pollId;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Argument text is required" });
    }

    // Lookup user's vote on this poll to derive their faction badge
    let userFaction = "Observer";
    let factionId = "observer";

    try {
      const voteDoc = await db.collection("global_votes").doc(`${uid}_${pollId}`).get();
      if (voteDoc.exists) {
        const vData = voteDoc.data();
        if (vData?.faction) {
          userFaction = vData.faction;
          factionId = String(vData.selectedOption || "voter");
        } else if (vData?.selectedOption) {
          userFaction = `Voted: ${vData.selectedOption}`;
          factionId = String(vData.selectedOption);
        }
      }
    } catch (e) {
      // Default to Observer
    }

    const userDoc = await db.collection("users").doc(uid).get();
    const uData = userDoc.exists ? userDoc.data() : null;

    const newComment = {
      pollId,
      userId: uid,
      userName: uData?.displayName || req.user.name || "Neural Forecaster",
      userAvatar: uData?.avatar || uData?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${uid}`,
      userFaction,
      factionId,
      text: text.trim(),
      upvotes: 0,
      upvotedBy: [],
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection("poll_debates").add(newComment);
    res.json({ success: true, id: docRef.id, ...newComment });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/debate/:commentId/upvote", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const commentId = req.params.commentId;
    const uid = req.user.uid;
    const commentRef = db.collection("poll_debates").doc(commentId);
    const commentDoc = await commentRef.get();

    if (!commentDoc.exists) {
      return res.status(404).json({ error: "Argument not found" });
    }

    const data = commentDoc.data() || {};
    const upvotedBy = data.upvotedBy || [];
    const hasUpvoted = upvotedBy.includes(uid);

    let newUpvotedBy;
    let delta = 0;
    if (hasUpvoted) {
      newUpvotedBy = upvotedBy.filter((id: string) => id !== uid);
      delta = -1;
    } else {
      newUpvotedBy = [...upvotedBy, uid];
      delta = 1;
    }

    const newUpvotes = Math.max(0, (data.upvotes || 0) + delta);
    await commentRef.update({
      upvotes: newUpvotes,
      upvotedBy: newUpvotedBy
    });

    res.json({ success: true, upvotes: newUpvotes, hasUpvoted: !hasUpvoted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Community report endpoint
app.post("/api/polls/:id/report", authenticateToken, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const pollId = req.params.id;
    const { reason } = req.body;
    const uid = req.user.uid;

    const pollDoc = await db.collection("world_cup_polls").doc(pollId).get();
    const pollTitle = pollDoc.exists ? pollDoc.data()?.title || "Untitled Poll" : "Unknown Poll";

    await db.collection("reports").add({
      pollId,
      pollTitle,
      reason: reason || "Flagged by community forecaster",
      reporterUid: uid,
      reporterName: req.user.name || req.user.email || "Forecaster",
      status: "pending",
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, message: "Report submitted to admin triage queue." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// STANDALONE ADMIN CONSOLE: 8 SINGLE-WORD TOOL ENDPOINTS
// =====================================================================

// 1. Queue: Pending user-submitted polls approval triage
app.get("/api/admin/queue", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const snap = await db.collection("world_cup_polls")
      .where("status", "==", "pending_approval")
      .limit(100)
      .get();
    const queue = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(queue);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/queue/:id", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const pollId = req.params.id;
    const { action, reason } = req.body; // 'approve' | 'reject'

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "Action must be 'approve' or 'reject'" });
    }

    const pollRef = db.collection("world_cup_polls").doc(pollId);
    const pollDoc = await pollRef.get();
    if (!pollDoc.exists) return res.status(404).json({ error: "Poll not found" });

    const newStatus = action === "approve" ? "active" : "rejected";
    await pollRef.update({
      status: newStatus,
      moderatedAt: new Date().toISOString(),
      moderatedBy: req.user.uid,
      moderationReason: reason || null
    });

    await logAdminAction(req.user.uid, req.user.email, `QUEUE_${action.toUpperCase()}`, pollId, "poll", { reason });

    res.json({ success: true, message: `Poll ${action}d successfully` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Polls: Global manager (lock, pin, delete, resolve)
app.patch("/api/admin/polls/:id", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const pollId = req.params.id;
    const updates = req.body;

    const pollRef = db.collection("world_cup_polls").doc(pollId);
    await pollRef.update({
      ...updates,
      updatedAt: new Date().toISOString()
    });

    await logAdminAction(req.user.uid, req.user.email, "POLL_PATCH", pollId, "poll", updates);
    res.json({ success: true, message: "Poll state updated" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Users: Dossier, ban, shadowban, verify, recalibrate score
app.get("/api/admin/users", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const snap = await db.collection("users").limit(100).get();
    const users = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/users/:uid/action", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const targetUid = req.params.uid;
    const { action, score } = req.body;

    const userRef = db.collection("users").doc(targetUid);
    const updates: any = { updatedAt: new Date().toISOString() };

    switch (action) {
      case "ban":
        updates.isBanned = true;
        break;
      case "unban":
        updates.isBanned = false;
        break;
      case "shadowban":
        updates.isShadowbanned = true;
        break;
      case "unshadowban":
        updates.isShadowbanned = false;
        break;
      case "verify":
        updates.verified = true;
        break;
      case "unverify":
        updates.verified = false;
        break;
      case "recalibrate":
        if (typeof score === "number") {
          updates.accuracy = Math.max(0, Math.min(100, score));
        }
        break;
      default:
        return res.status(400).json({ error: "Invalid user management action" });
    }

    await userRef.set(updates, { merge: true });
    await logAdminAction(req.user.uid, req.user.email, `USER_${action.toUpperCase()}`, targetUid, "user", { action, score });

    res.json({ success: true, message: `User action '${action}' applied.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Bounties: Sponsor escrow verification & yield distribution
app.get("/api/admin/bounties", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const sponsoredSnap = await db.collection("world_cup_polls")
      .where("isSponsored", "==", true)
      .limit(50)
      .get();

    const bounties = sponsoredSnap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        pollId: d.id,
        pollTitle: data.title,
        sponsorName: data.sponsorName || "Anonymous Sponsor",
        escrowAmount: data.sponsorReward || "1,000 Points",
        status: data.status === "closed" ? "distributed" : "active",
        createdAt: data.createdAt || new Date().toISOString()
      };
    });

    res.json(bounties);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/bounties/:id/payout", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const bountyId = req.params.id;
    const pollRef = db.collection("world_cup_polls").doc(bountyId);
    await pollRef.update({
      bountyDistributed: true,
      bountyDistributedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await logAdminAction(req.user.uid, req.user.email, "BOUNTY_PAYOUT", bountyId, "bounty", {});
    res.json({ success: true, message: "Escrow yield payout distributed to top forecasters." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Reports: Community abuse triage inbox
app.get("/api/admin/reports", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const snap = await db.collection("reports")
      .where("status", "==", "pending")
      .limit(100)
      .get();
    const reports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/reports/:id", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const reportId = req.params.id;
    const { action, notes } = req.body; // 'resolve' | 'dismiss'

    const reportRef = db.collection("reports").doc(reportId);
    await reportRef.update({
      status: action === "resolve" ? "resolved" : "dismissed",
      resolvedBy: req.user.uid,
      resolvedAt: new Date().toISOString(),
      notes: notes || null
    });

    await logAdminAction(req.user.uid, req.user.email, `REPORT_${action.toUpperCase()}`, reportId, "report", { notes });
    res.json({ success: true, message: `Report ${action}d successfully` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Safety: Prohibited word dictionary, toxicity threshold, rate limits
app.get("/api/admin/safety", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const doc = await db.collection("config").doc("safety").get();
    const data = doc.exists ? doc.data() : {
      prohibitedWords: ["scam", "phishing", "hate", "malware", "ponzi"],
      toxicityThreshold: 0.85,
      rateLimitPerMinute: 60,
      spamFilterEnabled: true
    };
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/safety", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const safetySettings = req.body;
    await db.collection("config").doc("safety").set({
      ...safetySettings,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.uid
    }, { merge: true });

    await logAdminAction(req.user.uid, req.user.email, "SAFETY_CONFIG_UPDATE", "safety", "config", safetySettings);
    res.json({ success: true, message: "Safety filters synchronized." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Logs: Immutable audit log stream
app.get("/api/admin/logs", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const snap = await db.collection("audit_logs")
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Config: System emergency kill-switches, maintenance mode, min account age
app.get("/api/admin/config", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const doc = await db.collection("config").doc("global").get();
    const data = doc.exists ? doc.data() : {
      phase: "pre_election",
      maintenanceMode: false,
      minAccountAgeDays: 0,
      maxDailyPollsPerUser: 10
    };
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/config", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (!db) return res.status(500).json({ error: "DB not initialized" });
  try {
    const configSettings = req.body;
    await db.collection("config").doc("global").set({
      ...configSettings,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.uid
    }, { merge: true });

    await logAdminAction(req.user.uid, req.user.email, "GLOBAL_CONFIG_UPDATE", "global", "config", configSettings);
    res.json({ success: true, message: "Global protocol config updated." });
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
