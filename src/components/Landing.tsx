import { motion } from "framer-motion";
import { ShieldCheck, Swords, Trophy, BarChart3, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-emerald-500/30">
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-500 tracking-[0.2em] uppercase">
              <ShieldCheck className="w-3 h-3" />
              Electoral Swarm Sovereignty
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9] text-white">
              The <span className="text-emerald-500">Pulse</span> of Kerala's Heart.
            </h1>
            <p className="text-lg text-white/40 leading-relaxed max-w-lg">
              Harnessing peer-verified swarm intelligence to simulate the 2026 Kerala Assembly Elections with unprecedented accuracy.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:gap-6 gap-4">
              <Link
                to="/signup"
                className="group flex justify-center items-center gap-3 px-8 py-4 rounded-2xl bg-emerald-500 text-black font-bold text-sm emerald-glow hover:bg-emerald-400 transition-all w-full sm:w-auto"
              >
                JOIN THE SWARM
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/leaderboard"
                className="flex text-center justify-center px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all w-full sm:w-auto"
              >
                LIVE PREDICTIONS
              </Link>
            </div>
            <div className="flex items-center gap-8 sm:gap-12 pt-8 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-3xl font-bold tracking-tighter">2.4M</span>
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Predictions Synced</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold tracking-tighter">140</span>
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Constituencies Loaded</span>
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
              <div className="w-full h-full bg-emerald-500/5 rounded-3xl flex items-center justify-center border border-emerald-500/10 overflow-hidden">
                <img 
                  src="/kerala-map.png" 
                  alt="Kerala Electoral Map" 
                  className="w-full h-full object-contain p-4 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)] opacity-80 mix-blend-screen"
                />
              </div>
              {/* Floating Stats */}
              <div className="absolute bottom-4 right-4 sm:bottom-12 sm:right-12 glass p-4 sm:p-6 rounded-3xl emerald-glow-strong border border-emerald-500/20 max-w-[calc(100%-2rem)]">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Active Hotspot</span>
                  <span className="text-xl font-bold tracking-tight">Trivandrum City</span>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-3xl font-bold">94%</span>
                    <span className="text-[10px] font-mono text-white/40 uppercase">Consensus</span>
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
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">Emergent <span className="text-emerald-500">Forecasting.</span></h2>
          <p className="text-white/40 max-w-2xl">
            We don't just aggregate votes. We simulate electoral outcomes using high-fidelity historical layering and peer-verified swarm telemetry.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "SWARM INTELLIGENCE", icon: Swords, desc: "Weighted prediction models based on user accuracy history and demographic correlation." },
            { title: "ARCHIVAL INTEGRITY", icon: ShieldCheck, desc: "Direct integration with Kerala 2021 master data ensuring historical accuracy benchmarks." },
            { title: "REAL-TIME ANALYTICS", icon: BarChart3, desc: "Predictive vectors that update as new information flows through the democratic swarm." },
          ].map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="glass p-8 rounded-[32px] border border-white/5 space-y-6 hover:border-emerald-500/20 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <feature.icon className="text-emerald-500 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">{feature.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 px-4 sm:px-8 text-center">
        <div className="max-w-3xl mx-auto glass p-8 sm:p-16 rounded-[48px] border border-emerald-500/10 emerald-glow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-emerald-500/5 -z-10" />
          <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-8" />
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">Ready to <span className="text-emerald-500">Impact</span> the Swarm?</h2>
          <p className="text-white/40 mb-12 text-lg">
            Join the elite rank of electoral archivists and shape the 2026 forecast.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-3 px-12 py-5 rounded-2xl bg-emerald-500 text-black font-bold text-lg emerald-glow hover:bg-emerald-400 transition-all"
          >
            AUTHENTICATE ACCESS
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 md:py-20 px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <ShieldCheck className="text-black w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">CrowdVote <span className="text-emerald-500">OS</span></span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-[10px] font-mono text-white/40 uppercase tracking-widest">
            <a href="#" className="hover:text-emerald-500">Documentation</a>
            <a href="#" className="hover:text-emerald-500">Methodology</a>
            <a href="#" className="hover:text-emerald-500">Privacy Alpha</a>
            <Link to="/admin-login" className="text-white/20 hover:text-emerald-500 border border-white/5 px-2 py-1 rounded">Admin Console</Link>
          </div>
          <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest text-center">© 2026 Electoral Swarm Lab</span>
        </div>
      </footer>
    </div>
  );
}
