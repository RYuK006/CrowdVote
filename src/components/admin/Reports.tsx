import React, { useState, useEffect } from "react";
import { AlertTriangle, Check, X, ShieldAlert, Flag } from "lucide-react";
import { auth } from "../../firebase";
import { cn } from "../../lib/utils";

export function Reports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/admin/reports", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Reports fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleAction = async (id: string, action: "resolve" | "dismiss") => {
    setActionLoading(id);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== id));
        setStatusMsg(`Report ${action}d.`);
        setTimeout(() => setStatusMsg(null), 2500);
      }
    } catch (err) {
      console.error("Report action error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center font-mono text-xs text-stone-500 animate-pulse">
        Fetching abuse reports from community safety mesh...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white font-mono uppercase tracking-wider">
            Abuse Reports ({reports.length})
          </h2>
          <p className="text-xs text-stone-400 font-mono">
            Triage community-flagged polls and offensive behavior reports
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-stone-300"
        >
          Refresh
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
          {statusMsg}
        </div>
      )}

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="p-12 rounded-2xl bg-black/40 border border-white/5 text-center text-xs font-mono text-stone-500">
          No pending reports. Zero community safety violations currently flagged.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-5 rounded-2xl bg-[#0c0f16] border border-[#1b202c] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                    <Flag className="w-3 h-3" /> Flagged Poll
                  </span>
                  <span className="text-[10px] font-mono text-stone-500">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white leading-snug">
                  {report.pollTitle || "Untitled Poll"}
                </h3>

                <p className="text-xs text-rose-300/90 font-mono bg-rose-950/20 p-2 rounded-lg border border-rose-500/20">
                  Reason: {report.reason}
                </p>

                <span className="text-[10px] font-mono text-stone-500">
                  Reported by: {report.reporterName || report.reporterUid}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={actionLoading === report.id}
                  onClick={() => handleAction(report.id, "dismiss")}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-bold font-mono transition-colors"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  disabled={actionLoading === report.id}
                  onClick={() => handleAction(report.id, "resolve")}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold font-mono transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Resolve Violation
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
