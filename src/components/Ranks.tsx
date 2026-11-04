import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Trophy, Medal, Target, Zap, Search, ArrowUpRight, 
  User, ShieldCheck, Clapperboard, Sparkles, TrendingUp, 
  BarChart3, CheckCircle2, Filter, Award, ChevronRight
} from "lucide-react";
import { auth } from "../firebase";
import { Layout } from "./Layout";
import { cn } from "../lib/utils";

interface ForecasterNode {
  uid: string;
  id?: string;
  handle: string;
  displayName: string;
  avatar: string;
  subtitle: string;
  accuracy: number;
  signalsCount: number;
  points: number;
  rank?: number;
  tier: "Grandmaster" | "Master" | "Pro" | "Analyst";
  category: string;
  topCall: string;
}

interface ForecastBrief {
  id: string;
  title: string;
  authorHandle: string;
  authorName: string;
  authorAvatar: string;
  authorAccuracy: number;
  category: string;
  consensusPrediction: string;
  confidence: number;
  pollId: string;
  status: "Tracking Ahead" | "In Range" | "High Spread" | "Decisive Win";
}

const FALLBACK_FORECASTERS: ForecasterNode[] = [
  {
    uid: "node_quantum_oracle",
    handle: "quantum_oracle",
    displayName: "Quantum Oracle",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80",
    subtitle: "AI Reasoning & Compute Forecaster",
    accuracy: 98.4,
    signalsCount: 1420,
    points: 48200,
    tier: "Grandmaster",
    category: "AI",
    topCall: "Open-weight reasoning parity before fall 2026",
  },
  {
    uid: "node_polity_matrix",
    handle: "polity_matrix",
    displayName: "Polity Matrix",
    avatar: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=150&h=150&q=80",
    subtitle: "Demographic Coalition Statistician",
    accuracy: 97.9,
    signalsCount: 1180,
    points: 41500,
    tier: "Grandmaster",
    category: "Politics",
    topCall: "Kerala 2026 assembly voter shift margin +4.2%",
  },
  {
    uid: "node_alpha_macro",
    handle: "alpha_macro",
    displayName: "Alpha Macro",
    avatar: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=150&h=150&q=80",
    subtitle: "Cross-Asset Yield Forecaster",
    accuracy: 97.2,
    signalsCount: 1890,
    points: 39800,
    tier: "Grandmaster",
    category: "Finance",
    topCall: "Decoupled 75bps terminal Fed cuts pricing",
  },
  {
    uid: "node_cyber_pulse",
    handle: "cyber_pulse",
    displayName: "Cyber Pulse",
    avatar: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=150&h=150&q=80",
    subtitle: "Zero-Day & Sovereign Threat Modeler",
    accuracy: 96.5,
    signalsCount: 940,
    points: 34100,
    tier: "Master",
    category: "Science",
    topCall: "Quantum resilience timeline shift to 2027",
  },
  {
    uid: "node_crypto_sentinel",
    handle: "crypto_sentinel",
    displayName: "Crypto Sentinel",
    avatar: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=150&h=150&q=80",
    subtitle: "On-Chain Liquidity & L2 Specialist",
    accuracy: 96.1,
    signalsCount: 2210,
    points: 32600,
    tier: "Master",
    category: "Crypto",
    topCall: "Bitcoin liquidity squeeze at $150k target",
  },
  {
    uid: "node_venture_roast",
    handle: "venture_roast",
    displayName: "Venture Roast",
    avatar: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=150&h=150&q=80",
    subtitle: "SaaS Multiples & Unit Economics Critic",
    accuracy: 94.6,
    signalsCount: 860,
    points: 29400,
    tier: "Pro",
    category: "Startups",
    topCall: "SaaS Series A revenue multiples below 8x ARR",
  },
  {
    uid: "node_bio_synthetics",
    handle: "bio_synthetics",
    displayName: "Bio Synthetics",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    subtitle: "CRISPR & Synthetic Biology Node",
    accuracy: 94.2,
    signalsCount: 780,
    points: 27100,
    tier: "Pro",
    category: "Science",
    topCall: "In-vivo editing accelerated FDA review pass",
  },
  {
    uid: "node_delta_analytica",
    handle: "delta_analytica",
    displayName: "Delta Analytica",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
    subtitle: "High-Frequency Volatility Forecaster",
    accuracy: 93.8,
    signalsCount: 1650,
    points: 25900,
    tier: "Pro",
    category: "Finance",
    topCall: "FX volatility expansion in Q3 2026 cycle",
  },
];

const FORECAST_BRIEFS: ForecastBrief[] = [
  {
    id: "brief_1",
    pollId: "poll_quantum_oracle_2026",
    title: "Will open-weight reasoning models surpass frontier proprietary LLMs by Q3 2026?",
    authorHandle: "quantum_oracle",
    authorName: "Quantum Oracle",
    authorAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80",
    authorAccuracy: 98.4,
    category: "AI",
    consensusPrediction: "Surpass Frontier Parity",
    confidence: 74,
    status: "Tracking Ahead",
  },
  {
    id: "brief_2",
    pollId: "poll_alpha_macro_2026",
    title: "US Federal Reserve interest rates: Cumulative rate cuts before December 2026",
    authorHandle: "alpha_macro",
    authorName: "Alpha Macro",
    authorAvatar: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=150&h=150&q=80",
    authorAccuracy: 97.2,
    category: "Finance",
    consensusPrediction: "3 or More Cuts (>75 bps)",
    confidence: 68,
    status: "Decisive Win",
  },
  {
    id: "brief_3",
    pollId: "poll_venture_roast_2026",
    title: "Will the median Series A SaaS revenue multiple drop below 8x ARR by late 2026?",
    authorHandle: "venture_roast",
    authorName: "Venture Roast",
    authorAvatar: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=150&h=150&q=80",
    authorAccuracy: 94.6,
    category: "Startups",
    consensusPrediction: "Drop Below 8x ARR",
    confidence: 71,
    status: "High Spread",
  },
  {
    id: "brief_4",
    pollId: "poll_crypto_sentinel_2026",
    title: "Will Bitcoin breach $150,000 before the end of Q4 2026?",
    authorHandle: "crypto_sentinel",
    authorName: "Crypto Sentinel",
    authorAvatar: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=150&h=150&q=80",
    authorAccuracy: 96.1,
    category: "Crypto",
    consensusPrediction: "Yes, Above $150k target",
    confidence: 63,
    status: "In Range",
  },
  {
    id: "brief_5",
    pollId: "poll_polity_matrix_2026",
    title: "Kerala Assembly Elections 2026: Coalition Seat Majority Projection",
    authorHandle: "polity_matrix",
    authorName: "Polity Matrix",
    authorAvatar: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=150&h=150&q=80",
    authorAccuracy: 97.9,
    category: "Politics",
    consensusPrediction: "LDF Majority Retention",
    confidence: 51,
    status: "Decisive Win",
  },
];

const CATEGORY_TABS = ["All", "AI", "Finance", "Crypto", "Politics", "Science", "Startups"];

export function Ranks() {
  const [forecasters, setForecasters] = useState<ForecasterNode[]>(FALLBACK_FORECASTERS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeView, setActiveView] = useState<"ranks" | "briefs">("ranks");

  useEffect(() => {
    // Attempt fetching live global suggestions / leaderboard
    Promise.allSettled([
      fetch("/api/suggestions").then(res => res.json()),
      fetch("/api/leaderboard/global").then(res => res.json()),
    ]).then(([sugResult, leadResult]) => {
      const liveList: ForecasterNode[] = [];

      if (sugResult.status === "fulfilled" && Array.isArray(sugResult.value)) {
        sugResult.value.forEach((u: any, idx: number) => {
          liveList.push({
            uid: u.uid || `node_${idx}`,
            handle: u.handle || u.displayName?.toLowerCase().replace(/\s+/g, "_") || `forecaster_${idx}`,
            displayName: u.displayName || "Node Forecaster",
            avatar: u.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.uid || idx}`,
            subtitle: u.subtitle || "High Variance Calibration",
            accuracy: u.accuracy || 95.0,
            signalsCount: u.signalsCount || 450 + idx * 80,
            points: u.points || 12000 + idx * 1500,
            tier: idx < 3 ? "Grandmaster" : idx < 6 ? "Master" : "Pro",
            category: "AI",
            topCall: "Consensus calibration active",
          });
        });
      }

      if (liveList.length > 0) {
        // Merge or replace
        setForecasters(liveList);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const filteredForecasters = forecasters
    .filter(f => selectedCategory === "All" || f.category === selectedCategory)
    .filter(f => 
      f.displayName.toLowerCase().includes(search.toLowerCase()) ||
      f.handle.toLowerCase().includes(search.toLowerCase()) ||
      f.subtitle.toLowerCase().includes(search.toLowerCase())
    )
    .map((f, idx) => ({ ...f, rank: idx + 1 }));

  const topThree = filteredForecasters.slice(0, 3);
  const tableForecasters = filteredForecasters.slice(3);

  return (
    <Layout user={auth.currentUser}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* 1. Header Bar with Clapperboard Motif */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#1b1e26]">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/10">
                <Clapperboard className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-mono font-black uppercase tracking-[0.3em] text-amber-400">
                LEADERBOARD &amp; TOP PREDICTIONS
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              The <span className="text-emerald-400 italic">Grandmaster</span> Radar
            </h1>
            <p className="text-stone-400 max-w-xl text-xs sm:text-sm font-sans leading-relaxed">
              Decentralized consensus intelligence. Top forecasting agents ranked by verified Brier calibration, prediction accuracy, and high-spread forecast briefs.
            </p>
          </div>

          {/* Quick Dual View Toggle (Leaderboard Matrix vs Forecast Briefs) */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#0d0f14] border border-[#1f232d] shadow-xl self-start md:self-auto">
            <button
              onClick={() => setActiveView("ranks")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2",
                activeView === "ranks"
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-black"
                  : "text-stone-400 hover:text-white"
              )}
            >
              <Trophy className="w-4 h-4" />
              <span>Leaderboard</span>
            </button>

            <button
              onClick={() => setActiveView("briefs")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2",
                activeView === "briefs"
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black"
                  : "text-stone-400 hover:text-white"
              )}
            >
              <Clapperboard className="w-4 h-4" />
              <span>Forecast Briefs</span>
            </button>
          </div>
        </div>

        {/* 2. Top Forecast Briefs Spotlight (Clapperboard Motif) */}
        {activeView === "briefs" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Clapperboard className="w-5 h-5 text-amber-400" />
                  <span>Elite Forecast Briefs &amp; Track Records</span>
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  High-conviction market briefs cast by Tier 1 Grandmasters with asymmetric accuracy.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                5 Active High-Conviction Briefs
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FORECAST_BRIEFS.map((brief) => (
                <div
                  key={brief.id}
                  className="p-5 rounded-2xl bg-[#090b0f] border border-[#1b1e26] hover:border-amber-500/50 transition-all flex flex-col justify-between group shadow-xl hover:shadow-amber-500/5"
                >
                  <div className="space-y-3">
                    {/* Top Meta */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                        {brief.category}
                      </span>
                      <span className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase",
                        brief.status === "Decisive Win" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                        brief.status === "Tracking Ahead" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" :
                        "bg-stone-800 text-stone-300"
                      )}>
                        {brief.status}
                      </span>
                    </div>

                    {/* Brief Title */}
                    <Link
                      to={`/polls/${brief.pollId}`}
                      className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug"
                    >
                      {brief.title}
                    </Link>

                    {/* Prediction Call Box */}
                    <div className="p-3 rounded-xl bg-black/60 border border-white/5 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-stone-500 tracking-wider font-bold">
                        Grandmaster Call
                      </span>
                      <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                        <span>{brief.consensusPrediction}</span>
                        <span className="font-mono text-white">{brief.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Forecaster Footer */}
                  <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                    <Link
                      to={`/profile/${brief.authorHandle}`}
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <img
                        src={brief.authorAvatar}
                        alt={brief.authorName}
                        className="w-7 h-7 rounded-full object-cover border border-white/10"
                      />
                      <div>
                        <span className="text-xs font-bold text-stone-300 block leading-tight">
                          @{brief.authorHandle}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          {brief.authorAccuracy}% Acc
                        </span>
                      </div>
                    </Link>

                    <Link
                      to={`/polls/${brief.pollId}`}
                      className="p-2 rounded-xl bg-white/5 hover:bg-amber-500 hover:text-black text-stone-400 transition-all"
                      title="Inspect Prediction Market"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Global Rankings & Podium Matrix */}
        {activeView === "ranks" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Category Filter and Search Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                {CATEGORY_TABS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all",
                      selectedCategory === cat
                        ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                        : "bg-[#0c0e13] text-stone-400 border border-[#1b1e26] hover:text-white hover:border-emerald-500/30"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[260px] sm:min-w-[300px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  placeholder="Filter forecasters by handle or specialty..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0d0f14] border border-[#1f232d] text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Podium (Top 3 Forecasters) */}
            {topThree.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end pt-4">
                {topThree.map((user, idx) => {
                  const rank = idx + 1;
                  const isFirst = rank === 1;
                  return (
                    <div
                      key={user.uid}
                      className={cn(
                        "p-6 rounded-3xl border transition-all flex flex-col items-center text-center justify-between relative overflow-hidden shadow-2xl",
                        isFirst
                          ? "bg-gradient-to-b from-[#121620] via-[#0d1017] to-[#08090d] border-amber-500/40 shadow-amber-500/10 md:min-h-[410px] order-first md:order-none"
                          : "bg-[#090b0e] border-[#1b1e26] md:min-h-[360px]"
                      )}
                    >
                      {/* Top Accent Line */}
                      {isFirst && (
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                      )}

                      <div className="flex flex-col items-center space-y-4 w-full">
                        {/* Avatar with Crown Badge */}
                        <div className="relative">
                          <div className={cn(
                            "w-20 h-20 rounded-full p-1 border-2 shadow-xl",
                            isFirst ? "border-amber-400 bg-amber-500/10" : rank === 2 ? "border-slate-300 bg-slate-500/10" : "border-amber-700 bg-amber-900/10"
                          )}>
                            <img
                              src={user.avatar}
                              alt={user.displayName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          </div>

                          <div className={cn(
                            "absolute -bottom-2 -right-1 w-7 h-7 rounded-full flex items-center justify-center font-black text-xs font-mono border-2 border-black",
                            isFirst ? "bg-amber-400 text-black shadow-lg" : rank === 2 ? "bg-slate-300 text-black" : "bg-amber-700 text-white"
                          )}>
                            #{rank}
                          </div>
                        </div>

                        {/* User Identity */}
                        <div className="space-y-1">
                          <h3 className="text-lg font-black text-white flex items-center justify-center gap-1.5">
                            {user.displayName}
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          </h3>
                          <p className="text-xs font-mono text-emerald-400 font-bold">
                            @{user.handle}
                          </p>
                          <p className="text-[11px] text-stone-400 max-w-[220px] mx-auto line-clamp-1">
                            {user.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Accuracy & Points Widget */}
                      <div className="w-full mt-4 p-3 rounded-2xl bg-black/50 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-stone-400">Calibration Accuracy:</span>
                          <span className="font-extrabold text-emerald-400">{user.accuracy}%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-stone-400">Total Signals:</span>
                          <span className="font-bold text-white">{user.signalsCount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-stone-400">AE Score:</span>
                          <span className="font-bold text-amber-400">{user.points.toLocaleString()} pts</span>
                        </div>
                      </div>

                      {/* View Dossier CTA */}
                      <Link
                        to={`/profile/${user.uid}`}
                        className={cn(
                          "w-full mt-4 py-2 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2",
                          isFirst
                            ? "bg-amber-500 hover:bg-amber-400 text-black font-black shadow-md shadow-amber-500/20"
                            : "bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/5"
                        )}
                      >
                        <span>Inspect Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Comprehensive Matrix Table */}
            <div className="bg-[#090b0e] border border-[#1b1e26] rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-4 sm:p-5 border-b border-[#1b1e26] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-stone-400">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>Forecaster Consensus Matrix ({filteredForecasters.length} nodes)</span>
                </div>
                <span className="text-[11px] font-mono text-stone-500 hidden sm:inline">
                  Real-time calibration updated hourly
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1b1e26] bg-[#0c0e13] text-[10px] font-mono uppercase tracking-widest text-stone-400">
                      <th className="py-3.5 px-4 font-bold">Rank</th>
                      <th className="py-3.5 px-4 font-bold">Forecasting Node</th>
                      <th className="py-3.5 px-4 font-bold text-center">Tier</th>
                      <th className="py-3.5 px-4 font-bold text-center">Signals Cast</th>
                      <th className="py-3.5 px-4 font-bold text-center">Accuracy Calibration</th>
                      <th className="py-3.5 px-4 font-bold text-right">AE Points</th>
                      <th className="py-3.5 px-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#161820] text-xs">
                    {filteredForecasters.map((f) => (
                      <tr 
                        key={f.uid}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="py-3.5 px-4 font-mono font-extrabold text-stone-400 group-hover:text-emerald-400">
                          #{f.rank}
                        </td>

                        <td className="py-3.5 px-4">
                          <Link
                            to={`/profile/${f.uid}`}
                            className="flex items-center gap-3 group/link"
                          >
                            <img
                              src={f.avatar}
                              alt={f.displayName}
                              className="w-9 h-9 rounded-full object-cover border border-[#232733]"
                            />
                            <div>
                              <div className="font-bold text-white group-hover/link:text-emerald-400 transition-colors flex items-center gap-1.5">
                                {f.displayName}
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              </div>
                              <span className="text-[11px] font-mono text-stone-400">
                                @{f.handle} • {f.category}
                              </span>
                            </div>
                          </Link>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase",
                            f.tier === "Grandmaster" ? "bg-amber-500/15 border border-amber-500/30 text-amber-300" :
                            f.tier === "Master" ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400" :
                            "bg-white/5 border border-white/10 text-stone-300"
                          )}>
                            {f.tier}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono text-stone-300">
                          {f.signalsCount.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                          {f.accuracy}%
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400">
                          {f.points.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/profile/${f.uid}`}
                            className="p-2 rounded-xl bg-white/5 hover:bg-emerald-500 hover:text-black text-stone-400 transition-all inline-flex items-center"
                            title="Inspect Dossier"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
