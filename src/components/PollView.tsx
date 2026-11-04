import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ChevronLeft, Sparkles, ExternalLink, ShieldCheck, 
  Clock, Lock, Share2, CheckCircle2, TrendingUp 
} from "lucide-react";
import { cn } from "../lib/utils";
import { auth } from "../firebase";
import { Layout } from "./Layout";
import { Poll } from "../types";
import { RoastRoomCouncil } from "./RoastRoomCouncil";
import { Versus } from "./formats/Versus";
import { Choice } from "./formats/Choice";
import { Scale } from "./formats/Scale";
import { Rank } from "./formats/Rank";
import { Open } from "./formats/Open";
import { Debate } from "./debate/Debate";

export function PollView() {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOption, setVotedOption] = useState<any>(null);
  const [userFaction, setUserFaction] = useState<string | undefined>();
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchPoll = async () => {
    if (!pollId) return;
    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : null;

      const res = await fetch(`/api/polls/${pollId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.ok) {
        const data = await res.json();
        setPoll(data);
      }
    } catch (err) {
      console.error("Failed to load poll:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoll();
  }, [pollId]);

  useEffect(() => {
    if (!auth.currentUser || !pollId) return;
    auth.currentUser.getIdToken().then(token => {
      fetch('/api/user/votes', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data[pollId]) {
          setHasVoted(true);
          setVotedOption(data[pollId].selectedOption);
          setUserFaction(data[pollId].faction);
        }
      })
      .catch(console.error);
    });
  }, [auth.currentUser, pollId]);

  const handleVote = async (optionValue: any) => {
    if (!pollId || !auth.currentUser) {
      navigate("/signin");
      return;
    }

    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pollId,
          selectedOption: optionValue,
          confidence: 100
        })
      });

      if (res.ok) {
        const data = await res.json();
        setHasVoted(true);
        setVotedOption(optionValue);
        if (data.faction) setUserFaction(data.faction);
        if (data.poll) setPoll(data.poll);
      }
    } catch (err) {
      console.error("Voting failed:", err);
    }
  };

  const handleOpenCandidateSubmit = async (text: string) => {
    if (!pollId || !auth.currentUser) return;
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(`/api/polls/${pollId}/open-submit`, {
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
        setPoll(prev => prev ? ({
          ...prev,
          openSubmissions: [...(prev.openSubmissions || []), data.submission]
        }) : null);
        setHasVoted(true);
        setVotedOption(data.submission.id);
        setUserFaction(data.submission.text);
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <Layout user={auth.currentUser}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse font-mono text-xs tracking-widest text-emerald-500">
            CONNECTING TO CONSENSUS NODE...
          </div>
        </div>
      </Layout>
    );
  }

  if (!poll) {
    return (
      <Layout user={auth.currentUser}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <p className="text-white font-bold text-xl">Prediction Terminal Not Found</p>
          <button
            onClick={() => navigate('/feed')}
            className="px-5 py-2 bg-emerald-500 text-black font-bold text-xs rounded-xl"
          >
            Return to Feed
          </button>
        </div>
      </Layout>
    );
  }

  const format = poll.format || "choice";
  const isBlindMasked = Boolean((poll as any).isBlindMasked && !hasVoted);

  return (
    <Layout user={auth.currentUser}>
      <div className="pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mt-6 mb-4">
          <button 
            onClick={() => navigate('/feed')}
            className="flex items-center gap-1.5 text-stone-400 hover:text-emerald-400 transition-colors font-mono text-xs uppercase font-bold tracking-wider"
          >
            <ChevronLeft className="w-4 h-4" /> Feed
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-xs font-mono transition-colors border border-white/5"
          >
            {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Copied" : "Share"}</span>
          </button>
        </div>

        {/* Sponsored Banner */}
        {poll.isSponsored && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-black font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-amber-400">
                    Sponsored Market
                  </span>
                  <span className="font-bold text-sm text-white">
                    {poll.sponsorName}
                  </span>
                </div>
                {poll.sponsorReward && (
                  <p className="text-xs font-mono text-amber-300 font-semibold mt-0.5">
                    🎁 Reward: {poll.sponsorReward}
                  </p>
                )}
              </div>
            </div>

            {poll.sponsorUrl && (
              <a
                href={poll.sponsorUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors border border-amber-500/30 whitespace-nowrap"
              >
                Visit Partner <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Main Poll Terminal Container */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0a0d14] border border-[#1d222e] shadow-2xl flex flex-col gap-6">
          {/* Header Metadata */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                {format.toUpperCase()}
              </span>

              {poll.category && (
                <span className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-stone-400 text-xs font-mono">
                  {poll.category}
                </span>
              )}

              {poll.status && (
                <span className="px-2.5 py-0.5 rounded-lg bg-stone-900 border border-white/10 text-stone-300 text-xs font-mono uppercase">
                  {poll.status}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              {poll.title}
            </h1>

            {poll.description && (
              <p className="text-sm text-stone-300 leading-relaxed">
                {poll.description}
              </p>
            )}

            {/* Timing / Countdown */}
            {poll.lockAt && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-stone-400 mt-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Locks: {new Date(poll.lockAt).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Interactive Format Engine */}
          <div className="pt-2 border-t border-[#181d28]">
            {format === "versus" ? (
              <Versus
                pollId={poll.id}
                leftSide={poll.versusLeft}
                rightSide={poll.versusRight}
                hasVoted={hasVoted}
                votedOption={votedOption}
                isBlindMasked={isBlindMasked}
                onVote={handleVote}
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
                votedOption={votedOption}
                isBlindMasked={isBlindMasked}
                onVote={handleVote}
              />
            ) : format === "rank" ? (
              <Rank
                pollId={poll.id}
                options={poll.options}
                rankedItems={poll.rankedItems}
                hasVoted={hasVoted}
                votedOption={votedOption}
                isBlindMasked={isBlindMasked}
                onVote={handleVote}
              />
            ) : format === "open" ? (
              <Open
                pollId={poll.id}
                submissions={poll.openSubmissions}
                hasVoted={hasVoted}
                votedOption={votedOption}
                onVote={handleVote}
                onOpenSubmit={handleOpenCandidateSubmit}
              />
            ) : (
              <Choice
                pollId={poll.id}
                options={poll.options || []}
                hasVoted={hasVoted}
                votedOption={votedOption}
                isBlindMasked={isBlindMasked}
                onVote={handleVote}
              />
            )}
          </div>

          {/* Faction-badged Debate Arena */}
          <Debate
            pollId={poll.id}
            pollTitle={poll.title}
            userFaction={userFaction}
          />
        </div>

        {/* AI Council of Advisors */}
        <div className="mt-8">
          <RoastRoomCouncil poll={poll} />
        </div>
      </div>
    </Layout>
  );
}
