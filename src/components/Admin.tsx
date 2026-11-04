import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  ShieldCheck, ListFilter, Sliders, Users as UsersIcon, 
  Sparkles, Flag, Terminal, Settings, AlertOctagon, Lock 
} from "lucide-react";
import { auth } from "../firebase";
import { Layout } from "./Layout";
import { cn } from "../lib/utils";
import { Queue } from "./admin/Queue";
import { Polls } from "./admin/Polls";
import { Users } from "./admin/Users";
import { Bounties } from "./admin/Bounties";
import { Reports } from "./admin/Reports";
import { Safety } from "./admin/Safety";
import { Logs } from "./admin/Logs";
import { Config } from "./admin/Config";

type AdminTab = "queue" | "polls" | "users" | "bounties" | "reports" | "safety" | "logs" | "config";

const ADMIN_TABS: Array<{ id: AdminTab; label: string; icon: any }> = [
  { id: "queue", label: "Queue", icon: ListFilter },
  { id: "polls", label: "Polls", icon: Sliders },
  { id: "users", label: "Users", icon: UsersIcon },
  { id: "bounties", label: "Bounties", icon: Sparkles },
  { id: "reports", label: "Reports", icon: Flag },
  { id: "safety", label: "Safety", icon: ShieldCheck },
  { id: "logs", label: "Logs", icon: Terminal },
  { id: "config", label: "Config", icon: Settings },
];

export function Admin() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const activeTab = (searchParams.get("tab") as AdminTab) || "queue";

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminPrivileges = async () => {
      const user = auth.currentUser;
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken(true);
        const res = await fetch("/api/user/check", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(Boolean(data.isAdmin));
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Admin verification error:", err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminPrivileges();
  }, [auth.currentUser]);

  const setTab = (tabId: AdminTab) => {
    navigate(`/admin?tab=${tabId}`);
  };

  if (loading) {
    return (
      <Layout user={auth.currentUser}>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="animate-pulse font-mono text-xs tracking-widest text-emerald-400">
            AUTHENTICATING ROOT CONSOLE CREDENTIALS...
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout user={auth.currentUser}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">404 • Not Found</h2>
          <p className="text-xs text-stone-500 font-mono">The requested terminal interface does not exist or has been cloaked.</p>
          <button
            onClick={() => navigate("/feed")}
            className="px-4 py-2 mt-2 bg-emerald-500 text-black font-bold text-xs rounded-xl"
          >
            Return to Feed
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={auth.currentUser}>
      <div className="pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* Terminal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6 pb-6 border-b border-[#181d28]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1.5px] shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full rounded-[10px] bg-black flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white uppercase font-mono">
                  Admin Console
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                  LEVEL 1 ROOT
                </span>
              </div>
              <p className="text-xs font-mono text-stone-400">
                Consensus mesh governance, safety quarantine, and escrow settlement
              </p>
            </div>
          </div>
        </div>

        {/* 8 Single-Word Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-4 border-b border-[#181d28] scrollbar-none">
          {ADMIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all whitespace-nowrap border",
                  isActive
                    ? "bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20"
                    : "bg-[#0b0e14] hover:bg-[#121622] text-stone-400 hover:text-white border-[#1d222e]"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-black" : "text-stone-400")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tab Workspace */}
        <div className="pt-6">
          {activeTab === "queue" && <Queue />}
          {activeTab === "polls" && <Polls />}
          {activeTab === "users" && <Users />}
          {activeTab === "bounties" && <Bounties />}
          {activeTab === "reports" && <Reports />}
          {activeTab === "safety" && <Safety />}
          {activeTab === "logs" && <Logs />}
          {activeTab === "config" && <Config />}
        </div>
      </div>
    </Layout>
  );
}
