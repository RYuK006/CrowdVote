import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { Activity, TrendingUp, PieChart as PieChartIcon, BarChart3, Info, AlertCircle } from "lucide-react";
import { db, auth } from "../firebase";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { CONSTITUENCIES } from "../data";
import { Layout } from "./Layout";
import { cn } from "../lib/utils";
import { handleFirestoreError, OperationType } from "../lib/firebase-utils";

export function Analytics() {
  const [data, setData] = useState<any[]>([]);
  const [partyShare, setPartyShare] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [districtStats, setDistrictStats] = useState<any[]>([]);

  const [totalSignals, setTotalSignals] = useState(0);

const getPartyColor = (name: string, index: number) => {
  const partyColors: Record<string, string> = {
    'CPI(M)': '#ef4444',
    'CPI': '#dc2626',
    'INC': '#3b82f6',
    'BJP': '#f97316',
    'IUML': '#22c55e',
    'KEC(M)': '#eab308'
  };
  const l = name.toUpperCase();
  for (const k in partyColors) {
    if (l.includes(k)) return partyColors[k];
  }
  const defaultColors = ['#a855f7', '#ec4899', '#14b8a6', '#facc15', '#6366f1'];
  return defaultColors[index % defaultColors.length];
};

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(res => {
        if (!res) return;
        const weights = res.partyShare || {};
        const share = Object.entries(weights)
          .map(([name, val], index) => ({
            name: name,
            value: Math.round(Number(val) || 0),
            color: getPartyColor(name, index)
          }))
          .filter(s => s.value > 0)
          .sort((a, b) => b.value - a.value);
          
        setPartyShare(share);
        setDistrictStats(res.districtStats || []);
        setTotalSignals(res.totalSignals || 0);
        
        // Mock historical data for trend using the dynamic share mapping
        // Create 5 trend dates
        const trendDates = ["Mar 20", "Mar 22", "Mar 24", "Mar 26", "Mar 28"];
        const trend = trendDates.map((date, i) => {
           const obj: any = { date };
           share.forEach(p => {
              // Add a bit of random variation backwards
              const variation = Math.floor(Math.random() * 5) - (trendDates.length - i - 1);
              obj[p.name] = Math.max(0, p.value + variation);
           });
           return obj;
        });
        
        setData(trend);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <Layout user={auth.currentUser}>
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-500">
              <Activity className="w-6 h-6" />
              <span className="text-xs font-mono uppercase tracking-[0.4em]">Swarm Intelligence Telemetry</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tighter">Predictive <span className="text-emerald-500">Analytics</span></h1>
            <p className="text-white/40 max-w-md font-mono text-sm leading-relaxed">
              Real-time visualization of emergent consensus vectors and electoral trends.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <div className="glass px-6 py-4 rounded-3xl border border-white/5 flex flex-col items-center w-full sm:w-auto">
              <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-1">Total Signals</span>
              <span className="text-2xl font-bold">{totalSignals}</span>
            </div>
            <div className="glass px-6 py-4 rounded-3xl border border-white/5 flex flex-col items-center w-full sm:w-auto">
              <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-1">Neural Sync</span>
              <span className="text-2xl font-bold text-emerald-500">94.2%</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Trend Chart */}
          <div className="lg:col-span-2 glass p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-white/5 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-emerald-500 w-5 h-5" />
                <h3 className="text-xl font-bold tracking-tight">Consensus Evolution</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                {partyShare.map(p => (
                  <div key={p.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    {partyShare.map(p => (
                      <linearGradient key={p.name} id={`color${p.name.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={p.color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={p.color} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#ffffff20', fontSize: 10, fontFamily: 'JetBrains Mono' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#ffffff20', fontSize: 10, fontFamily: 'JetBrains Mono' }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '16px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  {partyShare.map(p => (
                    <Area 
                      key={p.name}
                      type="monotone" 
                      dataKey={p.name} 
                      stroke={p.color} 
                      fillOpacity={1} 
                      fill={`url(#color${p.name.replace(/[^a-zA-Z0-9]/g, '')})`} 
                      strokeWidth={3}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Party Share Pie */}
          <div className="glass p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-white/5 flex flex-col min-h-[400px]">
            <div className="flex items-center gap-3 mb-10">
              <PieChartIcon className="text-emerald-500 w-5 h-5" />
              <h3 className="text-xl font-bold tracking-tight">Seat Projection</h3>
            </div>

            <div className="flex-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={partyShare}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {partyShare.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '16px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <span className="block text-4xl font-bold tracking-tighter">140</span>
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Total Seats</span>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              {partyShare.map((p) => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-sm font-bold tracking-tight">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono font-bold">{p.value}</span>
                    <span className="text-xs text-white/20">({((p.value / 140) * 100).toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-white/5 space-y-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-emerald-500 w-5 h-5" />
              <h3 className="text-xl font-bold tracking-tight">District Dominance</h3>
            </div>
            <div className="space-y-3">
              {districtStats.slice(0, 5).map((d) => (
                <div key={d.name} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-xs font-mono text-white/60">{d.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-emerald-500 uppercase">{d.winner}</span>
                    <span className="text-xs font-bold">{d.count} Seats</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-white/5 flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold">
                    {i}
                  </div>
                ))}
              </div>
              <span className="text-xs font-mono text-white/20 uppercase tracking-widest">+12 District Nodes Active</span>
            </div>
          </div>

          <div className="glass p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-white/5 space-y-6 bg-emerald-500/5 border-emerald-500/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-emerald-500 w-5 h-5 shrink-0" />
              <h3 className="text-xl font-bold tracking-tight">Swarm Anomaly Detection</h3>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Neural sync is currently at 94.2%. We have detected minor divergent vectors in the Ernakulam node. Predictive agents are advised to recalibrate their confidence parameters.
            </p>
            <button className="flex items-center gap-2 text-emerald-500 font-bold text-sm group">
              View Detailed Telemetry
              <TrendingUp className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
