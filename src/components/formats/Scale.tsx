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
    <div className="w-full flex flex-col gap-3.5 p-3.5 sm:p-4 rounded-xl bg-slate-50/70 dark:bg-[#121722] border border-slate-200 dark:border-[#1e2533] shadow-sm my-2">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#161d2a] border border-slate-200 dark:border-[#1e2533] flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">
              Sentiment Gauge
            </span>
            <div className={cn("text-xs sm:text-sm font-bold", sentiment.color)}>{sentiment.text}</div>
          </div>
        </div>

        {/* Selected / Current Value Display */}
        <div className="flex items-baseline gap-1 bg-white dark:bg-[#0e1219] px-3 py-1 rounded-xl border border-slate-200 dark:border-[#1e2533] font-mono shadow-sm">
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{currentValue}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{scaleUnit}</span>
        </div>
      </div>

      {/* Interactive Range Slider */}
      <div className="flex flex-col gap-1.5 relative">
        <input
          type="range"
          min={scaleMin}
          max={scaleMax}
          value={currentValue}
          disabled={disabled}
          onChange={(e) => setCurrentValue(Number(e.target.value))}
          className="w-full h-2.5 bg-slate-200 dark:bg-[#1e2533] rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all border border-slate-300 dark:border-slate-700/60"
        />

        {/* Min / Max ticks */}
        <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-slate-400 px-0.5 font-medium">
          <span>{scaleMin}{scaleUnit} (Bearish)</span>
          <span>50{scaleUnit} (Neutral)</span>
          <span>{scaleMax}{scaleUnit} (Bullish)</span>
        </div>
      </div>

      {/* Aggregate Swarm Consensus (Revealed post-vote or unmasked) */}
      {!isBlindMasked && scaleAverage !== undefined ? (
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white dark:bg-[#0e1219] border border-slate-200 dark:border-[#1e2533] font-mono">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Swarm Consensus Mean:
            </span>
            <span className="text-slate-900 dark:text-white font-bold text-sm">
              {scaleAverage}{scaleUnit}
            </span>
          </div>

          {/* Comparative visual bar */}
          <div className="relative w-full h-2 rounded-full bg-slate-100 dark:bg-[#161d2a] overflow-hidden">
            <div
              className="absolute h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${scaleAverage}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-500 font-medium">
            <span>Sample: {scaleVotesCount} predictors</span>
            {hasVoted && <span>Your Stance: {typeof votedOption === "number" ? votedOption : currentValue}{scaleUnit}</span>}
          </div>
        </div>
      ) : isBlindMasked ? (
        <div className="flex items-center justify-center gap-1.5 p-3 rounded-xl bg-white dark:bg-[#0e1219] border border-slate-200 dark:border-[#1e2533] text-xs font-mono text-slate-500 dark:text-slate-500">
          <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span>Swarm mean masked • Lock stance to unveil consensus</span>
        </div>
      ) : null}

      {/* Submit or Update CTA Button */}
      <button
        type="button"
        disabled={disabled || submitting}
        onClick={handleSubmit}
        className={cn(
          "w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm",
          hasVoted
            ? "bg-slate-100 hover:bg-slate-200 dark:bg-[#161d2a] dark:hover:bg-[#1b2333] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1e2533]"
            : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold active:scale-[0.99]"
        )}
      >
        {submitting ? (
          "Recording Prediction..."
        ) : hasVoted ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Update Stance ({currentValue}{scaleUnit})
          </>
        ) : (
          <>
            <Send className="w-3.5 h-3.5" /> Submit Forecast ({currentValue}{scaleUnit})
          </>
        )}
      </button>
    </div>
  );
}
