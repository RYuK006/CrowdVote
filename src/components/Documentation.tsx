import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, BookOpen, ChevronRight } from 'lucide-react';

export function Documentation() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors selection:bg-emerald-500/30 font-sans">
      <header className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
            <ShieldCheck className="text-emerald-500 w-6 h-6" />
          </Link>
          <span className="font-bold text-lg tracking-tight hidden sm:block">CrowdVote <span className="text-emerald-500">AI</span></span>
        </div>
        <Link to="/" className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] hover:text-emerald-500 transition-colors uppercase tracking-widest font-bold">
          <ArrowLeft className="w-4 h-4" /> Return Home
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-24">
        <div className="flex flex-col gap-16">
          
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-emerald-500 font-mono text-sm uppercase tracking-widest font-bold bg-emerald-500/10 px-4 py-2 rounded-full">
              <BookOpen className="w-4 h-4" /> Official Docs
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">Documentation</h1>
            <p className="text-lg md:text-xl text-[var(--text-secondary)] font-medium max-w-2xl">
              Learn how to leverage the power of swarm intelligence and become an Elite Predictor node in the CrowdVote AI network.
            </p>
          </div>

          <div className="grid gap-12">
            <section className="space-y-6">
              <h2 className="text-2xl font-bold border-b border-[var(--glass-border)] pb-4">1. The Swarm Intelligence Model</h2>
              <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-[var(--text-secondary)]">
                <p>CrowdVote AI aggregates human predictions to form a decentralized predictive model. By weighting predictions based on past accuracy (AE points), the system achieves higher accuracy than any individual node.</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Wisdom of the Crowd:</strong> Aggregated median consensus.</li>
                  <li><strong>Algorithmic Weighting:</strong> High AE points users have a stronger impact on the final prediction model.</li>
                  <li><strong>Real-time Telemetry:</strong> Predictions adjust dynamically as new information becomes available before an event.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold border-b border-[var(--glass-border)] pb-4">2. Earning AE points</h2>
              <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-[var(--text-secondary)]">
                <p>AE points are the reputation currency of CrowdVote AI. They determine your standing on the Leaderboard and the weight of your future votes.</p>
                <div className="glass p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--glass-border)] space-y-3">
                  <div className="flex items-center gap-3">
                    <ChevronRight className="text-emerald-500 w-5 h-5" />
                    <span><strong>Correct Prediction:</strong> +100 to +500 AE points (based on odds)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ChevronRight className="text-red-500 w-5 h-5" />
                    <span><strong>Incorrect Prediction:</strong> -50 AE points</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold border-b border-[var(--glass-border)] pb-4">3. AI Autonomous Agent</h2>
              <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-[var(--text-secondary)]">
                <p>The META tab features an Autonomous Predictor. When you enable the AI Agent, it analyzes your past voting history and automatically votes on new polls matching your historical profile.</p>
                <p><em>Note: The AI Agent is currently under development and operates in simulation mode only.</em></p>
              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
