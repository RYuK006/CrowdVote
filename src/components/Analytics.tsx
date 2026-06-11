import React, { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import { Layout } from "./Layout";
import { auth } from "../firebase";

export function Analytics() {
  const [pollVotes, setPollVotes] = useState<Record<string, Record<string, number>>>({});
  const [totalSignals, setTotalSignals] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(res => {
        if (!res) return;
        setPollVotes(res.pollVotes || {});
        setTotalSignals(res.totalSignals || 0);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <Layout user={auth.currentUser}>
      <div className="h-full flex flex-col relative pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="pt-8 pb-12 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-emerald-500 font-bold">
                <Activity className="w-6 h-6" />
                <span className="text-xs font-mono uppercase tracking-[0.4em]">Swarm Intelligence Telemetry</span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tighter text-[var(--text-primary)]">Predictive <span className="text-emerald-500 italic">Analytics</span></h1>
              <p className="text-[var(--text-secondary)] max-w-md font-mono text-sm leading-relaxed font-bold">
                Real-time visualization of generic polls.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
              <div className="glass px-6 py-4 rounded-3xl border border-[var(--glass-border)] flex flex-col items-center w-full sm:w-auto bg-[var(--glass-bg)]">
                <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest mb-1 font-bold">Total Signals</span>
                <span className="text-2xl font-bold text-[var(--text-primary)]">{totalSignals}</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 pt-8">
              {Object.entries(pollVotes).map(([pollId, options]) => (
                  <div key={pollId} className="glass p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-[var(--glass-border)] bg-[var(--card-bg)] shadow-xl">
                      <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-6">{pollId}</h3>
                      <div className="space-y-4">
                          {Object.entries(options).map(([opt, count]) => (
                              <div key={opt} className="flex items-center justify-between p-3 rounded-2xl bg-black/5 border border-[var(--glass-border)]">
                                  <span className="text-xs font-mono text-[var(--text-secondary)] font-bold">{opt}</span>
                                  <span className="text-xs font-bold text-[var(--text-primary)]">{count as number} Votes</span>
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
              {Object.keys(pollVotes).length === 0 && !loading && (
                  <div className="text-[var(--text-secondary)] font-mono text-sm uppercase tracking-widest">No votes cast yet.</div>
              )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
