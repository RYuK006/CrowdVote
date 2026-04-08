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
              India's Voting Prediction Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9] text-white">
              The <span className="text-emerald-500">Pulse</span> of Indian Elections.
            </h1>
            <p className="text-lg text-white/40 leading-relaxed max-w-lg">
              Predicting election results across India using the collective wisdom of the people. Fast, accurate, and open for all.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:gap-6 gap-4">
              <Link
                to="/signup"
                className="group flex justify-center items-center gap-3 px-8 py-4 rounded-2xl bg-emerald-500 text-black font-bold text-sm emerald-glow hover:bg-emerald-400 transition-all w-full sm:w-auto"
              >
                START PREDICTING
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
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Votes Predicted</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold tracking-tighter">140</span>
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Areas Covered</span>
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
                  src="/kerala-map.svg" 
                  alt="Kerala Electoral Map" 
                  className="w-full h-full object-contain p-4 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)] opacity-80 mix-blend-screen"
                />
              </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Current Trend</span>
                  <span className="text-xl font-bold tracking-tight">Kerala State</span>
                  <div className="flex items-center justify-between mt-4 mb-2">
                    <span className="text-3xl font-bold">94%</span>
                    <span className="text-[10px] font-mono text-white/40 uppercase">Confidence</span>
                  </div>
                  <div className="text-[8px] text-white/20 font-mono leading-tight">
                    Map: <a href="https://commons.wikimedia.org/wiki/User:Kambliyil" target="_blank" className="hover:text-emerald-500">Kambliyil</a> / <a href="https://creativecommons.org/licenses/by-sa/4.0" target="_blank" className="hover:text-emerald-500">CC BY-SA 4.0</a>
                  </div>
                </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 px-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-12 md:mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">Community Driven <span className="text-emerald-500">Predictions.</span></h2>
          <p className="text-white/40 max-w-2xl">
            We don't just count votes. We calculate election outcomes using previous election results and live data from people like you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "CROWD WISDOM", icon: Swords, desc: "Accurate prediction models based on community input and historical data." },
            { title: "HISTORICAL DATA", icon: ShieldCheck, desc: "Using verified election results from previous years ensuring better accuracy." },
            { title: "LIVE UPDATES", icon: BarChart3, desc: "See how predictions change in real-time as more people cast their votes." },
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
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">Ready to <span className="text-emerald-500">Start</span> Your Prediction?</h2>
          <p className="text-white/40 mb-12 text-lg">
            Join thousands of others in predicting the future of Indian politics.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-3 px-12 py-5 rounded-2xl bg-emerald-500 text-black font-bold text-lg emerald-glow hover:bg-emerald-400 transition-all"
          >
            GET STARTED
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
            <span className="font-bold text-lg tracking-tight">CrowdVote <span className="text-emerald-500">India</span></span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-[10px] font-mono text-white/40 uppercase tracking-widest">
            <a href="#" className="hover:text-emerald-500">Documentation</a>
            <a href="#" className="hover:text-emerald-500">Methodology</a>
            <a href="#" className="hover:text-emerald-500">Privacy Policy</a>
            <Link to="/admin-login" className="text-white/20 hover:text-emerald-500 border border-white/5 px-2 py-1 rounded">Admin Login</Link>
          </div>
          <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest text-center">© 2026 CrowdVote Project</span>
        </div>
      </footer>
    </div>
  );
}
