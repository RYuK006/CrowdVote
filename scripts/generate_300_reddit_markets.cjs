/**
 * scripts/generate_300_reddit_markets.cjs
 *
 * Populates 300 rephrased prediction market polls across 7 core domains
 * into Firestore and the local polls database, attributed to 35 authentic
 * South Indian Christian, domain-specific, and fan/culture accounts.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { generate300Topics } = require('./build_reddit_topics.cjs');

// 1. Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error("Missing serviceAccountKey.json!");
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// 2. Define the 35 Creator Accounts
const ACCOUNTS = [
  // South Indian Christian Names (18)
  { uid: "usr_reni_mathew", name: "Reni Mathew", handle: "@renimathew", bio: "Tech forecaster & systems engineer, Kochi. Tracking frontier AI and Kerala election consensus.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=ReniMathew", affinity: ["AI", "Politics", "Startups"] },
  { uid: "usr_jeswin_john", name: "Jeswin John", handle: "@jeswinjohn", bio: "Autonomous robotics researcher & election data modeller. Kottayam.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=JeswinJohn", affinity: ["AI", "Politics", "Science"] },
  { uid: "usr_alka_sara", name: "Alka Sara Biju", handle: "@alkasara", bio: "Quantitative macro analyst & healthtech forecaster. Thrissur.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=AlkaSara", affinity: ["Politics", "Startups", "Science"] },
  { uid: "usr_sneha_varghese", name: "Sneha K. Varghese", handle: "@snehakvarghese", bio: "Biotech & clinical trial researcher. Calicut / Bangalore.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=SnehaVarghese", affinity: ["Science", "Startups"] },
  { uid: "usr_elvin_jacob", name: "Elvin Jacob", handle: "@elvinjacob", bio: "Distributed systems architect, Web3 protocol contributor. Ernakulam.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=ElvinJacob", affinity: ["Crypto", "AI"] },
  { uid: "usr_jijo_ulahannan", name: "Jijo P. Ulahannan", handle: "@jijopual", bio: "Academic computational physicist & open science advocate. Pala.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=JijoUlahannan", affinity: ["Science", "AI"] },
  { uid: "usr_john_chacko", name: "John Chacko", handle: "@johnchacko", bio: "Aerospace telemetry enthusiast, ISRO & space economy tracker. Trivandrum.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=JohnChacko", affinity: ["Science", "Politics"] },
  { uid: "usr_jeffin_james", name: "Jeffin James", handle: "@jeffinjames", bio: "Product engineer & startup ecosystem watcher. Infopark Kochi.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=JeffinJames", affinity: ["Startups", "AI"] },
  { uid: "usr_binu_mathew", name: "Binu Mathew", handle: "@binumathew", bio: "Financial derivatives trader & commodity cycle forecaster. Aluva.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=BinuMathew", affinity: ["Startups", "Crypto", "Politics"] },
  { uid: "usr_jeneeta_james", name: "Jeneeta James", handle: "@jeneetajames", bio: "Data journalist, political polls and demographic trends analyst.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=JeneetaJames", affinity: ["Politics", "General"] },
  { uid: "usr_roshan_george", name: "Roshan George", handle: "@roshangeorge", bio: "Fullstack developer & decentralized consensus advocate. Thiruvalla.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=RoshanGeorge", affinity: ["Crypto", "Startups"] },
  { uid: "usr_stephy_varghese", name: "Stephy Varghese", handle: "@stephyvarghese", bio: "Renewable energy policy researcher & battery storage specialist.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=StephyVarghese", affinity: ["Science", "General"] },
  { uid: "usr_tinu_abraham", name: "Tinu Abraham", handle: "@tinuabraham", bio: "Hardware engineer & semiconductor packaging analyst. Bangalore / Kochi.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=TinuAbraham", affinity: ["AI", "Startups", "General"] },
  { uid: "usr_sherin_philip", name: "Sherin K. Philip", handle: "@sherinkphilip", bio: "Cybersecurity specialist & cryptographic privacy advocate. Kollam.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=SherinPhilip", affinity: ["Crypto", "General", "AI"] },
  { uid: "usr_robin_george", name: "Robin George G", handle: "@robingeorge", bio: "Mobile architecture lead & edge computing forecaster. Kottayam.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=RobinGeorge", affinity: ["AI", "Crypto"] },
  { uid: "usr_beno_babu", name: "Beno Babu", handle: "@benobabu", bio: "AI prompt engineer and sports analytics researcher. Pathanamthitta.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=BenoBabu", affinity: ["Sports", "AI"] },
  { uid: "usr_lijo_thomas", name: "Lijo Thomas", handle: "@lijothomas", bio: "Cloud infrastructure lead & football tactician enthusiast. Ernakulam.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=LijoThomas", affinity: ["Sports", "Startups"] },
  { uid: "usr_ailine_mary", name: "Ailine Mary Joseph", handle: "@ailinemary", bio: "Cognitive science researcher and cinema narrative analyst. Angamaly.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=AilineMary", affinity: ["General", "AI"] },

  // Domain-Specific Research & Analysis Nodes (9)
  { uid: "usr_silicon_kerala", name: "Silicon Kerala Pulse", handle: "@siliconkerala", bio: "Independent intelligence dispatch covering Kerala Startup Mission, angel rounds & tech scale-ups.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=SiliconKerala", affinity: ["Startups", "AI"] },
  { uid: "usr_frontier_macro", name: "Frontier Macro Lab", handle: "@frontiermacro", bio: "High-frequency macroeconomics, central bank liquidity models, and bond yield curve analysis.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=FrontierMacro", affinity: ["Startups", "Politics"] },
  { uid: "usr_sovereign_ai", name: "Sovereign AI Radar", handle: "@sovereignai", bio: "Tracking national compute clusters, frontier reasoning benchmarks, and open-weights parity.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=SovereignAI", affinity: ["AI"] },
  { uid: "usr_defi_sentinel", name: "DeFi Sentinel", handle: "@defisentinel", bio: "On-chain liquidity watcher, cross-chain bridge security, and stablecoin yield analysis.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=DeFiSentinel", affinity: ["Crypto"] },
  { uid: "usr_orbital_space", name: "Orbital Space Watch", handle: "@orbitalspacewatch", bio: "Global launch cadence, lunar lander telemetry, and commercial satellite constellation tracker.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=OrbitalSpace", affinity: ["Science"] },
  { uid: "usr_quantum_vector", name: "Quantum Vector Research", handle: "@quantumvector", bio: "Fault-tolerant quantum computing benchmarks, QPU qubit fidelity, and post-quantum encryption.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=QuantumVector", affinity: ["AI", "Science"] },
  { uid: "usr_biotech_horizon", name: "Biotech Horizon Lab", handle: "@biotechhorizon", bio: "In-silico drug design, mRNA platform pipelines, and FDA accelerated approvals tracker.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=BiotechHorizon", affinity: ["Science"] },
  { uid: "usr_clean_energy", name: "CleanEnergy Dispatch", handle: "@cleanenergydispatch", bio: "Perovskite solar cell efficiency, modular nuclear reactors (SMRs), and grid battery parity.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=CleanEnergy", affinity: ["Science"] },
  { uid: "usr_semi_yield", name: "Semiconductor Yield", handle: "@semiconductoryield", bio: "High-NA EUV lithography, CoWoS advanced packaging capacity, and foundry wafer pricing.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=SemiYield", affinity: ["AI", "Startups"] },

  // Fan / Culture / Media Accounts (8)
  { uid: "usr_mollywood_boxoffice", name: "Mollywood Box Office Tracker", handle: "@mollywoodboxoffice", bio: "The definitive consensus index on Malayalam cinema box office, worldwide grossers and pan-India records.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=MollywoodBO", affinity: ["General"] },
  { uid: "usr_real_madrid_kerala", name: "Real Madrid Ultras Kerala", handle: "@realmadridkerala", bio: "Official Kerala Madridistas fan coalition. Champions League predictions and match tactician debates.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=RealMadridKerala", affinity: ["Sports"] },
  { uid: "usr_f1_paddock_kerala", name: "Formula 1 Paddock Kerala", handle: "@f1paddockkerala", bio: "Pitlane telemetry, aero upgrades, tyre strategy models, and 2026 power-unit engine regulations.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=F1PaddockKerala", affinity: ["Sports"] },
  { uid: "usr_anirudh_wave", name: "Anirudh Music Wave", handle: "@anirudhwaves", bio: "Soundtrack charts, streaming records, concert footfall, and musical trend consensus hub.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=AnirudhWave", affinity: ["General"] },
  { uid: "usr_isro_fan_club", name: "ISRO Deep Space Fan Club", handle: "@isrodeepspace", bio: "Celebrating Indian space flight: Gaganyaan crew modules, Chandrayaan sample return, Shukrayaan missions.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=ISRODeepSpace", affinity: ["Science"] },
  { uid: "usr_openai_redteam", name: "OpenAI Red Team Fan", handle: "@openaireadteam", bio: "Tracking frontier safety evaluations, jailbreak vulnerabilities, and algorithmic alignment tests.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=OpenAIRedTeam", affinity: ["AI"] },
  { uid: "usr_nolan_archive", name: "Nolan Cinematic Archive", handle: "@nolancinema", bio: "Cinema purists analyzing non-linear narrative, 70mm IMAX cinematography, and theatrical milestones.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=NolanCinema", affinity: ["General"] },
  { uid: "usr_pl_tactics", name: "Premier League Tactical Desk", handle: "@pl_tactics", bio: "Expected goals (xG), pressing intensity metrics, and English title race forecast models.", avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=PLTactics", affinity: ["Sports"] }
];

// Helper to pick author with preference for topic domain affinity
function chooseAuthor(category, index) {
  const matches = ACCOUNTS.filter(a => a.affinity.includes(category));
  if (matches.length > 0) {
    return matches[index % matches.length];
  }
  return ACCOUNTS[index % ACCOUNTS.length];
}

async function run() {
  console.log("Generating 300 curated Reddit prediction market topics...");
  const rawTopics = generate300Topics();
  if (rawTopics.length !== 300) {
    console.error(`Expected 300 topics, got ${rawTopics.length}`);
    process.exit(1);
  }

  const baseTimestamp = Date.now();
  const builtPolls = [];

  rawTopics.forEach((t, i) => {
    const author = chooseAuthor(t.category, i);
    const pollId = `poll_reddit_${t.category.toLowerCase()}_${String(i + 1).padStart(3, '0')}`;
    
    // Spread creation time across the last 14 days, newest first
    const offsetMs = (300 - i) * 60 * 60 * 1000 * 0.9;
    const createdAt = new Date(baseTimestamp - offsetMs).toISOString();
    const lockAt = new Date(baseTimestamp + (180 + (i % 360)) * 24 * 60 * 60 * 1000).toISOString();

    const poll = {
      id: pollId,
      title: t.title,
      description: t.desc,
      category: t.category,
      format: t.format,
      status: "active",
      blind: false,
      changeable: true,
      anonymous: false,
      lockAt,
      createdAt,
      tags: t.tags || [`#${t.category}`],
      createdBy: author.uid,
      createdByName: author.name,
      authorHandle: author.handle,
      authorAvatar: author.avatar,
      isSponsored: false
    };

    if (t.format === "choice") {
      const rawOpts = t.options || ["Yes", "No", "Uncertain"];
      let totalV = 0;
      const opts = rawOpts.map((optText, oIdx) => {
        const v = Math.floor(65 + Math.random() * 240);
        totalV += v;
        return {
          id: `opt_${oIdx + 1}`,
          name: optText,
          text: optText,
          votes: v,
          percentage: 0
        };
      });
      opts.forEach(o => {
        o.percentage = Math.round((o.votes / totalV) * 100);
      });
      poll.options = opts;
      poll.totalVotes = totalV;
    } else if (t.format === "versus") {
      const vLeft = Math.floor(120 + Math.random() * 320);
      const vRight = Math.floor(110 + Math.random() * 310);
      const totalV = vLeft + vRight;
      const pLeft = Math.round((vLeft / totalV) * 100);
      const pRight = 100 - pLeft;

      poll.versusLeft = {
        id: "side_a",
        label: t.versusLeft || "Side A",
        votes: vLeft,
        percentage: pLeft
      };
      poll.versusRight = {
        id: "side_b",
        label: t.versusRight || "Side B",
        votes: vRight,
        percentage: pRight
      };
      poll.options = [
        { id: "opt_a", name: t.versusLeft, text: t.versusLeft, votes: vLeft, percentage: pLeft },
        { id: "opt_b", name: t.versusRight, text: t.versusRight, votes: vRight, percentage: pRight }
      ];
      poll.totalVotes = totalV;
    } else if (t.format === "scale") {
      const scaleMin = t.scaleMin !== undefined ? t.scaleMin : 0;
      const scaleMax = t.scaleMax !== undefined ? t.scaleMax : 100;
      const scaleUnit = t.scaleUnit || "%";
      const totalV = Math.floor(180 + Math.random() * 450);
      const avg = Math.round(scaleMin + (scaleMax - scaleMin) * (0.35 + Math.random() * 0.4));

      poll.scaleMin = scaleMin;
      poll.scaleMax = scaleMax;
      poll.scaleUnit = scaleUnit;
      poll.scaleAverage = avg;
      poll.totalVotes = totalV;
      poll.options = [
        { id: "opt_scale", name: `Consensus ${avg}${scaleUnit}`, text: `Consensus: ${avg}${scaleUnit}`, votes: totalV, percentage: 100 }
      ];
    }

    builtPolls.push(poll);
  });

  console.log(`Constructed ${builtPolls.length} calibrated prediction market objects.`);

  // 3. Save to local JSON archive in server/data/
  const outDir = path.join(__dirname, '..', 'server', 'data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const archivePath = path.join(outDir, 'reddit_polls_300.json');
  fs.writeFileSync(archivePath, JSON.stringify(builtPolls, null, 2), 'utf8');
  console.log(`Saved 300 polls archive to: ${archivePath}`);

  // Also merge/prepend into server/data/polls.json
  const mainPollsPath = path.join(outDir, 'polls.json');
  let existingPolls = [];
  if (fs.existsSync(mainPollsPath)) {
    try {
      existingPolls = JSON.parse(fs.readFileSync(mainPollsPath, 'utf8'));
    } catch (e) {
      existingPolls = [];
    }
  }
  // Deduplicate and place the 300 Reddit polls first
  const existingFiltered = existingPolls.filter(p => !p.id.startsWith("poll_reddit_"));
  const combinedPolls = [...builtPolls, ...existingFiltered];
  fs.writeFileSync(mainPollsPath, JSON.stringify(combinedPolls, null, 2), 'utf8');
  console.log(`Updated ${mainPollsPath} with ${combinedPolls.length} total polls (${builtPolls.length} reddit + ${existingFiltered.length} existing).`);

  // 4. Batch-write to Firestore world_cup_polls
  console.log("Writing 300 polls to Firestore world_cup_polls collection...");
  const BATCH_SIZE = 200;
  for (let b = 0; b < builtPolls.length; b += BATCH_SIZE) {
    const chunk = builtPolls.slice(b, b + BATCH_SIZE);
    const batch = db.batch();
    chunk.forEach(p => {
      const docRef = db.collection('world_cup_polls').doc(p.id);
      batch.set(docRef, p);
    });
    await batch.commit();
    console.log(`✓ Committed batch ${Math.floor(b / BATCH_SIZE) + 1} (${chunk.length} polls).`);
  }

  // 5. Upsert the 35 Creator profiles to Firestore users collection
  console.log("Upserting 35 creator profiles to Firestore users collection...");
  const userBatch = db.batch();
  ACCOUNTS.forEach(acc => {
    const uRef = db.collection('users').doc(acc.uid);
    userBatch.set(uRef, {
      uid: acc.uid,
      displayName: acc.name,
      handle: acc.handle,
      bio: acc.bio,
      avatar: acc.avatar,
      photoURL: acc.avatar,
      role: "demo_curator",
      predictionCount: Math.floor(40 + Math.random() * 120),
      accuracy: Math.floor(78 + Math.random() * 18),
      createdAt: new Date(baseTimestamp - 30 * 24 * 60 * 60 * 1000).toISOString()
    }, { merge: true });
  });
  await userBatch.commit();
  console.log("✓ All 35 creator profiles synchronized in Firestore.");

  console.log("\n=======================================================");
  console.log("🎉 SUCCESS: 300 Reddit prediction markets deployed!");
  console.log(`- Total Markets: ${builtPolls.length}`);
  console.log(`- Participating Creator Accounts: ${ACCOUNTS.length}`);
  console.log(`- Domains Covered: AI (50), Startups (45), Crypto (45), Politics (45), Science (40), Sports (40), General (35)`);
  console.log("=======================================================\n");
}

run().catch(err => {
  console.error("Fatal deployment error:", err);
  process.exit(1);
});
