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
    <div className="w-full flex flex-col gap-2 my-2">
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
              "group relative w-full text-left p-3 sm:p-3.5 rounded-xl border transition-all duration-300 overflow-hidden",
              isSelected
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/80 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                : "bg-white dark:bg-[#0b0e14] hover:bg-slate-50 dark:hover:bg-[#10141d] border-slate-200 dark:border-[#1d222e] hover:border-emerald-500/40 shadow-sm",
              disabled && "cursor-default"
            )}
          >
            {/* Background percentage fill bar when consensus is unmasked */}
            {!isBlindMasked && (
              <div
                className={cn(
                  "absolute inset-y-0 left-0 transition-all duration-700 ease-out opacity-20",
                  isSelected
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 opacity-30"
                    : isTop
                    ? "bg-emerald-500"
                    : "bg-slate-300 dark:bg-white/10"
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
                    "w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 border",
                    isSelected
                      ? "bg-emerald-500 text-black border-emerald-400 shadow-sm"
                      : "bg-slate-100 dark:bg-black/40 text-slate-600 dark:text-stone-400 border-slate-200 dark:border-white/10 group-hover:border-emerald-500/40 group-hover:text-slate-900 dark:group-hover:text-white"
                  )}
                >
                  {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : String.fromCharCode(65 + index)}
                </span>

                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={cn(
                    "text-xs sm:text-sm font-semibold truncate transition-colors",
                    isSelected ? "text-emerald-700 dark:text-emerald-300 font-bold" : "text-slate-800 dark:text-stone-200 group-hover:text-slate-900 dark:group-hover:text-white"
                  )}>
                    {option.name || option.text || `Option ${index + 1}`}
                  </span>
                  {isTop && !isBlindMasked && (
                    <span title="Consensus Leader">
                      <Crown className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Percentages or Blind status */}
              <div className="flex items-center gap-2 shrink-0">
                {isBlindMasked ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-stone-500 font-mono">
                    <Lock className="w-3 h-3 text-slate-400 dark:text-stone-600" />
                    <span className="hidden sm:inline text-xs font-medium">Masked</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className={cn(
                      "text-xs sm:text-sm font-black",
                      isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-stone-300"
                    )}>
                      {percentage}%
                    </span>
                    {option.votes !== undefined && (
                      <span className="text-[10px] text-slate-400 dark:text-stone-500 hidden sm:inline">
                        ({option.votes})
                      </span>
                    )}
                  </div>
                )}

                {!hasVoted && (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500/40 group-hover:text-emerald-500 transition-colors" />
                )}
              </div>
            </div>
          </button>
        );
      })}

      {/* Consensus masking banner */}
      {isBlindMasked && (
        <div className="flex items-center justify-center gap-1.5 py-1 text-xs font-mono text-slate-500 dark:text-stone-500">
          <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-500/60" />
          <span>Consensus masked to eliminate bias • Select an option to reveal live swarm distribution</span>
        </div>
      )}
    </div>
  );
}
