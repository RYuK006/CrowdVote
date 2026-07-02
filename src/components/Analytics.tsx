import React, { useState } from "react";
import { Cpu, ToggleRight, ToggleLeft, Terminal, Bot } from "lucide-react";
import { Layout } from "./Layout";
import { auth } from "../firebase";

export function Analytics() {
  const [autoPredictEnabled, setAutoPredictEnabled] = useState(false);

  return (
    <Layout user={auth.currentUser}>
      <div className="h-full flex flex-col pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full group">
        
        {/* Masked Content Container */}
        <div className="relative">
          {/* Work in Progress Overlay */}
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]/40 backdrop-blur-md rounded-3xl m-4">
            <div className="glass px-8 py-6 rounded-3xl border border-emerald-500/30 flex flex-col items-center bg-black/40 text-center space-y-3 shadow-2xl">
              <Cpu className="w-10 h-10 text-emerald-500 animate-pulse" />
              <h2 className="text-2xl font-bold tracking-tighter text-[var(--text-primary)]">Work In Progress</h2>
              <p className="text-[var(--text-secondary)] font-mono text-xs uppercase tracking-widest">
                AI Command Center is currently under development.
              </p>
            </div>
          </div>

          {/* Faded Content */}
          <div className="pt-8 pb-12 space-y-4 opacity-40 pointer-events-none select-none">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-emerald-500 font-bold">
                <Cpu className="w-6 h-6" />
                <span className="text-xs font-mono uppercase tracking-[0.4em]">Autonomous Predictor</span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tighter text-[var(--text-primary)]">AI Agent <span className="text-emerald-500 italic">Hub</span></h1>
              <p className="text-[var(--text-secondary)] max-w-md font-mono text-sm leading-relaxed font-bold">
                Train your personal AI agent to mirror your predictions and vote on your behalf when you are offline.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
              <div className="glass px-6 py-4 rounded-3xl border border-[var(--glass-border)] flex flex-col items-center w-full sm:w-auto bg-[var(--glass-bg)]">
                <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest mb-1 font-bold">Agent Alignment</span>
                <span className="text-2xl font-bold text-emerald-500">87.4%</span>
              </div>
            </div>
          </div>

          {/* AI Auto-Predictor Toggle */}
          <div className="pt-8">
            <div className={`glass p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border transition-all duration-500 ${autoPredictEnabled ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-[var(--glass-border)] bg-[var(--card-bg)]'} shadow-xl space-y-6 flex flex-col md:flex-row md:items-center justify-between`}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Bot className={`w-6 h-6 ${autoPredictEnabled ? 'text-emerald-500' : 'text-slate-500'}`} />
                  <h3 className={`text-xl font-bold tracking-tight ${autoPredictEnabled ? 'text-emerald-600' : 'text-[var(--text-primary)]'}`}>
                    Auto-Predictor {autoPredictEnabled ? 'Online' : 'Offline'}
                  </h3>
                </div>
                <p className="text-[var(--text-secondary)] font-mono text-xs sm:text-sm max-w-lg">
                  When enabled, your AI will automatically place votes in new polls based on patterns it learned from your past {154} predictions.
                </p>
              </div>
              
              <button 
                onClick={() => setAutoPredictEnabled(!autoPredictEnabled)}
                className="focus:outline-none transition-transform hover:scale-105 active:scale-95"
              >
                {autoPredictEnabled ? (
                  <ToggleRight className="w-16 h-16 text-emerald-500" />
                ) : (
                  <ToggleLeft className="w-16 h-16 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {/* Training Model Visuals */}
          <div className="pt-8 grid lg:grid-cols-2 gap-8">
            <div className="glass p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-[var(--glass-border)] bg-[var(--card-bg)] shadow-xl space-y-6">
              <div className="flex flex-col space-y-2 mb-6">
                <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Training Model</h3>
                <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest font-bold">Neural Net Confidence</span>
              </div>
              <div className="space-y-4 font-mono text-xs font-bold uppercase tracking-widest">
                <div className="space-y-1">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Sports (World Cup)</span>
                    <span>92%</span>
                  </div>
                  <div className="w-full bg-black/10 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Elections</span>
                    <span>81%</span>
                  </div>
                  <div className="w-full bg-black/10 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '81%' }}></div>
                  </div>
                </div>
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Pop Culture</span>
                    <span>45% (Needs Data)</span>
                  </div>
                  <div className="w-full bg-black/10 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Action Log */}
            <div className="glass p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-[var(--glass-border)] bg-[var(--card-bg)] shadow-xl space-y-6 h-80 overflow-y-auto">
              <div className="flex items-center gap-3 border-b border-[var(--glass-border)] pb-4 mb-4">
                <Terminal className="w-5 h-5 text-[var(--text-secondary)]" />
                <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Agent Action Log</h3>
              </div>
              <div className="space-y-4">
                {autoPredictEnabled ? (
                  <>
                    <div className="flex items-start gap-3">
                      <span className="text-emerald-500 mt-0.5 animate-pulse">●</span>
                      <div className="font-mono text-xs">
                        <span className="text-[var(--text-secondary)]">[{new Date().toLocaleTimeString()}]</span> <span className="text-[var(--text-primary)] font-bold">Scanning for new polls...</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 opacity-50">
                      <span className="text-emerald-500 mt-0.5">●</span>
                      <div className="font-mono text-xs">
                        <span className="text-[var(--text-secondary)]">Yesterday</span> <span className="text-[var(--text-primary)] font-bold">Model updated with 5 new votes.</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-50 pt-8">
                    <Bot className="w-8 h-8 text-[var(--text-secondary)]" />
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Agent Sleeping</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
}
