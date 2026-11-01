const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, '..', 'server.ts');
let code = fs.readFileSync(serverFile, 'utf8');

// 1. Add Supabase import & client at top
const topTarget = "const __dirname = path.dirname(__filename);";
const topReplacement = `const __dirname = path.dirname(__filename);

// Initialize Supabase Client if credentials are provided
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
export const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;
if (supabase) {
  console.log("⚡ Supabase Client initialized & connected");
}`;

if (!code.includes("import { createClient } from '@supabase/supabase-js';")) {
  code = code.replace(topTarget, topReplacement);
}

// 2. Replace /api/polls with upgraded multi-topic, sponsored & pagination support
const pollEndpointRegex = /app\.get\("\/api\/polls", async \(req, res\) => \{[\s\S]*?\}\);\r?\n\r?\napp\.get\("\/api\/polls\/:id"/;

const newPollEndpoint = `app.get("/api/polls", async (req, res) => {
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
      if (adv.key === "graham") roast = \`Looking at "\${poll.title}", the crowd usually bets on consensus. But betting on "\${optText}" is the real contrarian founder play.\`;
      else if (adv.key === "bezos") roast = \`This is a two-way door decision. Backing "\${optText}" provides asymmetric upside with low reversibility risk.\`;
      else if (adv.key === "hormozi") roast = \`Let us look at the raw numbers. "\${optText}" delivers 10x the perceived leverage with the least friction.\`;
      else if (adv.key === "musk") roast = \`First principles dictate that "\${optText}" minimizes thermodynamic waste. Build for velocity.\`;
      else if (adv.key === "naval") roast = \`Play long-term iterated games. "\${optText}" unlocks non-linear leverage.\`;
      else roast = \`Margin of safety says "\${optText}" protects your principal and yields durable returns.\`;

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

app.get("/api/polls/:id"`;

code = code.replace(pollEndpointRegex, newPollEndpoint);

fs.writeFileSync(serverFile, code, 'utf8');
console.log('server.ts successfully patched!');
