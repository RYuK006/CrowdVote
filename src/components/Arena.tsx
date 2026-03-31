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
      <div className="h-full flex relative">
        {/* Constituency List View - Always Full Width */}
        <div className="flex flex-col gap-8 w-full h-full pb-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-emerald-500">
                <Trophy className="w-6 h-6" />
                <span className="text-[10px] font-mono uppercase tracking-[0.4em]">Node Mesh Arena</span>
              </div>
              <h2 className="text-4xl sm:text-6xl font-bold tracking-tighter">Electoral <span className="text-emerald-500">Arena</span></h2>
              <p className="text-white/40 text-xs font-mono uppercase tracking-widest max-w-sm">
                Synchronizing Swarm: {Object.keys(predictions).length} of 140 Targets Identified
              </p>
            </div>
            
            <div className="flex flex-row items-stretch gap-4 shrink-0">
              <div className="relative group w-full md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search Node Identity..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>

              <div className="relative group w-40 shrink-0">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                <select
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-10 text-sm focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer font-bold"
                >
                  <option value="ALL">All Sectors</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar pr-2 h-full">
            {constituencies.length === 0 ? (
                <div className="col-span-full py-20 text-center text-white/20 font-mono text-sm uppercase tracking-[0.5em] animate-pulse">Scanning Neural Mesh...</div>
            ) : (
                filteredConstituencies.map((c) => (
                    <button
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={cn(
                            "group relative p-6 rounded-[32px] border transition-all duration-500 text-left overflow-hidden flex flex-col justify-between h-[180px]",
                            lockedIds.has(c.id)
                            ? "bg-emerald-500/5 border-emerald-500/30 hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]"
                            : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.07] hover:-translate-y-1"
                        )}
                    >
                        <div className="flex items-start justify-between w-full">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 shrink-0",
                                lockedIds.has(c.id) ? "bg-emerald-500 text-black border-emerald-500" : "bg-white/5 border-white/10 group-hover:border-emerald-500/40"
                            )}>
                                <MapPin className="w-6 h-6" />
                            </div>
                            {lockedIds.has(c.id) ? (
                                <Lock className="w-4 h-4 text-emerald-500" />
                            ) : predictions[c.id] ? (
                                <div className="w-4 h-4 rounded-full border-2 border-emerald-500/40 animate-pulse" />
                            ) : null}
                        </div>

                        <div className="space-y-1">
                            <h3 className="font-bold tracking-tight text-xl truncate">{c.name}</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{c.district}</span>
                                {lockedIds.has(c.id) && (
                                    <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase tracking-widest">{predictions[c.id]?.predictedParty}</span>
                                )}
                            </div>
                        </div>

                        <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                            <ChevronRight className="w-6 h-6 text-emerald-500" />
                        </div>
                    </button>
                ))
            )}
          </div>
        </div>

        {/* Full-Screen Detail Overlay */}
        <AnimatePresence>
          {selectedId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-0 lg:p-12"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-3xl"
                onClick={() => setSelectedId(null)}
              />
              
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: "spring", damping: 30, stiffness: 200 }}
                className="glass w-full h-full lg:max-w-6xl lg:max-h-[90vh] lg:rounded-[48px] border border-white/10 relative overflow-hidden flex flex-col bg-neutral-950/50 shadow-2xl z-10"
              >
                {/* Close Button UI */}
                <div className="absolute top-6 right-6 z-[110] flex items-center gap-4">
                    <button 
                      onClick={() => setShowInfo(!showInfo)}
                      className={cn(
                        "hidden sm:flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border transition-all duration-300 group relative overflow-hidden",
                        showInfo 
                          ? "bg-emerald-500 text-black border-emerald-500" 
                          : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <Info className="w-4 h-4" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">{showInfo ? "EXIT INTEL" : "DATA INTEL"}</span>
                    </button>
                    <button 
                      onClick={() => setSelectedId(null)}
                      className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 flex items-center justify-center transition-all group"
                    >
                      <X className="w-6 h-6 text-white/20 group-hover:text-red-500 group-hover:scale-110 transition-all" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Header Banner */}
                    <div className="h-48 sm:h-64 relative overflow-hidden shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-neutral-950" />
                        <div className="absolute inset-0 flex items-end p-8 sm:p-12">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-[0.4em] font-bold">Node Identity Analysis</span>
                                </div>
                                <h3 className="text-4xl sm:text-7xl font-bold tracking-tighter">{selectedConstituency?.name}</h3>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs sm:text-sm font-mono text-white/40 uppercase tracking-widest">{selectedConstituency?.district} SECTOR</span>
                                    <div className="w-1 h-1 rounded-full bg-white/10" />
                                    <span className="text-xs sm:text-sm font-mono text-emerald-500 uppercase tracking-widest font-bold">ID: {selectedId}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 sm:p-12 space-y-12">
                        <div className="grid xl:grid-cols-2 gap-12">
                            {showInfo ? (
                                <>
                                    <div className="space-y-12">
                                        <div className="space-y-6">
                                            <h4 className="text-xs font-mono text-white/20 uppercase tracking-[0.4em]">Sector Metrics</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="glass p-6 rounded-[32px] border border-white/5 space-y-2">
                                                    <span className="text-[10px] font-mono text-white/20 uppercase">Turnout 2021</span>
                                                    <p className="text-2xl font-bold text-emerald-500">{details?.results2021.turnout}%</p>
                                                </div>
                                                <div className="glass p-6 rounded-[32px] border border-white/5 space-y-2">
                                                    <span className="text-[10px] font-mono text-white/20 uppercase">Electors</span>
                                                    <p className="text-2xl font-bold">{details?.results2021.electors.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            <h4 className="text-xs font-mono text-white/20 uppercase tracking-[0.4em]">Historical Victors</h4>
                                            <div className="glass p-8 rounded-[40px] border border-white/5 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                                    <Trophy className="w-16 h-16" />
                                                </div>
                                                <div className="space-y-6">
                                                    <div>
                                                        <span className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest block mb-2 font-bold">2021 Winner</span>
                                                        <h5 className="text-2xl font-bold tracking-tight">{details?.results2021.winner.name}</h5>
                                                        <p className="text-xs font-mono text-emerald-500 uppercase font-bold mt-1">{details?.results2021.winner.front}</p>
                                                    </div>
                                                    <div className="pt-6 border-t border-white/5">
                                                        <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest block mb-2">Runner Up</span>
                                                        <h5 className="text-xl font-bold text-white/60">{details?.results2021.runnerUp.name}</h5>
                                                        <p className="text-xs font-mono text-white/20 uppercase mt-1">{details?.results2021.runnerUp.votes.toLocaleString()} Votes</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <h4 className="text-xs font-mono text-white/20 uppercase tracking-[0.4em]">Node Agents (2026)</h4>
                                        <div className="flex flex-col gap-3">
                                            {details && Object.entries(details.candidates2026).map(([front, info]: [any, any]) => {
                                                if (front === 'others') return null;
                                                const party = PARTIES.find(p => p.id === front.toUpperCase());
                                                return (
                                                    <div key={front} className="glass p-5 rounded-3xl border border-white/5 flex items-center gap-6 group hover:bg-white/5 transition-all">
                                                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-3 shrink-0">
                                                            <img src={party?.symbol} alt={front} className="w-full h-full object-contain" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: party?.color }}>{front}</span>
                                                                <div className="w-1 h-1 rounded-full bg-white/10" />
                                                                <span className="text-[10px] font-mono text-white/40 uppercase">{info.party}</span>
                                                            </div>
                                                            <h5 className="text-lg font-bold group-hover:text-emerald-500 transition-colors">{info.name}</h5>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-12">
                                        <div className="space-y-8">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-mono text-emerald-500 uppercase tracking-[0.4em] font-bold">Neural Core Signal</h4>
                                                <button 
                                                    onClick={() => setPredictions(prev => {
                                                        const next = { ...prev };
                                                        delete next[selectedId];
                                                        return next;
                                                    })}
                                                    disabled={isLocked}
                                                    className="flex items-center gap-2 text-[10px] font-mono text-white/20 hover:text-red-500 transition-colors uppercase disabled:opacity-0"
                                                >
                                                    <RotateCcw className="w-3 h-3" />
                                                    Reset Pulse
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {PARTIES.map((party) => (
                                                    <button
                                                        key={party.id}
                                                        onClick={() => !isLocked && handlePredict(party.id)}
                                                        disabled={isLocked}
                                                        className={cn(
                                                            "p-6 rounded-[32px] border transition-all duration-500 text-left relative overflow-hidden group flex items-center gap-6",
                                                            predictions[selectedId]?.predictedParty === party.id
                                                                ? "bg-white/10 border-emerald-500/50 shadow-[0_0_40px_-5px_rgba(16,185,129,0.2)]"
                                                                : "bg-white/5 border-white/5 hover:border-white/10",
                                                            isLocked && "opacity-80 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: party.color }} />
                                                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-3 shrink-0">
                                                            <img src={party.symbol} alt={party.id} className="w-full h-full object-contain" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest block mb-1">{party.id} Node</span>
                                                            <h5 className="text-xl font-bold tracking-tight">{party.name}</h5>
                                                        </div>
                                                        {predictions[selectedId]?.predictedParty === party.id && (
                                                            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-mono text-white/20 uppercase tracking-[0.4em]">Signal Conviction</h4>
                                                <span className="text-3xl font-bold text-emerald-500">{predictions[selectedId]?.confidence || 50}%</span>
                                            </div>
                                            <input 
                                                type="range"
                                                min="10"
                                                max="100"
                                                step="5"
                                                value={predictions[selectedId]?.confidence || 50}
                                                onChange={(e) => !isLocked && handleConfidence(parseInt(e.target.value))}
                                                disabled={isLocked}
                                                className="w-full h-3 bg-white/5 rounded-full appearance-none cursor-pointer accent-emerald-500 disabled:opacity-20"
                                            />
                                            <div className="flex justify-between text-[8px] font-mono text-white/20 uppercase tracking-[0.4em]">
                                                <span>Minimum Variance</span>
                                                <span>Swarm Consensus</span>
                                                <span>Absolute Conviction</span>
                                            </div>
                                        </div>

                                        <div className="pt-8">
                                            {isLocked ? (
                                                <div className="w-full py-8 rounded-[32px] bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center gap-2">
                                                    <Lock className="w-8 h-8 text-emerald-500 mb-2" />
                                                    <span className="text-xl font-bold text-emerald-500 tracking-widest uppercase">Signal Finalized</span>
                                                    <p className="text-[10px] font-mono text-white/40 uppercase">Node Synced to Global Intelligence</p>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={handleSave}
                                                    disabled={saving || !predictions[selectedId]?.predictedParty}
                                                    className="w-full py-8 rounded-[32px] bg-emerald-500 text-black font-bold text-xl emerald-glow hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-4 disabled:opacity-20"
                                                >
                                                    {saving ? (
                                                        <Database className="w-6 h-6 animate-pulse" />
                                                    ) : (
                                                        <>
                                                            <Lock className="w-6 h-6" />
                                                            SYNCHRONIZE TO BACKEND
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                            {message && (
                                                <motion.p 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={cn("mt-6 text-center text-xs font-mono font-bold uppercase tracking-[0.2em]", message.type === 'success' ? 'text-emerald-500' : 'text-red-500')}
                                                >
                                                    {message.text}
                                                </motion.p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="hidden xl:flex flex-col gap-8">
                                        <div className="glass p-10 rounded-[40px] border border-white/5 space-y-8">
                                            <div className="flex items-center gap-3">
                                                <BarChart3 className="text-emerald-500 w-5 h-5" />
                                                <h4 className="text-xs font-bold font-mono uppercase tracking-[0.3em]">Live Swarm Data</h4>
                                            </div>
                                            <div className="space-y-6">
                                                {globalActivity.slice(0, 8).map((act, i) => (
                                                    <div key={i} className="flex items-center justify-between pb-4 border-b border-white/[0.03] last:border-0 last:pb-0">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                                                            <span className="text-[10px] font-mono text-white/40">NODE_{act.constituencyId}</span>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase">{act.predictedParty}</span>
                                                    </div>
                                                ))}
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
