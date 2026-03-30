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
        const [metricsRes, nodesRes] = await Promise.all([
          fetch("/api/admin/metrics", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/admin/nodes", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setAdminMetrics(metricsData);
          setStats({
            users: metricsData.totalUsers || 0,
            predictions: metricsData.totalPredictions || 0
          });
        }
        if (nodesRes.ok) setAdminNodes(await nodesRes.json());
      } catch (error) {
        console.error("Failed to fetch admin API data:", error);
      }
    };

    fetchAdminData();
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
              <p className="text-white/40 text-sm leading-relaxed font-mono">
                Unauthorized node detected. Only verified administrative agents can access the central command node.
              </p>
            </div>
            <button 
              onClick={() => window.location.href = "/"}
              className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 font-bold transition-all uppercase tracking-widest text-xs"
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
            <div className="flex items-center gap-3 text-red-500">
              <Shield className="w-6 h-6" />
              <span className="text-xs font-mono uppercase tracking-[0.4em]">Central Command Node</span>
            </div>
            <h1 className="text-6xl font-bold tracking-tighter">System <span className="text-red-500">Admin</span></h1>
            <p className="text-white/40 max-w-md font-mono text-sm leading-relaxed">
              Global configuration and swarm management parameters.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="glass px-6 py-4 rounded-3xl border border-white/5 flex flex-col items-center">
              <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-1">Active Agents</span>
              <span className="text-2xl font-bold">{stats.users}</span>
            </div>
            <div className="glass px-6 py-4 rounded-3xl border border-white/5 flex flex-col items-center">
              <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-1">Predictions</span>
              <span className="text-2xl font-bold text-red-500">{stats.predictions}</span>
            </div>
          </div>
        </div>

        {tab === "overview" && (
          <div className="space-y-8">
            <div className="grid lg:grid-cols-1 gap-8">
              {/* Phase Control */}
              <div className="glass p-10 rounded-[40px] border border-white/5 space-y-10">
                <div className="flex items-center gap-3">
                  <Clock className="text-red-500 w-5 h-5" />
                  <h3 className="text-xl font-bold tracking-tight">Election Lifecycle Phase</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {["Pre-Election", "Campaign", "After Polling"].map((p) => (
                    <div
                      key={p}
                      className={cn(
                        "p-8 rounded-[32px] border transition-all duration-500 relative overflow-hidden group",
                        phase === p
                          ? "bg-red-500/10 border-red-500/50 red-glow shadow-[0_0_30px_-5px_rgba(239,68,68,0.2)]"
                          : "bg-white/[0.02] border-white/5 hover:border-white/10"
                      )}
                    >
                      <div className="space-y-6">
                        <div className="flex justify-between items-start">
                          <span className={cn(
                            "text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-1 rounded-md",
                            phase === p ? "bg-red-500 text-black font-bold" : "text-white/20"
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
                          <h4 className="text-xl font-bold tracking-tight">{p}</h4>
                          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Temporal Node</p>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-white/5">
                          <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Phase Expiry (End Date)</label>
                          <input 
                            type="datetime-local"
                            value={phaseExpiries[p] || ""}
                            onChange={(e) => handleExpiryUpdate(p, e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white/60 focus:outline-none focus:border-red-500/50 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 rounded-3xl bg-red-500/5 border border-red-500/20 flex items-start gap-4">
                  <AlertTriangle className="text-red-500 w-6 h-6 shrink-0" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest">Warning: Global State Change</h4>
                    <p className="text-xs text-white/40 leading-relaxed">
                      Changing the election phase affects all predictive agents simultaneously. Neural sync vectors will be recalculated based on the new temporal context.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {adminMetrics && (
              <div className="grid md:grid-cols-2 gap-8 mt-12">
                <div className="glass p-10 rounded-[40px] border border-white/5 space-y-6">
                  <h3 className="text-lg font-bold font-mono uppercase tracking-widest text-white/40">Votes Per Day</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={adminMetrics.votesPerDay}>
                        <defs>
                          <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                          itemStyle={{ color: '#ef4444' }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#ef4444" fillOpacity={1} fill="url(#colorVotes)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass p-10 rounded-[40px] border border-white/5 space-y-6">
                  <h3 className="text-lg font-bold font-mono uppercase tracking-widest text-white/40">New Users Per Day</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={adminMetrics.usersPerDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                          cursor={{ fill: '#ffffff05' }}
                        />
                        <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="md:col-span-2 glass p-10 rounded-[40px] border border-white/5 space-y-6">
                  <h3 className="text-lg font-bold font-mono uppercase tracking-widest text-white/40">Peak Voting Hours</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={adminMetrics.votesPerHour}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="hour" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                        />
                        <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
                      </LineChart>
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
                className="px-6 py-3 rounded-2xl bg-red-500 text-black font-bold flex items-center gap-3 hover:bg-red-400 transition-all red-glow"
              >
                {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                EXPORT COMPLETE DATA STREAM (.CSV)
              </button>
            </div>

            <div className="glass rounded-[40px] border border-white/5 p-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RefreshCw className="text-red-500 w-5 h-5" />
                  <h3 className="text-xl font-bold tracking-tight">Recent Prediction Monitor</h3>
                </div>
                <span className="text-xs font-mono text-white/20 uppercase tracking-widest">Real-time Stream</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="pb-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">Agent ID</th>
                      <th className="pb-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">Constituency</th>
                      <th className="pb-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">Prediction</th>
                      <th className="pb-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">Confidence</th>
                      <th className="pb-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPredictions.map((pred) => (
                      <tr key={pred.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                        <td className="py-4 text-xs font-mono text-white/40 group-hover:text-white transition-colors">{pred.userId?.slice(0, 8)}...</td>
                        <td className="py-4 text-xs font-bold">{pred.constituencyId}</td>
                        <td className="py-4">
                          <span className="px-2 py-1 rounded bg-red-500/10 text-red-500 text-[10px] font-mono uppercase">
                            {pred.predictedParty}
                          </span>
                        </td>
                        <td className="py-4 text-xs font-mono">{pred.confidence}%</td>
                        <td className="py-4 text-xs text-white/20">{new Date(pred.timestamp).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "nodes" && (
          <div className="glass rounded-[40px] border border-white/5 p-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="text-red-500 w-5 h-5" />
                <h3 className="text-xl font-bold tracking-tight">Agent Mesh Management</h3>
              </div>
              <div className="flex items-center gap-4">
                 <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-mono">
                    TOTAL: {adminNodes.length}
                 </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="pb-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">Display Name</th>
                    <th className="pb-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">Phone Number</th>
                    <th className="pb-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">Predict. Score</th>
                    <th className="pb-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">Votes Cast</th>
                    <th className="pb-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {adminNodes.map((node) => (
                    <tr key={node.uid} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="py-4 text-xs font-bold">{node.displayName}</td>
                      <td className="py-4 text-xs font-mono text-white/40">{node.phoneNumber}</td>
                      <td className="py-4 text-xs font-mono">{node.predictabilityScore}</td>
                      <td className="py-4 text-xs font-mono text-red-500 font-bold">{node.predictionCount}</td>
                      <td className="py-4">
                        <span className="px-2 py-1 rounded bg-red-500/10 text-red-500 text-[10px] font-mono uppercase">
                          ACTIVE NODE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "system" && (
          <div className="glass p-12 rounded-[40px] border border-white/5 text-center flex flex-col items-center justify-center space-y-4">
            <Settings className="w-12 h-12 text-white/20 mb-4" />
            <h3 className="text-xl font-bold tracking-tight">System Configuration</h3>
            <p className="text-white/40 text-sm font-mono max-w-md mx-auto leading-relaxed">
              Neural network and swarm intelligence parameters are currently locked to optimal defaults. Subsystem overrides require Level 5 clearance.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
