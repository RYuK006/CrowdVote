import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Info, Lock, Trophy, RefreshCw, Database } from "lucide-react";
import { cn } from "../lib/utils";
import { auth } from "../firebase";
import { Layout } from "./Layout";
import { useTheme } from "../context/ThemeContext";
import { Poll } from "../types";

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
        <div className="flex items-center justify-center h-full text-emerald-500 font-mono tracking-widest uppercase text-sm animate-pulse">
          Loading Poll Data...
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

  return (
    <Layout user={auth.currentUser}>
      <div className="h-full flex flex-col relative pb-20 px-4 sm:px-8 max-w-4xl mx-auto w-full">
        <button 
          onClick={() => navigate('/polls')}
          className="flex items-center gap-2 mt-8 mb-4 text-[var(--text-secondary)] hover:text-emerald-500 transition-colors w-fit font-mono text-[10px] uppercase font-bold tracking-widest"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Polls
        </button>

        <div className="glass p-8 sm:p-12 rounded-[40px] border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-xl mt-4">
          <div className="space-y-4 mb-10">
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-500 font-extrabold uppercase tracking-widest">
              {poll.category || "General Poll"}
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tighter text-[var(--text-primary)]">{poll.title}</h1>
            {poll.matchTime && (
              <p className="text-emerald-500 font-mono text-sm font-bold uppercase tracking-widest">
                Match Time: {poll.matchTime}
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
                  {poll.options.map((option, idx) => {
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
                                      : "bg-[var(--glass-bg)] border-[var(--glass-border)] hover:border-emerald-500/30",
                                  isDisabled && "opacity-80 cursor-not-allowed"
                              )}
                          >
                              <div className="absolute top-0 left-0 w-1.5 h-full transition-transform duration-500 bg-[var(--glass-border)] group-hover:bg-emerald-500/50" />
                              <div className="flex items-center gap-3 w-full">
                                  <div className="flex-1 min-w-0 pb-1 pl-2">
                                      <h5 className="text-lg font-bold tracking-tight leading-snug text-[var(--text-primary)]">{option.text || option.name}</h5>
                                      {poll.optionScores !== undefined && (
                                        <div className="text-xs font-mono text-[var(--text-secondary)] mt-1 font-bold">
                                          Weight: {totalPollScore > 0 ? (((poll.optionScores[option.id] || 0) / totalPollScore) * 100).toFixed(1) : "0.0"}%
                                        </div>
                                      )}
                                  </div>
                              </div>
                              {isSelected && (
                                  <div className="absolute top-1/2 -translate-y-1/2 right-6">
                                      <motion.div 
                                         layoutId="active-dot"
                                         className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)]" 
                                      />
                                  </div>
                              )}
                          </button>
                      );
                  })}
              </div>
            </div>

            {vote?.selectedOption && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-[0.4em] font-extrabold">Your Conviction Level</h4>
                    <div className="flex items-end gap-3">
                      <span className={cn(
                        "text-[10px] font-mono uppercase font-extrabold mb-1",
                        isDark ? "text-emerald-500" : "text-emerald-700"
                      )}>
                        { vote.confidence < 40 ? "LOW" : vote.confidence < 80 ? "MEDIUM" : "HIGH" }
                      </span>
                      <span className={cn(
                        "text-3xl sm:text-4xl font-bold font-mono tracking-tighter italic",
                        isDark ? "text-emerald-500" : "text-emerald-700"
                      )}>{vote.confidence}%</span>
                    </div>
                </div>
                <div className="relative group">
                    <input 
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={vote.confidence}
                        onChange={(e) => handleConfidence(parseInt(e.target.value))}
                        disabled={locked || poll.status === "closed"}
                        className={cn(
                            "w-full h-3 rounded-full appearance-none cursor-pointer accent-emerald-500 disabled:opacity-20 transition-all font-bold",
                            isDark ? "bg-white/10" : "bg-black/10"
                        )}
                    />
                </div>
              </motion.div>
            )}

            <div className="pt-4">
                {(() => {
                  const isExpired = poll.lockAt ? new Date() > new Date(poll.lockAt) : false;
                  
                  if (locked) {
                    return (
                      <div className="w-full py-8 sm:py-10 rounded-[32px] bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center gap-2">
                          <Lock className="w-8 h-8 text-emerald-700 mb-2" />
                          <span className="text-xl sm:text-2xl font-bold text-emerald-700 tracking-[0.2em] uppercase italic">Vote Submitted</span>
                          <p className="text-[10px] font-mono text-emerald-800 uppercase tracking-[0.2em] font-extrabold">Synched to Neural Mesh</p>
                      </div>
                    );
                  }
                  if (isExpired) {
                    return (
                      <div className="w-full py-8 sm:py-10 rounded-[32px] bg-gray-500/10 border border-gray-500/30 flex flex-col items-center justify-center gap-2">
                          <Lock className="w-8 h-8 text-gray-500 mb-2" />
                          <span className="text-xl sm:text-2xl font-bold text-gray-500 tracking-[0.2em] uppercase italic">MATCH STARTED</span>
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
                                ? cn(
                                    "bg-[var(--glass-bg)] border-2 border-dashed opacity-60 grayscale cursor-not-allowed",
                                    isDark ? "border-[var(--glass-border)] text-[var(--text-secondary)]" : "border-slate-400 text-slate-700 font-extrabold"
                                  )
                                : "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] hover:scale-[1.01] ring-1 ring-white/20"
                        )}
                    >
                        {saving ? (
                            <RefreshCw className="w-7 h-7 animate-spin" />
                        ) : (
                            <>
                                <Database className={cn(
                                    "w-6 h-6 transition-transform duration-300",
                                    vote?.selectedOption ? "group-hover:scale-110" : ""
                                )} />
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
      </div>
    </Layout>
  );
}
