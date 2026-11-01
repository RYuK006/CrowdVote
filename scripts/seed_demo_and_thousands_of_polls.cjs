const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const credPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(credPath)) {
  console.error("❌ Service account key not found at", credPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

const DEMO_USER_ID = "demo_roastmaster_curator";
const DEMO_USER_DATA = {
  displayName: "RoastMaster & Global Curator",
  email: "demo.curator@crowdvote.ai",
  accuracyScore: 100,
  role: "demo_curator",
  bio: "Official CrowdVote Demo Curator. Curating thousands of multi-topic polls and Roast Room simulated advisor debates across Tech, Startups, Crypto, Sports, and Culture.",
  avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=RoastMaster",
  predictionCount: 2500,
  isVerified: true,
  createdAt: new Date().toISOString()
};

// Templates for generating rich, diverse topics
const CATEGORY_TEMPLATES = {
  "Tech & AI": [
    { q: "Will Artificial General Intelligence (AGI) be achieved before {year}?", opts: ["Yes, before {year}", "No, after {year}", "Never / Far future"] },
    { q: "Which AI model architecture will dominate software engineering in {year}?", opts: ["Full Reasoning Models", "Hybrid Speculative Decoders", "Local Quantized LLMs", "Multi-Agent Swarms"] },
    { q: "Will humanoid robots reach 1M units deployed globally by {year}?", opts: ["Yes, easily", "No, supply chain bottleneck", "Unlikely before 2035"] },
    { q: "Which programming language will see highest growth for systems engineering in {year}?", opts: ["Rust", "Zig", "Go", "Modern C++"] },
    { q: "Will quantum computing break commercial RSA encryption before {year}?", opts: ["Yes, major breakthrough", "No, post-quantum wins", "Decades away"] },
    { q: "Which web framework provides the best DX and performance in {year}?", opts: ["Next.js / React 19", "SvelteKit", "Vite + Solid", "Astro"] },
    { q: "Will autonomous robotaxis surpass human-driven rideshare market share in tier-1 cities by {year}?", opts: ["Yes, completely", "Partial parity (30-50%)", "Regulatory gridlock"] },
    { q: "Which chip architecture will challenge Nvidia's datacenter monopoly by {year}?", opts: ["Custom Hyperscaler ASICs (TPU/Trainium)", "AMD Instinct", "Neuromorphic / Photonic chips", "Nvidia retains 80%+"] }
  ],
  "Startups & Roasts": [
    { q: "For a B2B SaaS startup with $50k MRR, what is the best capital strategy in {year}?", opts: ["Bootstrap & retain 100% equity", "Raise a $3M Seed round", "Venture debt only", "Seek strategic acquisition"] },
    { q: "Which founder focus area delivers maximum leverage at pre-seed?", opts: ["Talking to 10 customers daily", "Perfecting the MVP architecture", "Audience building on X/LinkedIn", "Fundraising network"] },
    { q: "Is remote-first culture still a competitive moat for early startups in {year}?", opts: ["Yes, global talent density", "No, in-person shipping velocity wins", "Hybrid hub model only"] },
    { q: "What pricing model is most effective for AI native applications in {year}?", opts: ["Outcome/Value-based billing", "Pure usage/token metering", "Flat monthly seat licensing", "Freemium + credits"] },
    { q: "Should a technical founder hire an agency or build in-house marketing?", opts: ["Founder-led organic marketing", "Boutique agency", "Hire full-time Head of Growth", "Product-led growth only"] },
    { q: "What is the primary reason early stage tech startups fail post-PMF?", opts: ["Premature scaling & burn rate", "Co-founder alignment breakdown", "Distribution failure", "Platform risk"] }
  ],
  "Finance & Crypto": [
    { q: "What will be Bitcoin's market valuation cycle peak before {year}?", opts: ["$150,000 - $200,000", "$200,000 - $300,000", "Above $300,000", "Below $100,000"] },
    { q: "Will decentralized prediction markets reach $50B in annual volume by {year}?", opts: ["Yes, explosive adoption", "No, regulatory friction", "Exceeds $100B"] },
    { q: "Which smart contract platform will settle the most real-world tokenized assets (RWA) in {year}?", opts: ["Ethereum L1 + L2s", "Solana", "Chainlink CCIP / Avalanche Subnets", "Private Permissioned Chains"] },
    { q: "Where will the US Federal Reserve benchmark interest rate stand by end of {year}?", opts: ["Below 3.25%", "3.25% - 4.00%", "4.00% - 4.75%", "Above 4.75%"] },
    { q: "Which asset class offers the strongest risk-adjusted return over a 5-year horizon?", opts: ["Global Equities (S&P/Nasdaq)", "Bitcoin & Digital Gold", "Private Credit / High Yield", "Emerging Market Infrastructure"] }
  ],
  "Politics": [
    { q: "Will the UN establish a binding international AI safety treaty before {year}?", opts: ["Yes, multilateral treaty", "Non-binding accord only", "No consensus reached"] },
    { q: "Which geopolitical bloc will lead clean energy patent filings in {year}?", opts: ["East Asia / China", "European Union", "United States", "India & Global South"] },
    { q: "Will digital sovereign IDs and biometric voting be adopted by 10+ major democracies by {year}?", opts: ["Yes, widespread rollout", "Selective pilots only", "Blocked on privacy concerns"] }
  ],
  "Sports": [
    { q: "Who will capture the UEFA Champions League title in the {year} season?", opts: ["Real Madrid", "Manchester City", "Bayern Munich", "Underdog finalist"] },
    { q: "Will an athlete run an officially ratified sub-2:00:00 marathon in open competition before {year}?", opts: ["Yes, with advanced supershoes", "No, physiological barrier", "Only in pacemaking lab conditions"] },
    { q: "Which team will claim the Formula 1 World Constructors Championship in {year}?", opts: ["McLaren", "Ferrari", "Red Bull Racing", "Mercedes"] },
    { q: "Will the Cricket World Cup see an associate nation reach the semi-finals by {year}?", opts: ["Yes, historic upset", "No, traditional powers hold", "Quarter-finals at most"] }
  ],
  "Pop Culture": [
    { q: "Which medium will generate the highest grossing entertainment franchise in {year}?", opts: ["Video Games / Interactive Worlds", "Cinematic Theatrical Releases", "Short-Form Social IP", "Anime / Manga Adaptations"] },
    { q: "Will a purely AI-generated music album top the global Billboard 200 before {year}?", opts: ["Yes, mainstream hit", "No, copyright & listener pushback", "Under pseudonymous virtual artist"] },
    { q: "Which gaming genre will capture highest player engagement in {year}?", opts: ["Extraction Shooters & Roguelikes", "Open World RPGs", "Social Party / Sandbox Games", "Competitive MOBA"] }
  ],
  "Science": [
    { q: "Will commercial nuclear fusion achieve sustained net electricity to the grid before {year}?", opts: ["Yes, private pilot reactors", "No, not before 2035", "Between 2030-2035"] },
    { q: "Will humans establish a permanent crewed lunar base camp by {year}?", opts: ["Yes, Artemis / CNSA", "Delayed to late 2030s", "Uncrewed robotic outpost only"] },
    { q: "Will an anti-aging drug extending healthy human lifespan by 10+ years pass FDA Phase III by {year}?", opts: ["Yes, senolytics/NAD breakthrough", "No, regulatory hurdle", "Only in animal models"] }
  ],
  "Sponsored": [
    {
      sponsor: "Supabase",
      logo: "https://supabase.com/favicon/favicon-32x32.png",
      url: "https://supabase.com",
      reward: "2x Accuracy Points Boost",
      q: "Sponsored by Supabase: What is the most critical database architectural requirement for high-scale real-time apps in {year}?",
      opts: ["PostgreSQL Row Level Security (RLS)", "Instant Realtime WebSocket Subscriptions", "Edge Functions with Vector Embeddings", "Automated DB Backups & Zero-Downtime Migration"]
    },
    {
      sponsor: "Vercel",
      logo: "https://vercel.com/favicon.ico",
      url: "https://vercel.com",
      reward: "150 Bonus Influence Points",
      q: "Sponsored by Vercel: Which frontend rendering paradigm provides the optimal balance of SEO and instant interaction in {year}?",
      opts: ["Hybrid Server Components (RSC) + Streaming", "Edge SSR with Incremental Static Regeneration", "Static Site Generation (SSG) with Client Hydration", "Full Client-Side SPA with PWA Caching"]
    },
    {
      sponsor: "Red Bull",
      logo: "https://www.redbull.com/favicon.ico",
      url: "https://www.redbull.com",
      reward: "VIP Access & 3x Points",
      q: "Sponsored by Red Bull: In extreme high-performance endurance, what matters most for peak output?",
      opts: ["Mental resilience & nervous system focus", "Aerobic capacity & VO2 max", "Biomechanics & aerodynamics", "Metabolic fuel & recovery rate"]
    },
    {
      sponsor: "Stripe",
      logo: "https://stripe.com/favicon.ico",
      url: "https://stripe.com",
      reward: "2x Accuracy Points Boost",
      q: "Sponsored by Stripe: What payment infrastructure innovation will unlock the next $1T in global internet commerce by {year}?",
      opts: ["Autonomous AI Agent Micro-Transactions", "Cross-Border Instant Stablecoin Rails", "Embedded Frictionless One-Click Checkout", "Real-Time Fraud Prevention with Machine Learning"]
    },
    {
      sponsor: "Linear",
      logo: "https://linear.app/favicon.ico",
      url: "https://linear.app",
      reward: "Pro Builder Badge & 2x Points",
      q: "Sponsored by Linear: What defines high-velocity product engineering teams in {year}?",
      opts: ["High trust, minimal meetings, crisp written async specs", "Heavy sprint rituals & granular story points", "Continuous deployment with automated rollback", "Specialized QA and product management layers"]
    }
  ]
};

const YEARS = ["2026", "2027", "2028", "2029", "2030"];
const ADVISORS = ["Paul Graham", "Jeff Bezos", "Alex Hormozi", "Elon Musk", "Gary Vaynerchuk", "Naval Ravikant", "Warren Buffett", "Codie Sanchez"];

async function seed() {
  console.log("🚀 Starting database seeding...");
  
  // 1. Create or update Demo User in Firebase
  console.log(`👤 Syncing Demo User: ${DEMO_USER_ID}`);
  await db.collection("users").doc(DEMO_USER_ID).set(DEMO_USER_DATA, { merge: true });
  console.log("✅ Demo user created/updated successfully.");

  // Check existing polls count
  const existingSnap = await db.collection("world_cup_polls").limit(1).get();
  console.log(`📊 Polls collection currently exists. Adding thousands of multi-topic & sponsored polls...`);

  const categories = Object.keys(CATEGORY_TEMPLATES);
  const TOTAL_TARGET = 2100;
  let batch = db.batch();
  let countInBatch = 0;
  let totalCreated = 0;

  for (let i = 1; i <= TOTAL_TARGET; i++) {
    const category = categories[i % categories.length];
    const templates = CATEGORY_TEMPLATES[category];
    const template = templates[i % templates.length];
    const year = YEARS[i % YEARS.length];
    
    const isSponsored = category === "Sponsored" || (i % 7 === 0);
    let sponsorMeta = {};
    if (isSponsored) {
      const spTemplate = CATEGORY_TEMPLATES["Sponsored"][i % CATEGORY_TEMPLATES["Sponsored"].length];
      sponsorMeta = {
        isSponsored: true,
        sponsorName: spTemplate.sponsor,
        sponsorLogo: spTemplate.logo,
        sponsorUrl: spTemplate.url,
        sponsorReward: spTemplate.reward
      };
    } else {
      sponsorMeta = { isSponsored: false };
    }

    const title = template.q.replace(/\{year\}/g, year);
    const options = template.opts.map((optText, optIdx) => ({
      id: `opt${optIdx + 1}`,
      text: optText.replace(/\{year\}/g, year)
    }));

    const advisor = ADVISORS[i % ADVISORS.length];
    const pollId = `poll_${category.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${String(i).padStart(4, '0')}`;

    const pollDoc = {
      id: pollId,
      title: title,
      category: category === "Sponsored" ? "Sponsored" : category,
      description: `Community prediction & Roast Room debate. Evaluated by advisor council led by ${advisor}.`,
      status: "open",
      lockAt: new Date(Date.now() + (30 + (i % 120)) * 86400000).toISOString(),
      matchTime: `${10 + (i % 15)} Nov ${year}, ${(i % 12) + 1}:00 PM`,
      createdBy: DEMO_USER_ID,
      creatorName: DEMO_USER_DATA.displayName,
      createdAt: new Date(Date.now() - (i * 1800000)).toISOString(),
      councilVerdict: `${advisor}: "The contrarian play is backed by fundamental leverage. Watch the crowd consensus closely."`,
      tags: [category.toLowerCase(), "roast-room", "crowd-vote", isSponsored ? "sponsored" : "community"],
      options: options,
      ...sponsorMeta
    };

    const docRef = db.collection("world_cup_polls").doc(pollId);
    batch.set(docRef, pollDoc, { merge: true });
    countInBatch++;
    totalCreated++;

    // Commit every 450 documents (Firestore limit is 500)
    if (countInBatch >= 450) {
      console.log(`💾 Committing batch of ${countInBatch} polls (Total so far: ${totalCreated}/${TOTAL_TARGET})...`);
      await batch.commit();
      batch = db.batch();
      countInBatch = 0;
    }
  }

  if (countInBatch > 0) {
    console.log(`💾 Committing final batch of ${countInBatch} polls...`);
    await batch.commit();
  }

  console.log(`\n🎉 SEEDING COMPLETE!`);
  console.log(`- Created/Updated User: ${DEMO_USER_DATA.displayName} (${DEMO_USER_ID})`);
  console.log(`- Generated & Stored: ${totalCreated} diverse multi-topic & sponsored polls`);
  console.log(`- Categories covered: ${categories.join(", ")}`);
  console.log(`- Existing user data preserved: YES (zero existing data deleted)`);
}

seed().then(() => {
  console.log("Seeding script finished cleanly.");
  process.exit(0);
}).catch(err => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
