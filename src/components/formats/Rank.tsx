import React, { useState, useEffect } from "react";
import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronUp, GripVertical, Lock, Trophy } from "lucide-react";
import { cn } from "../../lib/utils";
import { PollOption, PollRankItem } from "../../types";

interface RankProps {
  pollId: string;
  options?: PollOption[];
  rankedItems?: PollRankItem[];
  hasVoted?: boolean;
  votedOption?: string | number | string[];
  isBlindMasked?: boolean;
  disabled?: boolean;
  onVote: (rankedOrder: string[]) => Promise<void>;
}

export function Rank({
  options = [],
  rankedItems = [],
  hasVoted = false,
  votedOption,
  isBlindMasked = false,
  disabled = false,
  onVote,
}: RankProps) {
  // Normalize items to an array of { id, label, score }
  const defaultItems = options.length > 0
    ? options.map(o => ({ id: o.id, label: o.name || o.text || o.id, score: 0 }))
    : rankedItems.length > 0
    ? rankedItems
    : [];

  const [items, setItems] = useState(defaultItems);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (Array.isArray(votedOption) && votedOption.length > 0) {
      // Reorder items according to user's saved ranking
      const reordered = [...defaultItems].sort((a, b) => {
        const idxA = votedOption.indexOf(a.id);
        const idxB = votedOption.indexOf(b.id);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
      setItems(reordered);
    } else if (defaultItems.length > 0 && items.length === 0) {
      setItems(defaultItems);
    }
  }, [votedOption, options, rankedItems]);

  const moveItem = (index: number, direction: "up" | "down") => {
    if (disabled || submitting) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (disabled || submitting) return;
    setSubmitting(true);
    try {
      const rankedIds = items.map(i => i.id);
      await onVote(rankedIds);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 my-2">
      <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5 font-semibold">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          Ranked-Choice Instant Runoff (IRV)
        </span>
        <span>Arrange top to bottom</span>
      </div>

      {/* Reorderable Items List */}
      <div className="flex flex-col gap-2">
        {items.map((item, index) => {
          const rankOrdinal = index === 0 ? "1st" : index === 1 ? "2nd" : index === 2 ? "3rd" : `${index + 1}th`;
          const isWinner = index === 0;

          return (
            <div
              key={item.id || index}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border transition-all",
                isWinner
                  ? "border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm"
                  : "bg-white dark:bg-[#0e1219] border-slate-200 dark:border-[#1e2533] hover:border-slate-300 dark:hover:border-slate-700"
              )}
            >
              {/* Left: Position Badge & Label */}
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 border",
                    isWinner
                      ? "bg-amber-500 text-black border-amber-400 shadow-sm"
                      : "bg-slate-100 dark:bg-[#161d2a] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#1e2533]"
                  )}
                >
                  {rankOrdinal}
                </span>

                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {item.label}
                  </span>
                  {!isBlindMasked && item.score !== undefined && item.score > 0 && (
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      Consensus score: {item.score} pts
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Up / Down Reorder Controls */}
              {!disabled && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveItem(index, "up")}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#161d2a] dark:hover:bg-[#1f283a] disabled:opacity-20 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-[#1e2533]"
                    title="Move higher priority"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(index, "down")}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#161d2a] dark:hover:bg-[#1f283a] disabled:opacity-20 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-[#1e2533]"
                    title="Move lower priority"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Blind Consensus Message */}
      {isBlindMasked && (
        <div className="flex items-center justify-center gap-1.5 py-1 text-[11px] font-mono text-slate-500 dark:text-slate-500">
          <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          <span>Instant Runoff scores masked until ballot submission</span>
        </div>
      )}

      {/* Submit Preference CTA */}
      <button
        type="button"
        disabled={disabled || submitting}
        onClick={handleSubmit}
        className={cn(
          "w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm",
          hasVoted
            ? "bg-slate-100 hover:bg-slate-200 dark:bg-[#161d2a] dark:hover:bg-[#1f283a] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1e2533]"
            : "bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold active:scale-[0.99]"
        )}
      >
        {submitting ? (
          "Submitting Preference..."
        ) : hasVoted ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Update Ballot Order
          </>
        ) : (
          <>
            <Trophy className="w-3.5 h-3.5" /> Submit Ranked Preference
          </>
        )}
      </button>
    </div>
  );
}
