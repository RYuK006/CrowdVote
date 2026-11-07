import React, { useState, useEffect, useRef } from "react";
import { ChevronRight, Sparkles, ShieldCheck, TrendingUp, Zap, ChevronLeft } from "lucide-react";
import { cn } from "../lib/utils";
import { InstagramStoryModal, StoryItem } from "./InstagramStoryModal";

interface GrandmasterRadarProps {
  onSelectTopic?: (category: string) => void;
}

const FALLBACK_STORIES: StoryItem[] = [
  {
    id: "story_quantum_oracle",
    name: "Quantum Oracle",
    handle: "quantum_oracle",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80",
    role: "Grandmaster • 98.4% Acc",
    timeAgo: "1h",
    quote: "Market consensus is pricing a 74% probability of autonomous reasoning models achieving zero-shot coding milestones before Q3 2026.",
    category: "Tech & AI",
  },
  {
    id: "story_alpha_macro",
    name: "Alpha Macro",
    handle: "alpha_macro",
    avatar: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=150&h=150&q=80",
    role: "Grandmaster • 97.2% Acc",
    timeAgo: "2h",
    quote: "Central bank terminal rate cuts are already discounted by debt markets. Asymmetry lies in cross-currency carry spreads.",
    category: "Finance & Crypto",
  },
  {
    id: "story_cyber_pulse",
    name: "Cyber Pulse",
    handle: "cyber_pulse",
    avatar: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=150&h=150&q=80",
    role: "Master • 96.5% Acc",
    timeAgo: "3h",
    quote: "Sub-2nm lithography yields are stabilizing faster than foundry guidance suggests. Silicon moats are shifting to optical interconnects.",
    category: "Tech & AI",
  },
  {
    id: "story_venture_roast",
    name: "Venture Roast",
    handle: "venture_roast",
    avatar: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=150&h=150&q=80",
    role: "Expert • 94.6% Acc",
    timeAgo: "5h",
    quote: "90% of AI agent wrapper startups will run out of runway because their gross margin is subsidizing cloud compute rather than retention.",
    category: "Startups & Roasts",
  },
  {
    id: "story_polity_matrix",
    name: "Polity Matrix",
    handle: "polity_matrix",
    avatar: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=150&h=150&q=80",
    role: "Grandmaster • 97.9% Acc",
    timeAgo: "7h",
    quote: "Youth turnout divergence and economic sentiment volatility are shattering traditional sample polling in regional legislative races.",
    category: "Politics",
  },
  {
    id: "story_crypto_sentinel",
    name: "Crypto Sentinel",
    handle: "crypto_sentinel",
    avatar: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=150&h=150&q=80",
    role: "Master • 96.1% Acc",
    timeAgo: "12h",
    quote: "Ethereum Layer 2 blobs gas compression is driving daily transaction count past 40 million without base-layer fee spikes.",
    category: "Finance & Crypto",
  },
];

export function GrandmasterRadar({ onSelectTopic }: GrandmasterRadarProps) {
  const [stories, setStories] = useState<StoryItem[]>(FALLBACK_STORIES);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/stories")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            name: d.authorName || d.authorHandle,
            handle: d.authorHandle || d.authorName,
            avatar: d.avatar,
            role: d.role || "Grandmaster Forecaster",
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

  const handleScroll = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full mb-6 select-none">
      {/* Header Label */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
          <span className="text-sm font-mono font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
            Grandmaster Forecasting Radar
          </span>
          <span className="text-xs text-slate-500 dark:text-stone-400 font-mono hidden sm:inline">
            • Live 24h Predictive Theses
          </span>
        </div>

        {/* Scroll Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleScroll(-300)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#111318] dark:hover:bg-[#1a1d24] text-slate-600 hover:text-slate-900 dark:text-stone-400 dark:hover:text-white border border-slate-200 dark:border-[#20242e] transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll(300)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#111318] dark:hover:bg-[#1a1d24] text-slate-600 hover:text-slate-900 dark:text-stone-400 dark:hover:text-white border border-slate-200 dark:border-[#20242e] transition-colors shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Radar Pods */}
      <div
        ref={scrollRef}
        className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-1 px-1 scroll-smooth"
      >
        {stories.map((story, index) => (
          <div
            key={story.id}
            onClick={() => setSelectedStoryIndex(index)}
            className="min-w-[270px] sm:min-w-[300px] max-w-[300px] p-4 rounded-2xl bg-white dark:bg-[#090b0e] hover:bg-slate-50 dark:hover:bg-[#101217] border border-slate-200 dark:border-[#1b1e24] hover:border-emerald-500/40 transition-all cursor-pointer shadow-sm hover:shadow-emerald-500/10 flex flex-col justify-between group"
          >
            {/* Top Node Meta */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <img
                    src={story.avatar}
                    alt={story.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-[#262a33]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${story.handle}`;
                    }}
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 border-2 border-white dark:border-black" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                    @{story.handle}
                  </span>
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400/90 truncate font-semibold">
                    {story.role}
                  </span>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold uppercase shrink-0">
                {story.category}
              </span>
            </div>

            {/* Thesis Quote */}
            <p className="text-xs sm:text-sm text-slate-700 dark:text-stone-300 line-clamp-2 leading-relaxed italic mb-3">
              "{story.quote}"
            </p>

            {/* Bottom Meta */}
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-white/5 text-xs font-mono text-slate-500 dark:text-stone-400">
              <span>{story.timeAgo} ago</span>
              <span className="text-emerald-600 dark:text-emerald-400 group-hover:underline flex items-center gap-1 font-semibold">
                Read Thesis →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Story Modal Viewer */}
      {selectedStoryIndex !== null && (
        <InstagramStoryModal
          stories={stories}
          currentIndex={selectedStoryIndex}
          isOpen={selectedStoryIndex !== null}
          onClose={() => setSelectedStoryIndex(null)}
          onSelectStory={(idx) => setSelectedStoryIndex(idx)}
        />
      )}
    </div>
  );
}
