import React from "react";
import { Check, Lock, Sparkles, Swords } from "lucide-react";
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
        <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-[#0d1017] border border-emerald-500/40 items-center justify-center shadow-lg shadow-black/20">
          <Swords className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>

        {/* Left Contender */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onVote(leftSide.id)}
          className={cn(
            "relative group flex flex-col justify-between p-4 sm:p-5 rounded-2xl border text-left transition-all duration-300 overflow-hidden",
            isLeftSelected
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30"
              : "bg-white dark:bg-[#0b0e14] hover:bg-slate-50 dark:hover:bg-[#10141d] border-slate-200 dark:border-[#1d222e] hover:border-emerald-500/40 shadow-sm",
            disabled && "cursor-default"
          )}
        >
          {/* Top Label & Status */}
          <div className="flex items-center justify-between gap-2 z-10">
            <span className="text-xs sm:text-sm font-mono font-bold tracking-wider text-emerald-600 dark:text-emerald-400/90 uppercase">
              Side A
            </span>
            {isLeftSelected && (
              <span className="flex items-center gap-1 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/40 font-semibold">
                <Check className="w-3.5 h-3.5" /> Voted
              </span>
            )}
          </div>

          {/* Title / Description */}
          <div className="my-4 z-10">
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors leading-snug">
              {leftSide.label}
            </div>
            {leftSide.image && (
              <img
                src={leftSide.image}
                alt={leftSide.label}
                className="mt-2 w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-white/5"
              />
            )}
          </div>

          {/* Bottom Metric / CTA */}
          <div className="z-10 pt-2 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
            {isBlindMasked ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-stone-400 font-mono">
                <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-stone-500" />
                <span>Masked Consensus</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                  {leftPct}%
                </span>
                <span className="text-xs text-slate-500 dark:text-stone-400">
                  ({leftSide.votes || 0} votes)
                </span>
              </div>
            )}

            {!hasVoted && (
              <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Vote <Sparkles className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          {/* Percentage Fill Bar Background (Revealed post-vote) */}
          {!isBlindMasked && (
            <div
              className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
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
            "relative group flex flex-col justify-between p-4 sm:p-5 rounded-2xl border text-left transition-all duration-300 overflow-hidden",
            isRightSelected
              ? "bg-purple-50 dark:bg-purple-950/30 border-purple-500/80 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/30"
              : "bg-white dark:bg-[#0b0e14] hover:bg-slate-50 dark:hover:bg-[#10141d] border-slate-200 dark:border-[#1d222e] hover:border-purple-500/40 shadow-sm",
            disabled && "cursor-default"
          )}
        >
          {/* Top Label & Status */}
          <div className="flex items-center justify-between gap-2 z-10">
            <span className="text-xs sm:text-sm font-mono font-bold tracking-wider text-purple-600 dark:text-purple-400/90 uppercase">
              Side B
            </span>
            {isRightSelected && (
              <span className="flex items-center gap-1 text-xs font-mono text-purple-600 dark:text-purple-400 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-500/40 font-semibold">
                <Check className="w-3.5 h-3.5" /> Voted
              </span>
            )}
          </div>

          {/* Title / Description */}
          <div className="my-4 z-10">
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors leading-snug">
              {rightSide.label}
            </div>
            {rightSide.image && (
              <img
                src={rightSide.image}
                alt={rightSide.label}
                className="mt-2 w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-white/5"
              />
            )}
          </div>

          {/* Bottom Metric / CTA */}
          <div className="z-10 pt-2 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
            {isBlindMasked ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-stone-400 font-mono">
                <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-stone-500" />
                <span>Masked Consensus</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-purple-600 dark:text-purple-400">
                  {rightPct}%
                </span>
                <span className="text-xs text-slate-500 dark:text-stone-400">
                  ({rightSide.votes || 0} votes)
                </span>
              </div>
            )}

            {!hasVoted && (
              <span className="text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Vote <Sparkles className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          {/* Percentage Fill Bar Background (Revealed post-vote) */}
          {!isBlindMasked && (
            <div
              className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-700"
              style={{ width: `${rightPct}%` }}
            />
          )}
        </button>
      </div>

      {/* Aggregate consensus gauge bar when revealed */}
      {!isBlindMasked && (
        <div className="flex flex-col gap-2 px-1">
          <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-white/5 overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${leftPct}%` }}
            />
            <div
              className="h-full bg-purple-500 transition-all duration-700"
              style={{ width: `${rightPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm font-mono text-slate-600 dark:text-stone-400 font-medium">
            <span>{leftSide.label}: <strong className="text-emerald-600 dark:text-emerald-400">{leftPct}%</strong></span>
            <span>{rightSide.label}: <strong className="text-purple-600 dark:text-purple-400">{rightPct}%</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
