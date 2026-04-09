import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Target, Zap, Search, ArrowUpRight, User } from "lucide-react";
import { db, auth } from "../firebase";
import { collection, query, orderBy, limit, getDocs, onSnapshot } from "firebase/firestore";
import { Layout } from "./Layout";
import { cn } from "../lib/utils";
import { handleFirestoreError, OperationType } from "../lib/firebase-utils";

interface LeaderboardUser {
  id: string;
  displayName: string;
  predictionCount?: number;
  rank?: number;
}

export function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch('/api/leaderboard/global')
      .then(r => r.json())
      .then(fetchedUsers => {
        const withRank = fetchedUsers.map((u: any, index: number) => ({
          ...u,
          id: u.uid || u.id,
          rank: index + 1
        }));
        setUsers(withRank);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Leaderboard error:", error);
        setLoading(false);
      });
  }, []);

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const topThree = filteredUsers.slice(0, 3);
  const others = filteredUsers.slice(3);

  return (
    <Layout user={auth.currentUser}>
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-700">
              <Trophy className="w-6 h-6" />
              <span className="text-xs font-mono uppercase tracking-[0.4em] font-bold">Global Consensus Rankings</span>
            </div>
            <h1 className="text-6xl font-bold tracking-tighter text-slate-950">The <span className="text-emerald-700 italic">Elite</span> Swarm</h1>
            <p className="text-slate-800 max-w-md font-mono text-sm leading-relaxed font-bold">
              Top predictive agents ranked by total signals cast across the neural mesh.
            </p>
          </div>

          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-700 transition-colors" />
            <input
              type="text"
              placeholder="Filter agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/5 border border-black/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all font-mono placeholder:text-slate-600 text-slate-900 font-bold"
            />
          </div>
        </div>

        {/* Podium */}
        <div className="grid md:grid-cols-3 gap-8 items-end">
          {topThree.map((user, idx) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "glass p-8 rounded-[40px] border border-black/10 relative group overflow-hidden",
                idx === 0 ? "md:h-[420px] border-emerald-500/30 emerald-glow bg-white shadow-xl" : "md:h-[360px] bg-black/5",
                "h-auto py-10 md:py-8 flex flex-col items-center justify-between gap-8 md:gap-0"
              )}
            >
              {idx === 0 && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
              )}
              
              <div className="flex flex-col items-center text-center h-full justify-between w-full">
                <div className="space-y-6">
                  <div className="relative">
                    <div className={cn(
                      "w-24 h-24 rounded-full bg-black/5 border-2 flex items-center justify-center",
                      idx === 0 ? "border-emerald-500/50" : "border-black/5"
                    )}>
                      <User className="w-10 h-10 text-slate-600" />
                    </div>
                    <div className={cn(
                      "absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                      idx === 0 ? "bg-emerald-500 text-white" : "bg-black/10 text-slate-900"
                    )}>
                      {idx + 1}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold tracking-tight text-slate-950">{user.displayName || "Anonymous Agent"}</h3>
                    <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest font-bold">Agent ID: {user.id.slice(0, 8)}</p>
                  </div>
                </div>

                <div className="w-full flex justify-center">
                  <div className="bg-black/5 rounded-3xl p-6 border border-black/5 w-full">
                    <Zap className="w-6 h-6 text-emerald-700 mb-2 mx-auto" />
                    <span className="block text-2xl font-bold text-slate-950">{user.predictionCount || 0}</span>
                    <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest text-center block font-bold">Signals Cast</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* List */}
        <div className="glass rounded-[40px] border border-black/10 overflow-x-auto custom-scrollbar">
          <div className="min-w-[600px] md:min-w-0">
            <div className="grid grid-cols-[80px_1fr_120px_120px_80px] p-6 border-b border-black/10 text-[10px] font-mono text-slate-800 uppercase tracking-widest font-bold">
              <span>Rank</span>
              <span>Agent</span>
              <span className="text-center">Signals Cast</span>
              <span className="text-center">Uptime</span>
              <span className="text-right">Action</span>
            </div>

            <div className="divide-y divide-white/5">
            {others.map((user) => (
              <div key={user.id} className="grid grid-cols-[80px_1fr_120px_120px_80px] p-6 items-center hover:bg-black/5 transition-colors group">
                <span className="text-xl font-bold text-slate-600 group-hover:text-emerald-700 transition-colors">#{user.rank}</span>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-black/5 border border-black/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="font-extrabold tracking-tight text-slate-900 transition-colors uppercase">{user.displayName || "Anonymous Agent"}</h4>
                    <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest font-bold">ID: {user.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="text-center font-mono font-bold text-emerald-700">{user.predictionCount || 0}</div>
                <div className="text-center font-mono font-bold">100%</div>
                <div className="flex justify-end">
                  <button className="p-2 rounded-xl bg-black/5 border border-black/10 hover:bg-emerald-500 hover:text-white transition-all">
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
