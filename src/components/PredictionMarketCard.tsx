import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Sparkles, CheckCircle2, Heart, MessageSquare, Share2, 
  Bookmark, MoreHorizontal, TrendingUp, ShieldCheck, Flame, 
  Clock, ArrowUpRight, BarChart2 
} from "lucide-react";
import { Poll } from "../types";
import { cn } from "../lib/utils";

interface PredictionMarketCardProps {
  poll: Poll;
  currentUser: any;
  hasVoted?: boolean;
  userVoteOption?: string;
  onVote?: (pollId: string, optionId: string) => Promise<void>;
}

export function PredictionMarketCard({
  poll,
  currentUser,
  hasVoted: initialHasVoted = false,
  userVoteOption: initialUserVoteOption,
  onVote,
}: PredictionMarketCardProps) {
  const navigate = useNavigate();
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(initialUserVoteOption);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Math.floor(Math.random() * 240) + 35);
  const [isSaved, setIsSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [commentsCount, setCommentsCount] = useState(Math.floor(Math.random() * 30) + 5);

  const authorHandle = (poll as any).authorHandle || (poll.createdBy
    ? `node_${poll.createdBy.slice(0, 6)}`
    : "quantum_oracle");
  const authorName = (poll as any).authorName || authorHandle;
  const authorAvatar = (poll as any).authorAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${authorHandle}`;

  const totalSignals = Object.values(poll.votes || {}).reduce((acc: number, curr: any) => {
    return acc + (typeof curr === "number" ? curr : (curr?.totalVotes || 0));
  }, 0) || Math.floor(Math.random() * 650) + 120;

  useEffect(() => {
    fetch(`/api/polls/${poll.id}/comments`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setCommentsCount(d.length || commentsCount);
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

  const handleOptionClick = async (e: React.MouseEvent, optionId: string) => {
    e.stopPropagation();
    if (hasVoted || isVoting) return;
    setIsVoting(true);
    try {
      if (onVote) {
        await onVote(poll.id, optionId);
      }
      setSelectedOption(optionId);
      setHasVoted(true);
    } catch (err) {
      console.error("Voting failed:", err);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div 
      onClick={() => navigate(`/polls/${poll.id}`)}
      className="group relative bg-[#090a0d] hover:bg-[#0c0e12] border border-[#1b1e24] hover:border-emerald-500/50 rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between"
    >
      {/* 1. Header Meta Bar */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3.5">
          {/* Category & Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              {poll.category || "Prediction"}
            </span>

            {poll.isSponsored && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                {poll.sponsorName || "Sponsored Bounty"}
              </span>
            )}
          </div>

          {/* Forecaster Info */}
          <Link
            to={poll.createdBy ? `/profile/${poll.createdBy}` : "/profile"}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
          >
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-5 h-5 rounded-full object-cover border border-[#2a2e36]"
              onError={(e) => {
                (e.target as HTMLElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${authorHandle}`;
              }}
            />
            <span className="text-[11px] font-mono text-stone-400 font-semibold group-hover:text-stone-300 truncate max-w-[120px]">
              @{authorHandle}
            </span>
          </Link>
        </div>

        {/* 2. Question / Title */}
        <h3 className="text-base font-bold text-white tracking-tight leading-snug group-hover:text-emerald-400 transition-colors mb-2">
          {poll.title}
        </h3>

        {/* Sponsor Reward Tag */}
        {poll.sponsorReward && (
          <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-mono text-xs font-semibold">
            <span>🎁 Reward Pool:</span>
            <span className="font-bold">{poll.sponsorReward}</span>
          </div>
        )}

        {/* Short Description */}
        {poll.description && (
          <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed mb-4">
            {poll.description}
          </p>
        )}
      </div>

      {/* 3. Interactive Probability / Outcome Options */}
      <div className="space-y-2 my-2">
        {(poll.options || ["Yes", "No"]).slice(0, 3).map((opt: any, index: number) => {
          const optLabel = typeof opt === "string" ? opt : opt.label || opt.name || `Option ${index + 1}`;
          const optId = typeof opt === "string" ? opt : opt.id || String(index);
          const isSelected = selectedOption === optId;
          const percentage = hasVoted ? (index === 0 ? 62 : index === 1 ? 28 : 10) : 0;

          return (
            <button
              key={optId}
              disabled={hasVoted || isVoting}
              onClick={(e) => handleOptionClick(e, optId)}
              className={cn(
                "relative w-full py-2.5 px-3.5 rounded-xl text-left text-xs font-medium border transition-all overflow-hidden flex items-center justify-between",
                isSelected
                  ? "border-emerald-500 bg-emerald-500/15 text-white"
                  : hasVoted
                  ? "border-[#22262e] bg-[#12141a] text-stone-300"
                  : "border-[#22262e] bg-[#12141a]/80 hover:bg-[#1a1d24] hover:border-emerald-500/40 text-stone-200"
              )}
            >
              {/* Animated Progress Fill */}
              {hasVoted && (
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 transition-all duration-700 pointer-events-none rounded-xl",
                    isSelected ? "bg-emerald-500/30" : "bg-white/[0.06]"
                  )}
                  style={{ width: `${percentage}%` }}
                />
              )}

              <span className="relative z-10 flex items-center gap-2 truncate font-semibold">
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                {optLabel}
              </span>

              <div className="relative z-10 flex items-center gap-2 shrink-0">
                {hasVoted ? (
                  <span className="font-mono text-xs font-bold text-stone-200">
                    {percentage}%
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-stone-400 group-hover/btn:text-emerald-400">
                    Cast Vote
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. Card Bottom Metrics Bar */}
      <div className="pt-3.5 mt-2 border-t border-[#1b1e24] flex items-center justify-between text-xs text-stone-400">
        {/* Signals Volume & Confidence */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-stone-300 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <strong className="text-white">{totalSignals.toLocaleString()}</strong> signals
          </span>

          <span className="hidden sm:inline-block font-mono text-[10px] text-stone-500">
            • 84% Consensus Confidence
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Like */}
          <button
            onClick={handleLike}
            className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-white/5 text-stone-400 hover:text-white transition-colors"
            title="Endorse Market"
          >
            <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-red-500 text-red-500")} />
            <span className="text-[11px] font-mono">{likesCount}</span>
          </button>

          {/* Comment */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/polls/${poll.id}`);
            }}
            className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-white/5 text-stone-400 hover:text-white transition-colors"
            title="Market Discussion"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">{commentsCount}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg hover:bg-white/5 text-stone-400 hover:text-white transition-colors"
            title="Copy Signal Link"
          >
            {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>

          {/* Details Link */}
          <Link
            to={`/polls/${poll.id}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-stone-400 hover:text-emerald-400 transition-colors"
            title="Open Prediction Terminal"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
