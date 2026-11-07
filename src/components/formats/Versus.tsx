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
        {/* Central VS Badge with Frosted Glass */}
        <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-[#121722]/90 backdrop-blur-md border border-emerald-500/40 items-center justify-center shadow-md">
          <Swords className="w-3.5 h-3.5 text-emerald-500" />
        </div>

        {/* Left Contender with Frosted Glass */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onVote(leftSide.id)}
          className={cn(
            "relative group flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-300 overflow-hidden backdrop-blur-md",
            isLeftSelected
              ? "bg-emerald-500/15 dark:bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/40"
              : "bg-white/60 hover:bg-emerald-500/5 dark:bg-[#121722]/60 dark:hover:bg-emerald-500/10 border-slate-200/80 dark:border-emerald-500/20 hover:border-emerald-500/40 shadow-sm",
            disabled && "cursor-default"
          )}
        >
          {/* Top Label & Status */}
          <div className="flex items-center justify-between gap-2 z-10">
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
              Side A
            </span>
            {isLeftSelected && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40 font-semibold shadow-sm">
                <Check className="w-3 h-3" /> Voted
              </span>
            )}
          </div>

          {/* Title / Description */}
          <div className="my-3 z-10">
            <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors leading-snug">
              {leftSide.label}
            </div>
            {leftSide.image && (
              <img
                src={leftSide.image}
                alt={leftSide.label}
                className="mt-2 w-full h-28 object-cover rounded-lg border border-emerald-500/20 shadow-sm"
              />
            )}
          </div>

          {/* Bottom Metric / CTA */}
          <div className="z-10 pt-2 border-t border-slate-200/80 dark:border-emerald-500/15 flex items-center justify-between">
            {isBlindMasked ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600/80 dark:text-emerald-400/80 font-mono font-medium">
                <Lock className="w-3 h-3 text-emerald-500" />
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
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-bold">
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

        {/* Right Contender with Frosted Glass */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onVote(rightSide.id)}
          className={cn(
            "relative group flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-300 overflow-hidden backdrop-blur-md",
            isRightSelected
              ? "bg-teal-500/15 dark:bg-teal-950/40 border-teal-500 shadow-md shadow-teal-500/20 ring-2 ring-teal-500/40"
              : "bg-white/60 hover:bg-teal-500/5 dark:bg-[#121722]/60 dark:hover:bg-teal-500/10 border-slate-200/80 dark:border-emerald-500/20 hover:border-teal-500/40 shadow-sm",
            disabled && "cursor-default"
          )}
        >
          {/* Top Label & Status */}
          <div className="flex items-center justify-between gap-2 z-10">
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider text-teal-600 dark:text-teal-400 uppercase">
              Side B
            </span>
            {isRightSelected && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-teal-600 dark:text-teal-400 bg-teal-500/20 px-2 py-0.5 rounded-full border border-teal-500/40 font-semibold shadow-sm">
                <Check className="w-3 h-3" /> Voted
              </span>
            )}
          </div>

          {/* Title / Description */}
          <div className="my-3 z-10">
            <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors leading-snug">
              {rightSide.label}
            </div>
            {rightSide.image && (
              <img
                src={rightSide.image}
                alt={rightSide.label}
                className="mt-2 w-full h-28 object-cover rounded-lg border border-teal-500/20 shadow-sm"
              />
            )}
          </div>

          {/* Bottom Metric / CTA */}
          <div className="z-10 pt-2 border-t border-slate-200/80 dark:border-emerald-500/15 flex items-center justify-between">
            {isBlindMasked ? (
              <div className="flex items-center gap-1.5 text-xs text-teal-600/80 dark:text-teal-400/80 font-mono font-medium">
                <Lock className="w-3 h-3 text-teal-500" />
                <span>Masked Consensus</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-teal-600 dark:text-teal-400">
                  {rightPct}%
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  ({rightSide.votes || 0})
                </span>
              </div>
            )}

            {!hasVoted && (
              <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-bold">
                Vote <Sparkles className="w-3 h-3" />
              </span>
            )}
          </div>

          {/* Percentage Fill Bar Background (Revealed post-vote) */}
          {!isBlindMasked && (
            <div
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-700"
              style={{ width: `${rightPct}%` }}
            />
          )}
        </button>
      </div>

      {/* Aggregate consensus gauge bar when revealed */}
      {!isBlindMasked && (
        <div className="flex flex-col gap-1.5 px-1">
          <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-white/10 overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${leftPct}%` }}
            />
            <div
              className="h-full bg-teal-500 transition-all duration-700"
              style={{ width: `${rightPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-700 dark:text-slate-300 font-medium">
            <span>{leftSide.label}: <strong className="text-emerald-600 dark:text-emerald-400">{leftPct}%</strong></span>
            <span>{rightSide.label}: <strong className="text-teal-600 dark:text-teal-400">{rightPct}%</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
