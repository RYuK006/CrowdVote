import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, MapPin, Info, Lock, RotateCcw, AlertCircle, BarChart3, History, Users2, ExternalLink, ChevronRight, ChevronLeft, Trophy, X } from "lucide-react";
import { DISTRICTS, PARTIES } from "../data";
import { cn } from "../lib/utils";
import { auth } from "../firebase";
import { Layout } from "./Layout";
import { User } from "../types";

export function Arena() {
  const [constituencies, setConstituencies] = useState<any[]>([]);
  const [details, setDetails] = useState<any>(null);
  
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
    fetch('/api/constituencies')
      .then(r => r.json())
      .then(setConstituencies)
      .catch(console.error);
      
    fetchGlobalActivity();
  }, []);

  useEffect(() => {
    if (selectedId && contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (selectedId) {
      fetch(`/api/constituencies/${selectedId}`)
        .then(r => r.json())
        .then(setDetails)
        .catch(console.error);
    } else {
      setDetails(null);
    }
  }, [selectedId]);

  const fetchGlobalActivity = async () => {
    setLoadingActivity(true);
    try {
      const res = await fetch('/api/activity/global');
      const activity = await res.json();
      setGlobalActivity(activity);
    } catch (error) {
      console.error("Error fetching activity:", error);
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    
    // Fetch user initial predictions from API
    auth.currentUser.getIdToken().then(token => {
      fetch('/api/user/predictions', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setPredictions(data);
        setLoading(false);
      })
      .catch(console.error);
    });
  }, [auth.currentUser]); // Run initially or when currentUser finishes loading

  useEffect(() => {
    if (selectedId && showInfo) {
      fetchConstituencyLeaderboard(selectedId);
    }
  }, [selectedId, showInfo]);

  const fetchConstituencyLeaderboard = async (id: string) => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch(`/api/leaderboard/${id}`);
      const users = await res.json();
      setConstituencyLeaderboard(users);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const filteredConstituencies = constituencies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesDistrict = filterDistrict === "ALL" || c.district === filterDistrict;
    return matchesSearch && matchesDistrict;
  });

  const selectedConstituency = constituencies.find(c => c.id === selectedId);

  const handlePredict = (partyId: string) => {
    if (!selectedId) return;
    setPredictions(prev => ({
      ...prev,
      [selectedId]: {
        ...(prev[selectedId] || { confidence: 50 }),
        predictedParty: partyId,
      }
    }));
  };

  const handleConfidence = (value: number) => {
    if (!selectedId) return;
    setPredictions(prev => ({
      ...prev,
      [selectedId]: {
        ...(prev[selectedId] || { predictedParty: "LDF" }),
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
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/predict', {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          constituencyId: selectedId,
          predictedParty: prediction.predictedParty,
          confidence: prediction.confidence || 50
        })
      });
      if (!res.ok) throw new Error("Failed to save via API");
      setMessage({ type: "success", text: "Prediction locked in swarm via Backend." });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to sync signal." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout user={auth.currentUser}>
      <div className="relative h-full flex overflow-hidden">
        {/* Constituency List View (Left Panel on Desktop, Full on Mobile when nothing selected) */}
        <div className={cn(
          "flex flex-col gap-6 overflow-hidden h-full transition-all duration-300",
          selectedId ? "w-full lg:w-[450px] xl:w-[500px] lg:flex-none lg:pr-6 hidden lg:flex" : "w-full flex-1"
        )}>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight">Electoral <span className="text-emerald-500">Arena</span></h2>
              <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest hidden sm:block">
                {Object.keys(predictions).length} of 140 Predicted
              </p>
            </div>
            
            <div className="flex flex-row items-stretch gap-2 xl:gap-4 shrink-0">
              <div className="relative group w-full xl:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>

              <div className="relative group w-32 xl:w-40 shrink-0">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                <select
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-8 text-sm focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="ALL">All Dt.</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-20">
            {constituencies.length === 0 ? (
                <div className="p-8 text-center text-white/20 font-mono text-sm uppercase tracking-widest">Loading node data...</div>
            ) : (
                <div className="flex flex-col gap-3">
                {filteredConstituencies.map((c) => (
                    <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                        "group relative p-4 rounded-[20px] border transition-all duration-300 text-left overflow-hidden flex items-center justify-between gap-4",
                        predictions[c.id]
                        ? "bg-emerald-500/5 border-emerald-500/30 hover:bg-emerald-500/10"
                        : selectedId === c.id
                          ? "bg-white/10 border-white/30"
                          : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.07]"
                    )}
                    >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 shrink-0",
                        predictions[c.id] ? "bg-emerald-500/20 border-emerald-500/40" : "bg-white/5 border-white/10"
                        )}>
                        <MapPin className={cn("w-5 h-5", predictions[c.id] ? "text-emerald-500" : "text-white/20")} />
                        </div>
                        <div className="min-w-0">
                        <h3 className="font-bold tracking-tight text-base sm:text-lg group-hover:text-emerald-500 transition-colors truncate">{c.name}</h3>
                        <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest truncate">{c.district}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0">
                        {predictions[c.id] ? (
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-mono text-emerald-500/60 uppercase tracking-widest mb-1">State</span>
                            <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">{predictions[c.id].predictedParty}</span>
                            <Lock className="w-3 h-3 text-emerald-500" />
                            </div>
                        </div>
                        ) : (
                        <div className="flex flex-col items-end opacity-20 group-hover:opacity-40 transition-opacity hidden sm:flex">
                            <span className="text-[9px] font-mono uppercase tracking-widest mb-1">Status</span>
                            <span className="text-[9px] font-mono uppercase tracking-widest">Awaiting</span>
                        </div>
                        )}
                        <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-emerald-500 transition-all group-hover:translate-x-1 hidden lg:block" />
                    </div>
                    </button>
                ))}
                </div>
            )}
          </div>
        </div>

        {/* Details Overlay (Right Panel on Desktop, Full Overlay on mobile) */}
        <AnimatePresence>
          {selectedId && (
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="absolute inset-0 z-50 bg-neutral-950 lg:relative lg:flex-1 lg:bg-transparent lg:z-auto"
            >
              <div className="glass w-full h-full lg:rounded-[40px] border border-white/5 relative overflow-hidden flex flex-col bg-neutral-950 shadow-2xl">
                {/* Overlay Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0 bg-white/[0.02]">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setSelectedId(null)}
                      className="flex items-center lg:hidden gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                    >
                      <ChevronLeft className="w-4 h-4 text-white/40 group-hover:text-white" />
                      <span className="text-[10px] font-mono font-bold text-white/40 group-hover:text-white uppercase tracking-widest">Back</span>
                    </button>
                    <div className="space-y-0.5">
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{selectedConstituency?.name}</h3>
                      <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{selectedConstituency?.district} District</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedId(null)}
                        className="hidden lg:flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                      >
                        <X className="w-4 h-4 text-white/40 group-hover:text-white" />
                      </button>
                  </div>
                </div>

                {/* Scrollable Content Area within panel */}
                <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-10">
                      <div className="space-y-2 hidden lg:block">
                        <div className="flex items-center gap-3">
                          <h3 className="text-4xl font-bold tracking-tighter truncate max-w-sm xl:max-w-md">{selectedConstituency?.name}</h3>
                          <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-500 uppercase tracking-widest">
                            Node: {selectedId}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
                        <button 
                          onClick={() => setShowInfo(!showInfo)}
                          className={cn(
                            "flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border transition-all duration-300 group relative overflow-hidden",
                            showInfo 
                              ? "bg-emerald-500 text-black border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                              : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white hover:border-white/20"
                          )}
                        >
                          <Info className={cn("w-4 h-4 transition-transform duration-300", showInfo ? "text-black scale-110" : "text-white/40 group-hover:text-white")} />
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest relative z-10">
                            {showInfo ? "CLOSE INTEL" : "VIEW INTEL"}
                          </span>
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

                <div className="grid xl:grid-cols-2 gap-8 flex-1">
                  {showInfo ? (
                    <div className="col-span-1 xl:col-span-2 grid xl:grid-cols-2 gap-8 pb-10">
                      {/* Constituency Intelligence */}
                      <div className="space-y-8">
                        <div className="space-y-6">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <label className="text-[11px] font-mono text-emerald-500 uppercase tracking-[0.3em] font-bold">Node Analytics</label>
                          </div>
                          <div className="glass p-6 sm:p-8 rounded-[32px] border border-white/5 space-y-5 bg-white/[0.02] relative overflow-hidden group">
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between group/item relative z-10 gap-1 sm:gap-0">
                              <span className="text-xs text-white/40">Population (Est.)</span>
                              <span className="text-sm font-mono text-white font-bold">{details?.population || "N/A"}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between group/item relative z-10 gap-1 sm:gap-0">
                              <span className="text-xs text-white/40">Electors (2021)</span>
                              <span className="text-sm font-mono text-white font-bold">{details?.results2021.electors || "N/A"}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between group/item relative z-10 gap-1 sm:gap-0">
                              <span className="text-xs text-white/40">Turnout (2021)</span>
                              <span className="text-sm font-mono text-emerald-500 font-bold">{details?.results2021.turnout || "N/A"}%</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between group/item relative z-10 gap-1 sm:gap-0">
                              <span className="text-xs text-white/40">Victory Margin (2021)</span>
                              <span className="text-sm font-mono text-white font-bold">{details?.results2021.margin || "N/A"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <label className="text-[11px] font-mono text-emerald-500 uppercase tracking-[0.3em] font-bold">Historical Records (2021)</label>
                          </div>
                          <div className="grid gap-3">
                            <div className="glass p-5 rounded-[24px] border border-white/5 flex items-center justify-between relative overflow-hidden group hover:bg-white/5 transition-all">
                              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                              <div className="pl-4">
                                <span className="text-[8px] font-mono text-emerald-500 uppercase block mb-1 font-bold">Winner</span>
                                <span className="text-sm font-bold tracking-tight block max-w-[120px] sm:max-w-xs xl:max-w-full truncate">{details?.results2021.winner.name || "N/A"}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[8px] font-mono text-white/20 uppercase block mb-1 font-bold">Front</span>
                                <span className="text-xs font-bold text-emerald-500">{details?.results2021.winner.front || "N/A"}</span>
                              </div>
                            </div>
                            <div className="glass p-5 rounded-[24px] border border-white/5 flex items-center justify-between opacity-60 relative overflow-hidden group hover:opacity-100 transition-all">
                              <div className="absolute top-0 left-0 w-1.5 h-full bg-white/20" />
                              <div className="pl-4">
                                <span className="text-[8px] font-mono text-white/40 uppercase block mb-1 font-bold">Runner Up</span>
                                <span className="text-sm font-bold tracking-tight block max-w-[120px] sm:max-w-xs xl:max-w-full truncate">{details?.results2021.runnerUp.name || "N/A"}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[8px] font-mono text-white/20 uppercase block mb-1 font-bold">Votes</span>
                                <span className="text-xs font-mono">{details?.results2021.runnerUp.votes || "N/A"}</span>
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
                          {details ? (
                            <>
                              {[
                                { key: 'ldf', color: '#ef4444', label: 'LDF' },
                                { key: 'udf', color: '#3b82f6', label: 'UDF' },
                                { key: 'nda', color: '#f97316', label: 'NDA' }
                              ].map((front) => {
                                const candidate = details.candidates2026[front.key as 'ldf'|'udf'|'nda'];
                                const partyData = PARTIES.find(p => p.id === front.label);
                                return (
                                  <div key={front.key} className="glass p-4 rounded-[24px] border border-white/5 relative overflow-hidden group hover:bg-white/5 transition-all flex items-center gap-4">
                                    <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: front.color }} />
                                    {/* NO CANDIDATE IMAGE USED, ONLY PARTY SYMBOL */}
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-2 shrink-0 group-hover:border-white/20 transition-all">
                                      <img 
                                        src={partyData?.symbol} 
                                        alt={front.label} 
                                        className="w-full h-full object-contain opacity-60 group-hover:opacity-100 transition-opacity" 
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest font-bold">{front.label}</span>
                                        <div className="w-1 h-1 rounded-full bg-white/10" />
                                        <span className="text-[8px] font-mono text-white/40 uppercase font-bold truncate">{candidate.party}</span>
                                      </div>
                                      <span className="text-base sm:text-lg font-bold block tracking-tight group-hover:text-emerald-500 transition-colors truncate">{candidate.name}</span>
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {details.candidates2026.others && details.candidates2026.others.length > 0 && (
                                <div className="glass p-5 rounded-[24px] border border-white/5 bg-white/[0.01]">
                                  <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest block mb-3 font-bold">Other Candidates</span>
                                  <div className="flex flex-wrap gap-2">
                                    {details.candidates2026.others.map((other: string, idx: number) => (
                                      <span key={idx} className="px-3 py-1.5 rounded-xl bg-white/5 text-[10px] text-white/60 border border-white/10 font-mono hover:bg-white/10 transition-colors">
                                        {other}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="p-8 text-center glass rounded-[24px] border border-white/5">
                              <p className="text-xs text-white/20 font-mono uppercase tracking-widest">Awaiting Node Data...</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
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
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                      >
                        {PARTIES.map((party) => {
                          const candidate = details && party.id !== "OTH" 
                            ? details.candidates2026[party.id.toLowerCase() as 'ldf'|'udf'|'nda'] 
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
                                "p-4 rounded-[24px] border transition-all duration-300 text-left relative overflow-hidden group flex items-center gap-4",
                                predictions[selectedId]?.predictedParty === party.id
                                  ? "bg-white/10 border-emerald-500/50 emerald-glow"
                                  : "bg-white/5 border-white/5 hover:border-white/20"
                              )}
                            >
                              <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: party.color }} />
                              
                              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-2.5 shrink-0 group-hover:border-emerald-500/30 transition-all">
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
                                    <span className="text-sm sm:text-base font-bold tracking-tight leading-tight text-white block truncate group-hover:text-emerald-500 transition-colors">
                                      {candidate.name}
                                    </span>
                                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block truncate">
                                      {candidate.party}
                                    </span>
                                  </div>
                                ) : party.id === "OTH" ? (
                                  <div className="space-y-0.5">
                                    <span className="text-sm sm:text-base font-bold tracking-tight leading-tight text-white block truncate">
                                      Independent / Others
                                    </span>
                                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block">
                                      Multiple Candidates
                                    </span>
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    <span className="text-sm font-bold tracking-tight leading-tight text-white/20 block">
                                      Data Syncing...
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
                         <span className="text-xl font-bold text-emerald-500">{predictions[selectedId]?.confidence || 50}%</span>
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
                       <div className="flex justify-between text-[8px] font-mono text-white/20 uppercase tracking-widest">
                         <span>Low Conviction</span>
                         <span>Neural Sync</span>
                         <span>High Conviction</span>
                       </div>
                    </div>

                    <div className="pt-2 pb-10">
                      <button
                        onClick={handleSave}
                        disabled={saving || !predictions[selectedId]?.predictedParty}
                        className="w-full py-5 rounded-[24px] bg-emerald-500 text-black font-bold text-lg emerald-glow hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                      >
                        {saving ? (
                          "SYNCING TO BACKEND..."
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

                  <div className="space-y-8 hidden xl:block">
                     <div className="glass p-6 rounded-[24px] border border-white/5 space-y-6">
                       <div className="flex items-center gap-3">
                         <History className="text-emerald-500 w-4 h-4" />
                         <h4 className="text-xs font-bold tracking-widest uppercase">Global Swarm Activity</h4>
                       </div>
                       <div className="space-y-3">
                         {loadingActivity ? (
                           <div className="flex justify-center py-4 text-emerald-500">Wait...</div>
                         ) : globalActivity.length > 0 ? (
                           globalActivity.map((act) => (
                             <div key={act.id} className="flex items-center justify-between text-[10px] font-mono">
                               <div className="flex items-center gap-2">
                                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                                 <span className="text-white/40">NODE_{act.constituencyId}</span>
                               </div>
                               <span className="text-emerald-500">{act.predictedParty}</span>
                             </div>
                           ))
                         ) : (
                           <p className="text-[10px] text-white/20">No recent signals...</p>
                         )}
                       </div>
                     </div>
                  </div>
                    </>
                  )}
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
