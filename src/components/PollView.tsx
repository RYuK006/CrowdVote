import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Info, Lock, Trophy, RefreshCw, Database, Sparkles, ExternalLink, Flame } from "lucide-react";
import { cn } from "../lib/utils";
import { auth } from "../firebase";
import { Layout } from "./Layout";
import { useTheme } from "../context/ThemeContext";
import { Poll } from "../types";
import { RoastRoomCouncil } from "./RoastRoomCouncil";

export function PollView() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [vote, setVote] = useState<{ selectedOption: string, confidence: number } | null>(null);
  const [locked, setLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/polls/${pollId}`)
      .then(r => r.json())
      .then(data => {
        setPoll(data);
        setLoading(false);
      })
      .catch(console.error);
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
          setVote({
            selectedOption: data[pollId].selectedOption,
            confidence: data[pollId].confidence
          });
          setLocked(true);
        }
      })
      .catch(console.error);
    });
  }, [auth.currentUser, pollId]);

  const handleSelectOption = (optionId: string) => {
    if (locked) return;
    setVote(prev => ({
      selectedOption: optionId,
      confidence: prev?.confidence || 50
    }));
  };

  const handleConfidence = (val: number) => {
    if (locked) return;
    setVote(prev => ({
      ...prev!,
      confidence: val
    }));
  };

  const handleSave = async () => {
    if (!pollId || !auth.currentUser || !vote?.selectedOption) return;

    setSaving(true);
    setMessage(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/vote', {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          pollId,
          selectedOption: vote.selectedOption,
          confidence: vote.confidence
        })
      });
      if (!res.ok) throw new Error("Failed to save via API");
      setLocked(true);
      setMessage({ type: "success", text: "Vote locked in swarm via Backend." });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to sync signal." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout user={auth.currentUser}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse font-mono text-sm tracking-widest text-[var(--text-secondary)]">
            FETCHING SWARM NODE...
          </div>
        </div>
      </Layout>
    );
  }

  if (!poll) {
    return (
      <Layout user={auth.currentUser}>
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <p className="text-[var(--text-primary)] font-bold text-2xl">Poll not found</p>
          <button onClick={() => navigate('/polls')} className="px-6 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl font-bold">Return to Polls</button>
        </div>
      </Layout>
    );
  }

  const totalPollScore = poll?.optionScores ? Object.values(poll.optionScores).reduce((a, b) => a + b, 0) : 0;
  const isSponsored = Boolean(poll.isSponsored);

  return (
    <Layout user={auth.currentUser}>
      <div className="h-full flex flex-col relative pb-20 px-4 sm:px-8 max-w-4xl mx-auto w-full">
        <button 
          onClick={() => navigate('/polls')}
          className="flex items-center gap-2 mt-8 mb-4 text-[var(--text-secondary)] hover:text-emerald-500 transition-colors w-fit font-mono text-[10px] uppercase font-bold tracking-widest"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Polls
        </button>

        {/* Sponsored Banner if applicable */}
        {isSponsored && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-black">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-amber-400">
                    Sponsored Prediction Poll
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

        {/* Main Poll Card */}
        <div className={cn(
          "glass p-8 sm:p-12 rounded-[40px] border shadow-xl mt-2",
          isSponsored
            ? "border-amber-500/30 bg-gradient-to-b from-amber-500/5 via-[var(--glass-bg)] to-transparent"
            : "border-[var(--glass-border)] bg-[var(--glass-bg)]"
        )}>
          <div className="space-y-4 mb-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "inline-block px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest border",
                isSponsored
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              )}>
                {poll.category || "General Poll"}
              </span>

              {poll.tags && poll.tags.map((tag: string) => (
                <span key={tag} className="text-[9px] font-mono text-[var(--text-secondary)] px-2 py-0.5 rounded-full bg-black/10">
                  #{tag}
                </span>
              ))}
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tighter text-[var(--text-primary)]">{poll.title}</h1>
            {poll.matchTime && (
              <p className="text-emerald-500 font-mono text-sm font-bold uppercase tracking-widest">
                Scheduled: {poll.matchTime}
              </p>
            )}
            <p className="text-[var(--text-secondary)] text-lg">{poll.description}</p>
          </div>

          <div className="space-y-12">
            <div className="space-y-6">
              <h4 className={cn(
                  "text-[10px] font-mono uppercase tracking-[0.4em] font-extrabold",
                  isDark ? "text-emerald-400" : "text-emerald-700"
              )}>Choose Your Option</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {poll.options.map((option) => {
                      const isSelected = vote?.selectedOption === option.id;
                      const isExpired = poll.lockAt ? new Date() > new Date(poll.lockAt) : false;
                      const isDisabled = locked || poll.status === "closed" || isExpired;
                      return (
                          <button
                              key={option.id}
                              onClick={() => handleSelectOption(option.id)}
                              disabled={isDisabled}
                              className={cn(
                                  "p-5 rounded-[24px] border transition-all duration-500 text-left relative overflow-hidden group flex flex-col gap-4 shadow-sm",
                                  isSelected
                                      ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]"
                                      : isDisabled
                                      ? "opacity-60 cursor-not-allowed bg-black/5 border-[var(--glass-border)]"
                                      : "bg-black/5 hover:bg-black/10 border-[var(--glass-border)] hover:border-emerald-500/30"
                              )}
                          >
                              <div className="flex items-center justify-between w-full">
                                  <span className="font-bold text-lg text-[var(--text-primary)] leading-tight">{option.text || option.name}</span>
                                  {isSelected && (
                                      <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                                  )}
                              </div>

                              {totalPollScore > 0 && poll.optionScores && (
                                <div className="w-full space-y-1 mt-auto">
                                  <div className="flex justify-between text-[10px] font-mono text-[var(--text-secondary)]">
                                    <span>Consensus Weight</span>
                                    <span>{Math.round(((poll.optionScores[option.id] || 0) / totalPollScore) * 100)}%</span>
                                  </div>
                                  <div className="w-full h-1.5 rounded-full bg-black/10 overflow-hidden">
                                    <div
                                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                      style={{ width: `${Math.round(((poll.optionScores[option.id] || 0) / totalPollScore) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                          </button>
                      );
                  })}
              </div>
            </div>

            {/* Confidence Slider */}
            {vote?.selectedOption && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 p-6 rounded-3xl bg-[var(--glass-border)]/30 border border-[var(--glass-border)]"
              >
                <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-mono uppercase tracking-widest font-extrabold text-[var(--text-primary)]">Confidence Level</h4>
                      <p className="text-xs text-[var(--text-secondary)] font-medium">Higher confidence magnifies your accuracy weight in swarm consensus.</p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "text-[10px] font-mono uppercase font-extrabold mb-1",
                        isDark ? "text-emerald-500" : "text-emerald-700"
                      )}>
                        { vote.confidence < 40 ? "LOW" : vote.confidence < 80 ? "MEDIUM" : "HIGH" }
                      </span>
                      <div className="text-3xl font-bold font-mono tracking-tighter text-emerald-500">{vote.confidence}%</div>
                    </div>
                </div>

                <input 
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={vote.confidence}
                  onChange={(e) => handleConfidence(parseInt(e.target.value))}
                  disabled={locked || poll.status === "closed"}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer accent-emerald-500 disabled:opacity-20 transition-all font-bold bg-black/10"
                />
              </motion.div>
            )}

            {/* Lock in Vote Button */}
            <div className="pt-4">
                {(() => {
                  const isExpired = poll.lockAt ? new Date() > new Date(poll.lockAt) : false;
                  
                  if (locked) {
                    return (
                      <div className="w-full py-8 sm:py-10 rounded-[32px] bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center gap-2">
                          <Lock className="w-8 h-8 text-emerald-600 mb-2" />
                          <span className="text-xl sm:text-2xl font-bold text-emerald-600 tracking-[0.2em] uppercase italic">Vote Submitted</span>
                          <p className="text-[10px] font-mono text-emerald-700 uppercase tracking-[0.2em] font-extrabold">Synched to Neural Mesh</p>
                      </div>
                    );
                  }
                  if (isExpired) {
                    return (
                      <div className="w-full py-8 sm:py-10 rounded-[32px] bg-gray-500/10 border border-gray-500/30 flex flex-col items-center justify-center gap-2">
                          <Lock className="w-8 h-8 text-gray-500 mb-2" />
                          <span className="text-xl sm:text-2xl font-bold text-gray-500 tracking-[0.2em] uppercase italic">TIME EXPIRED</span>
                          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] font-extrabold">Poll Locked</p>
                      </div>
                    );
                  }
                  return (
                    <button 
                        onClick={handleSave}
                        disabled={saving || !vote?.selectedOption || poll.status === "closed"}
                        className={cn(
                            "w-full py-6 sm:py-8 rounded-[32px] font-bold text-xl transition-all duration-300 flex items-center justify-center gap-4 relative overflow-hidden group active:scale-[0.98]",
                            !vote?.selectedOption || saving || poll.status === "closed"
                                ? "bg-[var(--glass-bg)] border-2 border-dashed opacity-60 grayscale cursor-not-allowed border-[var(--glass-border)] text-[var(--text-secondary)]"
                                : "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] hover:scale-[1.01] ring-1 ring-white/20"
                        )}
                    >
                        {saving ? (
                            <RefreshCw className="w-7 h-7 animate-spin" />
                        ) : (
                            <>
                                <Database className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                                {poll.status === "closed" ? "POLL CLOSED" : "LOCK IN VOTE"}
                            </>
                        )}
                    </button>
                  );
                })()}
            </div>

            {message && (
                <div className={cn(
                    "p-4 rounded-xl text-center text-sm font-bold animate-in fade-in slide-in-from-bottom-2",
                    message.type === 'success' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                )}>
                    {message.text}
                </div>
            )}
          </div>
        </div>

        {/* Roast Room Council Debate Section */}
        <RoastRoomCouncil poll={poll} />
      </div>
    </Layout>
  );
}
