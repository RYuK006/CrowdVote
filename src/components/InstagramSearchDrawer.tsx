import React, { useState, useEffect } from "react";
import { Search, X, TrendingUp, Sparkles, User, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Poll } from "../types";

interface InstagramSearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstagramSearchDrawer({ isOpen, onClose }: InstagramSearchDrawerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const RECENT_SEARCHES = [
    "AI Singularity 2026",
    "Kerala Assembly Elections",
    "Bitcoin $150k target",
    "YC Winter 2026 Roasts",
    "Champions League Final",
  ];

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/polls?search=${encodeURIComponent(query)}&limit=8`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setResults(data);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-[390px] h-full bg-[#000000] border-r border-[#262626] shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
        {/* Header */}
        <div className="p-6 border-b border-[#262626] space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white tracking-tight">Search</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-stone-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search polls, categories, topics..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#1c1c1e] text-sm text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {query.trim() ? (
            <div className="space-y-2">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider px-2 block">
                Predictions & Polls
              </span>
              {loading ? (
                <div className="py-8 text-center text-xs font-mono text-stone-500">
                  Searching neural registry...
                </div>
              ) : results.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  No prediction posts found for "{query}"
                </div>
              ) : (
                results.map((poll) => (
                  <div
                    key={poll.id}
                    onClick={() => {
                      onClose();
                      navigate(`/polls/${poll.id}`);
                    }}
                    className="p-3 rounded-xl hover:bg-white/[0.06] cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block">
                        {poll.category || "General"}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                        {poll.title}
                      </h4>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-500 group-hover:text-white group-hover:translate-x-1 transition-transform shrink-0" />
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Recent
                </span>
                <span className="text-[11px] font-semibold text-emerald-400 cursor-pointer hover:underline">
                  Clear all
                </span>
              </div>

              <div className="space-y-1">
                {RECENT_SEARCHES.map((item) => (
                  <button
                    key={item}
                    onClick={() => setQuery(item)}
                    className="w-full p-2.5 rounded-xl hover:bg-white/[0.06] flex items-center gap-3 text-left transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-stone-400 group-hover:text-emerald-400 transition-colors">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-stone-200 font-medium group-hover:text-white truncate">
                      {item}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

