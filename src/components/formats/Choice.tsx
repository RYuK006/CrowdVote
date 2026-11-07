import React from "react";
import { Check, Crown, Lock, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import { PollOption } from "../../types";

interface ChoiceProps {
  pollId: string;
  options: PollOption[];
  hasVoted?: boolean;
  votedOption?: string | number | string[];
  isBlindMasked?: boolean;
  disabled?: boolean;
  onVote: (optionId: string) => Promise<void>;
}

export function Choice({
  options = [],
  hasVoted = false,
  votedOption,
  isBlindMasked = false,
  disabled = false,
  onVote,
}: ChoiceProps) {
  // Find top percentage option for leader highlighting post-reveal
  const topOption = !isBlindMasked && options.length > 0
    ? [...options].sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))[0]
    : null;

  return (
    <div className="w-full flex flex-col gap-2.5 my-2">
      {options.map((option, index) => {
        const isSelected = votedOption === option.id;
        const isTop = topOption && topOption.id === option.id && (topOption.percentage ?? 0) > 0;
        const percentage = isBlindMasked ? null : (option.percentage ?? 0);

        return (
          <button
            key={option.id || index}
            type="button"
            disabled={disabled}
            onClick={() => onVote(option.id)}
            className={cn(
              "group relative w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-300 overflow-hidden backdrop-blur-md",
              isSelected
                ? "bg-emerald-500/15 dark:bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/40"
                : "bg-white/60 hover:bg-emerald-500/5 dark:bg-[#121722]/60 dark:hover:bg-emerald-500/10 border-slate-200/80 dark:border-emerald-500/20 hover:border-emerald-500/40 shadow-sm",
              disabled && "cursor-default"
            )}
          >
            {/* Background percentage fill bar when consensus is unmasked */}
            {!isBlindMasked && (
              <div
                className={cn(
                  "absolute inset-y-0 left-0 transition-all duration-700 ease-out",
                  isSelected
                    ? "bg-gradient-to-r from-emerald-500/30 to-teal-400/20"
                    : isTop
                    ? "bg-emerald-500/20"
                    : "bg-slate-300/40 dark:bg-white/5"
                )}
                style={{ width: `${percentage}%` }}
              />
            )}

            {/* Foreground content */}
            <div className="relative z-10 flex items-center justify-between gap-2.5">
              {/* Option label & Index indicator */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={cn(
                    "w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 border transition-all shadow-sm",
                    isSelected
                      ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30"
                      : "bg-slate-100/90 dark:bg-[#0e1219]/90 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-emerald-500/20 group-hover:border-emerald-500/50 group-hover:text-emerald-500"
                  )}
                >
                  {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : String.fromCharCode(65 + index)}
                </span>

                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={cn(
                    "text-xs sm:text-sm font-semibold truncate transition-colors",
                    isSelected ? "text-emerald-800 dark:text-emerald-200 font-bold" : "text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300"
                  )}>
                    {option.name || option.text || `Option ${index + 1}`}
                  </span>
                  {isTop && !isBlindMasked && (
                    <span title="Consensus Leader">
                      <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Percentages or Blind status */}
              <div className="flex items-center gap-2 shrink-0">
                {isBlindMasked ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600/80 dark:text-emerald-400/80 font-mono font-medium">
                    <Lock className="w-3 h-3 text-emerald-500" />
                    <span className="hidden sm:inline text-xs font-semibold">Masked</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className={cn(
                      "text-xs sm:text-sm font-black",
                      isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200"
                    )}>
                      {percentage}%
                    </span>
                    {option.votes !== undefined && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                        ({option.votes})
                      </span>
                    )}
                  </div>
                )}

                {!hasVoted && (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500/50 group-hover:text-emerald-500 transition-colors" />
                )}
              </div>
            </div>
          </button>
        );
      })}

      {/* Consensus masking banner */}
      {isBlindMasked && (
        <div className="flex items-center justify-center gap-1.5 py-1 text-xs font-mono text-emerald-600/90 dark:text-emerald-400/90">
          <Lock className="w-3 h-3 text-emerald-500" />
          <span>Consensus masked to eliminate bias • Select an option to reveal live swarm distribution</span>
        </div>
      )}
    </div>
  );
}
