import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, UserPlus, Check, X, ShieldCheck, Sparkles } from "lucide-react";
import { FriendRequest } from "../types";
import { cn } from "../lib/utils";

interface InstagramNotificationsProps {
  currentUser: any;
  isOpen: boolean;
  onClose: () => void;
  onOpenFollowersModal?: () => void;
}

export function InstagramNotifications({
  currentUser,
  isOpen,
  onClose,
  onOpenFollowersModal,
}: InstagramNotificationsProps) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || !isOpen) return;

    currentUser.getIdToken().then((token: string) => {
      fetch("/api/user/friend-requests", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.incoming)) {
            setRequests(data.incoming);
          }
        })
        .catch(console.error);
    });
  }, [currentUser, isOpen]);

  const handleRespond = async (fromUid: string, action: "accept" | "decline") => {
    if (!currentUser) return;
    setRespondingId(fromUid);
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`/api/user/friend-request/${fromUid}/respond`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.fromUid !== fromUid));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRespondingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex select-none">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[390px] h-full bg-[#000000] border-r border-[#262626] shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
        {/* Header */}
        <div className="p-6 border-b border-[#262626] flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white tracking-tight">Notifications</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {/* Friend Requests Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Follow & Connection Requests ({requests.length})
              </span>
            </div>

            {requests.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                <span className="text-xs text-stone-400">
                  No pending connection requests
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {requests.map((req) => (
                  <div
                    key={req.id || req.fromUid}
                    className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-500/40">
                        {req.fromName?.charAt(0) || "P"}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white truncate block">
                          {req.fromName || req.fromUid}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          wants to connect as mutual forecaster
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRespond(req.fromUid, "accept")}
                        disabled={respondingId === req.fromUid}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleRespond(req.fromUid, "decline")}
                        disabled={respondingId === req.fromUid}
                        className="px-3 py-1.5 rounded-xl bg-white/10 text-stone-300 text-xs font-bold hover:bg-white/20 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider px-2 block">
              Consensus Activity
            </span>

            <div className="space-y-2">
              <div className="p-3 rounded-xl hover:bg-white/[0.04] transition-colors flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-900 border border-white/10 flex items-center justify-center text-red-500 shrink-0">
                  <Heart className="w-5 h-5 fill-red-500" />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <span className="font-bold text-white">Quantum Oracle</span>
                  <span className="text-stone-300"> endorsed your prediction thesis in </span>
                  <span className="font-semibold text-emerald-400">Autonomous Reasoning LLMs</span>
                  <span className="text-stone-500 text-[10px] block mt-0.5 font-mono">1h ago</span>
                </div>
              </div>

              <div className="p-3 rounded-xl hover:bg-white/[0.04] transition-colors flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-900 border border-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <span className="font-bold text-white">Polity Matrix</span>
                  <span className="text-stone-300"> subscribed to your prediction feed.</span>
                  <span className="text-stone-500 text-[10px] block mt-0.5 font-mono">5h ago</span>
                </div>
                <button
                  onClick={onOpenFollowersModal}
                  className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 shrink-0"
                >
                  View
                </button>
              </div>

              <div className="p-3 rounded-xl hover:bg-white/[0.04] transition-colors flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-900 border border-white/10 flex items-center justify-center text-amber-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <span className="font-bold text-white">Consensus Protocol</span>
                  <span className="text-stone-300"> calibrated your forecasting accuracy score to </span>
                  <span className="font-bold text-emerald-400">96.8% (Master Tier)</span>
                  <span className="text-stone-500 text-[10px] block mt-0.5 font-mono">1d ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
