import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal, 
  CheckCircle2, Sparkles, Share2, Check 
} from "lucide-react";
import { Poll } from "../types";
import { cn } from "../lib/utils";

interface InstagramPostCardProps {
  poll: Poll;
  currentUser: any;
  hasVoted?: boolean;
  userVoteOption?: string;
  onVote?: (pollId: string, optionId: string) => Promise<void>;
}

export function InstagramPostCard({
  poll,
  currentUser,
  hasVoted: initialHasVoted = false,
  userVoteOption: initialUserVoteOption,
  onVote,
}: InstagramPostCardProps) {
  const navigate = useNavigate();
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(initialUserVoteOption);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Math.floor(Math.random() * 850) + 120);
  const [isSaved, setIsSaved] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState<string[]>([
    "High variance thesis right here.",
    "Already priced in by consensus.",
  ]);
  const [isVoting, setIsVoting] = useState(false);

  // Derive author handle and subtitle
  const authorHandle = poll.createdBy
    ? `node_${poll.createdBy.slice(0, 6)}`
    : "joel.k.jose";
  const subtitle = poll.category
    ? `${poll.category} • Consensus Matrix`
    : "Vrinda Shameek, Harib Hussain • Kanneeril";

  const totalVotes = Object.values(poll.votes || {}).reduce((acc: number, curr: any) => {
    return acc + (typeof curr === "number" ? curr : (curr?.totalVotes || 0));
  }, 0) || Math.floor(Math.random() * 400) + 60;

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleShare = () => {
    const url = `${window.location.origin}/polls/${poll.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setComments((prev) => [...prev, commentInput.trim()]);
    setCommentInput("");
  };

  const handleOptionClick = async (optionId: string) => {
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
    <article className="w-full bg-[#000000] border-b border-[#262626] sm:border sm:rounded-2xl overflow-hidden mb-6 text-white select-none">
      {/* 1. Post Header */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-3">
          <Link
            to={poll.createdBy ? `/profile/${poll.createdBy}` : "/profile"}
            className="p-[1.5px] rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-lime-400 group"
          >
            <div className="w-8 h-8 rounded-full bg-black p-0.5 overflow-hidden">
              <img
                src={`https://api.dicebear.com/7.x/identicon/svg?seed=${authorHandle}`}
                alt={authorHandle}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </Link>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                to={poll.createdBy ? `/profile/${poll.createdBy}` : "/profile"}
                className="text-xs font-bold hover:text-stone-300 transition-colors truncate"
              >
                {authorHandle}
              </Link>
              <span className="text-stone-500 text-xs">• 1w</span>
            </div>
            <span className="text-[11px] text-stone-400 truncate max-w-[280px]">
              {subtitle}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowOptionsModal(true)}
          className="p-1 rounded-full text-stone-400 hover:text-white transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Media / Poll Canvas Area */}
      <div className="relative w-full aspect-square sm:aspect-[4/3] bg-gradient-to-b from-[#141416] via-[#09090b] to-[#040405] border-y border-[#262626] flex flex-col justify-between p-5 overflow-hidden">
        {/* Subtle background mesh decoration */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Top Badges */}
        <div className="flex items-center justify-between z-10">
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
            {poll.category || "Prediction"}
          </span>

          {poll.isSponsored && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px] font-mono font-extrabold uppercase tracking-wider shadow-lg">
              <Sparkles className="w-3 h-3" />
              {poll.sponsorName || "Sponsored"}
            </span>
          )}
        </div>

        {/* Poll Title */}
        <div className="my-auto z-10 space-y-2 py-2">
          <Link
            to={`/polls/${poll.id}`}
            className="text-lg sm:text-xl font-bold tracking-tight text-white hover:text-emerald-400 transition-colors line-clamp-3 block leading-snug"
          >
            {poll.title}
          </Link>
          {poll.sponsorReward && (
            <div className="text-xs font-mono text-amber-400 font-semibold">
              🎁 Sponsor Allocation: {poll.sponsorReward}
            </div>
          )}
        </div>

        {/* Interactive Poll Options */}
        <div className="z-10 space-y-2 w-full pt-2">
          {(poll.options || ["Yes", "No"]).slice(0, 3).map((opt: any, index: number) => {
            const optLabel = typeof opt === "string" ? opt : opt.label || opt.name || `Option ${index + 1}`;
            const optId = typeof opt === "string" ? opt : opt.id || String(index);
            const isSelected = selectedOption === optId;
            const percentage = hasVoted ? (index === 0 ? 64 : index === 1 ? 28 : 8) : 0;

            return (
              <button
                key={optId}
                disabled={hasVoted || isVoting}
                onClick={() => handleOptionClick(optId)}
                className={cn(
                  "relative w-full py-2.5 px-4 rounded-xl text-left font-medium text-xs border transition-all overflow-hidden flex items-center justify-between",
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/10 text-white"
                    : hasVoted
                    ? "border-white/10 bg-white/5 text-stone-300"
                    : "border-white/15 bg-black/40 hover:bg-white/10 hover:border-emerald-500/50 text-white"
                )}
              >
                {/* Real-time Percentage Bar */}
                {hasVoted && (
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 transition-all duration-700 pointer-events-none rounded-xl",
                      isSelected ? "bg-emerald-500/25" : "bg-white/10"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                )}

                <span className="relative z-10 font-semibold truncate flex items-center gap-2">
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  {optLabel}
                </span>

                {hasVoted && (
                  <span className="relative z-10 font-mono text-xs font-bold text-stone-300 shrink-0">
                    {percentage}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Action Toolbar */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className="hover:scale-110 active:scale-90 transition-transform"
          >
            <Heart
              className={cn(
                "w-6 h-6 transition-colors",
                isLiked ? "fill-red-500 text-red-500" : "text-white hover:text-stone-300"
              )}
            />
          </button>

          <button
            onClick={() => navigate(`/polls/${poll.id}`)}
            className="hover:scale-110 active:scale-90 transition-transform"
          >
            <MessageCircle className="w-6 h-6 text-white hover:text-stone-300 -rotate-90" />
          </button>

          <button
            onClick={handleShare}
            className="hover:scale-110 active:scale-90 transition-transform"
          >
            <Send className="w-6 h-6 text-white hover:text-stone-300 -rotate-12" />
          </button>
        </div>

        <button
          onClick={() => setIsSaved(!isSaved)}
          className="hover:scale-110 active:scale-90 transition-transform"
        >
          <Bookmark
            className={cn(
              "w-6 h-6 transition-colors",
              isSaved ? "fill-white text-white" : "text-white hover:text-stone-300"
            )}
          />
        </button>
      </div>

      {/* 4. Metadata & Caption */}
      <div className="px-3 pb-3 space-y-1.5 text-xs">
        {/* Likes Count */}
        <div className="font-bold text-white pt-1">
          Liked by <span className="font-extrabold">skytsengel_006</span> and{" "}
          <span className="font-extrabold">{likesCount.toLocaleString()} others</span>
        </div>

        {/* Caption */}
        <div className="leading-snug">
          <Link
            to={poll.createdBy ? `/profile/${poll.createdBy}` : "/profile"}
            className="font-bold text-white hover:underline mr-1.5"
          >
            {authorHandle}
          </Link>
          <span className="text-stone-300">
            {poll.description || poll.title}
          </span>
        </div>

        {/* Comments Count */}
        <Link
          to={`/polls/${poll.id}`}
          className="text-stone-500 hover:text-stone-400 block pt-0.5"
        >
          View all {comments.length + 14} comments
        </Link>

        {/* Latest Comments */}
        <div className="space-y-0.5 pt-0.5">
          {comments.slice(-2).map((c, i) => (
            <div key={i} className="text-stone-300 truncate">
              <span className="font-semibold text-white mr-1.5">
                {i === 0 ? "stephin_shalu" : "vrinda_s"}
              </span>
              <span>{c}</span>
            </div>
          ))}
        </div>

        {/* Timestamp */}
        <div className="text-[10px] font-mono text-stone-500 uppercase tracking-widest pt-1">
          1 WEEK AGO
        </div>

        {/* Inline Comment Input Box */}
        <form
          onSubmit={handlePostComment}
          className="pt-2 mt-2 border-t border-[#262626] flex items-center justify-between"
        >
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-stone-500 focus:outline-none flex-1 pr-2"
          />
          <button
            type="submit"
            disabled={!commentInput.trim()}
            className="text-xs font-bold text-emerald-400 disabled:opacity-30 hover:text-emerald-300 transition-opacity"
          >
            Post
          </button>
        </form>
      </div>

      {/* Options Dialog Modal */}
      {showOptionsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowOptionsModal(false)}
        >
          <div
            className="w-full max-w-xs bg-[#262626] rounded-2xl overflow-hidden divide-y divide-[#363636] shadow-2xl text-center text-sm font-semibold"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowOptionsModal(false);
                handleShare();
              }}
              className="w-full py-3.5 text-emerald-400 hover:bg-white/5 active:bg-white/10"
            >
              {copiedLink ? "✓ Link Copied!" : "Share to Direct / Copy Link"}
            </button>
            <button
              onClick={() => {
                setShowOptionsModal(false);
                navigate(`/polls/${poll.id}`);
              }}
              className="w-full py-3.5 text-white hover:bg-white/5 active:bg-white/10"
            >
              Go to Prediction Post
            </button>
            <button
              onClick={() => setShowOptionsModal(false)}
              className="w-full py-3.5 text-stone-400 hover:bg-white/5 active:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
