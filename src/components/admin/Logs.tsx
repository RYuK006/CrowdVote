import React, { useState, useEffect } from "react";
import { Terminal, Shield, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { auth } from "../../firebase";

export function Logs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/admin/logs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Logs fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center font-mono text-xs text-stone-500 animate-pulse">
        Reading immutable security audit stream...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white font-mono uppercase tracking-wider">
            Audit Stream ({logs.length})
          </h2>
          <p className="text-xs text-stone-400 font-mono">
            Cryptographically sealed timeline of administrative actions and moderation events
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-stone-300"
        >
          Refresh
        </button>
      </div>

      {/* Logs stream */}
      {logs.length === 0 ? (
        <div className="p-12 rounded-2xl bg-black/40 border border-white/5 text-center text-xs font-mono text-stone-500">
          No audit logs recorded yet. All administrative operations are streamed here.
        </div>
      ) : (
        <div className="flex flex-col gap-2 font-mono text-xs">
          {logs.map((log) => {
            const isExpanded = expandedId === log.id;

            return (
              <div
                key={log.id}
                onClick={() => setExpandedId(isExpanded ? null : log.id)}
                className="p-3.5 rounded-xl bg-[#0a0d14] border border-[#1b202c] hover:border-emerald-500/40 cursor-pointer transition-colors flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronRight className="w-3.5 h-3.5 text-stone-500" />}
                    <span className="font-bold text-emerald-400">
                      [{log.action || "SYSTEM_EVENT"}]
                    </span>
                    <span className="text-stone-300">
                      Target: {log.targetType || "node"} / {log.targetId || "global"}
                    </span>
                  </div>

                  <span className="text-[10px] text-stone-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-stone-400 pl-5">
                  <span>Admin: {log.adminEmail || log.adminUid}</span>
                </div>

                {isExpanded && log.details && (
                  <div className="mt-2 p-3 rounded-lg bg-black/60 border border-white/5 text-[11px] text-emerald-300 overflow-x-auto">
                    <pre>{JSON.stringify(log.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
