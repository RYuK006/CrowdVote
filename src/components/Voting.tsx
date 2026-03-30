import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Vote, CheckCircle2, AlertCircle, Info, BarChart3, Users } from "lucide-react";
import { Layout } from "./Layout";
import { auth, db } from "../firebase";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firebase-utils";
import { cn } from "../lib/utils";

export function Voting() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPredictions: 0,
    userPredictions: 0,
    completionRate: 0,
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, "predictions"), where("userId", "==", auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userCount = snapshot.size;
      setStats(prev => ({
        ...prev,
        userPredictions: userCount,
        completionRate: Math.round((userCount / 140) * 100),
      }));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "predictions");
    });

    // Fetch total predictions (simplified for demo)
    const totalQ = query(collection(db, "predictions"));
    const unsubscribeTotal = onSnapshot(totalQ, (snapshot) => {
      setStats(prev => ({ ...prev, totalPredictions: snapshot.size }));
    });

    return () => {
      unsubscribe();
      unsubscribeTotal();
    };
  }, []);

  return (
    <Layout user={auth.currentUser}>
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-500">
              <Vote className="w-6 h-6" />
              <span className="text-[10px] font-mono uppercase tracking-[0.4em]">Voting Protocol Alpha</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tighter">
              Predictive <span className="text-emerald-500">Consensus</span>
            </h1>
            <p className="text-white/40 max-w-xl text-lg leading-relaxed">
              Your predictions are being aggregated into the global swarm intelligence model. 
              The current phase is <span className="text-white font-bold">CAMPAIGN</span>.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="glass p-6 rounded-3xl border border-white/5 min-w-[160px]">
              <span className="text-[10px] font-mono text-white/40 uppercase block mb-2">Completion</span>
              <span className="text-3xl font-bold text-emerald-500">{stats.completionRate}%</span>
              <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${stats.completionRate}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-white/5 space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <BarChart3 className="w-24 h-24" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="text-emerald-500 w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Neural Sync Status</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Your predictive signals are currently synchronized with the main swarm vector.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-2 text-[10px] font-mono text-emerald-500 uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Connection
            </div>
          </div>

          <div className="glass p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-white/5 space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Users className="w-24 h-24" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Vote className="text-blue-500 w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Aggregate Signals</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Total predictive signals processed across all nodes in the Kerala 2026 network.
              </p>
            </div>
            <div className="pt-4 text-2xl font-bold font-mono text-blue-500">
              {stats.totalPredictions.toLocaleString()}
            </div>
          </div>

          <div className="glass p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-white/5 space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Info className="w-24 h-24" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <AlertCircle className="text-purple-500 w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Protocol Integrity</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                All votes are cryptographically verified and weighted by agent predictability scores.
              </p>
            </div>
            <div className="pt-4 text-[10px] font-mono text-purple-500 uppercase tracking-widest">
              Verified by Swarm_OS
            </div>
          </div>
        </div>

        <div className="glass p-8 sm:p-12 rounded-[32px] sm:rounded-[40px] border border-white/5 text-center space-y-8">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Ready to update your <span className="text-emerald-500">Predictions</span>?</h2>
            <p className="text-white/40 leading-relaxed">
              The electoral landscape is fluid. Re-calibrate your signals in the Arena to maintain high neural sync and maximize your Influence Points.
            </p>
          </div>
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = "/arena"}
              className="px-12 py-5 rounded-full bg-emerald-500 text-black font-bold text-lg emerald-glow hover:bg-emerald-400 transition-all"
            >
              ENTER THE ARENA
            </motion.button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
