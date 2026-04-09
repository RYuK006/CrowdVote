import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Vote, CheckCircle2, AlertCircle, Info, BarChart3, Users, Search, Swords } from "lucide-react";
import { Layout } from "./Layout";
import { auth, db } from "../firebase";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firebase-utils";
import { cn } from "../lib/utils";

import { CONSTITUENCIES } from "../data";
import candidateDataObj from "../candidates.json";
const candidateData = candidateDataObj as Record<string, any[]>;

export function Voting() {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({
    totalPredictions: 0,
    userPredictions: 0,
    completionRate: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      try {
        const token = await auth.currentUser.getIdToken();
        
        // Fetch user predictions
        const res = await fetch('/api/user/predictions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setPredictions(data);
        
        const userCount = Object.keys(data).length;
        
        // Fetch global stats (optional but keep for UI)
        const globalRes = await fetch('/api/analytics');
        const globalData = await globalRes.json();
        
        setStats({
          userPredictions: userCount,
          totalPredictions: globalData.totalSignals || 0,
          completionRate: Math.round((userCount / 140) * 100),
        });
      } catch (error) {
        console.error("Error fetching voting data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const predictedList = Object.entries(predictions).map(([id, data]) => {
    // id looks like "Pre-Campaign_107". Wait, predictions keys are like "Pre-Campaign_107" in server.ts
    // In database it stores `constituencyId`, so we can use data.constituencyId
    const constId = data.constituencyId || id.split('_')[1] || id;
    const constituency = CONSTITUENCIES.find(c => c.id === constId);
    
    // Find candidate details using the constituency candidates list
    const constCandidates = candidateData[constId] || [];
    const candidate = constCandidates.find(c => c.id === data.predictedParty && c.name === data.predictedCandidate)
      || constCandidates.find(c => c.id === data.predictedParty); // Fallback to party match
      
    // Construct party context to render
    const party = {
      id: data.predictedParty,
      name: data.predictedCandidate || data.predictedParty,
      symbol: candidate?.symbol ? `/symbols/${candidate.symbol}` : null,
      color: candidate ? '#10b981' : '#a855f7' // Emerald if matched, purple if default
    };
    
    return { ...data, constituency, party };
  }).filter(p => 
    p.constituency?.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.party?.id && p.party.id.toLowerCase().includes(search.toLowerCase())) ||
    (p.party?.name && p.party.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout user={auth.currentUser}>
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-500">
              <Vote className="w-6 h-6" />
              <span className="text-[10px] font-mono uppercase tracking-[0.4em]">Election Prediction Dashboard</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tighter">
              Your <span className="text-emerald-500">Predictions</span>
            </h1>
            <p className="text-slate-500 max-w-xl text-lg leading-relaxed">
              Your voting predictions help us calculate the most likely election outcomes. 
              The current phase is <span className="text-slate-900 font-bold uppercase tracking-widest">Live Voting</span>.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="glass p-6 rounded-3xl border border-black/10 min-w-[160px] bg-black/5">
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Progress</span>
              <span className="text-3xl font-bold text-emerald-600">{stats.completionRate}%</span>
              <div className="w-full h-1 bg-black/10 rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${stats.completionRate}%` }} 
                />
              </div>
            </div>
          </div>
        </div>



        {/* Prediction Review Section */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight">Review Your <span className="text-emerald-500">Votes</span></h2>
            <div className="relative group w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Search areas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black/5 border border-black/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all font-mono placeholder:text-slate-400"
              />
            </div>
          </div>

          {loading ? (
             <div className="py-20 text-center font-mono text-slate-300 uppercase tracking-[0.5em] animate-pulse">Loading your data...</div>
          ) : predictedList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {predictedList.map((item) => (
                <div 
                  key={item.constituencyId}
                  className="glass p-5 rounded-[28px] border border-black/10 hover:border-emerald-500/30 transition-all group bg-white shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-0.5">
                      <h4 className="font-bold tracking-tight text-lg group-hover:text-emerald-500 transition-colors">{item.constituency?.name}</h4>
                      <p className="text-[10px] font-mono text-slate-300 uppercase tracking-widest">{item.constituency?.district}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-black/5 border border-black/10 flex items-center justify-center p-1.5 overflow-hidden">
                       {item.party?.symbol ? (
                         <img src={item.party.symbol} alt={item.party?.id} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                       ) : (
                         <Users className="w-5 h-5 text-neutral-400" />
                       )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Candidate Predicted</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-600 uppercase px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">{item.party?.id}</span>
                        <span className="font-bold tracking-tight text-slate-700 truncate">{item.party?.name !== item.party?.id ? item.party?.name : ""}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Confidence</span>
                        <span className="text-sm font-bold text-emerald-600">{item.confidence}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
Expected behavior:
Updates the voting prediction display for light mode, improving contrast for candidate names and progress bars.
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${item.confidence}%` }}
                          className="h-full bg-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass p-12 rounded-[40px] border border-black/10 text-center space-y-6 bg-white shadow-xl">
              <div className="w-20 h-20 rounded-full bg-black/5 border border-black/10 flex items-center justify-center mx-auto opacity-40">
                <AlertCircle className="w-10 h-10 text-slate-300" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold italic">No Predictions Yet</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                  You haven't made any predictions yet. Go to the Prediction Center to start.
                </p>
              </div>
              <button 
                onClick={() => window.location.href = "/arena"}
                className="px-8 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-sm emerald-glow hover:bg-emerald-400 transition-all shadow-lg"
              >
                GO TO PREDICTION CENTER
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

