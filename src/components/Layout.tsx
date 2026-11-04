import React, { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  BarChart3, Zap, Trophy, TrendingUp, Send, Search, Bell, 
  Plus, Sun, Moon, ShieldCheck, ShieldAlert, LogOut, User, 
  Menu, X, Sparkles, ChevronDown, CheckCircle2 
} from "lucide-react";
import { cn } from "../lib/utils";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useTheme } from "../context/ThemeContext";
import { CreatePollModal } from "./CreatePollModal";
import { InstagramSearchDrawer } from "./InstagramSearchDrawer";
import { InstagramNotifications } from "./InstagramNotifications";

interface LayoutProps {
  children: ReactNode;
  user: any;
}

export function Layout({ children, user }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const isAdminRoute = location.pathname.startsWith("/admin") && location.pathname !== "/admin-login";

  const navLinks = [
    { label: "Feed", path: "/feed", icon: BarChart3 },
    { label: "Swipe", path: "/swipe", icon: Zap },
    { label: "Ranks", path: "/ranks", icon: Trophy },
    { label: "Chat", path: "/chat", icon: Send },
  ];

  return (
    <div className="min-h-screen bg-[#060709] text-white selection:bg-emerald-500/25 font-sans flex flex-col">
      {/* 1. Universal Top Cyber-Terminal Navigation Bar */}
      <header className="sticky top-0 z-40 w-full h-16 bg-[#090b0e]/95 border-b border-[#181b22] backdrop-blur-xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Brand Identity & Live Status */}
        <div className="flex items-center gap-6">
          <Link to="/feed" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-lime-400 p-[1.5px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-[10px] bg-black flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
                CrowdVote <span className="text-emerald-400 font-mono text-xs uppercase tracking-widest font-black">AI</span>
              </span>
              <span className="hidden sm:flex items-center gap-1.5 text-[9px] font-mono text-stone-400 tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                CONSENSUS MESH ACTIVE
              </span>
            </div>
          </Link>

          {/* Desktop Primary Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 ml-4 border-l border-[#1f232b] pl-4">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === "/feed" && (location.pathname === "/polls" || location.pathname === "/")) ||
                (item.path === "/swipe" && location.pathname === "/reels") ||
                (item.path === "/ranks" && location.pathname === "/leaderboard");

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2",
                    isActive
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
                      : "text-stone-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn("w-3.5 h-3.5", isActive ? "text-emerald-400" : "text-stone-500")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center: Quick Command / Search Bar */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full px-4 py-2 rounded-xl bg-[#111318] hover:bg-[#161920] border border-[#20242e] hover:border-emerald-500/40 text-stone-400 text-xs flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-stone-500 group-hover:text-emerald-400 transition-colors" />
              <span>Search markets, forecasters, topics...</span>
            </div>
            <kbd className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-mono text-stone-400">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="lg:hidden p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/5"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Create Market CTA */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Create</span>
          </button>

          {/* Direct Messages (E2EE Chat) */}
          <Link
            to="/chat"
            className={cn(
              "relative p-2 rounded-xl border transition-colors",
              location.pathname.startsWith("/chat")
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                : "bg-[#111318] border-[#20242e] text-stone-400 hover:text-white hover:border-white/20"
            )}
            title="Encrypted Messenger"
          >
            <Send className="w-4 h-4 -rotate-12" />
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-extrabold leading-none">
              4
            </span>
          </Link>

          {/* Activity / Notifications Bell */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className={cn(
              "relative p-2 rounded-xl border transition-colors",
              isNotificationsOpen
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                : "bg-[#111318] border-[#20242e] text-stone-400 hover:text-white hover:border-white/20"
            )}
            title="Consensus Activity"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-black text-[9px] font-extrabold leading-none">
              1
            </span>
          </button>

          {/* Appearance Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[#111318] border border-[#20242e] text-stone-400 hover:text-white transition-colors"
            title="Toggle Appearance"
          >
            {theme === "light" ? <Moon className="w-4 h-4 text-emerald-400" /> : <Sun className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* User Profile Pill & Dropdown */}
          <div className="relative">
            {user ? (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-[#111318] border border-[#20242e] hover:border-emerald-500/40 transition-all"
              >
                <div className="flex flex-col text-right hidden sm:block">
                  <span className="text-xs font-bold text-white truncate max-w-[100px]">
                    {user.displayName || "Node Forecaster"}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                    98.4% Accuracy
                  </span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30 overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user.displayName?.charAt(0) || "U"
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>
            ) : (
              <Link
                to="/signin"
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Profile Dropdown Menu */}
            {isUserMenuOpen && (
              <div 
                className="absolute right-0 top-12 w-56 bg-[#111318] border border-[#20242e] rounded-2xl shadow-2xl p-2 z-50 divide-y divide-white/5 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2 space-y-0.5">
                  <span className="text-xs font-bold text-white block truncate">
                    {user?.displayName || "Forecasting Node"}
                  </span>
                  <span className="text-[10px] font-mono text-stone-400 block truncate">
                    {user?.email}
                  </span>
                </div>

                <div className="py-1 space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full px-3 py-2 rounded-xl hover:bg-white/5 flex items-center gap-2.5 text-xs text-stone-300 hover:text-white transition-colors"
                  >
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>Forecaster Dossier</span>
                  </Link>

                  <Link
                    to="/ranks"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full px-3 py-2 rounded-xl hover:bg-white/5 flex items-center gap-2.5 text-xs text-stone-300 hover:text-white transition-colors"
                  >
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Global Rankings</span>
                  </Link>

                  <Link
                    to="/admin"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full px-3 py-2 rounded-xl hover:bg-white/5 flex items-center gap-2.5 text-xs text-stone-300 hover:text-white transition-colors"
                  >
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span>Admin Authority</span>
                  </Link>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      signOut(auth);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-400 flex items-center gap-2.5 text-xs font-semibold transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Disconnect Node</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Content Canvas */}
      <main className="flex-1 w-full pb-20 md:pb-8">
        {children}
      </main>

      {/* 3. Mobile Bottom Navigation Deck */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090b0e]/95 border-t border-[#181b22] backdrop-blur-xl px-2 py-1.5 flex items-center justify-around">
        <Link
          to="/feed"
          className={cn(
            "flex flex-col items-center gap-1 p-1 transition-colors",
            location.pathname === "/feed" || location.pathname === "/polls" || location.pathname === "/" ? "text-emerald-400" : "text-stone-400"
          )}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Feed</span>
        </Link>

        <Link
          to="/swipe"
          className={cn(
            "flex flex-col items-center gap-1 p-1 transition-colors",
            location.pathname === "/swipe" || location.pathname === "/reels" ? "text-emerald-400" : "text-stone-400"
          )}
        >
          <Zap className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Swipe</span>
        </Link>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 -mt-3 active:scale-95 hover:bg-emerald-400 transition-all"
          title="Create Market"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
        </button>

        <Link
          to="/ranks"
          className={cn(
            "flex flex-col items-center gap-1 p-1 transition-colors",
            location.pathname === "/ranks" || location.pathname === "/leaderboard" ? "text-emerald-400" : "text-stone-400"
          )}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Ranks</span>
        </Link>

        <Link
          to="/chat"
          className={cn(
            "relative flex flex-col items-center gap-1 p-1 transition-colors",
            location.pathname.startsWith("/chat") ? "text-emerald-400" : "text-stone-400"
          )}
        >
          <Send className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Chat</span>
          <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-red-500" />
        </Link>
      </nav>

      {/* 4. Global Modals & Drawers */}
      <CreatePollModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          if (location.pathname === "/feed" || location.pathname === "/polls") {
            window.location.reload();
          }
        }}
      />

      <InstagramSearchDrawer
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <InstagramNotifications
        currentUser={user}
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
}
