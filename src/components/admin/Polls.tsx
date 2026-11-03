import React, { useState, useEffect } from "react";
import { Lock, Unlock, Trash2, Pin, CheckCircle2, Search, Sparkles } from "lucide-react";
import { auth } from "../../firebase";
import { cn } from "../../lib/utils";

export function Polls() {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPoll, setSelectedPoll] = useState<any | null>(null);
  const [winningOptionId, setWinningOptionId] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchPolls = async () => {
    try {
      const res = await fetch("/api/polls?limit=100");
      if (res.ok) {
        const data = await res.json();
        setPolls(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Polls fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const handlePatch = async (pollId: string, updates: any) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const res = await fetch(`/api/admin/polls/${pollId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setPolls(prev => prev.map(p => p.id === pollId ? { ...p, ...updates } : p));
        setStatusMsg("Poll updated.");
        setTimeout(() => setStatusMsg(null), 2500);
      }
    } catch (err) {
      console.error("Patch error:", err);
    }
  };

  const handleDelete = async (pollId: string) => {
    if (!window.confirm("Permanently delete this poll from Firestore?")) return;
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const res = await fetch(`/api/admin/polls/${pollId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPolls(prev => prev.filter(p => p.id !== pollId));
        setStatusMsg("Poll deleted.");
        setTimeout(() => setStatusMsg(null), 2500);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoll || !winningOptionId) return;

    setIsResolving(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const res = await fetch(`/api/admin/polls/${selectedPoll.id}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ winningOptionId })
      });
      if (res.ok) {
        setStatusMsg("Poll resolved and points distributed!");
        setSelectedPoll(null);
        fetchPolls();
      }
    } catch (err) {
      console.error("Resolve error:", err);
    } finally {
      setIsResolving(false);
    }
  };

  const filteredPolls = polls.filter(p =>
    (p.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-white font-mono uppercase tracking-wider">
            Polls Manager ({filteredPolls.length})
          </h2>
          <p className="text-xs text-stone-400 font-mono">
            Lock, pin, adjust expiration, or resolve official consensus winners
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-500" />
          <input
            type="text"
            placeholder="Search polls..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#10141d] border border-[#202636] text-xs text-white placeholder-stone-500 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
          {statusMsg}
        </div>
      )}

      {/* Resolution Modal */}
      {selectedPoll && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0c0f16] border border-[#1e2330] p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase">
              Resolve Outcome: {selectedPoll.title}
            </h3>
            <p className="text-xs text-stone-400 font-mono">
              Select the validated consensus winner to distribute forecaster yield.
            </p>

            <form onSubmit={handleResolve} className="space-y-4">
              <div className="space-y-2">
                {(selectedPoll.options || []).map((opt: any) => (
                  <label
                    key={opt.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                      winningOptionId === opt.id
                        ? "bg-emerald-500/15 border-emerald-500 text-white"
                        : "bg-[#121622] border-[#22293a] text-stone-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="winner"
                      value={opt.id}
                      checked={winningOptionId === opt.id}
                      onChange={() => setWinningOptionId(opt.id)}
                      className="accent-emerald-500"
                    />
                    <span className="text-xs font-semibold">{opt.name || opt.text || opt.id}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPoll(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!winningOptionId || isResolving}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs font-mono"
                >
                  {isResolving ? "Distributing..." : "Confirm Winner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Polls table */}
      <div className="grid grid-cols-1 gap-2.5">
        {filteredPolls.map((poll) => {
          const isClosed = poll.status === "closed";
          const isPinned = Boolean(poll.isPinned);

          return (
            <div
              key={poll.id}
              className="p-4 rounded-xl bg-[#0c0f16] border border-[#1b202c] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold uppercase">
                    {poll.format || "choice"}
                  </span>
                  <span className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded-md",
                    isClosed ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
                  )}>
                    {poll.status || "active"}
                  </span>
                  {isPinned && (
                    <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Pin className="w-2.5 h-2.5" /> Pinned
                    </span>
                  )}
                </div>

                <span className="text-xs font-bold text-white truncate max-w-lg">
                  {poll.title}
                </span>

                <span className="text-[10px] font-mono text-stone-500">
                  ID: {poll.id} • Votes: {poll.totalVotes || 0}
                </span>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handlePatch(poll.id, { isPinned: !isPinned })}
                  className={cn(
                    "p-2 rounded-lg text-xs font-mono transition-colors",
                    isPinned ? "bg-amber-500/20 text-amber-300" : "bg-white/5 text-stone-400 hover:text-white"
                  )}
                  title="Toggle Pin"
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handlePatch(poll.id, { status: isClosed ? "active" : "closed" })}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white text-xs font-mono transition-colors"
                  title={isClosed ? "Reopen Poll" : "Lock Poll"}
                >
                  {isClosed ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPoll(poll)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold transition-colors border border-emerald-500/20 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(poll.id)}
                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                  title="Delete Poll"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
