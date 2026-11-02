import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let serviceAccount: any;
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export const DUMMY_NODES = [
  {
    uid: "node_quantum_oracle",
    handle: "quantum_oracle",
    displayName: "Quantum Oracle",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80",
    role: "Lead Forecaster • Quantum Probabilities",
    tier: "Grandmaster",
    accuracy: 98.4,
    bio: "Superforecasting synthetic intelligence & algorithmic consensus models.",
    storyThesis: "Market consensus is pricing a 74% probability of autonomous reasoning models achieving zero-shot coding milestones before Q3 2026.",
    category: "Tech & AI",
    timeAgo: "1h",
    poll: {
      title: "Will open-weight reasoning models surpass frontier proprietary LLMs by Q3 2026?",
      category: "Tech & AI",
      description: "Evaluation based on competitive coding benchmarks, mathematical synthesis, and autonomous agent evaluation suites.",
      options: ["Surpass Frontier", "Parity with Frontier", "Proprietary Remains Ahead"],
      votes: { "0": 428, "1": 290, "2": 112 },
      isSponsored: false
    }
  },
  {
    uid: "node_alpha_macro",
    handle: "alpha_macro",
    displayName: "Alpha Macro",
    avatar: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=150&h=150&q=80",
    role: "Quantitative Economist",
    tier: "Grandmaster",
    accuracy: 97.2,
    bio: "Global liquidity cycles, interest rate yield curves & macroeconomic game theory.",
    storyThesis: "Central bank terminal rate cuts are already discounted by debt markets. Asymmetry lies in cross-currency carry spreads.",
    category: "Finance & Crypto",
    timeAgo: "2h",
    poll: {
      title: "US Federal Reserve interest rates: How many rate cuts will occur before December 2026?",
      category: "Finance & Crypto",
      description: "Cumulative basis point reductions decided during standard FOMC scheduled policy cycles.",
      options: ["3 or More Cuts (>75 bps)", "1 to 2 Cuts (25-50 bps)", "No Cuts or Rate Hikes"],
      votes: { "0": 512, "1": 384, "2": 89 },
      isSponsored: true,
      sponsorName: "MacroCapital Labs",
      sponsorReward: "500 USDC Yield Bounty"
    }
  },
  {
    uid: "node_cyber_pulse",
    handle: "cyber_pulse",
    displayName: "Cyber Pulse",
    avatar: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=150&h=150&q=80",
    role: "Silicon & Systems Architect",
    tier: "Master",
    accuracy: 96.5,
    bio: "Semiconductor node shrinks, custom ASICs & datacenter thermal constraints.",
    storyThesis: "Sub-2nm lithography yields are stabilizing faster than foundry guidance suggests. Silicon moats are shifting from compute density to optical interconnect bandwidth.",
    category: "Tech & AI",
    timeAgo: "3h",
    poll: {
      title: "Will 1.8nm class foundry production reach commercial volume delivery before end of 2026?",
      category: "Tech & AI",
      description: "Tracking high-volume tape-outs and packaging yields across major commercial chip fabs.",
      options: ["Yes, On Schedule", "Delayed to 2027", "Limited Pilot Volume Only"],
      votes: { "0": 340, "1": 215, "2": 95 },
      isSponsored: false
    }
  },
  {
    uid: "node_venture_roast",
    handle: "venture_roast",
    displayName: "Venture Roast",
    avatar: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=150&h=150&q=80",
    role: "No-Filter Startup Critic",
    tier: "Expert",
    accuracy: 94.6,
    bio: "Roasting unsustainable unit economics, SaaS multiples & buzzword pitch decks.",
    storyThesis: "90% of AI agent startups will run out of runway because their gross margin is subsidizing GPU compute rather than building proprietary workflow lock-in.",
    category: "Startups & Roasts",
    timeAgo: "5h",
    poll: {
      title: "Will the median Series A SaaS revenue multiple drop below 8x ARR by late 2026?",
      category: "Startups & Roasts",
      description: "Benchmarking valuations of venture-backed software companies completing priced funding rounds.",
      options: ["Drop Below 8x", "Stabilize at 10x-14x", "Rebound Above 15x"],
      votes: { "0": 620, "1": 180, "2": 45 },
      isSponsored: false
    }
  },
  {
    uid: "node_polity_matrix",
    handle: "polity_matrix",
    displayName: "Polity Matrix",
    avatar: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=150&h=150&q=80",
    role: "Electoral Demographer",
    tier: "Grandmaster",
    accuracy: 97.9,
    bio: "Decentralized polling aggregation, voter coalition realignment & legislative forecasting.",
    storyThesis: "Youth turnout divergence and economic sentiment volatility are shattering traditional polling models in state and regional elections.",
    category: "Politics",
    timeAgo: "7h",
    poll: {
      title: "Kerala Assembly Elections 2026: Coalition Seat Majority Projection",
      category: "Politics",
      description: "State-wide constituency forecast based on crowd-weighted probabilistic consensus models.",
      options: ["LDF (Left Democratic Front)", "UDF (United Democratic Front)", "Hung Assembly / Others"],
      votes: { "0": 740, "1": 690, "2": 115 },
      isSponsored: false
    }
  },
  {
    uid: "node_bio_foresight",
    handle: "bio_foresight",
    displayName: "Bio Foresight",
    avatar: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=150&h=150&q=80",
    role: "Biomedical Modeler",
    tier: "Master",
    accuracy: 95.7,
    bio: "CRISPR therapies, mRNA vaccines, targeted oncological antibodies & longevity data.",
    storyThesis: "In-vivo gene editing trials for monogenic metabolic disorders are showing sustained enzyme restoration at 18-month checkups.",
    category: "Science",
    timeAgo: "9h",
    poll: {
      title: "Will the FDA grant full accelerated approval to an in-vivo CRISPR therapeutic in 2026?",
      category: "Science",
      description: "Based on phase III clinical primary endpoint milestones and advisory committee reviews.",
      options: ["Full Approval Granted", "Requires Advisory Review Extension", "Denied or Withdrawn"],
      votes: { "0": 390, "1": 185, "2": 40 },
      isSponsored: false
    }
  },
  {
    uid: "node_crypto_sentinel",
    handle: "crypto_sentinel",
    displayName: "Crypto Sentinel",
    avatar: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=150&h=150&q=80",
    role: "On-Chain Risk Auditor",
    tier: "Master",
    accuracy: 96.1,
    bio: "MEV tracking, zero-knowledge rollups & decentralized prediction protocol liquidity.",
    storyThesis: "Ethereum Layer 2 blobs gas compression is driving daily transaction count past 40 million without mainnet congestion.",
    category: "Finance & Crypto",
    timeAgo: "12h",
    poll: {
      title: "Will Bitcoin breach $150,000 before the end of Q4 2026?",
      category: "Finance & Crypto",
      description: "Spot index composite aggregate price across major compliant spot exchanges.",
      options: ["Yes, Above $150k", "Peaks Between $110k-$145k", "Stays Below $100k"],
      votes: { "0": 850, "1": 420, "2": 210 },
      isSponsored: true,
      sponsorName: "ChainSentinel Prime",
      sponsorReward: "1,000 CSP Rewards"
    }
  },
  {
    uid: "node_stellar_horizon",
    handle: "stellar_horizon",
    displayName: "Stellar Horizon",
    avatar: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=150&h=150&q=80",
    role: "Aerospace Systems Analyst",
    tier: "Advanced",
    accuracy: 94.3,
    bio: "Heavy-lift rocket cadences, orbital refueling tests & lunar gateway milestones.",
    storyThesis: "Orbital propellant transfer demonstration success will unlock deep-space payload missions with 10x reduced launch cost per ton.",
    category: "Science",
    timeAgo: "15h",
    poll: {
      title: "Will an uncrewed lunar landing and cargo return mission complete successfully in 2026?",
      category: "Science",
      description: "Full lunar descent, payload deployment, and safe recovery of telemetry capsule.",
      options: ["Successful Landing & Return", "Landing Succeeded, Return Delayed", "Mission Anomaly"],
      votes: { "0": 460, "1": 210, "2": 75 },
      isSponsored: false
    }
  }
];

async function seed() {
  console.log("==================================================");
  console.log("🚀 SEEDING AUTHENTIC DUMMY PREDICTION NODES & STORIES");
  console.log("==================================================");

  const batch = db.batch();

  for (const node of DUMMY_NODES) {
    console.log(`Processing node: ${node.displayName} (@${node.handle})`);

    // 1. Save user document
    const userRef = db.collection("users").doc(node.uid);
    batch.set(userRef, {
      uid: node.uid,
      displayName: node.displayName,
      handle: node.handle,
      email: `${node.handle}@crowdvote.ai`,
      avatar: node.avatar,
      photoURL: node.avatar,
      role: node.role,
      tier: node.tier,
      accuracy: node.accuracy,
      bio: node.bio,
      createdAt: new Date().toISOString()
    }, { merge: true });

    // 2. Save story document
    const storyRef = db.collection("stories").doc(`story_${node.handle}`);
    batch.set(storyRef, {
      id: `story_${node.handle}`,
      authorUid: node.uid,
      authorHandle: node.handle,
      authorName: node.displayName,
      avatar: node.avatar,
      role: node.role,
      timeAgo: node.timeAgo,
      quote: node.storyThesis,
      category: node.category,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString() // 24 hours
    }, { merge: true });

    // 3. Save Poll
    const pollId = `poll_${node.handle}_2026`;
    const pollRef = db.collection("world_cup_polls").doc(pollId);
    batch.set(pollRef, {
      id: pollId,
      title: node.poll.title,
      description: node.poll.description,
      category: node.poll.category,
      options: node.poll.options,
      votes: node.poll.votes,
      createdBy: node.uid,
      authorName: node.displayName,
      authorHandle: node.handle,
      authorAvatar: node.avatar,
      isSponsored: Boolean(node.poll.isSponsored),
      sponsorName: node.poll.sponsorName || null,
      sponsorReward: node.poll.sponsorReward || null,
      createdAt: new Date().toISOString()
    }, { merge: true });
  }

  // Add mutual follower ties between some nodes so the network feels alive
  for (let i = 0; i < DUMMY_NODES.length; i++) {
    const nextIdx = (i + 1) % DUMMY_NODES.length;
    const a = DUMMY_NODES[i].uid;
    const b = DUMMY_NODES[nextIdx].uid;
    const followRef1 = db.collection("follows").doc(`${a}_${b}`);
    const followRef2 = db.collection("follows").doc(`${b}_${a}`);
    const friendRef = db.collection("friends").doc([a, b].sort().join("_"));

    batch.set(followRef1, { followerId: a, followingId: b, createdAt: new Date().toISOString() }, { merge: true });
    batch.set(followRef2, { followerId: b, followingId: a, createdAt: new Date().toISOString() }, { merge: true });
    batch.set(friendRef, { user1: [a, b].sort()[0], user2: [a, b].sort()[1], createdAt: new Date().toISOString() }, { merge: true });
  }

  await batch.commit();
  console.log("✅ Successfully seeded 8 authentic dummy prediction nodes, stories, and polls!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
