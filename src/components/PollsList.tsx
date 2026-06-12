import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ListPlus, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Layout } from "./Layout";
import { auth } from "../firebase";
import { Poll } from "../types";
import { cn } from "../lib/utils";

export function PollsList() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<Record<string, any>>({});

  useEffect(() => {
    fetch("/api/polls")
      .then((res) => res.json())
      .then((data) => {
        setPolls(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    auth.currentUser.getIdToken().then((token) => {
      fetch("/api/user/votes", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setVotes(data))
        .catch(console.error);
    });
  }, [auth.currentUser]);

  return (
    <Layout user={auth.currentUser}>
      <div className="h-full flex flex-col relative pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="pt-8 pb-12 space-y-4">
          <div className="flex items-center gap-2 text-emerald-500">
            <ListPlus className="w-5 h-5" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold">Available Polls</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter text-[var(--text-primary)]">
            Explore <span className="text-emerald-500 italic">Polls</span>
          </h1>
          <p className="text-[var(--text-secondary)] font-medium max-w-2xl">
            Choose a poll to cast your vote and influence the crowd prediction. Your vote shapes the neural mesh.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center animate-pulse text-[var(--text-secondary)] font-mono text-[10px] uppercase tracking-widest">
            Loading Polls...
          </div>
        ) : polls.length === 0 ? (
          <div className="py-20 text-center text-[var(--text-secondary)] font-mono text-[10px] uppercase tracking-widest">
            No polls available.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...polls].sort((a, b) => {
              const aVoted = !!votes[a.id];
              const bVoted = !!votes[b.id];
              const aExpired = a.lockAt ? new Date() > new Date(a.lockAt) : false;
              const bExpired = b.lockAt ? new Date() > new Date(b.lockAt) : false;
              const aLocked = aVoted || aExpired || a.status === "closed";
              const bLocked = bVoted || bExpired || b.status === "closed";

              if (aLocked && !bLocked) return 1;
              if (!aLocked && bLocked) return -1;

              const timeA = new Date(a.lockAt || 0).getTime();
              const timeB = new Date(b.lockAt || 0).getTime();
              return timeA - timeB;
            }).map((poll) => {
              const hasVoted = !!votes[poll.id];
              const isExpired = poll.lockAt ? new Date() > new Date(poll.lockAt) : false;
              return (
                <Link
                  key={poll.id}
                  to={`/polls/${poll.id}`}
                  className={cn(
                    "group relative p-8 rounded-[32px] border transition-all duration-300 overflow-hidden flex flex-col justify-between h-[240px]",
                    hasVoted
                      ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                      : isExpired
                      ? "bg-gray-500/10 border-gray-500/30 opacity-75"
                      : "bg-[var(--glass-bg)] border-[var(--glass-border)] hover:border-emerald-500/30 hover:bg-[var(--glass-border)]"
                  )}
                >
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="px-3 py-1 rounded-full bg-black/10 border border-[var(--glass-border)] text-[9px] font-mono text-[var(--text-secondary)] uppercase font-bold tracking-widest">
                        {poll.category || "General"}
                      </div>
                      {hasVoted ? (
                        <div className="flex items-center gap-1 text-emerald-500">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-[9px] font-mono uppercase font-bold tracking-wider">Voted</span>
                        </div>
                      ) : isExpired ? (
                        <div className="flex items-center gap-1 text-gray-500">
                          <span className="text-[9px] font-mono uppercase font-bold tracking-wider">LOCKED</span>
                        </div>
                      ) : null}
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] leading-snug group-hover:text-emerald-500 transition-colors">
                      {poll.title}
                    </h2>
                    <p className="text-[var(--text-secondary)] text-sm line-clamp-2">
                      {poll.matchTime ? `Match Time: ${poll.matchTime}` : poll.description}
                    </p>
                  </div>
                  
                  <div className="absolute bottom-6 right-6 p-2 rounded-full bg-[var(--glass-border)] group-hover:bg-emerald-500 text-[var(--text-primary)] group-hover:text-white transition-colors duration-300">
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
