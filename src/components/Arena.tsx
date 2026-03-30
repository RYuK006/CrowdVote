import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, MapPin, Info, Lock, RotateCcw, Save, AlertCircle, BarChart3, Users, History, Users2, ExternalLink, ChevronRight, ChevronLeft, Menu, Trophy, X } from "lucide-react";
import { CONSTITUENCIES, DISTRICTS, PARTIES } from "../data";
import { CONSTITUENCY_DETAILS } from "../constituencyDetails";
import { cn } from "../lib/utils";
import { db, auth } from "../firebase";
import { doc, setDoc, getDoc, collection, query, where, getDocs, onSnapshot, limit, orderBy } from "firebase/firestore";
import { Layout } from "./Layout";
import { handleFirestoreError, OperationType } from "../lib/firebase-utils";
import { User, Prediction } from "../types";

export function Arena() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterDistrict, setFilterDistrict] = useState<string>("ALL");
  const [predictions, setPredictions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [constituencyLeaderboard, setConstituencyLeaderboard] = useState<User[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [globalActivity, setGlobalActivity] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedId && contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedId]);

  useEffect(() => {
    fetchGlobalActivity();
  }, []);

  const fetchGlobalActivity = async () => {
    setLoadingActivity(true);
    try {
      const q = query(collection(db, "predictions"), orderBy("timestamp", "desc"), limit(5));
      const snapshot = await getDocs(q);
      const activity = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGlobalActivity(activity);
    } catch (error) {
      console.error("Error fetching activity:", error);
    } finally {
      setLoadingActivity(false);
    }
  };

  const filteredConstituencies = CONSTITUENCIES.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesDistrict = filterDistrict === "ALL" || c.district === filterDistrict;
    return matchesSearch && matchesDistrict;
  });

  const selectedConstituency = CONSTITUENCIES.find(c => c.id === selectedId);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "predictions"), where("userId", "==", auth.currentUser.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const preds: Record<string, any> = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        preds[data.constituencyId] = data;
      });
      setPredictions(preds);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "predictions");
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedId && showInfo) {
      fetchConstituencyLeaderboard(selectedId);
    }
  }, [selectedId, showInfo]);

  const fetchConstituencyLeaderboard = async (id: string) => {
    setLoadingLeaderboard(true);
    try {
      // 1. Fetch predictions for this constituency
      const q = query(
        collection(db, "predictions"),
        where("constituencyId", "==", id),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const userIds = snapshot.docs.map(doc => doc.data().userId);

      if (userIds.length > 0) {
        // 2. Fetch user profiles for these predictors
        const usersQ = query(
          collection(db, "users"),
          where("uid", "in", userIds.slice(0, 5)) // Firestore 'in' limit is 10, but we only need 5
        );
        const usersSnapshot = await getDocs(usersQ);
        const users = usersSnapshot.docs.map(doc => doc.data() as User);
        
        // Sort by predictability score
        setConstituencyLeaderboard(users.sort((a, b) => b.predictabilityScore - a.predictabilityScore));
      } else {
        setConstituencyLeaderboard([]);
      }
    } catch (error) {
      console.error("Error fetching constituency leaderboard:", error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handlePredict = (partyId: string) => {
    if (!selectedId) return;
    setPredictions(prev => ({
      ...prev,
      [selectedId]: {
        ...(prev[selectedId] || { confidence: 50, margin: 5000 }),
        predictedParty: partyId,
      }
    }));
  };

  const handleConfidence = (value: number) => {
    if (!selectedId) return;
    setPredictions(prev => ({
      ...prev,
      [selectedId]: {
        ...(prev[selectedId] || { predictedParty: "LDF", margin: 5000 }),
        confidence: value,
      }
    }));
  };

  const handleSave = async () => {
    if (!selectedId || !auth.currentUser) return;
    const prediction = predictions[selectedId];
    if (!prediction?.predictedParty) return;

    setSaving(true);
    setMessage(null);
    try {
      const predId = `${auth.currentUser.uid}_${selectedId}`;
      const path = `predictions/${predId}`;
      await setDoc(doc(db, "predictions", predId), {
        ...prediction,
        userId: auth.currentUser.uid,
        constituencyId: selectedId,
        timestamp: new Date().toISOString(),
        phase: "Campaign" // Dynamic in real app
      });
      setMessage({ type: "success", text: "Prediction locked in swarm." });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `predictions/${auth.currentUser.uid}_${selectedId}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout user={auth.currentUser}>
      <div className="relative h-full flex flex-col overflow-hidden">
        {/* Constituency List View */}
        <div className="flex-1 flex flex-col gap-8 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
            <div className="space-y-1">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Electoral <span className="text-emerald-500">Arena</span></h2>
              <p className="text-white/40 text-sm font-mono uppercase tracking-widest">
                {Object.keys(predictions).length} of 140 Constituencies Predicted
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch gap-4">
              <div className="relative group min-w-[280px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search constituency..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>

              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                <select
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-10 text-sm focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="ALL">All Districts</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <div className="flex flex-col gap-3 pb-20">
              {filteredConstituencies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "group relative p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border transition-all duration-300 text-left overflow-hidden flex items-center justify-between gap-4",
                    predictions[c.id]
                      ? "bg-emerald-500/5 border-emerald-500/30 hover:bg-emerald-500/10"
                      : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.07]"
                  )}
                >
                  <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
                    <div className={cn(
                      "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 shrink-0",
                      predictions[c.id] ? "bg-emerald-500/20 border-emerald-500/40" : "bg-white/5 border-white/10"
                    )}>
                      <MapPin className={cn("w-6 h-6", predictions[c.id] ? "text-emerald-500" : "text-white/20")} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold tracking-tight text-lg sm:text-xl group-hover:text-emerald-500 transition-colors truncate">{c.name}</h3>
                      <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{c.district} District</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 shrink-0">
                    {predictions[c.id] ? (
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest mb-1">Prediction</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-emerald-500 uppercase tracking-wider">{predictions[c.id].predictedParty}</span>
                          <Lock className="w-3 h-3 text-emerald-500" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end opacity-20 group-hover:opacity-40 transition-opacity">
                        <span className="text-[10px] font-mono uppercase tracking-widest mb-1">Status</span>
                        <span className="text-[10px] font-mono uppercase tracking-widest">Awaiting</span>
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-emerald-500 transition-all group-hover:translate-x-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Details Overlay */}
        <AnimatePresence>
          {selectedId && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-[100] bg-neutral-950 flex flex-col"
            >
              <div className="glass w-full h-full relative overflow-hidden flex flex-col bg-neutral-950 shadow-2xl">
                {/* Overlay Header */}
                <div className="flex items-center justify-between p-6 sm:p-8 border-b border-white/5 shrink-0 bg-white/[0.02]">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <button 
                      onClick={() => setSelectedId(null)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                    >
                      <ChevronLeft className="w-4 h-4 text-white/40 group-hover:text-white" />
                      <span className="text-[10px] font-mono font-bold text-white/40 group-hover:text-white uppercase tracking-widest">Back</span>
                    </button>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="space-y-0.5">
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{selectedConstituency?.name}</h3>
                      <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{selectedConstituency?.district} District</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-500 uppercase tracking-widest hidden sm:block">
                    Node: {selectedId}
                  </div>
                </div>

                {/* Scrollable Content Area */}
                <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="p-6 sm:p-10 lg:p-12">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-12 lg:pr-12">
                      <div className="space-y-2 hidden lg:block">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-3xl sm:text-5xl font-bold tracking-tighter">{selectedConstituency?.name}</h3>
                          <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-500 uppercase tracking-widest">
                            Node: {selectedId}
                          </div>
                        </div>
                        <p className="text-white/40 font-mono text-sm uppercase tracking-[0.3em]">{selectedConstituency?.district} District</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setShowInfo(!showInfo)}
                          className={cn(
                            "flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl border transition-all duration-300 group relative overflow-hidden",
                            showInfo 
                              ? "bg-emerald-500 text-black border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                              : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white hover:border-white/20"
                          )}
                        >
                          {showInfo && (
                            <motion.div 
                              layoutId="info-bg"
                              className="absolute inset-0 bg-emerald-400/10"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            />
                          )}
                          <Info className={cn("w-5 h-5 transition-transform duration-300", showInfo ? "text-black scale-110" : "text-white/40 group-hover:text-white group-hover:rotate-12")} />
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest relative z-10">
                            {showInfo ? "CLOSE INTEL" : "VIEW INTEL"}
                          </span>
                          {showInfo && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-1.5 h-1.5 rounded-full bg-black ml-1"
                            />
                          )}
                        </button>
                        <button 
                          onClick={() => setPredictions(prev => {
                            const next = { ...prev };
                            delete next[selectedId];
                            return next;
                          })}
                          className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all group"
                        >
                          <RotateCcw className="w-5 h-5 text-white/40 group-hover:text-red-400" />
                        </button>
                      </div>
                    </div>

                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 flex-1 overflow-y-auto lg:overflow-visible custom-scrollbar p-1">
                  {showInfo ? (
                    <div className="col-span-2 grid lg:grid-cols-3 gap-6 lg:gap-10 overflow-y-auto custom-scrollbar pr-2 pb-10">
                      {/* Constituency Intelligence */}
                      <div className="space-y-8">
                        <div className="space-y-6">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <label className="text-[11px] font-mono text-emerald-500 uppercase tracking-[0.3em] font-bold">Constituency Intelligence</label>
                          </div>
                          <div className="glass p-8 rounded-[32px] border border-white/5 space-y-5 bg-white/[0.02] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all duration-700" />
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between group/item relative z-10 gap-1 sm:gap-0">
                              <span className="text-xs text-white/40 group-hover/item:text-white/60 transition-colors">Population (Est.)</span>
                              <span className="text-sm font-mono text-white font-bold">{CONSTITUENCY_DETAILS[selectedId]?.population || "N/A"}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between group/item relative z-10 gap-1 sm:gap-0">
                              <span className="text-xs text-white/40 group-hover/item:text-white/60 transition-colors">Electors (2021)</span>
                              <span className="text-sm font-mono text-white font-bold">{CONSTITUENCY_DETAILS[selectedId]?.results2021.electors || "N/A"}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between group/item relative z-10 gap-1 sm:gap-0">
                              <span className="text-xs text-white/40 group-hover/item:text-white/60 transition-colors">Turnout (2021)</span>
                              <span className="text-sm font-mono text-emerald-500 font-bold">{CONSTITUENCY_DETAILS[selectedId]?.results2021.turnout || "N/A"}%</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between group/item relative z-10 gap-1 sm:gap-0">
                              <span className="text-xs text-white/40 group-hover/item:text-white/60 transition-colors">Victory Margin (2021)</span>
                              <span className="text-sm font-mono text-white font-bold">{CONSTITUENCY_DETAILS[selectedId]?.results2021.margin || "N/A"}</span>
                            </div>
                            
                            <div className="pt-6 border-t border-white/5 space-y-4 relative z-10">
                              <label className="text-[8px] font-mono text-white/20 uppercase tracking-widest block font-bold">Demographics Breakdown</label>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center hover:bg-white/10 transition-colors">
                                  <span className="text-[8px] text-white/40 block mb-1">Male</span>
                                  <span className="text-xs font-mono font-bold">{CONSTITUENCY_DETAILS[selectedId]?.demographics.male || "N/A"}</span>
                                </div>
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center hover:bg-white/10 transition-colors">
                                  <span className="text-[8px] text-white/40 block mb-1">Female</span>
                                  <span className="text-xs font-mono font-bold">{CONSTITUENCY_DETAILS[selectedId]?.demographics.female || "N/A"}</span>
                                </div>
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center hover:bg-white/10 transition-colors">
                                  <span className="text-[8px] text-white/40 block mb-1">Others</span>
                                  <span className="text-xs font-mono font-bold">{CONSTITUENCY_DETAILS[selectedId]?.demographics.others || "N/A"}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="pt-6 border-t border-white/5 relative z-10">
                              <a 
                                href={CONSTITUENCY_DETAILS[selectedId]?.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-[10px] font-mono text-emerald-500 hover:bg-emerald-500/10 transition-all uppercase tracking-widest font-bold group/btn"
                              >
                                View Detailed Report
                                <ExternalLink className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                              </a>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <label className="text-[11px] font-mono text-emerald-500 uppercase tracking-[0.3em] font-bold">Historical Data (2021)</label>
                          </div>
                          <div className="grid gap-4">
                            <div className="glass p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between relative overflow-hidden group hover:bg-white/5 transition-all gap-4">
                              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                              <div className="pl-2 sm:pl-0">
                                <span className="text-[8px] font-mono text-emerald-500 uppercase block mb-1 font-bold">Winner</span>
                                <span className="text-base font-bold tracking-tight block max-w-full truncate">{CONSTITUENCY_DETAILS[selectedId]?.results2021.winner.name || "N/A"}</span>
                              </div>
                              <div className="sm:text-right pl-2 sm:pl-0">
                                <span className="text-[8px] font-mono text-white/20 uppercase block mb-1 font-bold">Front</span>
                                <span className="text-xs font-bold text-emerald-500">{CONSTITUENCY_DETAILS[selectedId]?.results2021.winner.front || "N/A"}</span>
                              </div>
                            </div>
                            <div className="glass p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between opacity-60 relative overflow-hidden group hover:opacity-100 transition-all gap-4">
                              <div className="absolute top-0 left-0 w-1.5 h-full bg-white/20" />
                              <div className="pl-2 sm:pl-0">
                                <span className="text-[8px] font-mono text-white/40 uppercase block mb-1 font-bold">Runner Up</span>
                                <span className="text-base font-bold tracking-tight block max-w-full truncate">{CONSTITUENCY_DETAILS[selectedId]?.results2021.runnerUp.name || "N/A"}</span>
                              </div>
                              <div className="sm:text-right pl-2 sm:pl-0">
                                <span className="text-[8px] font-mono text-white/20 uppercase block mb-1 font-bold">Votes</span>
                                <span className="text-xs font-mono">{CONSTITUENCY_DETAILS[selectedId]?.results2021.runnerUp.votes || "N/A"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2026 Candidates */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                          <label className="text-[11px] font-mono text-emerald-500 uppercase tracking-[0.3em] font-bold">Upcoming Candidates (2026)</label>
                        </div>
                        <div className="flex flex-col gap-4">
                          {CONSTITUENCY_DETAILS[selectedId] ? (
                            <>
                              {[
                                { key: 'ldf', color: '#ef4444', label: 'LDF' },
                                { key: 'udf', color: '#3b82f6', label: 'UDF' },
                                { key: 'nda', color: '#f97316', label: 'NDA' }
                              ].map((front) => {
                                const candidate = CONSTITUENCY_DETAILS[selectedId].candidates2026[front.key as 'ldf'|'udf'|'nda'];
                                const partyData = PARTIES.find(p => p.id === front.label);
                                return (
                                  <div key={front.key} className="glass p-5 rounded-[28px] border border-white/5 relative overflow-hidden group hover:bg-white/5 transition-all flex items-center gap-5">
                                    <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: front.color }} />
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2.5 shrink-0 group-hover:border-white/20 transition-all">
                                      <img 
                                        src={partyData?.symbol} 
                                        alt={front.label} 
                                        className="w-full h-full object-contain opacity-60 group-hover:opacity-100 transition-opacity" 
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest font-bold">{front.label} Candidate</span>
                                        <div className="w-1 h-1 rounded-full bg-white/10" />
                                        <span className="text-[8px] font-mono text-white/40 uppercase font-bold">{candidate.party}</span>
                                      </div>
                                      <span className="text-lg font-bold block tracking-tight group-hover:text-emerald-500 transition-colors truncate">{candidate.name}</span>
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {CONSTITUENCY_DETAILS[selectedId].candidates2026.others.length > 0 && (
                                <div className="glass p-6 rounded-[32px] border border-white/5 bg-white/[0.01]">
                                  <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest block mb-4 font-bold">Other Candidates</span>
                                  <div className="flex flex-wrap gap-2">
                                    {CONSTITUENCY_DETAILS[selectedId].candidates2026.others.map((other, idx) => (
                                      <span key={idx} className="px-3 py-1.5 rounded-xl bg-white/5 text-[10px] text-white/60 border border-white/10 font-mono hover:bg-white/10 transition-colors">
                                        {other}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="p-12 text-center glass rounded-[32px] border border-white/5">
                              <p className="text-xs text-white/20 font-mono uppercase tracking-widest">Candidate data pending sync...</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Local Leaderboard */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                          <label className="text-[11px] font-mono text-emerald-500 uppercase tracking-[0.3em] font-bold">Local Swarm Leaders</label>
                        </div>
                        <div className="space-y-3">
                          {loadingLeaderboard ? (
                            <div className="flex flex-col items-center justify-center p-12 glass rounded-[32px] border border-white/5 gap-4">
                              <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                              <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Scanning Nodes...</span>
                            </div>
                          ) : constituencyLeaderboard.length > 0 ? (
                            constituencyLeaderboard.map((user, idx) => (
                              <div key={user.uid} className="glass p-5 rounded-[28px] border border-white/5 flex items-center gap-4 group hover:bg-white/10 transition-all relative overflow-hidden">
                                {idx === 0 && <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-bl-[40px] flex items-center justify-center"><Trophy className="w-4 h-4 text-emerald-500" /></div>}
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-sm font-bold text-emerald-500 border border-emerald-500/20 emerald-glow group-hover:bg-emerald-500 group-hover:text-black transition-all">
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-bold block truncate tracking-tight">{user.displayName}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">Sync: {user.predictabilityScore}%</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-mono text-emerald-500 font-bold">{user.influencePoints} IP</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-12 text-center glass rounded-[32px] border border-white/5">
                              <Users2 className="w-10 h-10 text-white/10 mx-auto mb-4" />
                              <p className="text-xs text-white/20 font-mono uppercase tracking-widest">No active signals in this node</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 pb-20">
                      <div className="space-y-10">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono text-emerald-500 uppercase tracking-[0.3em] font-bold">Target Node Selection</label>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Awaiting Input</span>
                        </div>
                      </div>
                      
                      <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={{
                          visible: { transition: { staggerChildren: 0.1 } }
                        }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
                      >
                        {PARTIES.map((party) => {
                          const candidate = selectedId && party.id !== "OTH" 
                            ? CONSTITUENCY_DETAILS[selectedId]?.candidates2026[party.id.toLowerCase() as 'ldf'|'udf'|'nda'] 
                            : null;
                          
                          return (
                            <motion.button
                              key={party.id}
                              variants={{
                                hidden: { opacity: 0, y: 10 },
                                visible: { opacity: 1, y: 0 }
                              }}
                              onClick={() => handlePredict(party.id)}
                              className={cn(
                                "p-4 sm:p-5 rounded-[24px] sm:rounded-[32px] border transition-all duration-300 text-left relative overflow-hidden group flex items-center gap-4",
                                predictions[selectedId]?.predictedParty === party.id
                                  ? "bg-white/10 border-emerald-500/50 emerald-glow"
                                  : "bg-white/5 border-white/5 hover:border-white/20"
                              )}
                            >
                              <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: party.color }} />
                              
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2.5 shrink-0 group-hover:border-emerald-500/30 transition-all">
                                <img 
                                  src={party.symbol} 
                                  alt={party.id} 
                                  className="w-full h-full object-contain opacity-60 group-hover:opacity-100 transition-opacity" 
                                  referrerPolicy="no-referrer" 
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">{party.id}</span>
                                  <div className="w-1 h-1 rounded-full bg-white/20" />
                                  <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest truncate">{party.name}</span>
                                </div>
                                
                                {candidate ? (
                                  <div className="space-y-0.5">
                                    <span className="text-base sm:text-lg font-bold tracking-tight leading-tight text-white block truncate group-hover:text-emerald-500 transition-colors">
                                      {candidate.name}
                                    </span>
                                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block">
                                      {candidate.party}
                                    </span>
                                  </div>
                                ) : party.id === "OTH" ? (
                                  <div className="space-y-0.5">
                                    <span className="text-base sm:text-lg font-bold tracking-tight leading-tight text-white block truncate">
                                      Independent / Others
                                    </span>
                                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block">
                                      Multiple Candidates
                                    </span>
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    <span className="text-base sm:text-lg font-bold tracking-tight leading-tight text-white/20 block">
                                      Data Syncing...
                                    </span>
                                    <span className="text-[9px] font-mono text-white/10 uppercase tracking-widest block">
                                      Awaiting Node Update
                                    </span>
                                  </div>
                                )}
                              </div>

                              {predictions[selectedId]?.predictedParty === party.id && (
                                <motion.div 
                                  layoutId="active-indicator"
                                  className="absolute top-3 right-3"
                                >
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono text-emerald-500 uppercase tracking-[0.3em]">Confidence Calibration</label>
                        <span className="text-2xl font-bold text-emerald-500">{predictions[selectedId]?.confidence || 50}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={predictions[selectedId]?.confidence || 50}
                        onChange={(e) => handleConfidence(parseInt(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-white/20 uppercase tracking-widest">
                        <span>Low Conviction</span>
                        <span>Neural Sync</span>
                        <span>High Conviction</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-10">
                    <div className="glass p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-white/5 space-y-6">
                      <div className="flex items-center gap-3">
                        <History className="text-emerald-500 w-5 h-5" />
                        <h4 className="text-sm font-bold tracking-widest uppercase">Global Swarm Activity</h4>
                      </div>
                      <div className="space-y-4">
                        {loadingActivity ? (
                          <div className="flex justify-center py-4">
                            <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                          </div>
                        ) : globalActivity.length > 0 ? (
                          globalActivity.map((act) => (
                            <div key={act.id} className="flex items-center justify-between text-[10px] font-mono">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                                <span className="text-white/40">NODE_{act.constituencyId}</span>
                              </div>
                              <span className="text-emerald-500">{act.predictedParty}</span>
                              <span className="text-white/20">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] text-white/20 text-center">No recent signals...</p>
                        )}
                      </div>
                    </div>

                    <div className="glass p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-white/5 space-y-6">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="text-emerald-500 w-5 h-5" />
                        <h4 className="text-sm font-bold tracking-widest uppercase">Swarm Telemetry</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/40">Influence Point Cost</span>
                          <span className="text-sm font-mono text-emerald-500">-{((predictions[selectedId]?.confidence || 50) / 10).toFixed(0)} IP</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/40">Predictability Weight</span>
                          <span className="text-sm font-mono text-white">x{((predictions[selectedId]?.confidence || 50) / 50).toFixed(1)}</span>
                        </div>
                        <div className="pt-4 border-t border-white/5">
                          <div className="flex items-center gap-2 text-emerald-500/60 mb-2">
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-[10px] font-mono uppercase">Neural Sync Active</span>
                          </div>
                          <p className="text-[10px] text-white/20 leading-relaxed">
                            Your prediction aligns with 64% of the active swarm. Locking this will strengthen the consensus vector.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 pb-10">
                      <button
                        onClick={handleSave}
                        disabled={saving || !predictions[selectedId]?.predictedParty}
                        className="w-full py-6 rounded-[32px] bg-emerald-500 text-black font-bold text-lg emerald-glow hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                      >
                        {saving ? (
                          "SYNCING..."
                        ) : (
                          <>
                            <Lock className="w-5 h-5" />
                            LOCK PREDICTION
                          </>
                        )}
                      </button>
                      {message && (
                        <p className={cn("mt-4 text-center text-xs font-mono uppercase tracking-widest", message.type === "success" ? "text-emerald-500" : "text-red-400")}>
                          {message.text}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
      </div>
    </Layout>
  );
}
