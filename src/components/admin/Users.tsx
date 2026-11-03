import React, { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, Ban, EyeOff, CheckCircle2, Search, Sliders, User } from "lucide-react";
import { auth } from "../../firebase";
import { cn } from "../../lib/utils";

export function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Users fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserAction = async (uid: string, action: string, score?: number) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const res = await fetch(`/api/admin/users/${uid}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, score })
      });
      if (res.ok) {
        setStatusMsg(`User action '${action}' applied.`);
        setTimeout(() => setStatusMsg(null), 2500);
        fetchUsers();
      }
    } catch (err) {
      console.error("User action failed:", err);
    }
  };

  const handleRecalibrate = (uid: string, currentScore: number = 85) => {
    const input = window.prompt("Enter new calibrated accuracy score (0-100):", String(currentScore));
    if (input !== null) {
      const num = parseInt(input, 10);
      if (!isNaN(num)) {
        handleUserAction(uid, "recalibrate", num);
      }
    }
  };

  const filteredUsers = users.filter(u =>
    (u.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.uid || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-white font-mono uppercase tracking-wider">
            User Dossier ({filteredUsers.length})
          </h2>
          <p className="text-xs text-stone-400 font-mono">
            Manage forecaster credentials, compliance flags, and accuracy calibration
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-500" />
          <input
            type="text"
            placeholder="Search forecasters..."
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

      {/* Users table */}
      <div className="grid grid-cols-1 gap-2.5">
        {filteredUsers.map((user) => {
          const isBanned = Boolean(user.isBanned);
          const isShadowbanned = Boolean(user.isShadowbanned);
          const isVerified = Boolean(user.verified);

          return (
            <div
              key={user.uid}
              className="p-4 rounded-xl bg-[#0c0f16] border border-[#1b202c] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* User Identity */}
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`}
                  alt={user.displayName}
                  className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 object-cover shrink-0"
                />

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      {user.displayName || "Anonymous Forecaster"}
                    </span>
                    {isVerified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" title="Verified Forecaster" />
                    )}
                    {isBanned && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/40">
                        BANNED
                      </span>
                    )}
                    {isShadowbanned && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        SHADOW
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-stone-400 truncate">
                    {user.email || user.uid}
                  </span>

                  <span className="text-[10px] font-mono text-stone-500">
                    Accuracy: {user.accuracy ?? 85}% • Role: {user.role || "user"}
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                {/* Verify */}
                <button
                  type="button"
                  onClick={() => handleUserAction(user.uid, isVerified ? "unverify" : "verify")}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors border",
                    isVerified
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-white/5 hover:bg-white/10 text-stone-400 border-white/5"
                  )}
                  title="Toggle Verification"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </button>

                {/* Recalibrate Score */}
                <button
                  type="button"
                  onClick={() => handleRecalibrate(user.uid, user.accuracy)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-mono transition-colors border border-white/5 flex items-center gap-1"
                  title="Recalibrate accuracy points"
                >
                  <Sliders className="w-3.5 h-3.5 text-teal-400" /> Score
                </button>

                {/* Shadowban */}
                <button
                  type="button"
                  onClick={() => handleUserAction(user.uid, isShadowbanned ? "unshadowban" : "shadowban")}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors border",
                    isShadowbanned
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                      : "bg-white/5 hover:bg-white/10 text-stone-400 border-white/5"
                  )}
                  title="Toggle Shadowban"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </button>

                {/* Ban */}
                <button
                  type="button"
                  onClick={() => handleUserAction(user.uid, isBanned ? "unban" : "ban")}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors border",
                    isBanned
                      ? "bg-rose-500 text-black font-bold border-rose-400"
                      : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30"
                  )}
                  title="Toggle Global Ban"
                >
                  <Ban className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
