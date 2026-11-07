import React, { useState } from "react";
import { Check, Gauge, Lock, Send, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";

interface ScaleProps {
  pollId: string;
  scaleMin?: number;
  scaleMax?: number;
  scaleUnit?: string;
  scaleAverage?: number;
  scaleVotesCount?: number;
  hasVoted?: boolean;
  votedOption?: string | number | string[];
  isBlindMasked?: boolean;
  disabled?: boolean;
  onVote: (value: number) => Promise<void>;
}

export function Scale({
  scaleMin = 0,
  scaleMax = 100,
  scaleUnit = "%",
  scaleAverage,
  scaleVotesCount = 0,
  hasVoted = false,
  votedOption,
  isBlindMasked = false,
  disabled = false,
  onVote,
}: ScaleProps) {
  const initialValue = typeof votedOption === "number" ? votedOption : 50;
  const [currentValue, setCurrentValue] = useState<number>(initialValue);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (disabled || submitting) return;
    setSubmitting(true);
    try {
      await onVote(currentValue);
    } finally {
      setSubmitting(false);
    }
  };

  // Determine sentiment category
  const getSentimentLabel = (val: number) => {
    if (val < 25) return { text: "Strong Skepticism", color: "text-rose-500 dark:text-rose-400" };
    if (val < 50) return { text: "Lean Negative", color: "text-amber-500 dark:text-amber-400" };
    if (val < 75) return { text: "Lean Confident", color: "text-teal-600 dark:text-teal-400" };
    return { text: "High Conviction", color: "text-emerald-600 dark:text-emerald-400" };
  };

  const sentiment = getSentimentLabel(currentValue);

  return (
    <div className="w-full flex flex-col gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0b0e14] border border-slate-200 dark:border-[#1d222e] shadow-sm my-2">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-slate-500 dark:text-stone-400 font-semibold">
              Sentiment Gauge
            </span>
            <div className={cn("text-sm sm:text-base font-bold", sentiment.color)}>{sentiment.text}</div>
          </div>
        </div>

        {/* Selected / Current Value Display */}
        <div className="flex items-baseline gap-1.5 bg-slate-100 dark:bg-black/60 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 font-mono shadow-inner">
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{currentValue}</span>
          <span className="text-sm text-slate-600 dark:text-stone-400 font-bold">{scaleUnit}</span>
        </div>
      </div>

      {/* Interactive Range Slider */}
      <div className="flex flex-col gap-2 relative">
        <input
          type="range"
          min={scaleMin}
          max={scaleMax}
          value={currentValue}
          disabled={disabled}
          onChange={(e) => setCurrentValue(Number(e.target.value))}
          className="w-full h-3.5 bg-slate-200 dark:bg-[#161a23] rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all border border-slate-300 dark:border-white/5"
        />

        {/* Min / Max ticks */}
        <div className="flex justify-between items-center text-xs font-mono text-slate-500 dark:text-stone-400 px-1 font-medium">
          <span>{scaleMin}{scaleUnit} (Bearish)</span>
          <span>50{scaleUnit} (Neutral)</span>
          <span>{scaleMax}{scaleUnit} (Bullish)</span>
        </div>
      </div>

      {/* Aggregate Swarm Consensus (Revealed post-vote or unmasked) */}
      {!isBlindMasked && scaleAverage !== undefined ? (
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-50 dark:bg-[#10141c] border border-slate-200 dark:border-white/5 font-mono">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-600 dark:text-stone-400 flex items-center gap-2 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              Swarm Consensus Mean:
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-base">
              {scaleAverage}{scaleUnit}
            </span>
          </div>

          {/* Comparative visual bar */}
          <div className="relative w-full h-2.5 rounded-full bg-slate-200 dark:bg-black/60 overflow-hidden">
            <div
              className="absolute h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
              style={{ width: `${scaleAverage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-stone-500 font-medium">
            <span>Sample: {scaleVotesCount} predictors</span>
            {hasVoted && <span>Your Stance: {typeof votedOption === "number" ? votedOption : currentValue}{scaleUnit}</span>}
          </div>
        </div>
      ) : isBlindMasked ? (
        <div className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 text-xs sm:text-sm font-mono text-slate-500 dark:text-stone-500">
          <Lock className="w-4 h-4 text-slate-400 dark:text-stone-600" />
          <span>Swarm mean distribution masked • Lock your prediction to unveil consensus</span>
        </div>
      ) : null}

      {/* Submit or Update CTA Button */}
      <button
        type="button"
        disabled={disabled || submitting}
        onClick={handleSubmit}
        className={cn(
          "w-full py-3 px-5 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-2 shadow-lg",
          hasVoted
            ? "bg-slate-200 hover:bg-slate-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-slate-800 dark:text-stone-200 border border-slate-300 dark:border-white/10"
            : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20 active:scale-[0.99]"
        )}
      >
        {submitting ? (
          "Recording Prediction..."
        ) : hasVoted ? (
          <>
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Update Stance ({currentValue}{scaleUnit})
          </>
        ) : (
          <>
            <Send className="w-4 h-4" /> Submit Forecast ({currentValue}{scaleUnit})
          </>
        )}
      </button>
    </div>
  );
}
