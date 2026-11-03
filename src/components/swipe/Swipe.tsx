import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ChevronUp, ChevronDown, Heart, MessageSquare, Share2, 
  Sparkles, CheckCircle2, TrendingUp, Trophy, ArrowRight, 
  X, ShieldCheck, Flame, Lock 
} from "lucide-react";
import { auth } from "../../firebase";
import { Layout } from "../Layout";
import { Poll } from "../../types";
import { cn } from "../../lib/utils";
import { Versus } from "../formats/Versus";
import { Choice } from "../formats/Choice";
import { Scale } from "../formats/Scale";
import { Rank } from "../formats/Rank";
import { Open } from "../formats/Open";
import { Debate } from "../debate/Debate";

export function Swipe() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDebateOpen, setIsDebateOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : null;
      const res = await fetch("/api/polls?limit=40", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setPolls(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load polls for Swipe feed:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentPoll = polls[currentIndex];

  const handleNext = () => {
    if (currentIndex < polls.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsDebateOpen(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsDebateOpen(false);
    }
  };

  // Keyboard navigation: arrow up and arrow down
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") handleNext();
      if (e.key === "ArrowUp" || e.key === "k") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, polls.length]);

  const handleVote = async (optionValue: any) => {
    if (!currentPoll || !auth.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pollId: currentPoll.id,
          selectedOption: optionValue,
          confidence: 100
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPolls(prev =>
          prev.map((p, idx) =>
            idx === currentIndex
              ? { ...p, ...(data.poll || {}), hasVoted: true, votedOption: optionValue, votedFaction: data.faction }
              : p
          )
        );
      }
    } catch (err) {
      console.error("Swipe voting error:", err);
    }
  };

  const handleOpenCandidateSubmit = async (text: string) => {
    if (!currentPoll || !auth.currentUser) return;
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(`/api/polls/${currentPoll.id}/open-submit`, {
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
        setPolls(prev =>
          prev.map((p, idx) =>
            idx === currentIndex
              ? {
                  ...p,
                  openSubmissions: [...(p.openSubmissions || []), data.submission],
                  hasVoted: true,
                  votedOption: data.submission.id
                }
              : p
          )
        );
      }
    }
  };

  const handleShare = () => {
    if (!currentPoll) return;
    const url = `${window.location.origin}/polls/${currentPoll.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <Layout user={auth.currentUser}>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="animate-pulse font-mono text-xs tracking-widest text-emerald-400">
            LOADING RAPID SWIPE FEED...
          </div>
        </div>
      </Layout>
    );
  }

  if (polls.length === 0) {
    return (
      <Layout user={auth.currentUser}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <p className="text-white font-bold text-lg">No active polls in Swipe queue</p>
          <button
            onClick={() => navigate("/polls")}
            className="px-4 py-2 bg-emerald-500 text-black font-bold text-xs rounded-xl"
          >
            Explore Feed
          </button>
        </div>
      </Layout>
    );
  }

  const format = currentPoll.format || "choice";
  const isBlindMasked = Boolean((currentPoll as any).isBlindMasked && !currentPoll.hasVoted);

  return (
    <Layout user={auth.currentUser}>
      <div 
        ref={containerRef}
        className="w-full max-w-xl mx-auto min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center px-3 sm:px-4 py-4 relative"
      >
        {/* Swipe Card Shell */}
        <div className="w-full bg-[#0a0d14] border border-[#1d222e] rounded-3xl p-5 sm:p-7 shadow-2xl relative flex flex-col justify-between min-h-[580px] max-h-[85vh] overflow-y-auto">
          {/* Top Bar: Progress Indicator & Author */}
          <div className="flex items-center justify-between pb-3 border-b border-[#181d29] gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                {format.toUpperCase()}
              </span>
              <span className="text-[10px] font-mono text-stone-400">
                Poll {currentIndex + 1} of {polls.length}
              </span>
            </div>

            {/* Clapperboard Leaderboard Link Motif */}
            <Link
              to="/leaderboard"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-mono transition-colors border border-amber-500/20"
              title="Leaderboard & Top Predictions"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Ranks</span>
            </Link>
          </div>

          {/* Central Content */}
          <div className="my-auto py-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {currentPoll.title}
              </h2>
              {currentPoll.description && (
                <p className="text-xs text-stone-300 line-clamp-3 leading-relaxed">
                  {currentPoll.description}
                </p>
              )}
            </div>

            {/* Format Component */}
            <div className="py-2">
              {format === "versus" ? (
                <Versus
                  pollId={currentPoll.id}
                  leftSide={currentPoll.versusLeft}
                  rightSide={currentPoll.versusRight}
                  hasVoted={currentPoll.hasVoted}
                  votedOption={currentPoll.votedOption}
                  isBlindMasked={isBlindMasked}
                  onVote={handleVote}
                />
              ) : format === "scale" ? (
                <Scale
                  pollId={currentPoll.id}
                  scaleMin={currentPoll.scaleMin}
                  scaleMax={currentPoll.scaleMax}
                  scaleUnit={currentPoll.scaleUnit}
                  scaleAverage={currentPoll.scaleAverage}
                  scaleVotesCount={currentPoll.scaleVotesCount}
                  hasVoted={currentPoll.hasVoted}
                  votedOption={currentPoll.votedOption}
                  isBlindMasked={isBlindMasked}
                  onVote={handleVote}
                />
              ) : format === "rank" ? (
                <Rank
                  pollId={currentPoll.id}
                  options={currentPoll.options}
                  rankedItems={currentPoll.rankedItems}
                  hasVoted={currentPoll.hasVoted}
                  votedOption={currentPoll.votedOption}
                  isBlindMasked={isBlindMasked}
                  onVote={handleVote}
                />
              ) : format === "open" ? (
                <Open
                  pollId={currentPoll.id}
                  submissions={currentPoll.openSubmissions}
                  hasVoted={currentPoll.hasVoted}
                  votedOption={currentPoll.votedOption}
                  onVote={handleVote}
                  onOpenSubmit={handleOpenCandidateSubmit}
                />
              ) : (
                <Choice
                  pollId={currentPoll.id}
                  options={currentPoll.options || []}
                  hasVoted={currentPoll.hasVoted}
                  votedOption={currentPoll.votedOption}
                  isBlindMasked={isBlindMasked}
                  onVote={handleVote}
                />
              )}
            </div>
          </div>

          {/* Bottom Card Controls & Action Hub */}
          <div className="pt-3 border-t border-[#181d29] flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Prev */}
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={handlePrev}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-stone-300 hover:text-white transition-all"
                title="Previous (Up Arrow)"
              >
                <ChevronUp className="w-5 h-5" />
              </button>

              {/* Next */}
              <button
                type="button"
                disabled={currentIndex === polls.length - 1}
                onClick={handleNext}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-stone-300 hover:text-white transition-all"
                title="Next (Down Arrow)"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {/* Debate Drawer Toggle */}
              <button
                type="button"
                onClick={() => setIsDebateOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold transition-all border border-emerald-500/30"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Debate</span>
              </button>

              {/* Share */}
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white transition-all"
                title="Share Signal"
              >
                {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Slide-over Debate Drawer */}
        {isDebateOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-lg bg-[#0a0d14] border-l border-[#1d222e] h-full p-6 flex flex-col justify-between overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-[#1d222e]">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                    Faction Discourse
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDebateOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 text-stone-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 my-4">
                <Debate
                  pollId={currentPoll.id}
                  pollTitle={currentPoll.title}
                  userFaction={currentPoll.votedFaction}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
