import React from "react";
import { Check, Flame, Lock, Sparkles, Swords } from "lucide-react";
import { cn } from "../../lib/utils";
import { PollVersusSide } from "../../types";

interface VersusProps {
  pollId: string;
  leftSide?: PollVersusSide;
  rightSide?: PollVersusSide;
  hasVoted?: boolean;
  votedOption?: string | number | string[];
  isBlindMasked?: boolean;
  disabled?: boolean;
  onVote: (optionId: string) => Promise<void>;
}

export function Versus({
  leftSide = { id: "left", label: "Contender A", votes: 0, percentage: 50 },
  rightSide = { id: "right", label: "Contender B", votes: 0, percentage: 50 },
  hasVoted = false,
  votedOption,
  isBlindMasked = false,
  disabled = false,
  onVote,
}: VersusProps) {
  const isLeftSelected = votedOption === leftSide.id;
  const isRightSelected = votedOption === rightSide.id;

  const leftPct = isBlindMasked ? null : (leftSide.percentage ?? 50);
  const rightPct = isBlindMasked ? null : (rightSide.percentage ?? 50);

  return (
    <div className="w-full flex flex-col gap-3 my-2">
      {/* Split Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
        {/* Central VS Badge */}
        <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-[#0d1017] border border-emerald-500/40 items-center justify-center shadow-lg shadow-black/80">
          <Swords className="w-4 h-4 text-emerald-400" />
        </div>

        {/* Left Contender */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onVote(leftSide.id)}
          className={cn(
            "relative group flex flex-col justify-between p-4 rounded-2xl border text-left transition-all duration-300 overflow-hidden",
            isLeftSelected
              ? "bg-emerald-950/30 border-emerald-500/70 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30"
              : "bg-[#0b0e14] hover:bg-[#10141d] border-[#1d222e] hover:border-emerald-500/40",
            disabled && "cursor-default"
          )}
        >
          {/* Top Label & Status */}
          <div className="flex items-center justify-between gap-2 z-10">
            <span className="text-xs font-mono font-bold tracking-wider text-emerald-400/90 uppercase">
              Side A
            </span>
            {isLeftSelected && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                <Check className="w-3 h-3" /> Voted
              </span>
            )}
          </div>

          {/* Title / Description */}
          <div className="my-4 z-10">
            <div className="text-base font-extrabold text-white group-hover:text-emerald-300 transition-colors">
              {leftSide.label}
            </div>
            {leftSide.image && (
              <img
                src={leftSide.image}
                alt={leftSide.label}
                className="mt-2 w-full h-32 object-cover rounded-xl border border-white/5"
              />
            )}
          </div>

          {/* Bottom Metric / CTA */}
          <div className="z-10 pt-2 border-t border-white/5 flex items-center justify-between">
            {isBlindMasked ? (
              <div className="flex items-center gap-1.5 text-xs text-stone-400 font-mono">
                <Lock className="w-3.5 h-3.5 text-stone-500" />
                <span>Masked Consensus</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono tracking-tight text-emerald-400">
                  {leftPct}%
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  ({leftSide.votes || 0} votes)
                </span>
              </div>
            )}

            {!hasVoted && (
              <span className="text-xs font-semibold text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Vote <Sparkles className="w-3 h-3" />
              </span>
            )}
          </div>

          {/* Percentage Fill Bar Background (Revealed post-vote) */}
          {!isBlindMasked && (
            <div
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
              style={{ width: `${leftPct}%` }}
            />
          )}
        </button>

        {/* Right Contender */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onVote(rightSide.id)}
          className={cn(
            "relative group flex flex-col justify-between p-4 rounded-2xl border text-left transition-all duration-300 overflow-hidden",
            isRightSelected
              ? "bg-purple-950/30 border-purple-500/70 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/30"
              : "bg-[#0b0e14] hover:bg-[#10141d] border-[#1d222e] hover:border-purple-500/40",
            disabled && "cursor-default"
          )}
        >
          {/* Top Label & Status */}
          <div className="flex items-center justify-between gap-2 z-10">
            <span className="text-xs font-mono font-bold tracking-wider text-purple-400/90 uppercase">
              Side B
            </span>
            {isRightSelected && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/40">
                <Check className="w-3 h-3" /> Voted
              </span>
            )}
          </div>

          {/* Title / Description */}
          <div className="my-4 z-10">
            <div className="text-base font-extrabold text-white group-hover:text-purple-300 transition-colors">
              {rightSide.label}
            </div>
            {rightSide.image && (
              <img
                src={rightSide.image}
                alt={rightSide.label}
                className="mt-2 w-full h-32 object-cover rounded-xl border border-white/5"
              />
            )}
          </div>

          {/* Bottom Metric / CTA */}
          <div className="z-10 pt-2 border-t border-white/5 flex items-center justify-between">
            {isBlindMasked ? (
              <div className="flex items-center gap-1.5 text-xs text-stone-400 font-mono">
                <Lock className="w-3.5 h-3.5 text-stone-500" />
                <span>Masked Consensus</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono tracking-tight text-purple-400">
                  {rightPct}%
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  ({rightSide.votes || 0} votes)
                </span>
              </div>
            )}

            {!hasVoted && (
              <span className="text-xs font-semibold text-purple-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Vote <Sparkles className="w-3 h-3" />
              </span>
            )}
          </div>

          {/* Percentage Fill Bar Background (Revealed post-vote) */}
          {!isBlindMasked && (
            <div
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-700"
              style={{ width: `${rightPct}%` }}
            />
          )}
        </button>
      </div>

      {/* Aggregate consensus gauge bar when revealed */}
      {!isBlindMasked && (
        <div className="flex flex-col gap-1.5 px-1">
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${leftPct}%` }}
            />
            <div
              className="h-full bg-purple-500 transition-all duration-700"
              style={{ width: `${rightPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-stone-400">
            <span>{leftSide.label}: {leftPct}%</span>
            <span>{rightSide.label}: {rightPct}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
