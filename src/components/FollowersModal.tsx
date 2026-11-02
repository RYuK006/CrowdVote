import React, { useState, useEffect } from "react";
import { X, Search, User, ShieldCheck, UserCheck, UserPlus, MessageSquare, Sparkles, HeartHandshake } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { FollowUser } from "../types";
import { cn } from "../lib/utils";

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUid: string;
  targetName?: string;
  initialTab?: "followers" | "following" | "friends";
  counts?: { followers: number; following: number; friends: number };
  onUpdateCounts?: () => void;
}

export function FollowersModal({
  isOpen,
  onClose,
  targetUid,
  targetName = "User",
  initialTab = "followers",
  counts = { followers: 0, following: 0, friends: 0 },
  onUpdateCounts
}: FollowersModalProps) {
  const [activeTab, setActiveTab] = useState<"followers" | "following" | "friends">(initialTab);
  const [list, setList] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!isOpen || !targetUid) return;

    async function fetchList() {
      setLoading(true);
      try {
        let headers: Record<string, string> = {};
        if (auth.currentUser) {
          const token = await auth.currentUser.getIdToken();
          headers["Authorization"] = `Bearer ${token}`;
        }

        const endpoint = `/api/user/${targetUid}/${activeTab}`;
        const res = await fetch(endpoint, { headers });
        if (res.ok) {
          const data = await res.json();
          setList(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(`Failed to fetch ${activeTab}:`, err);
      } finally {
        setLoading(false);
      }
    }

    fetchList();
  }, [isOpen, targetUid, activeTab]);

  if (!isOpen) return null;

  const handleToggleFollow = async (user: FollowUser) => {
    if (!auth.currentUser) {
      navigate("/signin");
      return;
    }
    setActionLoading(user.uid);
    try {
      const token = await auth.currentUser.getIdToken();
      const method = user.isFollowing ? "POST" : "POST";
      const endpoint = user.isFollowing ? `/api/user/unfollow/${user.uid}` : `/api/user/follow/${user.uid}`;

      const res = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setList(prev => prev.map(item => {
          if (item.uid === user.uid) {
            return {
              ...item,
              isFollowing: data.isFollowing,
              isFriend: data.isFriend ?? item.isFriend
            };
          }
          return item;
        }));
        if (onUpdateCounts) onUpdateCounts();
      }
    } catch (err) {
      console.error("Follow toggle failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredList = list.filter(u => 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="w-full max-w-md bg-[#0f1012] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base truncate max-w-[240px]">{targetName}</span>
            <span className="text-xs font-mono text-stone-500">• Social Graph</span>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Instagram-Style Navigation Tabs */}
        <div className="grid grid-cols-3 border-b border-white/10 text-center text-xs font-mono">
          <button
            onClick={() => setActiveTab("followers")}
            className={cn(
              "py-3 transition-colors border-b-2 flex items-center justify-center gap-1.5 font-bold",
              activeTab === "followers"
                ? "text-emerald-400 border-emerald-500 bg-emerald-500/5"
                : "text-stone-400 border-transparent hover:text-stone-200"
            )}
          >
            <span>Followers</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/10 text-stone-300">
              {counts.followers}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("following")}
            className={cn(
              "py-3 transition-colors border-b-2 flex items-center justify-center gap-1.5 font-bold",
              activeTab === "following"
                ? "text-emerald-400 border-emerald-500 bg-emerald-500/5"
                : "text-stone-400 border-transparent hover:text-stone-200"
            )}
          >
            <span>Following</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/10 text-stone-300">
              {counts.following}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("friends")}
            className={cn(
              "py-3 transition-colors border-b-2 flex items-center justify-center gap-1.5 font-bold",
              activeTab === "friends"
                ? "text-emerald-400 border-emerald-500 bg-emerald-500/5"
                : "text-stone-400 border-transparent hover:text-stone-200"
            )}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Friends</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/10 text-stone-300">
              {counts.friends}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-white/5">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5 custom-scrollbar p-2">
          {loading ? (
            <div className="p-12 text-center text-xs font-mono text-stone-500 animate-pulse">
              Loading {activeTab}...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-stone-500">
                <User className="w-5 h-5" />
              </div>
              <p className="text-xs font-mono text-stone-400">
                {searchQuery ? `No ${activeTab} match "${searchQuery}"` : `No ${activeTab} yet.`}
              </p>
            </div>
          ) : (
            filteredList.map((user) => {
              const isSelf = auth.currentUser?.uid === user.uid;
              return (
                <div
                  key={user.uid}
                  className="p-3 rounded-2xl flex items-center justify-between gap-3 hover:bg-white/5 transition-colors"
                >
                  {/* Avatar & Info */}
                  <Link
                    to={`/profile/${user.uid}`}
                    onClick={onClose}
                    className="flex items-center gap-3 min-w-0 flex-1 group"
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1.5px]">
                        <div className="w-full h-full rounded-full bg-[#0a0a0c] flex items-center justify-center text-emerald-400 font-bold text-sm">
                          {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                        </div>
                      </div>
                      {user.isFriend && (
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[8px] font-bold shadow">
                          ✓
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white group-hover:text-emerald-400 transition-colors truncate">
                          {user.displayName || "Prediction Node"}
                        </span>
                        {user.isFriend && (
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-mono font-bold border border-emerald-500/20">
                            Friend
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-stone-500 truncate">
                        {user.accuracy ? `${user.accuracy}% Accuracy` : user.email || "Active Node"}
                      </p>
                    </div>
                  </Link>

                  {/* Actions */}
                  {!isSelf && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link
                        to="/chat"
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-400 text-stone-400 transition-colors border border-white/5"
                        title="Send Message"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => handleToggleFollow(user)}
                        disabled={actionLoading === user.uid}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1",
                          user.isFollowing
                            ? "bg-white/10 hover:bg-red-500/10 text-stone-300 hover:text-red-400 border border-white/10"
                            : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20"
                        )}
                      >
                        {user.isFollowing ? (
                          <>
                            <UserCheck className="w-3 h-3" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3" />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
