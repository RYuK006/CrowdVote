import React, { useEffect, useRef, useState } from "react";
import { 
  Sparkles, Flame, Search, Filter, LayoutGrid, ListFilter, 
  TrendingUp, BarChart2, ShieldCheck, ArrowRight, RefreshCw 
} from "lucide-react";
import { Layout } from "./Layout";
import { auth } from "../firebase";
import { Poll } from "../types";
import { cn } from "../lib/utils";
import { PredictionMarketCard } from "./PredictionMarketCard";
import { GrandmasterRadar } from "./GrandmasterRadar";
import { MarketSideRail } from "./MarketSideRail";

const CATEGORIES = [
  "All",
  "Bounties",
  "AI",
  "Startups",
  "Crypto",
  "Politics",
  "Science",
  "Sports",
];

export function PollsList() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<Record<string, any>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<"trending" | "volume" | "newest">("trending");

  const fetchPolls = (cat: string, search: string, pageNum: number, replace: boolean = true) => {
    if (replace) {
      setLoading(true);
    } else {
      setIsFetchingMore(true);
    }
    const params = new URLSearchParams();
    if (cat !== "All") {
      if (cat === "Bounties") {
        params.set("sponsored", "true");
      } else {
        params.set("category", cat);
      }
    }
    if (search.trim()) params.set("search", search.trim());
    params.set("page", String(pageNum));
    params.set("limit", "24");

    fetch(`/api/polls?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          if (replace) {
            setPolls(data);
          } else {
            setPolls((prev) => [...prev, ...data]);
          }
          setHasMore(data.length === 24);
        }
        setLoading(false);
        setIsFetchingMore(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        setIsFetchingMore(false);
      });
  };

  useEffect(() => {
    setPage(1);
    fetchPolls(selectedCategory, searchQuery, 1, true);
  }, [selectedCategory, searchQuery]);

  // Infinite scroll observer: automatically loads more polls when reaching bottom
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading && !isFetchingMore) {
          setIsFetchingMore(true);
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            fetchPolls(selectedCategory, searchQuery, nextPage, false);
            return nextPage;
          });
        }
      },
      {
        root: null,
        rootMargin: "300px",
        threshold: 0.01,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, isFetchingMore, selectedCategory, searchQuery]);

  useEffect(() => {
    if (!auth.currentUser) return;
    auth.currentUser.getIdToken().then((token) => {
      fetch("/api/user/votes", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setVotes(data || {}))
        .catch(console.error);
    });
  }, [auth.currentUser]);

  const handleVote = async (pollId: string, optionId: string) => {
    if (!auth.currentUser) return;
    const token = await auth.currentUser.getIdToken();
    await fetch(`/api/polls/${pollId}/vote`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ optionId }),
    });

    setVotes((prev) => ({
      ...prev,
      [pollId]: { optionId, votedAt: new Date().toISOString() },
    }));
  };

  return (
    <Layout user={auth.currentUser}>
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-6">
        {/* 1. Live Consensus Market Ticker */}
        <div className="w-full py-2 px-3 sm:px-4 rounded-xl bg-slate-100 dark:bg-[#0e1219] border border-slate-200 dark:border-[#1e2533] overflow-hidden flex items-center gap-3 text-xs font-mono transition-colors">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="whitespace-nowrap text-[11px] sm:text-xs tracking-wider">LIVE CONSENSUS</span>
          </div>

          <div className="overflow-x-auto scrollbar-hide flex items-center gap-5 text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">
            <span className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Autonomous AI Parity: <strong className="text-slate-900 dark:text-white font-bold">74% Yes</strong> <span className="text-emerald-600 dark:text-emerald-400 font-semibold">▲ +3.2%</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Fed Terminal Rate Cuts: <strong className="text-slate-900 dark:text-white font-bold">46% ≥3 Cuts</strong> <span className="text-rose-500 dark:text-rose-400 font-semibold">▼ -1.5%</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Bitcoin $150k Q4: <strong className="text-slate-900 dark:text-white font-bold">63% Yes</strong> <span className="text-emerald-600 dark:text-emerald-400 font-semibold">▲ +4.8%</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Kerala Assembly 2026: <strong className="text-slate-900 dark:text-white font-bold">LDF 51% | UDF 43%</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="hover:text-slate-900 dark:hover:text-white transition-colors">
              In-Vivo CRISPR Approval: <strong className="text-slate-900 dark:text-white font-bold">68% Accelerated</strong>
            </span>
          </div>
        </div>

        {/* 2. Hero & Command Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-1 border-b border-slate-200 dark:border-[#1e2533] pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Feed</span>
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                ACTIVE
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
              Cast calibrated signals across decentralized forecasting topics. Signal consensus shifts in real-time.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-auto min-w-[260px] sm:min-w-[320px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search markets or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-[#0e1219] border border-slate-200 dark:border-[#1e2533] text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors shadow-sm"
            />
          </div>
        </div>

        {/* 3. Grandmaster Forecasting Radar Strip */}
        <GrandmasterRadar />

        {/* 4. Category Filter Deck & View Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              const isSponsored = cat === "Bounties";
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5",
                    isActive
                      ? isSponsored
                        ? "bg-amber-500 text-black shadow-sm font-bold"
                        : "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm font-bold"
                      : isSponsored
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                      : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50 dark:bg-[#0e1219] dark:text-slate-400 dark:border-[#1e2533] dark:hover:text-white dark:hover:bg-[#141923] shadow-sm"
                  )}
                >
                  {isSponsored && <Sparkles className="w-3.5 h-3.5" />}
                  {cat === "Startups" && <Flame className="w-3.5 h-3.5 text-orange-400" />}
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto text-xs text-slate-600 dark:text-slate-400">
            <span className="font-mono text-[11px] font-semibold">SORT:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white dark:bg-[#0e1219] border border-slate-200 dark:border-[#1e2533] rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-sm"
            >
              <option value="trending">🔥 Highest Velocity</option>
              <option value="volume">📊 Signal Volume</option>
              <option value="newest">⚡ Newest Listings</option>
            </select>
          </div>
        </div>

        {/* 5. Main Responsive Grid & Side Rail Layout */}
        <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 items-start">
          {/* Main Markets Feed (Left Column) */}
          <div className="flex-1 w-full space-y-6">
            {loading && polls.length === 0 ? (
              <div className="py-24 text-center text-xs sm:text-sm font-mono text-slate-600 dark:text-slate-400 uppercase tracking-widest animate-pulse flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Calibrating Neural Prediction Matrix...</span>
              </div>
            ) : polls.length === 0 ? (
              <div className="py-24 text-center text-slate-600 dark:text-slate-400 text-sm bg-white dark:bg-[#0e1219] border border-slate-200 dark:border-[#1e2533] rounded-2xl p-8">
                No prediction markets found matching your filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {polls.map((poll) => {
                  const userVote = votes[poll.id];
                  return (
                    <PredictionMarketCard
                      key={poll.id}
                      poll={poll}
                      currentUser={auth.currentUser}
                      hasVoted={Boolean(userVote)}
                      userVoteOption={userVote?.optionId}
                      onVote={handleVote}
                    />
                  );
                })}
              </div>
            )}

            {/* Infinite Scroll Sentinel */}
            <div ref={sentinelRef} className="w-full py-8 flex items-center justify-center min-h-[60px]">
              {isFetchingMore && (
                <div className="text-xs sm:text-sm font-mono text-slate-600 dark:text-slate-400 animate-pulse flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                  <span>Loading more markets...</span>
                </div>
              )}
              {!hasMore && polls.length > 0 && (
                <span className="text-xs font-mono text-slate-500 dark:text-slate-500 tracking-wider">
                  — All prediction markets loaded ({polls.length}) —
                </span>
              )}
            </div>
          </div>

          {/* Right Rail: Forecasters, Bounties, and Protocol Metrics */}
          <MarketSideRail currentUser={auth.currentUser} />
        </div>
      </div>
    </Layout>
  );
}
