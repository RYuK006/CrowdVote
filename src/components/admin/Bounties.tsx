import React, { useState, useEffect } from "react";
import { Sparkles, DollarSign, CheckCircle2, AlertCircle, ArrowUpRight } from "lucide-react";
import { auth } from "../../firebase";
import { cn } from "../../lib/utils";

export function Bounties() {
  const [bounties, setBounties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutLoading, setPayoutLoading] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchBounties = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/admin/bounties", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBounties(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Bounties fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBounties();
  }, []);

  const handlePayout = async (bountyId: string) => {
    if (!window.confirm("Distribute escrow yield pool to highest-accuracy forecasters?")) return;
    setPayoutLoading(bountyId);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const res = await fetch(`/api/admin/bounties/${bountyId}/payout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      if (res.ok) {
        setStatusMsg("Escrow yield successfully settled to predictor balances.");
        setTimeout(() => setStatusMsg(null), 3000);
        fetchBounties();
      }
    } catch (err) {
      console.error("Payout error:", err);
    } finally {
      setPayoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center font-mono text-xs text-stone-500 animate-pulse">
        Auditing escrow contracts and sponsored bounties...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white font-mono uppercase tracking-wider">
            Sponsored Bounties ({bounties.length})
          </h2>
          <p className="text-xs text-stone-400 font-mono">
            Verify sponsor escrow deposits and execute yield payout distribution
          </p>
        </div>
        <button
          onClick={fetchBounties}
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

      {/* Bounties List */}
      {bounties.length === 0 ? (
        <div className="p-12 rounded-2xl bg-black/40 border border-white/5 text-center text-xs font-mono text-stone-500">
          No active sponsored escrow pools found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {bounties.map((b) => {
            const isDistributed = b.status === "distributed";

            return (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-[#0c0f16] border border-[#1b202c] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono font-extrabold uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {b.sponsorName}
                    </span>
                    <span className={cn(
                      "text-[10px] font-mono px-2 py-0.5 rounded-md",
                      isDistributed ? "bg-emerald-500/10 text-emerald-400" : "bg-teal-500/10 text-teal-400"
                    )}>
                      {isDistributed ? "SETTLED" : "ACTIVE ESCROW"}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug">
                    {b.pollTitle}
                  </h3>

                  <span className="text-xs font-mono text-amber-400 font-semibold">
                    Escrow Pool: {b.escrowAmount}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isDistributed && (
                    <button
                      type="button"
                      disabled={payoutLoading === b.id}
                      onClick={() => handlePayout(b.id)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-bold font-mono transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> Execute Payout
                    </button>
                  )}
                  {isDistributed && (
                    <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Distributed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
