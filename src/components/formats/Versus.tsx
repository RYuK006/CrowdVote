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
    <div className="w-full flex flex-col gap-2.5 my-2">
      {/* Split Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 relative">
        {/* Central VS Badge */}
        <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white dark:bg-[#121722] border border-slate-200 dark:border-[#1e2533] items-center justify-center shadow-sm">
          <Swords className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
        </div>

        {/* Left Contender */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onVote(leftSide.id)}
          className={cn(
            "relative group flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-300 overflow-hidden",
            isLeftSelected
              ? "bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/80 shadow-sm ring-1 ring-emerald-500/30"
              : "bg-slate-50/70 hover:bg-slate-100/90 dark:bg-[#121722] dark:hover:bg-[#161d2a] border-slate-200 dark:border-[#1e2533] hover:border-slate-300 dark:hover:border-slate-700 shadow-sm",
            disabled && "cursor-default"
          )}
        >
          {/* Top Label & Status */}
          <div className="flex items-center justify-between gap-2 z-10">
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              Side A
            </span>
            {isLeftSelected && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                <Check className="w-3 h-3" /> Voted
              </span>
            )}
          </div>

          {/* Title / Description */}
          <div className="my-3 z-10">
            <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors leading-snug">
              {leftSide.label}
            </div>
            {leftSide.image && (
              <img
                src={leftSide.image}
                alt={leftSide.label}
                className="mt-2 w-full h-28 object-cover rounded-lg border border-slate-200 dark:border-white/5"
              />
            )}
          </div>

          {/* Bottom Metric / CTA */}
          <div className="z-10 pt-2 border-t border-slate-200 dark:border-[#1e2533] flex items-center justify-between">
            {isBlindMasked ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500 font-mono">
                <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                <span>Masked Consensus</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                  {leftPct}%
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  ({leftSide.votes || 0})
                </span>
              </div>
            )}

            {!hasVoted && (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Vote <Sparkles className="w-3 h-3" />
              </span>
            )}
          </div>

          {/* Percentage Fill Bar Background (Revealed post-vote) */}
          {!isBlindMasked && (
            <div
              className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-700"
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
            "relative group flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-300 overflow-hidden",
            isRightSelected
              ? "bg-indigo-500/10 dark:bg-indigo-950/20 border-indigo-500/80 shadow-sm ring-1 ring-indigo-500/30"
              : "bg-slate-50/70 hover:bg-slate-100/90 dark:bg-[#121722] dark:hover:bg-[#161d2a] border-slate-200 dark:border-[#1e2533] hover:border-slate-300 dark:hover:border-slate-700 shadow-sm",
            disabled && "cursor-default"
          )}
        >
          {/* Top Label & Status */}
          <div className="flex items-center justify-between gap-2 z-10">
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              Side B
            </span>
            {isRightSelected && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 px-2 py-0.5 rounded-full border border-indigo-500/30 font-semibold">
                <Check className="w-3 h-3" /> Voted
              </span>
            )}
          </div>

          {/* Title / Description */}
          <div className="my-3 z-10">
            <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors leading-snug">
              {rightSide.label}
            </div>
            {rightSide.image && (
              <img
                src={rightSide.image}
                alt={rightSide.label}
                className="mt-2 w-full h-28 object-cover rounded-lg border border-slate-200 dark:border-white/5"
              />
            )}
          </div>

          {/* Bottom Metric / CTA */}
          <div className="z-10 pt-2 border-t border-slate-200 dark:border-[#1e2533] flex items-center justify-between">
            {isBlindMasked ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500 font-mono">
                <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                <span>Masked Consensus</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
                  {rightPct}%
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  ({rightSide.votes || 0})
                </span>
              </div>
            )}

            {!hasVoted && (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                Vote <Sparkles className="w-3 h-3" />
              </span>
            )}
          </div>

          {/* Percentage Fill Bar Background (Revealed post-vote) */}
          {!isBlindMasked && (
            <div
              className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-700"
              style={{ width: `${rightPct}%` }}
            />
          )}
        </button>
      </div>

      {/* Aggregate consensus gauge bar when revealed */}
      {!isBlindMasked && (
        <div className="flex flex-col gap-1.5 px-1">
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/5 overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${leftPct}%` }}
            />
            <div
              className="h-full bg-indigo-500 transition-all duration-700"
              style={{ width: `${rightPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-400 font-medium">
            <span>{leftSide.label}: <strong className="text-emerald-600 dark:text-emerald-400">{leftPct}%</strong></span>
            <span>{rightSide.label}: <strong className="text-indigo-600 dark:text-indigo-400">{rightPct}%</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
