import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Swords, Trophy, BarChart3, ArrowRight, Sun, Moon, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export function Landing() {
  const { theme, toggleTheme } = useTheme();
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden selection:bg-emerald-500/30 transition-colors">
      {/* Top Header Toggle */}
      <header className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex justify-end items-center max-w-7xl mx-auto right-0">
        <button 
          onClick={(e) => toggleTheme(e)}
          className="p-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:emerald-glow transition-all active:scale-90 group backdrop-blur-xl"
          title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === 'light' ? (
            <Sun className="w-6 h-6 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="w-6 h-6 text-emerald-400 group-hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-8 max-w-7xl mx-auto">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full -z-10" />

        <div className="flex flex-col items-center text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium backdrop-blur-md"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Decentralized Consensus Protocol</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl"
          >
            The Future of <span className="text-gradient">Collective Intelligence</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl"
          >
            CrowdVote harnesses swarm intelligence through dynamic polling, prediction markets, and AI-driven consensus.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4"
          >
            <Link 
              to="/feed" 
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg transition-all emerald-glow hover:scale-105"
            >
              <span>Explore Terminal</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/signin" 
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] hover:bg-white/10 font-bold text-lg transition-all backdrop-blur-md hover:scale-105"
            >
              Connect Node
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-8 max-w-7xl mx-auto border-t border-[var(--glass-border)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-[var(--card-bg)] border border-[var(--glass-border)] space-y-4 hover:border-emerald-500/50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Swords className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Consensus Battles</h3>
            <p className="text-[var(--text-secondary)]">Stake convictions in dynamic versus battles and multidimensional scalar forecasts.</p>
          </div>

          <div className="p-8 rounded-3xl bg-[var(--card-bg)] border border-[var(--glass-border)] space-y-4 hover:border-emerald-500/50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Predictive Analytics</h3>
            <p className="text-[var(--text-secondary)]">Real-time sentiment telemetry and swarm intelligence calibration across multiple vectors.</p>
          </div>

          <div className="p-8 rounded-3xl bg-[var(--card-bg)] border border-[var(--glass-border)] space-y-4 hover:border-emerald-500/50 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Grandmaster Leaderboard</h3>
            <p className="text-[var(--text-secondary)]">Ascend global forecaster matrices through calibrated brier scores and accuracy ratios.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-[var(--glass-border)] text-center text-sm text-[var(--text-secondary)]">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-4">
          <div>CrowdVote AI © 2026. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setShowPrivacyPolicy(true)}
              className="hover:text-emerald-500 transition-colors"
            >
              Privacy Policy
            </button>
            <Link to="/feed" className="hover:text-emerald-500 transition-colors">Terminal</Link>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-3xl p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => setShowPrivacyPolicy(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-2xl font-bold mb-4">Privacy Policy</h2>
            <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
              <p>At CrowdVote AI, we prioritize user anonymity and cryptographic consensus integrity.</p>
              <h4 className="text-base font-semibold text-[var(--text-primary)]">1. Data Collection</h4>
              <p>We do not track personally identifiable metrics. Predictions, votes, and signals are anchored anonymously or via cryptographic node identifiers.</p>
              <h4 className="text-base font-semibold text-[var(--text-primary)]">2. Neural Consensus</h4>
              <p>Signal metrics are aggregated to construct unbiased decentralized probability distributions.</p>
              <h4 className="text-base font-semibold text-[var(--text-primary)]">3. Security</h4>
              <p>All client-server telemetry is encrypted in transit and at rest using modern protocol standards.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
