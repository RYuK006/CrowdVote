import React, { useState } from "react";
import { Link } from "react-router-dom";
import { User, Sparkles } from "lucide-react";
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

const DEFAULT_SUGGESTIONS: SuggestedUser[] = [
  {
    uid: "tisha_sara",
    handle: "Dr. Tisha Sara Titus",
    displayName: "Tisha Sara",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80",
    subtitle: "Followed by white_devil_006",
    accuracy: 97.4,
    isFollowing: false,
  },
  {
    uid: "stephin_shalu",
    handle: "Stephin V Shalu",
    displayName: "Stephin Shalu",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
    subtitle: "Followed by pre_lives + 18 m",
    accuracy: 94.8,
    isFollowing: false,
  },
  {
    uid: "jiyaaa_node",
    handle: "jiyaaa",
    displayName: "Jiya Thomas",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80",
    subtitle: "Followed by manu_thomas_n",
    accuracy: 96.1,
    isFollowing: false,
  },
  {
    uid: "clement_bab",
    handle: "Clement Bab",
    displayName: "Clement B",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80",
    subtitle: "Followed by renny_gc + 2 m",
    accuracy: 92.5,
    isFollowing: false,
  },
  {
    uid: "sumi_sudhi",
    handle: "sumi sudhi",
    displayName: "Sumi Sudhi",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
    subtitle: "Followed by aa_lwynn_ + 7 m",
    accuracy: 95.0,
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
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>(DEFAULT_SUGGESTIONS);
  const [loadingUid, setLoadingUid] = useState<string | null>(null);

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
    : "skytsengel_006";
  const currentDisplayName = currentUser?.displayName || "Aaron Alex Mathew";

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
          Switch
        </Link>
      </div>

      {/* Suggested Section Header */}
      <div className="flex items-center justify-between py-2 mb-2">
        <span className="text-sm font-bold text-stone-400">
          Suggested for you
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
                  {user.handle}
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

      {/* Instagram Meta Footer */}
      <div className="mt-8 pt-4 space-y-4 text-[11px] text-stone-500">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <a href="#about" className="hover:underline">About</a>
          <span>•</span>
          <a href="#help" className="hover:underline">Help</a>
          <span>•</span>
          <a href="#press" className="hover:underline">Press</a>
          <span>•</span>
          <a href="#api" className="hover:underline">API</a>
          <span>•</span>
          <a href="#jobs" className="hover:underline">Jobs</a>
          <span>•</span>
          <a href="#privacy" className="hover:underline">Privacy</a>
          <span>•</span>
          <a href="#terms" className="hover:underline">Terms</a>
          <span>•</span>
          <a href="#locations" className="hover:underline">Locations</a>
          <span>•</span>
          <a href="#language" className="hover:underline">Language</a>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-stone-600">
          © 2026 CROWDVOTE FROM META
        </div>
      </div>
    </div>
  );
}
