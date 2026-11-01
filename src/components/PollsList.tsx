import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ListPlus, ArrowRight, ShieldCheck, CheckCircle2, Search, Sparkles, Flame, Tag, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Layout } from "./Layout";
import { auth } from "../firebase";
import { Poll } from "../types";
import { cn } from "../lib/utils";

const CATEGORIES = [
  "All",
  "Sponsored",
  "Tech & AI",
  "Startups & Roasts",
  "Finance & Crypto",
  "Politics",
  "Sports",
  "Pop Culture",
  "Science"
];

export function PollsList() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<Record<string, any>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchPolls = (cat: string, search: string, pageNum: number, replace: boolean = true) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (cat !== "All") {
      if (cat === "Sponsored") {
        params.set("sponsored", "true");
      } else {
        params.set("category", cat);
      }
    }
    if (search) params.set("search", search);
    params.set("page", String(pageNum));
    params.set("limit", "48");

    fetch(`/api/polls?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          if (replace) {
            setPolls(data);
          } else {
            setPolls((prev) => [...prev, ...data]);
          }
          setHasMore(data.length === 48);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    setPage(1);
    fetchPolls(selectedCategory, searchQuery, 1, true);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    if (!auth.currentUser) return;
    auth.currentUser.getIdToken().then((token) => {
      fetch("/api/user/votes", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setVotes(data))
        .catch(console.error);
    });
  }, [auth.currentUser]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPolls(selectedCategory, searchQuery, nextPage, false);
  };

  return (
    <Layout user={auth.currentUser}>
      <div className="h-full flex flex-col relative pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="pt-8 pb-8 space-y-4">
          <div className="flex items-center gap-2 text-emerald-500">
            <ListPlus className="w-5 h-5" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold">Prediction Hub & Roast Room</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter text-[var(--text-primary)]">
                Explore <span className="text-emerald-500 italic">Polls</span>
              </h1>
              <p className="text-[var(--text-secondary)] font-medium max-w-2xl mt-2">
                Cast accuracy-weighted predictions across thousands of global topics. Consult the Roast Room council of simulated advisors or participate in boosted sponsored polls.
              </p>
            </div>
            
            {/* Search Input */}
            <div className="relative min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search thousands of topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              const isSponsored = cat === "Sponsored";
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-mono font-semibold transition-all whitespace-nowrap flex items-center gap-1.5",
                    isActive
                      ? isSponsored
                        ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                        : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : isSponsored
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                      : "bg-[var(--glass-bg)] text-[var(--text-secondary)] border border-[var(--glass-border)] hover:text-[var(--text-primary)] hover:border-emerald-500/40"
                  )}
                >
                  {isSponsored && <Sparkles className="w-3.5 h-3.5" />}
                  {cat === "Startups & Roasts" && <Flame className="w-3.5 h-3.5 text-orange-400" />}
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Polls Grid */}
        {loading && polls.length === 0 ? (
          <div className="py-20 text-center animate-pulse text-[var(--text-secondary)] font-mono text-[10px] uppercase tracking-widest">
            Scanning Multi-Topic Neural Mesh...
          </div>
        ) : polls.length === 0 ? (
          <div className="py-20 text-center text-[var(--text-secondary)] font-mono text-sm">
            No polls found matching the selected category or search.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {polls.map((poll) => {
              const hasVoted = !!votes[poll.id];
              const isExpired = poll.lockAt ? new Date() > new Date(poll.lockAt) : false;
              const isSponsored = Boolean(poll.isSponsored);

              return (
                <Link
                  key={poll.id}
                  to={`/polls/${poll.id}`}
                  className={cn(
                    "group relative p-7 rounded-[28px] border transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[260px]",
                    isSponsored
                      ? "bg-gradient-to-br from-amber-500/10 via-[var(--glass-bg)] to-amber-500/5 border-amber-500/30 hover:border-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.08)]"
                      : hasVoted
                      ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.08)]"
                      : isExpired
                      ? "bg-gray-500/10 border-gray-500/30 opacity-75"
                      : "bg-[var(--glass-bg)] border-[var(--glass-border)] hover:border-emerald-500/40 hover:bg-[var(--glass-border)]"
                  )}
                >
                  <div className="space-y-3.5 relative z-10">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold tracking-widest border",
                          isSponsored
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-black/10 border-[var(--glass-border)] text-[var(--text-secondary)]"
                        )}>
                          {poll.category || "General"}
                        </span>
                        
                        {isSponsored && (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-mono uppercase font-extrabold tracking-wider">
                            <Sparkles className="w-2.5 h-2.5" />
                            {poll.sponsorName || "Sponsored"}
                          </span>
                        )}
                      </div>

                      {hasVoted ? (
                        <div className="flex items-center gap-1 text-emerald-500">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-[9px] font-mono uppercase font-bold tracking-wider">Voted</span>
                        </div>
                      ) : isExpired ? (
                        <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-gray-500">
                          LOCKED
                        </span>
                      ) : null}
                    </div>

                    <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] leading-snug group-hover:text-emerald-500 transition-colors line-clamp-3">
                      {poll.title}
                    </h2>

                    {poll.sponsorReward && (
                      <div className="text-xs font-mono text-amber-400 font-semibold flex items-center gap-1">
                        🎁 Reward: {poll.sponsorReward}
                      </div>
                    )}

                    <p className="text-[var(--text-secondary)] text-xs line-clamp-2">
                      {poll.description || (poll.matchTime ? `Time: ${poll.matchTime}` : "")}
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-[var(--glass-border)]/50 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-secondary)]">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span>Roast Room Council</span>
                    </div>

                    <div className={cn(
                      "p-1.5 rounded-full transition-all duration-300",
                      isSponsored
                        ? "bg-amber-500/20 text-amber-300 group-hover:bg-amber-500 group-hover:text-black"
                        : "bg-[var(--glass-border)] group-hover:bg-emerald-500 text-[var(--text-primary)] group-hover:text-white"
                    )}>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !loading && polls.length > 0 && (
          <div className="mt-12 text-center">
            <button
              onClick={handleLoadMore}
              className="px-8 py-3 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-mono text-[var(--text-primary)] hover:border-emerald-500 hover:text-emerald-400 transition-all shadow-lg"
            >
              Load More Polls ({polls.length}+ loaded)
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
