import React, { useState, useEffect } from "react";
import { Check, X, ShieldAlert, Sparkles, Clock, User, AlertCircle } from "lucide-react";
import { auth } from "../../firebase";
import { cn } from "../../lib/utils";

export function Queue() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/admin/queue", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Queue fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionLoading(id);
    setStatusMessage(null);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const res = await fetch(`/api/admin/queue/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== id));
        setStatusMessage(`Poll ${action === "approve" ? "approved & deployed" : "rejected"}.`);
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err: any) {
      console.error("Action failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center font-mono text-xs text-stone-500 animate-pulse">
        Synchronizing pending triage queue...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white font-mono uppercase tracking-wider">
            Moderation Queue ({items.length})
          </h2>
          <p className="text-xs text-stone-400 font-mono">
            Review community submissions before releasing into global swarm consensus
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-stone-300 transition-colors"
        >
          Refresh
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
          {statusMessage}
        </div>
      )}

      {/* Items list */}
      {items.length === 0 ? (
        <div className="p-12 rounded-2xl bg-black/40 border border-white/5 text-center text-xs font-mono text-stone-500">
          No pending polls in queue. Swarm consensus is clear.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-[#0c0f16] border border-[#1b202c] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase">
                    {item.format || "choice"}
                  </span>
                  <span className="text-[10px] font-mono text-stone-400 bg-white/5 px-2 py-0.5 rounded-lg">
                    {item.category || "General"}
                  </span>
                  <span className="text-[10px] font-mono text-stone-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white leading-snug">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="text-xs text-stone-400 line-clamp-1">
                    {item.description}
                  </p>
                )}

                <span className="text-[10px] font-mono text-stone-500 flex items-center gap-1">
                  <User className="w-2.5 h-2.5" /> Proposed by {item.createdByName || item.createdBy}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={actionLoading === item.id}
                  onClick={() => handleAction(item.id, "reject")}
                  className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold font-mono transition-all border border-rose-500/30 flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
                <button
                  type="button"
                  disabled={actionLoading === item.id}
                  onClick={() => handleAction(item.id, "approve")}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-mono transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
