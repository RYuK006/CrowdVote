import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trophy, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "../lib/utils";

interface SuggestedUser {
  uid: string;
  handle: string;
  displayName: string;
  avatar: string;
  subtitle: string;
  accuracy: number;
  isFollowing?: boolean;
}

const FALLBACK_FORECASTERS: SuggestedUser[] = [
  {
    uid: "node_quantum_oracle",
    handle: "quantum_oracle",
    displayName: "Quantum Oracle",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80",
    subtitle: "Grandmaster • 98.4% Acc",
    accuracy: 98.4,
    isFollowing: false,
  },
  {
    uid: "node_polity_matrix",
    handle: "polity_matrix",
    displayName: "Polity Matrix",
    avatar: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=150&h=150&q=80",
    subtitle: "Grandmaster • 97.9% Acc",
    accuracy: 97.9,
    isFollowing: false,
  },
  {
    uid: "node_alpha_macro",
    handle: "alpha_macro",
    displayName: "Alpha Macro",
    avatar: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=150&h=150&q=80",
    subtitle: "Grandmaster • 97.2% Acc",
    accuracy: 97.2,
    isFollowing: false,
  },
  {
    uid: "node_cyber_pulse",
    handle: "cyber_pulse",
    displayName: "Cyber Pulse",
    avatar: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=150&h=150&q=80",
    subtitle: "Master • 96.5% Acc",
    accuracy: 96.5,
    isFollowing: false,
  },
  {
    uid: "node_crypto_sentinel",
    handle: "crypto_sentinel",
    displayName: "Crypto Sentinel",
    avatar: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=150&h=150&q=80",
    subtitle: "Master • 96.1% Acc",
    accuracy: 96.1,
    isFollowing: false,
  },
];

interface MarketSideRailProps {
  currentUser: any;
  onOpenFollowersModal?: () => void;
}

export function MarketSideRail({ currentUser, onOpenFollowersModal }: MarketSideRailProps) {
  const [forecasters, setForecasters] = useState<SuggestedUser[]>(FALLBACK_FORECASTERS);
  const [loadingUid, setLoadingUid] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/suggestions")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setForecasters(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleFollow = async (targetUid: string) => {
    if (!currentUser) return;
    setLoadingUid(targetUid);
    try {
      const token = await currentUser.getIdToken();
      const current = forecasters.find((s) => s.uid === targetUid);
      const endpoint = current?.isFollowing
        ? `/api/user/unfollow/${targetUid}`
        : `/api/user/follow/${targetUid}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setForecasters((prev) =>
          prev.map((s) =>
            s.uid === targetUid ? { ...s, isFollowing: !s.isFollowing } : s
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUid(null);
    }
  };

  return (
    <aside className="w-full xl:w-[340px] shrink-0 space-y-5 select-none">
      {/* 1. Elite Forecasters Widget */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1219] border border-slate-200 dark:border-[#1e2533] shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs sm:text-sm font-mono font-bold tracking-wider text-slate-900 dark:text-white uppercase">
              Top Forecasters
            </h4>
          </div>
          <Link
            to="/leaderboard"
            className="text-xs font-mono text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-semibold transition-colors"
          >
            Full Matrix →
          </Link>
        </div>

        <div className="space-y-2.5">
          {forecasters.slice(0, 5).map((f) => (
            <div
              key={f.uid}
              className="flex items-center justify-between py-1 group"
            >
              <Link
                to={`/profile/${f.uid}`}
                className="flex items-center gap-2.5 min-w-0 flex-1 pr-2"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-[#1a2130] border border-slate-200 dark:border-[#1e2533] shrink-0">
                  <img
                    src={f.avatar}
                    alt={f.displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${f.handle}`;
                    }}
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors truncate">
                    {f.displayName}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                    {f.subtitle}
                  </span>
                </div>
              </Link>

              <button
                onClick={() => handleToggleFollow(f.uid)}
                disabled={loadingUid === f.uid}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border transition-colors shrink-0",
                  f.isFollowing
                    ? "border-slate-200 dark:border-[#1e2533] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5"
                    : "border-slate-200 dark:border-[#1e2533] text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-[#141923] dark:hover:bg-[#1a2130]"
                )}
              >
                {loadingUid === f.uid ? "..." : f.isFollowing ? "Connected" : "+ Follow"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. High-Stakes Bounty Pools Widget */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 dark:bg-gradient-to-br dark:from-amber-500/10 dark:via-[#0e1219] dark:to-[#0e1219] border border-amber-500/25 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Sparkles className="w-4 h-4" />
            <h4 className="text-xs sm:text-sm font-mono font-bold tracking-wider uppercase">
              Bounty Allocations
            </h4>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-mono font-black uppercase">
            Live
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Sponsor pools incentivize calibrated prediction signals. Cast high-accuracy forecasts to earn protocol yield bounties.
        </p>

        <div className="space-y-2 pt-1">
          <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-[#121722] border border-amber-500/20 shadow-sm flex items-center justify-between text-xs sm:text-sm">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">MacroCapital Labs</span>
              <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold">500 USDC Yield Bounty</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">420 signals</span>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-[#121722] border border-amber-500/20 shadow-sm flex items-center justify-between text-xs sm:text-sm">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">ChainSentinel Prime</span>
              <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold">1,000 CSP Rewards</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">850 signals</span>
          </div>
        </div>
      </div>

      {/* 3. Protocol Telemetry & Footer */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1219] border border-slate-200 dark:border-[#1e2533] shadow-sm space-y-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-1 font-semibold">
          <TrendingUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <h4 className="text-xs sm:text-sm font-mono font-bold tracking-wider uppercase">
            Protocol Telemetry
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#121722] border border-slate-200 dark:border-[#1e2533]">
            <span className="text-slate-500 dark:text-slate-500 block text-[10px] font-semibold">TOTAL SIGNALS</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">48,920</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#121722] border border-slate-200 dark:border-[#1e2533]">
            <span className="text-slate-500 dark:text-slate-500 block text-[10px] font-semibold">AVG ACCURACY</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">96.8%</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-[#1e2533] flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <Link to="/docs" className="hover:text-slate-900 dark:hover:text-white transition-colors">Documentation</Link>
          <span>•</span>
          <Link to="/analytics" className="hover:text-slate-900 dark:hover:text-white transition-colors">Analytics</Link>
          <span>•</span>
          <Link to="/ranks" className="hover:text-slate-900 dark:hover:text-white transition-colors">Leaderboard</Link>
          <span>•</span>
          <Link to="/chat" className="hover:text-slate-900 dark:hover:text-white transition-colors">Encrypted Chat</Link>
        </div>

        <div className="text-[10px] font-mono text-slate-400 dark:text-slate-600 uppercase">
          © 2026 CROWDVOTE AI • SWARM CONSENSUS PROTOCOL
        </div>
      </div>
    </aside>
  );
}
