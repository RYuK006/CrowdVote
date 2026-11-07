import React, { useState } from "react";
import { Check, Plus, Send, Sparkles, User, Users } from "lucide-react";
import { cn } from "../../lib/utils";
import { PollOpenSubmission } from "../../types";

interface OpenProps {
  pollId: string;
  submissions?: PollOpenSubmission[];
  hasVoted?: boolean;
  votedOption?: string | number | string[];
  disabled?: boolean;
  onVote: (submissionId: string) => Promise<void>;
  onOpenSubmit: (text: string) => Promise<void>;
}

export function Open({
  pollId,
  submissions = [],
  hasVoted = false,
  votedOption,
  disabled = false,
  onVote,
  onOpenSubmit,
}: OpenProps) {
  const [candidateText, setCandidateText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  const handleNominate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateText.trim() || isSubmitting || disabled) return;

    setIsSubmitting(true);
    try {
      await onOpenSubmit(candidateText.trim());
      setCandidateText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteCandidate = async (subId: string) => {
    if (disabled || votingId) return;
    setVotingId(subId);
    try {
      await onVote(subId);
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 my-2">
      <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5 font-semibold">
          <Users className="w-3.5 h-3.5 text-teal-500" />
          Crowdsourced Open Ballot
        </span>
        <span>{submissions.length} Candidate Proposals</span>
      </div>

      {/* Candidate Submissions List */}
      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
        {submissions.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#121722] border border-slate-200 dark:border-[#1e2533] text-center text-xs font-mono text-slate-500 dark:text-slate-400">
            No candidate options submitted yet. Be the first to nominate an option below!
          </div>
        ) : (
          submissions.map((sub) => {
            const isSelected = votedOption === sub.id;

            return (
              <div
                key={sub.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-all duration-200",
                  isSelected
                    ? "bg-teal-500/10 border-teal-500/80 shadow-sm ring-1 ring-teal-500/30"
                    : "bg-white dark:bg-[#0e1219] border-slate-200 dark:border-[#1e2533] hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                {/* Left: Candidate text and nominator */}
                <div className="flex flex-col min-w-0 pr-3">
                  <span className={cn(
                    "text-sm font-semibold truncate",
                    isSelected ? "text-teal-700 dark:text-teal-300 font-bold" : "text-slate-900 dark:text-white"
                  )}>
                    {sub.text}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <User className="w-2.5 h-2.5" /> Proposed by {sub.authorName}
                  </span>
                </div>

                {/* Right: Vote count and Vote button */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                    {sub.votes || 0} votes
                  </span>

                  <button
                    type="button"
                    disabled={disabled || votingId === sub.id}
                    onClick={() => handleVoteCandidate(sub.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                      isSelected
                        ? "bg-teal-600 text-white shadow-sm"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-[#161d2a] dark:hover:bg-[#1f283a] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#1e2533]"
                    )}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Backed
                      </>
                    ) : (
                      "Vote"
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Nominate / Submit New Candidate Input */}
      <form onSubmit={handleNominate} className="flex gap-2 mt-1">
        <input
          type="text"
          value={candidateText}
          onChange={(e) => setCandidateText(e.target.value)}
          placeholder="Nominate new candidate option..."
          disabled={disabled || isSubmitting}
          className="flex-1 bg-white dark:bg-[#121722] border border-slate-200 dark:border-[#1e2533] focus:border-teal-500/60 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all shadow-sm"
        />
        <button
          type="submit"
          disabled={!candidateText.trim() || isSubmitting || disabled}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          {isSubmitting ? (
            "Adding..."
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" /> Propose
            </>
          )}
        </button>
      </form>
    </div>
  );
}
