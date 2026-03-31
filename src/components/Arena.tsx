import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, MapPin, Info, Lock, RotateCcw, AlertCircle, BarChart3, History, Users2, ExternalLink, ChevronRight, ChevronLeft, Trophy, X, Database } from "lucide-react";
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
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());
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
      setGlobalActivity(Array.isArray(activity) ? activity : []);
    } catch (error) {
      console.error("Error fetching activity:", error);
      setGlobalActivity([]);
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
        setLockedIds(new Set(Object.keys(data)));
        setLoading(false);
      })
      .catch(console.error);
    });
  }, [auth.currentUser]); 

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
  const isLocked = !!(selectedId && lockedIds.has(selectedId));

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
      setLockedIds(prev => new Set(prev).add(selectedId));
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
      <div className="h-full flex relative pb-4 overflow-hidden">
        {/* Constituency List View - Optimized Grid */}
        <div className="flex flex-col gap-6 w-full h-full pb-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0 px-1">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-emerald-500">
                <Trophy className="w-5 h-5" />
                <span className="text-[9px] font-mono uppercase tracking-[0.4em] font-bold">Node Mesh Arena</span>
              </div>
              <h2 className="text-4xl sm:text-6xl font-bold tracking-tighter">Electoral <span className="text-emerald-500">Arena</span></h2>
              <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest max-w-sm">
                Target nodes: {Object.keys(predictions).length} of 140 identified
              </p>
            </div>
            
            <div className="flex flex-row items-stretch gap-3 shrink-0">
              <div className="relative group flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search Node..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                />
              </div>

              <div className="relative group w-32 sm:w-40 shrink-0">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                <select
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-8 text-[11px] focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer font-bold uppercase tracking-tighter"
                >
                  <option value="ALL">ALL SECTORS</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar pr-2 h-full">
            {constituencies.length === 0 ? (
                <div className="col-span-full py-20 text-center text-white/20 font-mono text-[10px] uppercase tracking-[0.5em] animate-pulse">Scanning Neural Mesh...</div>
            ) : (
                filteredConstituencies.map((c) => (
                    <button
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={cn(
                            "group relative p-5 rounded-[32px] border transition-all duration-500 text-left overflow-hidden flex flex-col justify-between h-[150px] sm:h-[180px]",
                            lockedIds.has(c.id)
                            ? "bg-emerald-500/5 border-emerald-500/30 hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]"
                            : predictions[c.id]
                              ? "bg-white/[0.07] border-white/20 shadow-lg"
                              : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.07]"
                        )}
                    >
                        <div className="flex items-start justify-between w-full">
                            <div className={cn(
                                "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 shrink-0",
                                lockedIds.has(c.id) ? "bg-emerald-500 text-black border-emerald-500" : "bg-white/5 border-white/10 group-hover:border-emerald-500/40"
                            )}>
                                <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            {lockedIds.has(c.id) ? (
                                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                            ) : predictions[c.id] ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-mono text-emerald-500/60 uppercase font-bold">Draft Locked</span>
                                  <div className="w-2 h-2 rounded-full bg-emerald-500/40 animate-pulse" />
                                </div>
                            ) : null}
                        </div>

                        <div className="space-y-1">
                            <h3 className="font-bold tracking-tight text-lg sm:text-xl truncate leading-tight">{c.name}</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">{c.district}</span>
                                {predictions[c.id] && (
                                    <span className="text-[9px] font-mono text-emerald-500 font-bold uppercase tracking-widest">{predictions[c.id]?.predictedParty}</span>
                                )}
                            </div>
                        </div>

                        <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 hidden sm:block">
                            <ChevronRight className="w-5 h-5 text-emerald-500" />
                        </div>
                    </button>
                ))
            )}
          </div>
        </div>

        {/* Full-Screen Cinematic Overlay */}
        <AnimatePresence>
          {selectedId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6 lg:p-12"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
                onClick={() => setSelectedId(null)}
              />
              
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.98 }}
                transition={{ type: "spring", damping: 35, stiffness: 300 }}
                className="glass w-full h-full lg:max-w-6xl lg:max-h-[90vh] lg:rounded-[48px] border-b sm:border border-white/10 relative overflow-hidden flex flex-col bg-neutral-950/80 shadow-2xl z-10"
              >
                {/* Fixed Control Bar (Top) */}
                <div className="absolute top-4 sm:top-8 right-4 sm:right-8 z-[110] flex items-center gap-3">
                    <button 
                      onClick={() => setShowInfo(!showInfo)}
                      className={cn(
                        "flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border transition-all duration-300 group",
                        showInfo 
                          ? "bg-emerald-500 text-black border-emerald-500" 
                          : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <Info className="w-4 h-4" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] hidden sm:inline">{showInfo ? "EXIT INTEL" : "DATA INTEL"}</span>
                    </button>
                    <button 
                      onClick={() => setSelectedId(null)}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 flex items-center justify-center transition-all group active:scale-95"
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6 text-white/20 group-hover:text-red-500 transition-all font-bold" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Header Banner - Responsive Sizing */}
                    <div className="h-[220px] sm:h-[300px] relative overflow-hidden shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 via-emerald-500/5 to-transparent opacity-50" />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent" />
                        <div className="absolute inset-0 flex items-end p-6 sm:p-12">
                            <div className="space-y-2 max-w-full">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-[0.4em] font-bold">Node Identity Analysis</span>
                                </div>
                                <h3 className="text-3xl sm:text-6xl font-bold tracking-tighter leading-[0.9] break-words">{selectedConstituency?.name}</h3>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                                    <span className="text-[10px] sm:text-xs font-mono text-white/40 uppercase tracking-widest">{selectedConstituency?.district} SECTOR</span>
                                    <div className="w-1 h-1 rounded-full bg-white/20 hidden sm:block" />
                                    <span className="text-[10px] sm:text-xs font-mono text-emerald-500 uppercase tracking-widest font-bold">NODE: {selectedId}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 sm:p-12 pt-4 space-y-12">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                            {showInfo ? (
                                <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {/* Metrics Column */}
                                    <div className="space-y-10">
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] font-bold">Sector Telemetry</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="glass p-6 rounded-[32px] border border-white/5 space-y-2 bg-white/[0.02]">
                                                    <span className="text-[9px] font-mono text-white/20 uppercase">Turnout 2021</span>
                                                    <p className="text-3xl font-bold text-emerald-500">{details?.results2021.turnout || "--"}%</p>
                                                </div>
                                                <div className="glass p-6 rounded-[32px] border border-white/5 space-y-2 bg-white/[0.02]">
                                                    <span className="text-[9px] font-mono text-white/20 uppercase">Total Electors</span>
                                                    <p className="text-2xl font-bold font-mono tracking-tighter">{details?.results2021.electors.toLocaleString() || "N/A"}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] font-bold">Historical Victors</h4>
                                            <div className="glass p-8 rounded-[40px] border border-white/5 relative overflow-hidden bg-white/[0.01]">
                                                <div className="absolute -top-4 -right-4 p-8 opacity-[0.03]">
                                                    <Trophy className="w-32 h-32" />
                                                </div>
                                                <div className="space-y-8 relative z-10">
                                                    <div>
                                                        <span className="text-[9px] font-mono text-emerald-500/60 uppercase tracking-widest block mb-2 font-bold">2021 Dominant Signal</span>
                                                        <h5 className="text-2xl sm:text-3xl font-bold tracking-tight">{details?.results2021.winner.name}</h5>
                                                        <span className="text-[10px] font-mono text-emerald-500 uppercase font-bold mt-2 inline-block px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">{details?.results2021.winner.front}</span>
                                                    </div>
                                                    <div className="pt-8 border-t border-white/5 flex justify-between items-end">
                                                       <div>
                                                          <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest block mb-2">Primary Challenger</span>
                                                          <h5 className="text-lg font-bold text-white/60">{details?.results2021.runnerUp.name}</h5>
                                                       </div>
                                                       <div className="text-right">
                                                          <p className="text-xs font-mono text-white/20 uppercase">{details?.results2021.runnerUp.votes.toLocaleString()} Votes</p>
                                                       </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Candidates Column */}
                                    <div className="space-y-8">
                                        <h4 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] font-bold">Synchronizable Agents (2026)</h4>
                                        <div className="flex flex-col gap-3">
                                            {details && Object.entries(details.candidates2026).map(([front, info]: [any, any]) => {
                                                if (front === 'others') return null;
                                                const party = PARTIES.find(p => p.id === front.toUpperCase());
                                                return (
                                                    <div key={front} className="glass p-5 rounded-[28px] border border-white/5 flex items-center gap-5 sm:gap-6 group hover:bg-white/5 transition-all bg-white/[0.02]">
                                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2.5 shrink-0 shadow-lg">
                                                            <img src={party?.symbol} alt={front} className="w-full h-full object-contain filter group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] transition-all" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: party?.color }}>{front} Sector</span>
                                                            </div>
                                                            <h5 className="text-base sm:text-lg font-bold group-hover:text-emerald-500 transition-colors truncate">{info.name}</h5>
                                                            <span className="text-[9px] font-mono text-white/30 uppercase block truncate">{info.party}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-12">
                                        <div className="space-y-8">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-mono text-emerald-500 uppercase tracking-[0.4em] font-bold">Swarm Vector Selection</h4>
                                                <button 
                                                    onClick={() => setPredictions(prev => {
                                                        const next = { ...prev };
                                                        delete next[selectedId];
                                                        return next;
                                                    })}
                                                    disabled={isLocked}
                                                    className="flex items-center gap-2 text-[10px] font-mono text-white/30 hover:text-red-500 transition-colors uppercase disabled:opacity-0 active:scale-95"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    Clear Signal
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {PARTIES.map((party) => (
                                                    <button
                                                        key={party.id}
                                                        onClick={() => !isLocked && handlePredict(party.id)}
                                                        disabled={isLocked}
                                                        className={cn(
                                                            "p-5 sm:p-6 rounded-[32px] border transition-all duration-500 text-left relative overflow-hidden group flex items-center gap-5 sm:gap-6",
                                                            predictions[selectedId]?.predictedParty === party.id
                                                                ? "bg-white/10 border-emerald-500/50 shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]"
                                                                : "bg-white/5 border-white/5 hover:border-white/10",
                                                            isLocked && "opacity-80 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <div className="absolute top-0 left-0 w-1.5 h-full transition-transform duration-500 group-hover:scale-y-150" style={{ backgroundColor: party.color }} />
                                                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-3 shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                                            <img src={party.symbol} alt={party.id} className="w-full h-full object-contain filter group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest block mb-0.5">{party.id} NODE</span>
                                                            <h5 className="text-lg sm:text-xl font-bold tracking-tight truncate leading-tight">{party.name}</h5>
                                                        </div>
                                                        {predictions[selectedId]?.predictedParty === party.id && (
                                                            <motion.div 
                                                              layoutId="active-dot"
                                                              className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)]" 
                                                            />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] font-bold">Signal Conviction</h4>
                                                <span className="text-3xl sm:text-4xl font-bold text-emerald-500 font-mono tracking-tighter">{predictions[selectedId]?.confidence || 50}%</span>
                                            </div>
                                            <div className="relative group">
                                                <input 
                                                    type="range"
                                                    min="10"
                                                    max="100"
                                                    step="5"
                                                    value={predictions[selectedId]?.confidence || 50}
                                                    onChange={(e) => !isLocked && handleConfidence(parseInt(e.target.value))}
                                                    disabled={isLocked}
                                                    className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500 disabled:opacity-20 transition-all"
                                                />
                                            </div>
                                            <div className="flex justify-between text-[8px] font-mono text-white/30 uppercase tracking-[0.4em] pt-1">
                                                <span>Minimum Core</span>
                                                <span className="hidden sm:inline">Swarm Average</span>
                                                <span>Total Convergence</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 pb-12">
                                            {isLocked ? (
                                                <div className="w-full py-8 sm:py-10 rounded-[32px] bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center gap-2">
                                                    <Lock className="w-8 h-8 text-emerald-500 mb-2" />
                                                    <span className="text-xl sm:text-2xl font-bold text-emerald-500 tracking-[0.2em] uppercase">Signal Locked</span>
                                                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">Node Synced to Central Hub</p>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={handleSave}
                                                    disabled={saving || !predictions[selectedId]?.predictedParty}
                                                    className="w-full py-8 sm:py-10 rounded-[32px] bg-emerald-500 text-black font-bold text-xl emerald-glow hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-20 disabled:grayscale"
                                                >
                                                    {saving ? (
                                                        <RefreshCw className="w-6 h-6 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Database className="w-6 h-6" />
                                                            SYNCHRONIZE SIGNAL
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                            {message && (
                                                <motion.p 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={cn("mt-6 text-center text-[10px] font-mono font-bold uppercase tracking-[0.3em]", message.type === 'success' ? 'text-emerald-500' : 'text-red-500')}
                                                >
                                                    {message.text}
                                                </motion.p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Desktop Analytics (XL Only) */}
                                    <div className="hidden xl:flex flex-col gap-8">
                                        <div className="glass p-10 rounded-[40px] border border-white/5 space-y-8 bg-white/[0.01]">
                                            <div className="flex items-center gap-3">
                                                <BarChart3 className="text-emerald-500 w-5 h-5" />
                                                <h4 className="text-[10px] font-bold font-mono uppercase tracking-[0.4em]">Node Analytics</h4>
                                            </div>
                                            <p className="text-white/30 text-xs font-mono leading-relaxed uppercase tracking-tighter">
                                                Synchronizing user-defined vectors with global swarm metrics...
                                            </p>
                                            <div className="w-full h-1 bg-emerald-500/10 rounded-full overflow-hidden">
                                                <motion.div 
                                                  animate={{ x: ["-100%", "100%"] }}
                                                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                                  className="w-1/2 h-full bg-emerald-500/40"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
