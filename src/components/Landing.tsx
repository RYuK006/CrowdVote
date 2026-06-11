import { motion } from "framer-motion";
import { ShieldCheck, Swords, Trophy, BarChart3, ArrowRight, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export function Landing() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden selection:bg-emerald-500/30 transition-colors">
      {/* Top Header Toggle */}
      <header className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex justify-end items-center max-w-7xl mx-auto right-0">
        <button 
          onClick={toggleTheme}
          className="p-3 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:emerald-glow transition-all group backdrop-blur-xl"
        >
          {theme === 'light' ? (
            <Sun className="w-6 h-6 text-emerald-500 group-hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-6 h-6 text-emerald-500 group-hover:-rotate-12 transition-transform" />
          )}
        </button>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-8 max-w-7xl mx-auto">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full -z-10" />

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-500 tracking-[0.2em] uppercase font-bold">
              <ShieldCheck className="w-3 h-3" />
              The Global Polling & Prediction Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9] text-[var(--text-primary)]">
              The <span className="text-emerald-500 italic">Pulse</span> of the Crowd.
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-lg font-medium">
              Predicting matches, golden boot winners, and World Cup trends using the collective wisdom of the people. Fast, accurate, and open for all.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:gap-6 gap-4">
              <Link
                to="/polls"
                className="group flex justify-center items-center gap-3 px-8 py-4 rounded-2xl bg-emerald-500 text-black font-bold text-sm emerald-glow hover:bg-emerald-400 transition-all w-full sm:w-auto"
              >
                START PREDICTING
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/leaderboard"
                className="flex text-center justify-center px-8 py-4 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm font-bold hover:bg-black/10 transition-all w-full sm:w-auto text-[var(--text-primary)]"
              >
                LIVE PREDICTIONS
              </Link>
            </div>
            <div className="flex items-center gap-8 sm:gap-12 pt-8 border-t border-[var(--glass-border)]">
              <div className="flex flex-col">
                <span className="text-3xl font-bold tracking-tighter text-[var(--text-primary)]">2.4M</span>
                <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest font-bold">Votes Predicted</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold tracking-tighter text-[var(--text-primary)]">140+</span>
                <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest font-bold">Active Polls</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            <div className="aspect-square glass rounded-[40px] p-4 sm:p-8 flex items-center justify-center emerald-glow overflow-hidden relative">
              {/* Map Graphic */}
              <div className="w-full h-full bg-emerald-500/5 rounded-3xl flex items-center justify-center border border-emerald-500/10 overflow-hidden p-8">
                <img src="/2026_world_cup_colored.svg" alt="2026 World Cup" className="w-full h-full object-contain opacity-80 drop-shadow-2xl" />
              </div>
              <div className="absolute bottom-10 left-10 p-6 glass rounded-2xl border border-emerald-500/20 backdrop-blur-xl">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest font-bold">Current Trend</span>
                  <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Global Consensus</span>
                  <div className="flex items-center justify-between mt-4 mb-2">
                    <span className="text-3xl font-bold text-[var(--text-primary)]">94%</span>
                    <span className="text-[10px] font-mono text-emerald-500 uppercase font-bold">Confidence</span>
                  </div>
                  <div className="text-[8px] text-[var(--text-secondary)] font-mono leading-tight font-bold">
                    Powered by CrowdVote AI
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 px-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-12 md:mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 text-[var(--text-primary)]">Community Driven <span className="text-emerald-500 italic">Predictions.</span></h2>
          <p className="text-[var(--text-secondary)] max-w-2xl font-medium">
            We don't just count votes. We calculate match outcomes using historical data and live predictions from analysts like you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "CROWD WISDOM", icon: Swords, desc: "Accurate prediction models based on community input and trends." },
            { title: "VERIFIED DATA", icon: ShieldCheck, desc: "Using advanced algorithms to ensure genuine polling participation." },
            { title: "LIVE UPDATES", icon: BarChart3, desc: "See how predictions change in real-time as more people cast their votes." },
          ].map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="glass p-8 rounded-[32px] border border-[var(--glass-border)] space-y-6 hover:border-emerald-500/20 transition-all duration-300 bg-[var(--card-bg)]"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <feature.icon className="text-emerald-500 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{feature.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 px-4 sm:px-8 text-center">
        <div className="max-w-3xl mx-auto glass p-8 sm:p-16 rounded-[48px] border border-emerald-500/10 emerald-glow relative overflow-hidden bg-[var(--card-bg)]">
          <div className="absolute top-0 left-0 w-full h-full bg-emerald-500/5 -z-10" />
          <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-8" />
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6 text-[var(--text-primary)]">Ready to <span className="text-emerald-500 italic">Start</span> Your Prediction?</h2>
          <p className="text-[var(--text-secondary)] mb-12 text-lg font-medium">
            Join thousands of others in predicting the future.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-3 px-12 py-5 rounded-2xl bg-emerald-500 text-white font-bold text-lg emerald-glow hover:bg-emerald-400 transition-all"
          >
            GET STARTED
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 md:py-20 px-8 border-t border-[var(--glass-border)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-[var(--text-primary)]">CrowdVote <span className="text-emerald-500">AI</span></span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest font-bold">
            <a href="#" className="hover:text-emerald-500">Documentation</a>
            <a href="#" className="hover:text-emerald-500">Methodology</a>
            <a href="#" className="hover:text-emerald-500">Privacy Policy</a>
            <Link to="/adminlogin" className="text-[var(--text-secondary)] hover:text-emerald-500 border border-[var(--glass-border)] px-2 py-1 rounded">Admin Login</Link>
          </div>
          <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest text-center font-bold">© 2026 CrowdVote Project</span>
        </div>
      </footer>
    </div>
  );
}
