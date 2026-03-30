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

  useEffect(() => {
    // Listen to users count
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setStats(prev => ({ ...prev, users: snapshot.size }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "users");
    });

    // Listen to predictions count
    const unsubscribePreds = onSnapshot(collection(db, "predictions"), (snapshot) => {
      setStats(prev => ({ ...prev, predictions: snapshot.size }));
      const preds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setRecentPredictions(preds.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "predictions");
    });

    // Listen to global config
    const unsubscribeConfig = onSnapshot(doc(db, "config", "global"), (docSnap) => {
      if (docSnap.exists()) {
        setPhase(docSnap.data().phase);
      } else {
        // Initialize if missing
        setDoc(doc(db, "config", "global"), {
          phase: "Campaign",
          lastUpdated: new Date().toISOString(),
          updatedBy: auth.currentUser?.uid || "system"
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, "config/global"));
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "config/global");
    });

    // Verify admin status from backend
    const verifyAdmin = async () => {
      if (!auth.currentUser) return;
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch("/api/user/check", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setIsAdmin(!!data.isAdmin);
      } catch (error) {
        console.error("Admin verification failed:", error);
        setIsAdmin(false);
      }
    };

    verifyAdmin();

    const fetchAdminData = async () => {
      if (!auth.currentUser) return;
      try {
        const token = await auth.currentUser.getIdToken();
        
        // Fetch Metrics
        const metricsRes = await fetch("/api/admin/metrics", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const metricsData = await metricsRes.json();
        setAdminMetrics(metricsData);

        // Fetch Nodes
        const nodesRes = await fetch("/api/admin/nodes", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const nodesData = await nodesRes.json();
        setAdminNodes(nodesData);
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      }
    };

    if (isAdmin) {
      fetchAdminData();
    }

    return () => {
      unsubscribeUsers();
      unsubscribePreds();
      unsubscribeConfig();
    };
  }, [isAdmin]);

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
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Phase Control */}
              <div className="lg:col-span-2 glass p-10 rounded-[40px] border border-white/5 space-y-10">
                <div className="flex items-center gap-3">
                  <Clock className="text-red-500 w-5 h-5" />
                  <h3 className="text-xl font-bold tracking-tight">Election Lifecycle Phase</h3>
                </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {["Pre-Election", "Campaign", "After Polling"].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePhaseChange(p)}
                  disabled={saving}
                  className={cn(
                    "p-6 rounded-3xl border transition-all duration-300 text-left relative overflow-hidden group",
                    phase === p
                      ? "bg-red-500/10 border-red-500/50 red-glow"
                      : "bg-white/5 border-white/5 hover:border-white/20"
                  )}
                >
                  <div className="flex flex-col h-full justify-between">
                    <span className={cn("text-xs font-mono uppercase tracking-widest mb-4", phase === p ? "text-red-500" : "text-white/20")}>
                      {phase === p ? "Active" : "Locked"}
                    </span>
                    <span className="text-lg font-bold tracking-tight">{p}</span>
                  </div>
                </button>
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

            {/* System Health */}
            <div className="glass p-10 rounded-[40px] border border-white/5 space-y-8">
              <div className="flex items-center gap-3">
                <Settings className="text-red-500 w-5 h-5" />
                <h3 className="text-xl font-bold tracking-tight">System Telemetry</h3>
              </div>
  
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-white/40 uppercase tracking-widest">
                    <span>Database Load</span>
                    <span className="text-red-500">Normal</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: '12%' }} />
                  </div>
                </div>
  
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-white/40 uppercase tracking-widest">
                    <span>Neural Sync Latency</span>
                    <span className="text-red-500">14ms</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: '8%' }} />
                  </div>
                </div>
  
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-white/40 uppercase tracking-widest">
                    <span>API Error Rate</span>
                    <span className="text-red-500">0.02%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: '2%' }} />
                  </div>
                </div>
              </div>
  
              <div className="pt-8 border-t border-white/5 space-y-4">
                <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold flex items-center justify-center gap-3">
                  <RefreshCw className="w-4 h-4" />
                  Recalculate Scores
                </button>
                <button 
                  onClick={handleExportCSV}
                  disabled={exporting}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold flex items-center justify-center gap-3"
                >
                  {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                  Export Swarm Data
                </button>
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
