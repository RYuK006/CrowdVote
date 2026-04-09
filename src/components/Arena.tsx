import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, MapPin, Info, Lock, RotateCcw, AlertCircle, BarChart3, History, Users2, ExternalLink, ChevronRight, ChevronLeft, Trophy, X, Database, RefreshCw } from "lucide-react";
import { DISTRICTS, PARTIES, STATES } from "../data";
import candidateDataObj from "../candidates.json";
const candidateData = candidateDataObj as Record<string, any[]>;
import { cn } from "../lib/utils";
import { auth } from "../firebase";
import { Layout } from "./Layout";
import { User } from "../types";
import { UnderDevelopmentPopup } from "./UnderDevelopmentPopup";

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

  // New State variables for national prediction
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [stateSearch, setStateSearch] = useState("");
  const [showDevPopup, setShowDevPopup] = useState(false);
  const [selectedStateForPopup, setSelectedStateForPopup] = useState("");
  
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/constituencies')
      .then(r => r.json())
      .then(setConstituencies)
      .catch(console.error);
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

  const filteredStates = STATES.filter(s => 
    s.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const filteredConstituencies = constituencies.filter(c => {
    const matchesState = !selectedState || c.state === selectedState;
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesDistrict = filterDistrict === "ALL" || c.district === filterDistrict;
    return matchesState && matchesSearch && matchesDistrict;
  });

  const groupedByDistrict = (filterDistrict === "ALL" ? DISTRICTS : [filterDistrict]).reduce((acc, district) => {
    const group = filteredConstituencies.filter(c => c.district === district);
    if (group.length > 0) acc[district] = group;
    return acc;
  }, {} as Record<string, any[]>);

  const handleStateSelect = (state: string) => {
    if (state !== "Kerala") {
      setSelectedStateForPopup(state);
      setShowDevPopup(true);
      return;
    }
    setSelectedState(state);
  };

  const selectedConstituency = constituencies.find(c => c.id === selectedId);
  const isLocked = !!(selectedId && lockedIds.has(selectedId));

  const handlePredict = (partyId: string, candidateName: string) => {
    if (!selectedId) return;
    setPredictions(prev => ({
      ...prev,
      [selectedId]: {
        ...(prev[selectedId] || { confidence: 50 }),
        predictedParty: partyId,
        predictedCandidate: candidateName,
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
          predictedCandidate: prediction.predictedCandidate,
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
              <div className="flex items-center gap-2.5 text-emerald-700">
                <MapPin className="w-5 h-5" />
                <span className="text-[9px] font-mono uppercase tracking-[0.4em] font-bold">India Prediction Center</span>
              </div>
              <h2 className="text-4xl sm:text-6xl font-bold tracking-tighter text-slate-950">
                {selectedState ? (
                  <>
                    <span className="text-emerald-700 italic">{selectedState}</span> Prediction
                  </>
                ) : (
                  <>Select <span className="text-emerald-700 italic">State</span></>
                )}
              </h2>
              <p className="text-slate-800 text-[10px] font-mono uppercase tracking-widest max-w-sm font-bold">
                {selectedState 
                  ? `Predicting ${filteredConstituencies.length} areas in ${selectedState}`
                  : "Choose a state to start your voting prediction"}
              </p>
            </div>
            
            {selectedState ? (
              <div className="flex flex-row items-stretch gap-3 shrink-0">
                <button 
                  onClick={() => {
                    setSelectedState(null);
                    setFilterDistrict("ALL");
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-black/5 border border-black/10 rounded-2xl text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-black/10 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to States
                </button>

                <div className="relative group flex-1 md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-700 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search Area..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-black/5 border border-black/10 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all font-mono placeholder:text-slate-600 text-slate-900 font-bold"
                  />
                </div>

                <div className="relative group w-32 sm:w-40 shrink-0">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-700 transition-colors" />
                  <select
                    value={filterDistrict}
                    onChange={(e) => setFilterDistrict(e.target.value)}
                    className="w-full bg-black/5 border border-black/10 rounded-2xl py-3 pl-11 pr-8 text-[11px] focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer font-bold uppercase tracking-tighter text-slate-900"
                  >
                    <option value="ALL">ALL DISTRICTS</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            ) : (
                <div className="relative group max-w-md w-full px-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-700 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search State..."
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                    className="w-full bg-black/5 border border-black/10 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all font-mono placeholder:text-slate-600 text-slate-900 font-bold"
                  />
                </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-32">
            {!selectedState ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStates.map(state => (
                  <button
                    key={state}
                    onClick={() => handleStateSelect(state)}
                    className="group relative p-8 rounded-[32px] border border-black/10 bg-black/5 hover:bg-black/[0.08] hover:border-emerald-500/30 transition-all duration-500 text-left flex flex-col justify-between h-[120px] overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-xl sm:text-2xl tracking-tight text-slate-950">{state}</h3>
                      {state === "Kerala" ? (
                        <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-mono text-emerald-700 font-extrabold uppercase">Active</div>
                      ) : (
                        <Lock className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest font-bold">
                      {state === "Kerala" ? "Predict now" : "Coming Soon"}
                    </span>
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <ChevronRight className="w-5 h-5 text-emerald-500" />
                    </div>
                  </button>
                ))}
              </div>
            ) : constituencies.length === 0 ? (
                <div className="py-20 text-center text-slate-300 font-mono text-[10px] uppercase tracking-[0.5em] animate-pulse">Loading Constituencies...</div>
            ) : (
                <div className="space-y-12">
                  {Object.entries(groupedByDistrict).map(([district, items]) => (
                    <div key={district} className="space-y-6">
                      <div className="flex items-center gap-4 px-1">
                        <h4 className="text-sm font-mono text-emerald-700 uppercase tracking-[0.4em] font-bold">{district}</h4>
                        <div className="h-px flex-1 bg-black/10" />
                        <span className="text-[10px] font-mono text-slate-600 uppercase font-bold">{items.length} Areas</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {items.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setSelectedId(c.id)}
                            className={cn(
                                "group relative p-5 rounded-[32px] border transition-all duration-500 text-left overflow-hidden flex flex-col justify-between h-[150px] sm:h-[180px]",
                                lockedIds.has(c.id)
                                ? "bg-emerald-500/5 border-emerald-500/30 hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]"
                                : predictions[c.id]
                                  ? "bg-black/[0.08] border-black/20 shadow-lg"
                                  : "bg-black/5 border-black/10 hover:border-black/20 hover:bg-black/[0.08]"
                            )}
                        >
                            <div className="flex items-start justify-between w-full">
                                <div className={cn(
                                    "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 shrink-0",
                                    lockedIds.has(c.id) ? "bg-emerald-500 text-white border-emerald-500" : "bg-black/5 border-black/10 group-hover:border-emerald-500/40"
                                )}>
                                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                {lockedIds.has(c.id) ? (
                                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                                ) : predictions[c.id] ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-[8px] font-mono text-emerald-700/80 uppercase font-bold">Draft Locked</span>
                                      <div className="w-2 h-2 rounded-full bg-emerald-700/40 animate-pulse" />
                                    </div>
                                ) : null}
                            </div>
                            
                            <div className="space-y-1">
                                <h3 className="font-bold tracking-tight text-lg sm:text-xl truncate leading-tight group-hover:text-emerald-700 transition-colors uppercase text-slate-950">{c.name}</h3>
                                <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest font-bold">{c.district}</p>
                            </div>
                        
                            <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 hidden sm:block">
                                <ChevronRight className="w-5 h-5 text-emerald-500" />
                            </div>
                        </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </div>
        </div>

        {/* Under Development Popup */}
        <UnderDevelopmentPopup 
          isOpen={showDevPopup}
          onClose={() => setShowDevPopup(false)}
          title="Under Development"
          message={`Voting prediction for ${selectedStateForPopup} is coming soon. Currently, you can predict results for the upcoming Kerala Elections.`}
        />

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
                className="glass w-full h-full lg:max-w-6xl lg:max-h-[90vh] lg:rounded-[48px] border-b sm:border border-black/10 relative overflow-hidden flex flex-col bg-white/95 shadow-2xl z-10"
              >
                {/* Fixed Control Bar (Top) */}
                <div className="absolute top-4 sm:top-8 right-4 sm:right-8 z-[110] flex items-center gap-3">
                    <button 
                      onClick={() => setShowInfo(!showInfo)}
                      className={cn(
                        "flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border transition-all duration-300 group",
                        showInfo 
                          ? "bg-emerald-600 text-white border-emerald-600" 
                          : "bg-black/5 border-black/10 text-slate-800 hover:bg-black/10 hover:text-slate-950 font-bold"
                      )}
                    >
                      <Info className="w-4 h-4" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] hidden sm:inline">{showInfo ? "EXIT INTEL" : "DATA INTEL"}</span>
                    </button>
                    <button 
                      onClick={() => setSelectedId(null)}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-black/5 border border-black/10 hover:bg-red-500/10 hover:border-red-500/30 flex items-center justify-center transition-all group active:scale-95"
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300 group-hover:text-red-500 transition-all font-bold" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Header Banner - Responsive Sizing */}
                    <div className="h-[220px] sm:h-[300px] relative overflow-hidden shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent opacity-50" />
                        <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
                        <div className="absolute inset-0 flex items-end p-6 sm:p-12">
                            <div className="space-y-2 max-w-full">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-700 animate-pulse" />
                                    <span className="text-[9px] font-mono text-emerald-700 uppercase tracking-[0.4em] font-extrabold">Constituency Details</span>
                                </div>
                                <h3 className="text-2xl sm:text-6xl font-bold tracking-tighter leading-[0.9] break-words text-slate-950">{selectedConstituency?.name}</h3>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-slate-800 font-bold">
                                    <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest">{selectedConstituency?.district} DISTRICT</span>
                                    <div className="w-1 h-1 rounded-full bg-black/20 hidden sm:block" />
                                    <span className="text-[10px] sm:text-xs font-mono text-emerald-700 uppercase tracking-widest">AREA CODE: {selectedId}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-12 pt-4 space-y-10">
                        <div className={cn("grid grid-cols-1 gap-12 transition-all duration-700", showInfo ? "xl:grid-cols-2" : "xl:grid-cols-1")}>
                            {showInfo ? (
                                <div className="col-span-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                                    {/* Metrics Column */}
                                    <div className="space-y-10">
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.4em] font-extrabold">Voting Statistics</h4>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="glass p-6 rounded-[32px] border border-black/10 space-y-2 bg-black/5">
                                                    <span className="text-[9px] font-mono text-slate-800 uppercase font-bold">Voter Turnout (2021)</span>
                                                    <p className="text-3xl font-bold text-emerald-700">{details?.results2021.turnout || "--"}%</p>
                                                </div>
                                                <div className="glass p-6 rounded-[32px] border border-black/10 space-y-2 bg-black/5">
                                                    <span className="text-[9px] font-mono text-slate-800 uppercase font-bold">Total Voters</span>
                                                    <p className="text-2xl font-bold font-mono tracking-tighter text-slate-900">{details?.results2021.electors.toLocaleString() || "N/A"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Past Results Column */}
                                    <div className="space-y-10">
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.4em] font-extrabold">Historical Data</h4>
                                            <div className="glass p-8 rounded-[40px] border border-black/10 relative overflow-hidden bg-black/5">
                                                <div className="absolute -top-4 -right-4 p-8 opacity-[0.03]">
                                                    <Trophy className="w-32 h-32" />
                                                </div>
                                                <div className="space-y-8 relative z-10">
                                                    <div>
                                                        <span className="text-[9px] font-mono text-emerald-700 uppercase tracking-widest block mb-2 font-extrabold italic">2021 Winner</span>
                                                        <h5 className="text-2xl font-bold tracking-tight text-slate-950">{details?.results2021.winner.name}</h5>
                                                        <span className="text-[10px] font-mono text-emerald-700 uppercase font-extrabold mt-2 inline-block px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">{details?.results2021.winner.front}</span>
                                                    </div>
                                                    <div className="pt-8 border-t border-black/10 flex justify-between items-end">
                                                       <div>
                                                          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest block mb-1 font-bold">Runner Up</span>
                                                          <h5 className="text-sm font-bold text-slate-800">{details?.results2021.runnerUp.name}</h5>
                                                       </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Elite Predictors (Leaderboard) Column */}
                                    <div className="space-y-10">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-mono text-emerald-700 uppercase tracking-[0.4em] font-extrabold">Elite Predictors</h4>
                                                <Trophy className="w-4 h-4 text-emerald-700" />
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                {loadingLeaderboard ? (
                                                    <div className="py-10 flex flex-col items-center justify-center space-y-3">
                                                        <RefreshCw className="w-5 h-5 text-emerald-700/40 animate-spin" />
                                                        <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest font-bold">Sycing Signals...</span>
                                                    </div>
                                                ) : (!Array.isArray(constituencyLeaderboard) || constituencyLeaderboard.length === 0) ? (
                                                    <div className="glass p-8 rounded-[32px] border border-black/10 text-center text-slate-600 text-[10px] font-mono uppercase tracking-[0.2em] bg-black/5 font-bold">
                                                        Awaiting elite signals...
                                                    </div>
                                                ) : (
                                                    constituencyLeaderboard.map((user: any, idx: number) => (
                                                        <div key={user.uid || idx} className="glass p-4 rounded-2xl border border-black/10 flex items-center justify-between group hover:bg-black/10 transition-all bg-black/5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-[10px] font-bold">
                                                                    #{idx + 1}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold truncate max-w-[100px]">{user.displayName || "Predictor"}</p>
                                                                </div>
                                                            </div>
                                                                <div className="text-right">
                                                                    <p className="text-xs font-mono text-emerald-700 font-extrabold">{user.predictionCount || 0}</p>
                                                                    <span className="text-[8px] font-mono text-slate-600 uppercase text-center block font-bold">Signals</span>
                                                                </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-12">
                                        <div className="space-y-8">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-mono text-emerald-700 uppercase tracking-[0.4em] font-extrabold">Choose Your Candidate</h4>
                                                <button 
                                                    onClick={() => setPredictions(prev => {
                                                        const next = { ...prev };
                                                        delete next[selectedId];
                                                        return next;
                                                    })}
                                                    disabled={isLocked}
                                                    className="flex items-center gap-2 text-[10px] font-mono text-slate-700 hover:text-red-700 transition-colors uppercase disabled:opacity-0 active:scale-95 font-bold"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    Reset
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {(candidateData[selectedId] || []).map((candidate: any, idx: number) => (
                                                    <button
                                                        key={`${candidate.id}-${idx}`}
                                                        onClick={() => !isLocked && handlePredict(candidate.id, candidate.name)}
                                                        disabled={isLocked}
                                                        className={cn(
                                                            "p-4 sm:p-5 rounded-[24px] border transition-all duration-500 text-left relative overflow-hidden group flex flex-col gap-4",
                                                            predictions[selectedId]?.predictedParty === candidate.id && predictions[selectedId]?.predictedCandidate === candidate.name
                                                                ? "bg-black/10 border-emerald-500/50 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]"
                                                                : "bg-black/5 border-black/10 hover:border-black/20",
                                                            isLocked && "opacity-80 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <div className="absolute top-0 left-0 w-1.5 h-full transition-transform duration-500 bg-black/10 group-hover:bg-emerald-500/50" />
                                                        <div className="flex items-center gap-3 w-full">
                                                            <div className="w-12 h-12 rounded-xl bg-black/5 border border-black/10 flex items-center justify-center p-2 shrink-0 overflow-hidden bg-white">
                                                                {candidate.symbol ? (
                                                                    <img src={`/symbols/${candidate.symbol}`} alt={candidate.id} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('fallback-icon'); }} />
                                                                ) : (
                                                                    <Users2 className="w-5 h-5 text-neutral-700" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0 pb-1">
                                                                <span className="text-[9px] font-mono text-emerald-700 uppercase tracking-widest block mb-1 font-extrabold">{candidate.front || "IND"} <span className="text-slate-500 px-1 font-bold">•</span> {candidate.id}</span>
                                                                <h5 className="text-sm font-bold tracking-tight leading-snug text-slate-900">{candidate.name}</h5>
                                                            </div>
                                                        </div>
                                                        {predictions[selectedId]?.predictedParty === candidate.id && predictions[selectedId]?.predictedCandidate === candidate.name && (
                                                            <div className="absolute top-4 right-4">
                                                                <motion.div 
                                                                   layoutId="active-dot"
                                                                   className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)]" 
                                                                />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.4em] font-extrabold">Your Confidence</h4>
                                                <div className="flex items-end gap-3">
                                                  <span className="text-[10px] font-mono text-emerald-700 uppercase font-extrabold mb-1">
                                                    { (predictions[selectedId]?.confidence || 50) < 40 ? "LOW" : (predictions[selectedId]?.confidence || 50) < 80 ? "MEDIUM" : "HIGH" }
                                                  </span>
                                                  <span className="text-3xl sm:text-4xl font-bold text-emerald-700 font-mono tracking-tighter italic">{predictions[selectedId]?.confidence || 50}%</span>
                                                </div>
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
                                                    className="w-full h-3 bg-black/20 rounded-full appearance-none cursor-pointer accent-emerald-600 disabled:opacity-20 transition-all font-bold"
                                                />
                                            </div>
                                            <div className="flex justify-between text-[8px] font-mono text-slate-600 uppercase tracking-[0.4em] pt-1 font-bold">
                                                <span>Minimum Core</span>
                                                <span className="hidden sm:inline">Swarm Average</span>
                                                <span>Total Convergence</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 pb-12">
                                            {isLocked ? (
                                                <div className="w-full py-8 sm:py-10 rounded-[32px] bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center gap-2">
                                                    <Lock className="w-8 h-8 text-emerald-700 mb-2" />
                                                    <span className="text-xl sm:text-2xl font-bold text-emerald-700 tracking-[0.2em] uppercase italic">Vote Submitted</span>
                                                    <p className="text-[10px] font-mono text-slate-800 uppercase tracking-[0.2em] font-extrabold">Synched to Electoral Hub</p>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={handleSave}
                                                    disabled={saving || !predictions[selectedId]?.predictedParty}
                                                    className="w-full py-8 sm:py-10 rounded-[32px] bg-emerald-600 text-white font-bold text-xl emerald-glow hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-20 disabled:grayscale shadow-xl"
                                                >
                                                    {saving ? (
                                                        <RefreshCw className="w-6 h-6 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Database className="w-6 h-6" />
                                                            CONFIRM VOTE
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                            {message && (
                                                <motion.p 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={cn("mt-6 text-center text-[10px] font-mono font-bold uppercase tracking-[0.3em]", message.type === 'success' ? 'text-emerald-700' : 'text-red-700')}
                                                >
                                                    {message.text}
                                                </motion.p>
                                            )}
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
