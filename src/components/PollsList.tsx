import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Plus, Sparkles, Flame, Check } from "lucide-react";
import { Layout } from "./Layout";
import { auth } from "../firebase";
import { Poll } from "../types";
import { cn } from "../lib/utils";
import { InstagramPostCard } from "./InstagramPostCard";
import { InstagramRightSidebar } from "./InstagramRightSidebar";
import { InstagramStoryModal, StoryItem } from "./InstagramStoryModal";
import { FollowersModal } from "./FollowersModal";

const CATEGORIES = [
  "All",
  "Sponsored",
  "Tech & AI",
  "Startups & Roasts",
  "Finance & Crypto",
  "Politics",
  "Science",
  "Sports",
];

const FALLBACK_STORIES: StoryItem[] = [
  {
    id: "story_quantum_oracle",
    name: "Quantum Oracle",
    handle: "quantum_oracle",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80",
    role: "Lead Forecaster • Quantum Probabilities",
    timeAgo: "1h",
    quote: "Market consensus is pricing a 74% probability of autonomous reasoning models achieving zero-shot coding milestones before Q3 2026.",
    category: "Tech & AI",
  },
  {
    id: "story_alpha_macro",
    name: "Alpha Macro",
    handle: "alpha_macro",
    avatar: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=150&h=150&q=80",
    role: "Quantitative Economist",
    timeAgo: "2h",
    quote: "Central bank terminal rate cuts are already discounted by debt markets. Asymmetry lies in cross-currency carry spreads.",
    category: "Finance & Crypto",
  },
  {
    id: "story_cyber_pulse",
    name: "Cyber Pulse",
    handle: "cyber_pulse",
    avatar: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=150&h=150&q=80",
    role: "Silicon & Systems Architect",
    timeAgo: "3h",
    quote: "Sub-2nm lithography yields are stabilizing faster than foundry guidance suggests. Silicon moats are shifting to optical interconnects.",
    category: "Tech & AI",
  },
  {
    id: "story_venture_roast",
    name: "Venture Roast",
    handle: "venture_roast",
    avatar: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=150&h=150&q=80",
    role: "No-Filter Startup Critic",
    timeAgo: "5h",
    quote: "90% of AI agent wrapper startups will run out of runway because their gross margin is subsidizing cloud compute rather than retention.",
    category: "Startups & Roasts",
  },
  {
    id: "story_polity_matrix",
    name: "Polity Matrix",
    handle: "polity_matrix",
    avatar: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=150&h=150&q=80",
    role: "Electoral Demographer",
    timeAgo: "7h",
    quote: "Youth turnout divergence and economic sentiment volatility are shattering traditional sample polling in regional legislative races.",
    category: "Politics",
  },
  {
    id: "story_bio_foresight",
    name: "Bio Foresight",
    handle: "bio_foresight",
    avatar: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=150&h=150&q=80",
    role: "Biomedical Modeler",
    timeAgo: "9h",
    quote: "In-vivo gene editing trials for monogenic metabolic disorders are showing sustained enzyme restoration at 18-month checkups.",
    category: "Science",
  },
  {
    id: "story_crypto_sentinel",
    name: "Crypto Sentinel",
    handle: "crypto_sentinel",
    avatar: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=150&h=150&q=80",
    role: "On-Chain Risk Auditor",
    timeAgo: "12h",
    quote: "Ethereum Layer 2 blobs gas compression is driving daily transaction count past 40 million without base-layer fee spikes.",
    category: "Finance & Crypto",
  },
  {
    id: "story_stellar_horizon",
    name: "Stellar Horizon",
    handle: "stellar_horizon",
    avatar: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=150&h=150&q=80",
    role: "Aerospace Systems Analyst",
    timeAgo: "15h",
    quote: "Orbital propellant transfer demonstration success will unlock deep-space payload missions with 10x reduced launch cost per ton.",
    category: "Science",
  },
];

export function PollsList() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [stories, setStories] = useState<StoryItem[]>(FALLBACK_STORIES);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<Record<string, any>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Story Viewer State
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const storyTrayRef = useRef<HTMLDivElement>(null);

  // Followers Modal State
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);

  // Fetch stories from API
  useEffect(() => {
    fetch("/api/stories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            name: d.authorName || d.authorHandle,
            handle: d.authorHandle || d.authorName,
            avatar: d.avatar,
            role: d.role || "Prediction Node",
            timeAgo: d.timeAgo || "2h",
            quote: d.quote,
            category: d.category || "General",
            pollId: d.pollId
          }));
          setStories(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const fetchPolls = (cat: string, pageNum: number, replace: boolean = true) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (cat !== "All") {
      if (cat === "Sponsored") {
        params.set("sponsored", "true");
      } else {
        params.set("category", cat);
      }
    }
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
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    setPage(1);
    fetchPolls(selectedCategory, 1, true);
  }, [selectedCategory]);

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

  const handleScrollStoryRight = () => {
    if (storyTrayRef.current) {
      storyTrayRef.current.scrollBy({ left: 240, behavior: "smooth" });
    }
  };

  return (
    <Layout user={auth.currentUser}>
      {/* Instagram 2-Column Responsive Layout */}
      <div className="flex justify-center gap-10 xl:gap-14 px-2 sm:px-4 py-4 sm:py-6 max-w-[1020px] mx-auto min-h-screen">
        {/* ========================================================= */}
        {/* CENTER FEED COLUMN (Story Tray + Filters + Feed Posts)    */}
        {/* ========================================================= */}
        <div className="w-full max-w-[470px] sm:max-w-[500px] shrink-0 flex flex-col items-center">
          {/* 1. Horizontal Stories Tray (Instagram Layout) */}
          <div className="relative w-full mb-6 pb-2 border-b border-[#262626]">
            <div
              ref={storyTrayRef}
              className="flex items-center gap-4 overflow-x-auto scrollbar-hide py-1 px-1 scroll-smooth"
            >
              {/* User's Node (Add Story / Poll) */}
              <button
                onClick={() => setSelectedStoryIndex(0)}
                className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
              >
                <div className="relative p-[2px] rounded-full">
                  <div className="w-[66px] h-[66px] rounded-full bg-[#121214] p-0.5 border-2 border-dashed border-emerald-500/60 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
                    {auth.currentUser?.photoURL ? (
                      <img
                        src={auth.currentUser.photoURL}
                        alt="Your node"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-base">
                        {auth.currentUser?.displayName?.charAt(0) || "P"}
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 text-black border-2 border-black flex items-center justify-center shadow-md">
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
                <span className="text-[11px] font-medium text-stone-400 max-w-[70px] truncate text-center group-hover:text-emerald-400 transition-colors">
                  Your node
                </span>
              </button>

              {/* Dynamic Prediction Stories */}
              {stories.map((story, index) => (
                <button
                  key={story.id}
                  onClick={() => setSelectedStoryIndex(index)}
                  className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
                >
                  {/* Colorful Gradient Ring (Emerald-Teal-Lime) */}
                  <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-lime-400 group-hover:scale-105 transition-transform shadow-md shadow-emerald-500/10">
                    <div className="w-[62px] h-[62px] rounded-full bg-[#000000] p-0.5 flex items-center justify-center overflow-hidden">
                      <img
                        src={story.avatar}
                        alt={story.name}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${story.handle}`;
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-stone-300 max-w-[68px] truncate text-center group-hover:text-emerald-400 transition-colors">
                    {story.handle}
                  </span>
                </button>
              ))}
            </div>

            {/* Navigation Right Arrow Button */}
            <button
              onClick={handleScrollStoryRight}
              className="absolute right-0 top-1/2 -translate-y-6 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 z-20"
              title="Next stories"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* 2. Category Filter Pills */}
          <div className="w-full flex items-center gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              const isSponsored = cat === "Sponsored";
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5",
                    isActive
                      ? isSponsored
                        ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                        : "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                      : isSponsored
                      ? "bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
                      : "bg-[#18181b] text-stone-400 border border-[#262626] hover:text-white hover:border-emerald-500/40"
                  )}
                >
                  {isSponsored && <Sparkles className="w-3 h-3" />}
                  {cat === "Startups & Roasts" && <Flame className="w-3 h-3 text-orange-400" />}
                  {cat}
                </button>
              );
            })}
          </div>

          {/* 3. Instagram Feed Posts Stream */}
          <div className="w-full flex flex-col items-center">
            {loading && polls.length === 0 ? (
              <div className="py-24 text-center text-xs font-mono text-emerald-500 uppercase tracking-widest animate-pulse">
                Synchronizing Swarm Consensus Feed...
              </div>
            ) : polls.length === 0 ? (
              <div className="py-24 text-center text-stone-400 text-sm">
                No prediction posts found in this topic.
              </div>
            ) : (
              polls.map((poll) => {
                const userVote = votes[poll.id];
                return (
                  <InstagramPostCard
                    key={poll.id}
                    poll={poll}
                    currentUser={auth.currentUser}
                    hasVoted={Boolean(userVote)}
                    userVoteOption={userVote?.optionId}
                    onVote={handleVote}
                  />
                );
              })
            )}

            {/* Load More Button */}
            {hasMore && !loading && polls.length > 0 && (
              <button
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  fetchPolls(selectedCategory, nextPage, false);
                }}
                className="my-8 px-6 py-2.5 rounded-full bg-[#18181b] hover:bg-[#222226] border border-[#262626] text-xs font-bold text-white hover:text-emerald-400 transition-colors"
              >
                Load More Posts
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT SIDEBAR (Current User + Suggested For You + Footer) */}
        {/* ========================================================= */}
        <InstagramRightSidebar
          currentUser={auth.currentUser}
          onOpenFollowersModal={() => setIsFollowersModalOpen(true)}
        />
      </div>

      {/* Story Viewer Modal */}
      {selectedStoryIndex !== null && (
        <InstagramStoryModal
          stories={stories}
          currentIndex={selectedStoryIndex}
          isOpen={selectedStoryIndex !== null}
          onClose={() => setSelectedStoryIndex(null)}
          onSelectStory={(index) => setSelectedStoryIndex(index)}
        />
      )}

      {/* Followers & Suggested Modal */}
      {isFollowersModalOpen && (
        <FollowersModal
          isOpen={isFollowersModalOpen}
          onClose={() => setIsFollowersModalOpen(false)}
          targetUid={auth.currentUser?.uid || "me"}
          targetName={auth.currentUser?.displayName || "Prediction Node"}
          initialTab="followers"
        />
      )}
    </Layout>
  );
}
