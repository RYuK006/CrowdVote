import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Settings, Users, Database, AlertTriangle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { db, auth } from "../firebase";
import { doc, updateDoc, collection, onSnapshot, setDoc } from "firebase/firestore";
import { useLocation } from "react-router-dom";
import { Layout } from "./Layout";
import { cn } from "../lib/utils";
import { handleFirestoreError, OperationType } from "../lib/firebase-utils";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area 
} from 'recharts';

export function Admin() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get("tab") || "overview";

  const [phase, setPhase] = useState("Pre-Election");
  const [stats, setStats] = useState({ users: 0, predictions: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const [recentPredictions, setRecentPredictions] = useState<any[]>([]);
  const [adminMetrics, setAdminMetrics] = useState<any>(null);
  const [adminNodes, setAdminNodes] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);
  const [phaseExpiries, setPhaseExpiries] = useState<Record<string, string>>({});

  useEffect(() => {
    // 1. Listen to public global config (available to all authenticated users)
    const unsubscribeConfig = onSnapshot(doc(db, "config", "global"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPhase(data.phase);
        setPhaseExpiries(data.expiries || {});
      }
      setLoading(false);
    }, (error) => {
      console.error("Config listener failed:", error);
      setLoading(false);
    });

    // 2. Admin Verification Logic
    const verifyAdmin = async () => {
      if (!auth.currentUser) {
        setIsAdmin(false);
        return;
      }
      try {
        const token = await auth.currentUser.getIdToken(true);
        const res = await fetch("/api/user/check", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Auth API unreachable");
        const data = await res.json();
        setIsAdmin(!!data.isAdmin);
      } catch (error) {
        console.error("Admin verification failed:", error);
        setIsAdmin(false);
      }
    };

    verifyAdmin();

    return () => {
      unsubscribeConfig();
    };
  }, [auth.currentUser]);

  // 3. Admin Data Fetching (Only runs when verified)
  useEffect(() => {
    if (!isAdmin || !auth.currentUser) return;

    const fetchAdminData = async () => {
      try {
        const token = await auth.currentUser!.getIdToken();
        const [metricsRes, nodesRes, predictionsRes] = await Promise.all([
          fetch("/api/admin/metrics", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/admin/nodes", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/admin/predictions/recent", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setAdminMetrics(metricsData);
          setStats({
            users: metricsData.totalUsers || 0,
            predictions: metricsData.totalPredictions || 0
          });
        }
        if (nodesRes.ok) {
          const nodesData = await nodesRes.json();
          setAdminNodes(Array.isArray(nodesData) ? nodesData : []);
        }
        if (predictionsRes.ok) {
          const predsData = await predictionsRes.json();
          setRecentPredictions(Array.isArray(predsData) ? predsData : []);
        }
      } catch (error) {
        console.error("Failed to fetch admin API data:", error);
      }
    };

    fetchAdminData();
    // Poll for live updates every 30 seconds
    const interval = setInterval(fetchAdminData, 30000);
    return () => clearInterval(interval);
  }, [isAdmin, auth.currentUser]);

  const handlePhaseChange = async (newPhase: string) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "config", "global"), { 
        phase: newPhase,
        lastUpdated: new Date().toISOString(),
        updatedBy: auth.currentUser?.uid
      });
      setPhase(newPhase);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "config/global");
    } finally {
      setSaving(false);
    }
  };

  const handleExpiryUpdate = async (p: string, date: string) => {
    setSaving(true);
    try {
      const newExpiries = { ...phaseExpiries, [p]: date };
      await updateDoc(doc(db, "config", "global"), { 
        expiries: newExpiries,
        lastUpdated: new Date().toISOString(),
        updatedBy: auth.currentUser?.uid
      });
      setPhaseExpiries(newExpiries);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "config/global");
    } finally {
      setSaving(false);
    }
  };

  if (loading || isAdmin === null) {
    return (
      <Layout user={auth.currentUser}>
        <div className="h-full flex items-center justify-center">
          <div className="text-red-500 font-mono animate-pulse uppercase tracking-[0.5em]">
            Verifying Authority...
          </div>
        </div>
      </Layout>
    );
  }

  if (isAdmin === false) {
    return (
      <Layout user={auth.currentUser}>
        <div className="h-full flex items-center justify-center">
          <div className="glass p-12 rounded-[40px] border border-red-500/20 text-center space-y-6 max-w-md">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <Shield className="text-red-500 w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Access Denied</h1>
              <p className="text-slate-500 text-sm leading-relaxed font-mono">
                Unauthorized node detected. Only verified administrative agents can access the central command node.
              </p>
            </div>
            <button 
              onClick={() => window.location.href = "/"}
              className="px-8 py-3 rounded-2xl bg-black/5 border border-black/10 hover:bg-black/10 text-slate-600 font-bold transition-all uppercase tracking-widest text-xs"
            >
              RETURN TO PERIMETER
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/export", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crowdvote_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout user={auth.currentUser}>
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <Shield className="w-6 h-6" />
              <span className="text-xs font-mono uppercase tracking-[0.4em] font-bold">Central Command Node</span>
            </div>
            <h1 className="text-6xl font-bold tracking-tighter text-[var(--text-primary)]">System <span className="text-red-600 italic">Admin</span></h1>
            <p className="text-[var(--text-secondary)] max-w-md font-mono text-sm leading-relaxed font-bold">
              Global configuration and swarm management parameters.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="glass px-6 py-4 rounded-3xl border border-[var(--glass-border)] flex flex-col items-center">
              <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest mb-1 font-bold">Active Agents</span>
              <span className="text-2xl font-bold text-[var(--text-primary)]">{stats.users}</span>
            </div>
            <div className="glass px-6 py-4 rounded-3xl border border-[var(--glass-border)] flex flex-col items-center">
              <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest mb-1 font-bold">Predictions</span>
              <span className="text-2xl font-bold text-red-600">{stats.predictions}</span>
            </div>
          </div>
        </div>

        {tab === "overview" && (
          <div className="space-y-12">
            <div className="grid lg:grid-cols-1 gap-8">
              {/* Phase Control */}
              <div className="glass p-10 rounded-[40px] border border-[var(--glass-border)] space-y-10">
                <div className="flex items-center gap-3">
                  <Clock className="text-red-500 w-5 h-5" />
                  <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Election Lifecycle Phase</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {["Pre-Election", "Campaign", "After Polling"].map((p) => (
                    <div
                      key={p}
                      className={cn(
                        "p-8 rounded-[32px] border transition-all duration-500 relative overflow-hidden group/phase",
                        phase === p
                          ? "bg-red-500/10 border-red-500/50 red-glow shadow-[0_0_30px_-5px_rgba(239,68,68,0.2)]"
                          : "bg-black/5 border-[var(--glass-border)] hover:border-black/20"
                      )}
                    >
                      <div className="space-y-6">
                        <div className="flex justify-between items-start">
                          <span className={cn(
                            "text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-1 rounded-md",
                            phase === p ? "bg-red-600 text-white font-extrabold" : "text-[var(--text-secondary)] font-bold"
                          )}>
                            {phase === p ? "Active Phase" : "Standby"}
                          </span>
                          {phase !== p && (
                            <button 
                              onClick={() => handlePhaseChange(p)}
                              className="text-[10px] font-mono text-red-500/60 hover:text-red-500 border-b border-red-500/20 hover:border-red-500 transition-all uppercase tracking-widest"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <h4 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{p}</h4>
                          <p className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest font-bold">Temporal Node</p>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-[var(--glass-border)]">
                          <label className="text-[10px] font-mono text-[var(--text-primary)] uppercase tracking-widest block font-bold">Phase Expiry (End Date)</label>
                          <input 
                            type="datetime-local"
                            value={phaseExpiries[p] || ""}
                            onChange={(e) => handleExpiryUpdate(p, e.target.value)}
                            className="w-full bg-black/5 border border-[var(--glass-border)] rounded-xl px-4 py-3 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-red-500/50 transition-all placeholder:text-[var(--text-secondary)] font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Data Monitor */}
            <div className="glass rounded-[40px] border border-[var(--glass-border)] p-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="text-red-500 w-5 h-5" />
                  <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Recent Prediction Monitor</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest">Live Stream</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--glass-border)]">
                      <th className="pb-4 text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest font-bold">Agent ID</th>
                      <th className="pb-4 text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest font-bold">Constituency</th>
                      <th className="pb-4 text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest font-bold">Prediction</th>
                      <th className="pb-4 text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest font-bold">Confidence</th>
                      <th className="pb-4 text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest font-bold">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPredictions.length > 0 ? (
                      recentPredictions.map((pred) => (
                        <tr key={pred.id} className="border-b border-[var(--glass-border)] hover:bg-black/5 transition-colors group">
                          <td className="py-4 text-xs font-mono text-[var(--text-primary)] font-bold group-hover:text-red-500 transition-colors">{pred.userId?.slice(0, 8)}...</td>
                          <td className="py-4 text-xs font-bold text-[var(--text-primary)]">{pred.constituencyId}</td>
                          <td className="py-4">
                            <span className="px-2 py-1 rounded bg-red-500/10 text-red-600 text-[10px] font-mono uppercase font-extrabold">
                              {pred.predictedParty}
                            </span>
                          </td>
                          <td className="py-4 text-xs font-mono font-bold text-[var(--text-primary)]">{pred.confidence}%</td>
                          <td className="py-4 text-xs text-[var(--text-secondary)] font-bold">{new Date(pred.timestamp).toLocaleTimeString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-[var(--text-secondary)] font-mono text-xs uppercase tracking-widest font-extrabold">
                          No live activity detected in the current temporal frame.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {adminMetrics && (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="glass p-10 rounded-[40px] border border-[var(--glass-border)] space-y-6">
                  <h3 className="text-lg font-bold font-mono uppercase tracking-widest text-[var(--text-primary)]">Votes Per Day</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={adminMetrics.votesPerDay}>
                        <defs>
                          <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                          itemStyle={{ color: '#ef4444' }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#ef4444" fillOpacity={1} fill="url(#colorVotes)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass p-10 rounded-[40px] border border-[var(--glass-border)] space-y-6">
                  <h3 className="text-lg font-bold font-mono uppercase tracking-widest text-[var(--text-primary)]">New Users Per Day</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={adminMetrics.usersPerDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                          cursor={{ fill: '#ffffff05' }}
                        />
                        <Bar dataKey="count" fill="#dc2626" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "data" && (
          <div className="space-y-8">
            <div className="flex justify-end">
              <button 
                onClick={handleExportCSV}
                disabled={exporting}
                className="px-6 py-3 rounded-2xl bg-red-600 text-white font-bold flex items-center gap-3 hover:bg-red-500 transition-all red-glow"
              >
                {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                EXPORT COMPLETE DATA STREAM (.CSV)
              </button>
            </div>
            <div className="glass p-12 rounded-[40px] border border-[var(--glass-border)] text-center flex flex-col items-center justify-center space-y-4">
              <Database className="w-12 h-12 text-[var(--text-secondary)] mb-4" />
              <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Data Stream Analytics</h3>
              <p className="text-[var(--text-secondary)] text-sm font-mono max-w-md mx-auto leading-relaxed font-bold">
                Raw data telemetry redirected to COMMAND overview for real-time monitoring.
              </p>
            </div>
          </div>
        )}

        {tab === "nodes" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-10 rounded-[40px] border border-[var(--glass-border)] space-y-4 bg-[var(--card-bg)] shadow-xl group hover:border-red-500/30 transition-all duration-500">
                <div className="flex items-center gap-3 text-red-600">
                  <Users className="w-5 h-5" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold">Registered Agents</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-tighter text-[var(--text-primary)]">{stats.users}</span>
                  <span className="text-xs font-mono text-[var(--text-secondary)] font-bold uppercase tracking-widest">Active Units</span>
                </div>
              </div>

              <div className="glass p-10 rounded-[40px] border border-[var(--glass-border)] space-y-4 bg-[var(--card-bg)] shadow-xl group hover:border-red-500/30 transition-all duration-500">
                <div className="flex items-center gap-3 text-red-600">
                  <Database className="w-5 h-5" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold">Temporal Signals</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-tighter text-red-600 italic">{stats.predictions}</span>
                  <span className="text-xs font-mono text-[var(--text-secondary)] font-bold uppercase tracking-widest">Global Syncs</span>
                </div>
              </div>
            </div>

            <div className="glass rounded-[40px] border border-[var(--glass-border)] p-10 space-y-8 bg-[var(--card-bg)] shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="text-red-600 w-5 h-5" />
                  <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Agent Mesh Management</h3>
                </div>
                <div className="flex items-center gap-4">
                   <div className="px-4 py-2 rounded-xl bg-black/5 border border-[var(--glass-border)] text-xs font-mono font-extrabold text-[var(--text-primary)]">
                      TOTAL: {adminNodes.length}
                   </div>
                </div>
              </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--glass-border)]">
                    <th className="pb-4 text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest font-bold">Display Name</th>
                    <th className="pb-4 text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest font-bold">Email Address</th>
                    <th className="pb-4 text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest font-bold">Votes Cast</th>
                    <th className="pb-4 text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest text-right font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {adminNodes.map((node) => (
                    <tr key={node.uid} className="border-b border-[var(--glass-border)] hover:bg-black/5 transition-colors group">
                      <td className="py-4 text-xs font-bold text-[var(--text-primary)]">{node.displayName}</td>
                      <td className="py-4 text-xs font-mono text-[var(--text-secondary)] font-bold italic">{node.email}</td>
                      <td className="py-4 text-xs font-mono text-red-600 font-extrabold">{node.predictionCount}</td>
                      <td className="py-4 text-right">
                        <span className="px-2 py-1 rounded bg-red-500/10 text-red-600 text-[10px] font-mono uppercase font-extrabold">
                          ACTIVE NODE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}

        {tab === "system" && (
          <div className="glass p-12 rounded-[40px] border border-[var(--glass-border)] text-center flex flex-col items-center justify-center space-y-4">
            <Settings className="w-12 h-12 text-[var(--text-secondary)] mb-4" />
            <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">System Configuration</h3>
            <p className="text-[var(--text-secondary)] text-sm font-mono max-w-md mx-auto leading-relaxed font-bold">
              Neural network and swarm intelligence parameters are currently locked to optimal defaults. Subsystem overrides require Level 5 clearance.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
