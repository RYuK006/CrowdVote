import React from "react";
import { Check, CheckCircle2, Crown, Lock, Sparkles } from "lucide-react";
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
              "group relative w-full text-left p-3.5 rounded-xl border transition-all duration-300 overflow-hidden",
              isSelected
                ? "bg-emerald-950/30 border-emerald-500/80 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                : "bg-[#0b0e14] hover:bg-[#10141d] border-[#1d222e] hover:border-emerald-500/30",
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
                    : "bg-white/10"
                )}
                style={{ width: `${percentage}%` }}
              />
            )}

            {/* Foreground content */}
            <div className="relative z-10 flex items-center justify-between gap-3">
              {/* Option label & Index indicator */}
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={cn(
                    "w-6 h-6 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center shrink-0 border",
                    isSelected
                      ? "bg-emerald-500 text-black border-emerald-400"
                      : "bg-black/40 text-stone-400 border-white/10 group-hover:border-emerald-500/40 group-hover:text-white"
                  )}
                >
                  {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : String.fromCharCode(65 + index)}
                </span>

                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn(
                    "text-sm font-semibold truncate transition-colors",
                    isSelected ? "text-emerald-300 font-bold" : "text-stone-200 group-hover:text-white"
                  )}>
                    {option.name || option.text || `Option ${index + 1}`}
                  </span>
                  {isTop && !isBlindMasked && (
                    <span title="Consensus Leader">
                      <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Percentages or Blind status */}
              <div className="flex items-center gap-2 shrink-0">
                {isBlindMasked ? (
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono">
                    <Lock className="w-3 h-3 text-stone-600" />
                    <span className="hidden sm:inline text-[10px]">Masked</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className={cn(
                      "text-sm font-black",
                      isSelected ? "text-emerald-400" : "text-stone-300"
                    )}>
                      {percentage}%
                    </span>
                    {option.votes !== undefined && (
                      <span className="text-[10px] text-stone-500 hidden sm:inline">
                        ({option.votes})
                      </span>
                    )}
                  </div>
                )}

                {!hasVoted && (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400/40 group-hover:text-emerald-400 transition-colors" />
                )}
              </div>
            </div>
          </button>
        );
      })}

      {/* Consensus masking banner */}
      {isBlindMasked && (
        <div className="flex items-center justify-center gap-1.5 py-1 text-[11px] font-mono text-stone-500">
          <Lock className="w-3 h-3 text-emerald-500/60" />
          <span>Consensus masked to eliminate bias • Select an option to reveal live swarm distribution</span>
        </div>
      )}
    </div>
  );
}
