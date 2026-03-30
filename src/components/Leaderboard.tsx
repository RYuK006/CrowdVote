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
  influencePoints: number;
  predictabilityScore: number;
  rank?: number;
}

export function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      orderBy("influencePoints", "desc"),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers = snapshot.docs.map((doc, index) => ({
        id: doc.id,
        ...doc.data(),
        rank: index + 1
      })) as LeaderboardUser[];
      setUsers(fetchedUsers);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "users");
    });

    return () => unsubscribe();
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
            <div className="flex items-center gap-3 text-emerald-500">
              <Trophy className="w-6 h-6" />
              <span className="text-xs font-mono uppercase tracking-[0.4em]">Global Consensus Rankings</span>
            </div>
            <h1 className="text-6xl font-bold tracking-tighter">The <span className="text-emerald-500">Elite</span> Swarm</h1>
            <p className="text-white/40 max-w-md font-mono text-sm leading-relaxed">
              Top predictive agents ranked by influence points and predictability vectors.
            </p>
          </div>

          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Filter agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
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
                "glass p-8 rounded-[40px] border border-white/5 relative group overflow-hidden",
                idx === 0 ? "h-[420px] border-emerald-500/30 emerald-glow" : "h-[360px]"
              )}
            >
              {idx === 0 && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
              )}
              
              <div className="flex flex-col items-center text-center h-full justify-between">
                <div className="space-y-6">
                  <div className="relative">
                    <div className={cn(
                      "w-24 h-24 rounded-full bg-white/5 border-2 flex items-center justify-center",
                      idx === 0 ? "border-emerald-500/50" : "border-white/10"
                    )}>
                      <User className="w-10 h-10 text-white/20" />
                    </div>
                    <div className={cn(
                      "absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                      idx === 0 ? "bg-emerald-500 text-black" : "bg-white/10 text-white"
                    )}>
                      {idx + 1}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold tracking-tight">{user.displayName || "Anonymous Agent"}</h3>
                    <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Agent ID: {user.id.slice(0, 8)}</p>
                  </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-3xl p-4 border border-white/5">
                    <Zap className="w-4 h-4 text-emerald-500 mb-2 mx-auto" />
                    <span className="block text-xl font-bold">{user.influencePoints || 0}</span>
                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">IP</span>
                  </div>
                  <div className="bg-white/5 rounded-3xl p-4 border border-white/5">
                    <Target className="w-4 h-4 text-emerald-500 mb-2 mx-auto" />
                    <span className="block text-xl font-bold">{user.predictabilityScore || 0}%</span>
                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Score</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* List */}
        <div className="glass rounded-[40px] border border-white/5 overflow-hidden">
          <div className="grid grid-cols-[80px_1fr_120px_120px_80px] p-6 border-b border-white/5 text-[10px] font-mono text-white/20 uppercase tracking-widest">
            <span>Rank</span>
            <span>Agent</span>
            <span className="text-center">Influence</span>
            <span className="text-center">Predictability</span>
            <span className="text-right">Action</span>
          </div>

          <div className="divide-y divide-white/5">
            {others.map((user) => (
              <div key={user.id} className="grid grid-cols-[80px_1fr_120px_120px_80px] p-6 items-center hover:bg-white/5 transition-colors group">
                <span className="text-xl font-bold text-white/20 group-hover:text-emerald-500 transition-colors">#{user.rank}</span>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-white/20" />
                  </div>
                  <div>
                    <h4 className="font-bold tracking-tight">{user.displayName || "Anonymous Agent"}</h4>
                    <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">ID: {user.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="text-center font-mono font-bold text-emerald-500">{user.influencePoints || 0} IP</div>
                <div className="text-center font-mono font-bold">{user.predictabilityScore || 0}%</div>
                <div className="flex justify-end">
                  <button className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-emerald-500 hover:text-black transition-all">
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
