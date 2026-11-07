import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Sparkles, CheckCircle2, Heart, MessageSquare, Share2, 
  TrendingUp, ArrowUpRight, Lock, ShieldCheck 
} from "lucide-react";
import { Poll } from "../types";
import { cn } from "../lib/utils";
import { Versus } from "./formats/Versus";
import { Choice } from "./formats/Choice";
import { Scale } from "./formats/Scale";
import { Rank } from "./formats/Rank";
import { Open } from "./formats/Open";

interface PredictionMarketCardProps {
  poll: Poll;
  currentUser: any;
  hasVoted?: boolean;
  userVoteOption?: any;
  onVote?: (pollId: string, optionId: any) => Promise<void>;
}

const getCategoryBadgeClass = (category?: string) => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("ai") || cat.includes("tech")) {
    return "bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400";
  }
  if (cat.includes("finance")) {
    return "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400";
  }
  if (cat.includes("hardware") || cat.includes("science")) {
    return "bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400";
  }
  if (cat.includes("startup") || cat.includes("roast")) {
    return "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400";
  }
  if (cat.includes("politic")) {
    return "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400";
  }
  if (cat.includes("crypto")) {
    return "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400";
  }
  return "bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300";
};

export function PredictionMarketCard({
  poll: initialPoll,
  currentUser,
  hasVoted: initialHasVoted = false,
  userVoteOption: initialUserVoteOption,
  onVote,
}: PredictionMarketCardProps) {
  const navigate = useNavigate();
  const [poll, setPoll] = useState<Poll>(initialPoll);
  const [hasVoted, setHasVoted] = useState(initialHasVoted || initialPoll.hasVoted || false);
  const [selectedOption, setSelectedOption] = useState<any>(initialUserVoteOption || initialPoll.votedOption);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Math.floor(Math.random() * 240) + 35);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [commentsCount, setCommentsCount] = useState(Math.floor(Math.random() * 30) + 5);

  const authorHandle = (poll as any).authorHandle || (poll.createdBy
    ? `node_${poll.createdBy.slice(0, 6)}`
    : "quantum_oracle");
  const authorName = (poll as any).authorName || authorHandle;
  const authorAvatar = (poll as any).authorAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${authorHandle}`;

  const totalSignals = poll.totalVotes || 120;
  const isBlindMasked = Boolean((poll as any).isBlindMasked && !hasVoted);

  useEffect(() => {
    fetch(`/api/debate/${poll.id}`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setCommentsCount(d.length);
      })
      .catch(() => {});
  }, [poll.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikesCount(prev => (isLiked ? prev - 1 : prev + 1));

    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        const res = await fetch(`/api/polls/${poll.id}/like`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.likesCount === "number") setLikesCount(data.likesCount);
        }
      } catch (err) {
        console.error("Failed to like:", err);
      }
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/polls/${poll.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const executeVote = async (optionValue: any) => {
    if (!currentUser) {
      navigate("/signin");
      return;
    }
    if (isVoting) return;
    setIsVoting(true);
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pollId: poll.id,
          selectedOption: optionValue,
          confidence: 100
        })
      });

      if (res.ok) {
        const data = await res.json();
        setHasVoted(true);
        setSelectedOption(optionValue);
        if (data.poll) {
          setPoll(data.poll);
        }
        if (onVote) {
          await onVote(poll.id, optionValue);
        }
      }
    } catch (err) {
      console.error("Voting failed:", err);
    } finally {
      setIsVoting(false);
    }
  };

  const handleOpenCandidateSubmit = async (text: string) => {
    if (!currentUser) {
      navigate("/signin");
      return;
    }
    const token = await currentUser.getIdToken();
    const res = await fetch(`/api/polls/${poll.id}/open-submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ text })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.submission) {
        setPoll(prev => ({
          ...prev,
          openSubmissions: [...(prev.openSubmissions || []), data.submission]
        }));
        setHasVoted(true);
        setSelectedOption(data.submission.id);
      }
    }
  };

  const format = poll.format || "choice";

  return (
    <div 
      className="group relative bg-white/75 dark:bg-[#0e1219]/75 backdrop-blur-xl hover:bg-white/95 dark:hover:bg-[#121722]/95 border border-slate-200/80 dark:border-emerald-500/20 hover:border-emerald-500/50 rounded-2xl p-4 sm:p-5 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between"
    >
      {/* 1. Header Meta Bar */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-2.5">
          {/* Format Badge & Category with Frosted Glass */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-sm">
              {format.toUpperCase()}
            </span>

            {poll.category && (
              <span className={cn("px-2 py-0.5 rounded-lg border text-[10px] sm:text-[11px] font-mono font-medium backdrop-blur-md", getCategoryBadgeClass(poll.category))}>
                {poll.category}
              </span>
            )}

            {poll.isSponsored && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-amber-500" />
                {poll.sponsorName || "Sponsored"}
              </span>
            )}
          </div>

          {/* Forecaster Info */}
          <Link
            to={poll.createdBy ? `/profile/${poll.createdBy}` : "/profile"}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
          >
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-emerald-500/30 shadow-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${authorHandle}`;
              }}
            />
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400 font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate max-w-[130px]">
              @{authorHandle}
            </span>
          </Link>
        </div>
            />
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold group-hover:text-slate-700 dark:group-hover:text-slate-300 truncate max-w-[130px]">
              @{authorHandle}
            </span>
          </Link>
        </div>

        {/* 2. Question / Title */}
        <h3 
          onClick={() => navigate(`/polls/${poll.id}`)}
          className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-snug hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-2 cursor-pointer"
        >
          {poll.title}
        </h3>

        {/* Sponsor Reward Tag */}
        {poll.sponsorReward && (
          <div className="mb-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-xs font-semibold">
            <span>🎁 Escrow Reward:</span>
            <span className="font-bold">{poll.sponsorReward}</span>
          </div>
        )}

        {/* Short Description */}
        {poll.description && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {poll.description}
          </p>
        )}
      </div>

      {/* 3. Format-Specific Polling Engine */}
      <div className="my-2" onClick={(e) => e.stopPropagation()}>
        {format === "versus" ? (
          <Versus
            pollId={poll.id}
            leftSide={poll.versusLeft}
            rightSide={poll.versusRight}
            hasVoted={hasVoted}
            votedOption={selectedOption}
            isBlindMasked={isBlindMasked}
            disabled={isVoting}
            onVote={async (sideId) => executeVote(sideId)}
          />
        ) : format === "scale" ? (
          <Scale
            pollId={poll.id}
            scaleMin={poll.scaleMin}
            scaleMax={poll.scaleMax}
            scaleUnit={poll.scaleUnit}
            scaleAverage={poll.scaleAverage}
            scaleVotesCount={poll.scaleVotesCount}
            hasVoted={hasVoted}
            votedOption={selectedOption}
            isBlindMasked={isBlindMasked}
            disabled={isVoting}
            onVote={async (val) => executeVote(val)}
          />
        ) : format === "rank" ? (
          <Rank
            pollId={poll.id}
            options={poll.options}
            rankedItems={poll.rankedItems}
            hasVoted={hasVoted}
            votedOption={selectedOption}
            isBlindMasked={isBlindMasked}
            disabled={isVoting}
            onVote={async (order) => executeVote(order)}
          />
        ) : format === "open" ? (
          <Open
            pollId={poll.id}
            submissions={poll.openSubmissions}
            hasVoted={hasVoted}
            votedOption={selectedOption}
            disabled={isVoting}
            onVote={async (subId) => executeVote(subId)}
            onOpenSubmit={handleOpenCandidateSubmit}
          />
        ) : (
          <Choice
            pollId={poll.id}
            options={poll.options || []}
            hasVoted={hasVoted}
            votedOption={selectedOption}
            isBlindMasked={isBlindMasked}
            disabled={isVoting}
            onVote={async (optId) => executeVote(optId)}
          />
        )}
      </div>

      {/* 4. Card Bottom Metrics Bar */}
      <div className="pt-3 mt-2.5 border-t border-slate-200/80 dark:border-emerald-500/15 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        {/* Signals Volume & Blind Status */}
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <strong className="text-slate-900 dark:text-white font-bold">{totalSignals.toLocaleString()}</strong> votes
          </span>

          {isBlindMasked && (
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-semibold">
              <Lock className="w-3 h-3 text-emerald-500" /> Masked Consensus
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Like */}
          <button
            onClick={handleLike}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-emerald-500/10 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
            title="Endorse Poll"
          >
            <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-red-500 text-red-500")} />
            <span className="text-xs font-mono font-medium">{likesCount}</span>
          </button>

          {/* Debate comments */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/polls/${poll.id}`);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-emerald-500/10 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
            title="Join Debate"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="text-xs font-mono font-medium">{commentsCount}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
            title="Share Poll Link"
          >
            {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>

          {/* Details Link */}
          <Link
            to={`/polls/${poll.id}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg hover:bg-emerald-500/15 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
            title="Full Poll View"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
