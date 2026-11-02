import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Sparkles, UserCheck, UserPlus } from "lucide-react";
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

const FALLBACK_SUGGESTIONS: SuggestedUser[] = [
  {
    uid: "node_quantum_oracle",
    handle: "quantum_oracle",
    displayName: "Quantum Oracle",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80",
    subtitle: "Grandmaster • 98.4% Accuracy",
    accuracy: 98.4,
    isFollowing: false,
  },
  {
    uid: "node_polity_matrix",
    handle: "polity_matrix",
    displayName: "Polity Matrix",
    avatar: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=150&h=150&q=80",
    subtitle: "Grandmaster • 97.9% Accuracy",
    accuracy: 97.9,
    isFollowing: false,
  },
  {
    uid: "node_alpha_macro",
    handle: "alpha_macro",
    displayName: "Alpha Macro",
    avatar: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=150&h=150&q=80",
    subtitle: "Grandmaster • 97.2% Accuracy",
    accuracy: 97.2,
    isFollowing: false,
  },
  {
    uid: "node_cyber_pulse",
    handle: "cyber_pulse",
    displayName: "Cyber Pulse",
    avatar: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=150&h=150&q=80",
    subtitle: "Master • 96.5% Accuracy",
    accuracy: 96.5,
    isFollowing: false,
  },
  {
    uid: "node_crypto_sentinel",
    handle: "crypto_sentinel",
    displayName: "Crypto Sentinel",
    avatar: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=150&h=150&q=80",
    subtitle: "Master • 96.1% Accuracy",
    accuracy: 96.1,
    isFollowing: false,
  },
];

interface InstagramRightSidebarProps {
  currentUser: any;
  onOpenFollowersModal?: () => void;
}

export function InstagramRightSidebar({
  currentUser,
  onOpenFollowersModal,
}: InstagramRightSidebarProps) {
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>(FALLBACK_SUGGESTIONS);
  const [loadingUid, setLoadingUid] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const headers: Record<string, string> = {};
        if (currentUser) {
          const token = await currentUser.getIdToken();
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch("/api/suggestions", { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSuggestions(data);
          }
        }
      } catch (err) {
        console.error("Failed to load suggestions:", err);
      }
    };

    fetchSuggestions();
  }, [currentUser]);

  const handleToggleFollow = async (targetUid: string) => {
    if (!currentUser) return;
    setLoadingUid(targetUid);
    try {
      const token = await currentUser.getIdToken();
      const current = suggestions.find((s) => s.uid === targetUid);
      const endpoint = current?.isFollowing
        ? `/api/user/unfollow/${targetUid}`
        : `/api/user/follow/${targetUid}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setSuggestions((prev) =>
          prev.map((s) =>
            s.uid === targetUid ? { ...s, isFollowing: !s.isFollowing } : s
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle follow:", err);
    } finally {
      setLoadingUid(null);
    }
  };

  const currentHandle = currentUser?.email
    ? currentUser.email.split("@")[0]
    : "prediction_node";
  const currentDisplayName = currentUser?.displayName || "Forecasting Node";

  return (
    <div className="w-[324px] shrink-0 pt-6 px-3 select-none hidden lg:block">
      {/* Current User Card */}
      <div className="flex items-center justify-between py-3 mb-4">
        <Link to="/profile" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-full p-[1.5px] bg-gradient-to-tr from-emerald-500 via-teal-400 to-lime-400 group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-full bg-[#0a0a0c] flex items-center justify-center overflow-hidden">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentDisplayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  {currentDisplayName.charAt(0)}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-white tracking-tight truncate group-hover:text-emerald-400 transition-colors">
              {currentHandle}
            </span>
            <span className="text-xs text-stone-400 truncate">
              {currentDisplayName}
            </span>
          </div>
        </Link>

        <Link
          to="/profile"
          className="text-xs font-semibold text-emerald-400 hover:text-white transition-colors"
        >
          Profile
        </Link>
      </div>

      {/* Suggested Section Header */}
      <div className="flex items-center justify-between py-2 mb-2">
        <span className="text-sm font-bold text-stone-400">
          Suggested Forecasters
        </span>
        <button
          onClick={onOpenFollowersModal}
          className="text-xs font-semibold text-white hover:text-stone-300 transition-colors"
        >
          See all
        </button>
      </div>

      {/* Suggested Users List */}
      <div className="space-y-3">
        {suggestions.map((user) => (
          <div
            key={user.uid}
            className="flex items-center justify-between group py-1"
          >
            <Link
              to={`/profile/${user.uid}`}
              className="flex items-center gap-3 min-w-0 flex-1 pr-2"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-stone-900 border border-white/10 group-hover:border-emerald-500/50 transition-colors">
                <img
                  src={user.avatar}
                  alt={user.handle}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                  {user.displayName}
                </span>
                <span className="text-[11px] text-stone-400 truncate">
                  {user.subtitle}
                </span>
              </div>
            </Link>

            <button
              onClick={() => handleToggleFollow(user.uid)}
              disabled={loadingUid === user.uid}
              className={cn(
                "text-xs font-bold tracking-tight transition-colors shrink-0",
                user.isFollowing
                  ? "text-stone-400 hover:text-white"
                  : "text-emerald-400 hover:text-emerald-300"
              )}
            >
              {loadingUid === user.uid
                ? "..."
                : user.isFollowing
                ? "Following"
                : "Follow"}
            </button>
          </div>
        ))}
      </div>

      {/* CrowdVote Protocol Footer */}
      <div className="mt-8 pt-4 space-y-4 text-[11px] text-stone-500">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <Link to="/docs" className="hover:underline">About</Link>
          <span>•</span>
          <Link to="/docs" className="hover:underline">Protocol</Link>
          <span>•</span>
          <Link to="/docs" className="hover:underline">API</Link>
          <span>•</span>
          <Link to="/analytics" className="hover:underline">Analytics</Link>
          <span>•</span>
          <Link to="/leaderboard" className="hover:underline">Leaderboard</Link>
          <span>•</span>
          <a href="#privacy" className="hover:underline">Privacy</a>
          <span>•</span>
          <a href="#terms" className="hover:underline">Terms</a>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-stone-600">
          © 2026 CROWDVOTE AI • SWARM CONSENSUS PROTOCOL
        </div>
      </div>
    </div>
  );
}
