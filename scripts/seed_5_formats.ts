import admin from 'firebase-admin';
import * as fs from 'fs';
import path from 'path';

async function seedFiveFormats() {
  console.log("🌱 Seeding 5 Poll Formats into Firestore...");
  const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
  if (!fs.existsSync(serviceAccountPath)) {
    console.error("serviceAccountKey.json not found");
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  const db = admin.firestore();

  const samplePolls = [
    {
      id: "poll_versus_model_supremacy",
      title: "Frontier Model Supremacy: OpenAI o3 vs DeepSeek-R1",
      description: "Which reasoning architecture will dominate frontier agentic benchmarks through late 2026? Vote Side A or Side B.",
      category: "AI",
      format: "versus",
      status: "active",
      blind: true,
      changeable: true,
      totalVotes: 736,
      versusLeft: {
        id: "side_a",
        label: "OpenAI o3 Frontier Reasoning",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
        votes: 412,
        percentage: 56
      },
      versusRight: {
        id: "side_b",
        label: "DeepSeek-R1 Open Synthetics",
        image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80",
        votes: 324,
        percentage: 44
      },
      options: [
        { id: "side_a", name: "OpenAI o3", votes: 412, percentage: 56 },
        { id: "side_b", name: "DeepSeek-R1", votes: 324, percentage: 44 }
      ],
      createdBy: "rQLmIFSIZpfBomLiZVrUg4WA4b42",
      createdByName: "Aaron Alex Mathew",
      createdAt: new Date().toISOString()
    },
    {
      id: "poll_scale_agi_probability",
      title: "AGI Realization Probability: Odds of AGI Consensus before 2028",
      description: "Quantify your subjective probability (0-100%) that artificial general intelligence is verified by independent consensus before January 1, 2028.",
      category: "AI",
      format: "scale",
      status: "active",
      blind: true,
      changeable: true,
      totalVotes: 680,
      scaleMin: 0,
      scaleMax: 100,
      scaleUnit: "%",
      scaleAverage: 73,
      scaleVotesCount: 680,
      options: [
        { id: "val", name: "Sentiment Gauge (0-100%)" }
      ],
      createdBy: "rQLmIFSIZpfBomLiZVrUg4WA4b42",
      createdByName: "Aaron Alex Mathew",
      createdAt: new Date().toISOString()
    },
    {
      id: "poll_rank_layer1_settlement",
      title: "Smart Contract Layer 1 Supremacy: Rank by 2026 Settlement Volume",
      description: "Drag and arrange the leading Layer 1 architectures from highest to lowest projected net economic transaction throughput.",
      category: "Crypto",
      format: "rank",
      status: "active",
      blind: true,
      changeable: true,
      totalVotes: 512,
      options: [
        { id: "eth", name: "Ethereum (L1 + Rollup Superchain)" },
        { id: "sol", name: "Solana Parallel SVM Engine" },
        { id: "sui", name: "Sui Move Object Framework" },
        { id: "apt", name: "Aptos Block-STM Parallelism" }
      ],
      rankedItems: [
        { id: "eth", label: "Ethereum (L1 + Rollup Superchain)", score: 1420 },
        { id: "sol", label: "Solana Parallel SVM Engine", score: 1290 },
        { id: "sui", label: "Sui Move Object Framework", score: 810 },
        { id: "apt", label: "Aptos Block-STM Parallelism", score: 650 }
      ],
      createdBy: "rQLmIFSIZpfBomLiZVrUg4WA4b42",
      createdByName: "Aaron Alex Mathew",
      createdAt: new Date().toISOString()
    },
    {
      id: "poll_open_trillion_dollar_breakthrough",
      title: "Next Trillion-Dollar Frontier Sector: Nominate & Back Candidate Theses",
      description: "Crowdsourced open ballot. Vote for existing community proposals or nominate a new paradigm-shifting sector.",
      category: "Tech",
      format: "open",
      status: "active",
      blind: true,
      changeable: true,
      totalVotes: 846,
      options: [],
      openSubmissions: [
        {
          id: "sub_1",
          text: "Room-Temperature Superconducting Synthetics",
          authorId: "node_oracle",
          authorName: "Quantum Oracle",
          votes: 342,
          createdAt: new Date().toISOString()
        },
        {
          id: "sub_2",
          text: "Autonomous Multi-Agent Sovereign Economic DAOs",
          authorId: "node_alpha",
          authorName: "Alpha Macro",
          votes: 289,
          createdAt: new Date().toISOString()
        },
        {
          id: "sub_3",
          text: "In-Vivo CRISPR Epigenetic mRNA Diagnostics",
          authorId: "node_bio",
          authorName: "BioSynth Lab",
          votes: 215,
          createdAt: new Date().toISOString()
        }
      ],
      createdBy: "rQLmIFSIZpfBomLiZVrUg4WA4b42",
      createdByName: "Aaron Alex Mathew",
      createdAt: new Date().toISOString()
    },
    {
      id: "poll_choice_fed_terminal_rate",
      title: "US Federal Reserve Terminal Rate Cuts: Cumulative Policy Actions through 2026",
      description: "Standard multi-choice market. Predict the cumulative monetary easing cycle over the next 12 months.",
      category: "Crypto",
      format: "choice",
      status: "active",
      blind: true,
      changeable: true,
      totalVotes: 670,
      options: [
        { id: "opt_1", name: "Aggressive Easing (>75 bps total cuts)", votes: 310, percentage: 46 },
        { id: "opt_2", name: "Moderate Easing (25 to 50 bps cuts)", votes: 280, percentage: 42 },
        { id: "opt_3", name: "Pause or Further Rate Hikes (≤0 bps)", votes: 80, percentage: 12 }
      ],
      createdBy: "rQLmIFSIZpfBomLiZVrUg4WA4b42",
      createdByName: "Aaron Alex Mathew",
      createdAt: new Date().toISOString()
    }
  ];

  const batch = db.batch();
  samplePolls.forEach(p => {
    const docRef = db.collection("world_cup_polls").doc(p.id);
    batch.set(docRef, p, { merge: true });
  });

  await batch.commit();
  console.log("✨ Successfully seeded all 5 distinct poll formats into Firestore!");
  process.exit(0);
}

seedFiveFormats().catch(err => {
  console.error("Seeding error:", err);
  process.exit(1);
});
