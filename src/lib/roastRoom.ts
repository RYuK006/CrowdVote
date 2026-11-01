export interface AdvisorSeat {
  key: string;
  name: string;
  short: string;
  role: string;
  archetype: string;
  quote: string;
  portrait: string;
  style: string;
}

export const ADVISOR_ROSTER: AdvisorSeat[] = [
  {
    key: "graham",
    name: "Paul Graham",
    short: "Graham",
    role: "Y Combinator Founder & Essayist",
    archetype: "Hacker Ethos & First Principles",
    quote: "Make something people actually want. Everything else is vanity.",
    portrait: "/portraits/graham-base.webp",
    style: "Deep intellectual skepticism, focuses on relentless execution and contrarian truth."
  },
  {
    key: "bezos",
    name: "Jeff Bezos",
    short: "Bezos",
    role: "Amazon Founder & Executive Chair",
    archetype: "Day 1 & Customer Obsession",
    quote: "It's always Day 1. Day 2 is stasis, followed by irrelevance, followed by agonizing decline.",
    portrait: "/portraits/bezos-base.webp",
    style: "Framework of one-way vs two-way doors, scale economics, relentless customer focus."
  },
  {
    key: "hormozi",
    name: "Alex Hormozi",
    short: "Hormozi",
    role: "Acquisition.com Founder & Author",
    archetype: "$100M Offers & Unit Economics",
    quote: "Make offers so good people feel stupid saying no. Volume negates luck.",
    portrait: "/portraits/hormozi-base.webp",
    style: "Blunt mathematical reality, pricing power, ruthless focus on unit economics."
  },
  {
    key: "garyvee",
    name: "Gary Vaynerchuk",
    short: "GaryVee",
    role: "VaynerX CEO & Creator",
    archetype: "Attention & Culture",
    quote: "Attention is the only asset. If you don't trade on contemporary attention, you lose.",
    portrait: "/portraits/garyvee-base.webp",
    style: "High energy, macro-patience micro-speed, aggressive cultural relevance."
  },
  {
    key: "musk",
    name: "Elon Musk",
    short: "Musk",
    role: "Tesla, SpaceX & xAI",
    archetype: "First-Principles Physics & Scale",
    quote: "Boil things down to their fundamental truths and reason up from there.",
    portrait: "/portraits/musk-base.webp",
    style: "Engineering realism, aggressive timelines, elimination of unnecessary steps."
  },
  {
    key: "naval",
    name: "Naval Ravikant",
    short: "Naval",
    role: "AngelList Co-Founder & Philosopher",
    archetype: "Permissionless Leverage & Judgment",
    quote: "Judgment is knowing what to do. Leverage is multiplying that judgment.",
    portrait: "/portraits/naval-base.webp",
    style: "Calm aphorisms, specific knowledge, long-term games with long-term people."
  },
  {
    key: "buffett",
    name: "Warren Buffett",
    short: "Buffett",
    role: "Berkshire Hathaway Chairman",
    archetype: "Moats & Margin of Safety",
    quote: "Rule No. 1: Never lose money. Rule No. 2: Never forget rule No. 1.",
    portrait: "/portraits/buffett-base.webp",
    style: "Patience, durable competitive advantages, staying inside your circle of competence."
  },
  {
    key: "sanchez",
    name: "Codie Sanchez",
    short: "Codie",
    role: "Contrarian Thinking Founder",
    archetype: "Cash Flow & Sweating Assets",
    quote: "Cash flow cures everything. Don't chase trends when you can buy cash-flowing engines.",
    portrait: "/portraits/sanchez-base.webp",
    style: "Pragmatic, asset-backed, anti-hype, focuses on tangible revenue generation."
  },
  {
    key: "martell",
    name: "Dan Martell",
    short: "Martell",
    role: "SaaS Academy Founder & Author",
    archetype: "Buy Back Your Time & Systems",
    quote: "Don't hire to grow your business; hire to buy back your time.",
    portrait: "/portraits/martell-base.webp",
    style: "Systems thinker, process automation, scalable leadership."
  }
];

export interface CouncilEvaluation {
  seat: AdvisorSeat;
  roast: string;
  recommendedOption: string;
  confidence: number;
}

export function generateCouncilDebate(poll: { title: string; category?: string; options?: Array<{ id: string; text: string }> }): CouncilEvaluation[] {
  if (!poll.options || poll.options.length === 0) return [];

  // Pick 3 diverse advisors based on hash of title
  const hash = poll.title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seats = [...ADVISOR_ROSTER];
  
  const pickedIndices = [
    hash % seats.length,
    (hash + 3) % seats.length,
    (hash + 7) % seats.length
  ];
  
  const uniqueSeats = Array.from(new Set(pickedIndices)).map(i => seats[i]);

  return uniqueSeats.map((seat, idx) => {
    const chosenOption = poll.options![(hash + idx) % poll.options!.length];
    let roast = "";

    switch (seat.key) {
      case "graham":
        roast = `Looking at "${poll.title}", most people pick conventional wisdom. But the contrarian outlier is "${chosenOption.text}". If this is a real problem, solve it for the obsessives first.`;
        break;
      case "bezos":
        roast = `This is a two-way door decision. Backing "${chosenOption.text}" provides asymmetric upside. We should experiment fast and let customer behavior guide the outcome.`;
        break;
      case "hormozi":
        roast = `The crowd is overcomplicating this. Look at the math: "${chosenOption.text}" delivers the highest perceived value with the lowest friction. The rest is noise.`;
        break;
      case "garyvee":
        roast = `Stop debating in theory and check where culture is actually moving right now! "${chosenOption.text}" has 10x the cultural resonance and brand equity.`;
        break;
      case "musk":
        roast = `Strip away the noise and apply first principles. "${chosenOption.text}" minimizes thermodynamic waste and optimizes for execution velocity.`;
        break;
      case "naval":
        roast = `Play iterated games. "${chosenOption.text}" builds non-linear compounding and specific knowledge, whereas other options have capped upside.`;
        break;
      case "buffett":
        roast = `Look for the moat and margin of safety. In a 10-year horizon, "${chosenOption.text}" is the only choice that doesn't risk permanent capital loss.`;
        break;
      default:
        roast = `From an operational cash flow perspective, "${chosenOption.text}" stands out as the most durable and scalable choice.`;
    }

    return {
      seat,
      roast,
      recommendedOption: chosenOption.text,
      confidence: 75 + ((hash * (idx + 1)) % 23)
    };
  });
}
