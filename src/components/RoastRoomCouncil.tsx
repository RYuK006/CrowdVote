import React, { useState } from "react";
import { Flame, Sparkles, Trophy, ChevronRight, MessageSquareQuote, ShieldAlert } from "lucide-react";
import { generateCouncilDebate, CouncilEvaluation } from "../lib/roastRoom";

interface RoastRoomCouncilProps {
  poll: {
    title: string;
    category?: string;
    options?: Array<{ id: string; text?: string; name?: string }>;
    councilVerdict?: string;
  };
}

export function RoastRoomCouncil({ poll }: RoastRoomCouncilProps) {
  const [activeTab, setActiveTab] = useState<number>(0);
  
  const options = (poll.options || []).map(o => ({
    id: o.id,
    text: o.text || o.name || "Option"
  }));

  const debate = generateCouncilDebate({
    title: poll.title,
    category: poll.category,
    options
  });

  if (debate.length === 0) return null;

  const currentAdvisor = debate[activeTab] || debate[0];

  return (
    <div className="w-full mt-10 rounded-[32px] bg-gradient-to-b from-stone-900/90 to-black/95 border border-orange-500/20 shadow-[0_0_50px_rgba(249,115,22,0.08)] p-6 sm:p-8 overflow-hidden relative">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] font-extrabold text-orange-400">
                Simulated AI Council
              </span>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[9px] font-mono font-bold">
                Roast Room Engine
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
              Advisor Council <span className="text-orange-400 italic">Debate & Verdict</span>
            </h3>
          </div>
        </div>

        <div className="text-xs font-mono text-stone-400 max-w-xs text-left sm:text-right">
          Simulated perspectives grounded in the advisors' public frameworks & mental models.
        </div>
      </div>

      {/* Advisor Selector Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-6 relative z-10">
        {debate.map((evalItem, idx) => {
          const isSelected = activeTab === idx;
          return (
            <button
              key={evalItem.seat.key}
              onClick={() => setActiveTab(idx)}
              className={`p-3 rounded-2xl border text-left transition-all duration-300 flex items-center gap-3 ${
                isSelected
                  ? "bg-orange-500/20 border-orange-500/60 shadow-lg shadow-orange-500/10"
                  : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              <img
                src={evalItem.seat.portrait}
                alt={evalItem.seat.name}
                className="w-12 h-12 rounded-xl object-cover bg-stone-800 border border-white/10 flex-shrink-0"
                onError={(e) => {
                  // Fallback to initial avatar if portrait image not loaded
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{evalItem.seat.name}</div>
                <div className="text-[10px] font-mono text-stone-400 truncate">{evalItem.seat.short}</div>
                <div className="text-[9px] font-mono font-bold text-orange-400 mt-0.5">
                  Pick: {evalItem.recommendedOption}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Advisor Roast Card */}
      <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={currentAdvisor.seat.portrait}
              alt={currentAdvisor.seat.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500/40 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-white">{currentAdvisor.seat.name}</h4>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-white/10 text-stone-300 border border-white/10">
                  {currentAdvisor.seat.archetype}
                </span>
              </div>
              <p className="text-xs text-stone-400 font-mono">{currentAdvisor.seat.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="text-right">
              <div className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold">Confidence</div>
              <div className="text-base font-mono font-bold text-orange-400">{currentAdvisor.confidence}%</div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-mono font-bold">
              Call: {currentAdvisor.recommendedOption}
            </div>
          </div>
        </div>

        {/* Roast Quote Box */}
        <div className="relative pl-6 py-2 border-l-2 border-orange-500/50 text-stone-200 text-sm sm:text-base leading-relaxed italic">
          <MessageSquareQuote className="w-5 h-5 text-orange-500/40 absolute -left-2.5 -top-2" />
          "{currentAdvisor.roast}"
        </div>

        {/* Advisor Core Principle */}
        <div className="pt-2 text-xs font-mono text-stone-400 flex items-center gap-2">
          <span className="text-orange-400">Principle:</span>
          <span>"{currentAdvisor.seat.quote}"</span>
        </div>
      </div>
    </div>
  );
}
