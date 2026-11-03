import React, { useState, useEffect } from "react";
import { Settings, AlertOctagon, Shield, Save, CheckCircle2 } from "lucide-react";
import { auth } from "../../firebase";

export function Config() {
  const [phase, setPhase] = useState("pre_election");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [minAccountAgeDays, setMinAccountAgeDays] = useState(0);
  const [maxDailyPollsPerUser, setMaxDailyPollsPerUser] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/admin/config", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPhase(data.phase || "pre_election");
        setMaintenanceMode(Boolean(data.maintenanceMode));
        setMinAccountAgeDays(data.minAccountAgeDays || 0);
        setMaxDailyPollsPerUser(data.maxDailyPollsPerUser || 10);
      }
    } catch (err) {
      console.error("Config fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          phase,
          maintenanceMode,
          minAccountAgeDays,
          maxDailyPollsPerUser
        })
      });
      if (res.ok) {
        setStatusMsg("Global protocol configuration synchronized.");
        setTimeout(() => setStatusMsg(null), 3000);
      }
    } catch (err) {
      console.error("Save config error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center font-mono text-xs text-stone-500 animate-pulse">
        Retrieving global protocol configuration...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-base font-extrabold text-white font-mono uppercase tracking-wider">
          Global Protocol Configuration
        </h2>
        <p className="text-xs text-stone-400 font-mono">
          System switches, emergency lockdown killswitches, and anti-Sybil requirements
        </p>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
          {statusMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        {/* Maintenance / Kill-switch */}
        <div className="p-5 rounded-2xl bg-[#0c0f16] border border-rose-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white font-mono">
                Emergency Maintenance Mode
              </span>
              <p className="text-[11px] text-stone-400 font-mono">
                Suspends all vote transactions across the network instantly
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={maintenanceMode}
            onChange={(e) => setMaintenanceMode(e.target.checked)}
            className="w-5 h-5 rounded accent-rose-500 cursor-pointer"
          />
        </div>

        {/* Global Protocol Phase */}
        <div className="p-5 rounded-2xl bg-[#0c0f16] border border-[#1b202c] flex flex-col gap-2">
          <label className="text-xs font-bold text-white font-mono uppercase">
            Active Consensus Phase
          </label>
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#121622] border border-[#22293a] text-xs text-white outline-none focus:border-emerald-500"
          >
            <option value="pre_election">Phase 1: Pre-Tournament / Candidate Proposals</option>
            <option value="campaign">Phase 2: Live Tournament / Forecasting Swarm</option>
            <option value="final">Phase 3: Final Resolution & Tallying</option>
            <option value="exit">Phase 4: Post-Mortem & Yield Distribution</option>
          </select>
        </div>

        {/* Anti-Sybil Constraints */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#0c0f16] border border-[#1b202c] flex flex-col gap-2">
            <label className="text-xs font-bold text-white font-mono uppercase">
              Min Account Age (Days)
            </label>
            <input
              type="number"
              min="0"
              value={minAccountAgeDays}
              onChange={(e) => setMinAccountAgeDays(Number(e.target.value))}
              className="px-3 py-2 rounded-xl bg-[#121622] border border-[#22293a] text-xs text-white outline-none focus:border-emerald-500 font-mono"
            />
            <span className="text-[10px] text-stone-500 font-mono">
              Accounts younger than this cannot propose new polls.
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0c0f16] border border-[#1b202c] flex flex-col gap-2">
            <label className="text-xs font-bold text-white font-mono uppercase">
              Max Daily Polls / User
            </label>
            <input
              type="number"
              min="1"
              value={maxDailyPollsPerUser}
              onChange={(e) => setMaxDailyPollsPerUser(Number(e.target.value))}
              className="px-3 py-2 rounded-xl bg-[#121622] border border-[#22293a] text-xs text-white outline-none focus:border-emerald-500 font-mono"
            />
            <span className="text-[10px] text-stone-500 font-mono">
              Prevents individual nodes from saturating the queue.
            </span>
          </div>
        </div>

        {/* Save CTA */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-mono font-extrabold uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mt-2"
        >
          <Save className="w-4 h-4" /> {saving ? "Updating..." : "Deploy Global Config"}
        </button>
      </form>
    </div>
  );
}
