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
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 dark:bg-[#080a0f] dark:text-[#f8fafc] selection:bg-emerald-500/25 font-sans flex flex-col transition-colors duration-200 relative overflow-x-hidden">
      {/* Ambient Glassmorphic Emerald Backlights */}
      <div className="fixed -top-24 left-1/4 w-[600px] h-[350px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 -right-20 w-[500px] h-[450px] bg-teal-500/8 dark:bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed -bottom-20 left-10 w-[550px] h-[400px] bg-emerald-500/8 dark:bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* 1. Universal Top Cyber-Terminal Navigation Bar with Frosted Glassmorphism */}
      <header className="sticky top-0 z-40 w-full h-16 bg-white/80 dark:bg-[#0c1017]/80 border-b border-emerald-500/20 dark:border-emerald-500/20 backdrop-blur-2xl px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3 transition-colors shadow-sm shadow-emerald-500/5">
        {/* Left: Brand Identity & Live Status */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          <Link to="/feed" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-lime-400 p-[1.5px] shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                CrowdVote <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] uppercase tracking-widest font-black">AI</span>
              </span>
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 tracking-wider font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                CONSENSUS MESH ACTIVE
              </span>
            </div>
          </Link>

          {/* Desktop Primary Navigation Tabs with Glass Pill */}
          <nav className="hidden md:flex items-center gap-1 ml-2 border-l border-slate-200/80 dark:border-emerald-500/20 pl-3">
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
                    "px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 backdrop-blur-md",
                    isActive
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-emerald-500/10 dark:text-slate-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20"
                  )}
                >
                  <item.icon className={cn("w-3.5 h-3.5", isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-400")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center: Quick Command / Search Bar with Frosted Glass */}
        <div className="hidden xl:flex items-center flex-1 max-w-sm mx-4 min-w-0">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full px-3.5 py-2 rounded-xl bg-white/70 hover:bg-white/90 dark:bg-[#121722]/70 dark:hover:bg-[#161d2a]/90 backdrop-blur-xl border border-slate-200/80 dark:border-emerald-500/20 hover:border-emerald-500/50 text-slate-500 dark:text-slate-400 text-xs flex items-center justify-between transition-all group shadow-sm min-w-0"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
              <Search className="w-3.5 h-3.5 text-emerald-500/70 group-hover:text-emerald-500 transition-colors shrink-0" />
              <span className="truncate whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs">Search markets, forecasters...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-white/80 dark:bg-[#0e1219]/80 border border-slate-200 dark:border-emerald-500/20 text-[10px] font-mono text-slate-500 dark:text-slate-400 shadow-sm shrink-0 ml-2 whitespace-nowrap">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Tablet & Mobile Search Icon Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="xl:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors"
            title="Search"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Create Market CTA with Luminous Emerald Glow */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-bold transition-all shadow-md shadow-emerald-500/25 active:scale-95 shrink-0 border border-emerald-400"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create</span>
          </button>

          {/* Direct Messages (E2EE Chat) with Frosted Glass */}
          <Link
            to="/chat"
            className={cn(
              "hidden md:flex relative p-2 rounded-xl border backdrop-blur-md transition-all shrink-0",
              location.pathname.startsWith("/chat")
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "bg-white/70 dark:bg-[#121722]/70 border-slate-200/80 dark:border-emerald-500/20 text-slate-600 hover:text-slate-900 hover:border-emerald-500/40 dark:text-slate-400 dark:hover:text-white"
            )}
            title="Encrypted Messenger"
          >
            <Send className="w-4 h-4 -rotate-12" />
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-extrabold leading-none">
              4
            </span>
          </Link>

          {/* Activity / Notifications Bell with Frosted Glass */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className={cn(
              "relative p-2 rounded-xl border backdrop-blur-md transition-all shrink-0",
              isNotificationsOpen
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "bg-white/70 dark:bg-[#121722]/70 border-slate-200/80 dark:border-emerald-500/20 text-slate-600 hover:text-slate-900 hover:border-emerald-500/40 dark:text-slate-400 dark:hover:text-white"
            )}
            title="Consensus Activity"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-extrabold leading-none shadow-[0_0_6px_rgba(16,185,129,0.7)]">
              1
            </span>
          </button>

          {/* Appearance Toggle (With Ripple from button) */}
          <button
            onClick={(e) => toggleTheme(e)}
            className="p-2 rounded-xl bg-white/70 hover:bg-white/90 dark:bg-[#121722]/70 dark:hover:bg-[#161d2a]/90 backdrop-blur-md border border-slate-200/80 dark:border-emerald-500/20 hover:border-emerald-500/40 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all active:scale-90 shrink-0"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 text-emerald-600 transition-transform duration-300" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300" />
            )}
          </button>

          {/* User Profile Pill & Dropdown with Frosted Glass */}
          <div className="relative shrink-0">
            {user ? (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-white/70 hover:bg-white/90 dark:bg-[#121722]/70 dark:hover:bg-[#161d2a]/90 backdrop-blur-md border border-slate-200/80 dark:border-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-sm"
              >
                <div className="flex flex-col text-right hidden 2xl:block">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[110px]">
                    {user.displayName || "Node Forecaster"}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    98.4% Accuracy
                  </span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30 overflow-hidden shrink-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user.displayName?.charAt(0) || "U"
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
              </button>
            ) : (
              <Link
                to="/signin"
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
              >
                Sign In
              </Link>
            )}

            {/* Profile Dropdown Menu with Frosted Glass */}
            {isUserMenuOpen && (
              <div 
                className="absolute right-0 top-12 w-56 bg-white/90 dark:bg-[#0c1017]/90 backdrop-blur-2xl border border-emerald-500/25 rounded-2xl shadow-2xl p-2 z-50 divide-y divide-slate-100 dark:divide-white/5 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2 space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                    {user?.displayName || "Forecasting Node"}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block truncate font-medium">
                    {user?.email}
                  </span>
                </div>

                <div className="py-1 space-y-1">
                  {/* Theme Switcher in Dropdown */}
                  <button
                    onClick={(e) => {
                      setIsUserMenuOpen(false);
                      toggleTheme(e);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-emerald-500/10 flex items-center justify-between text-xs text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {theme === "light" ? <Moon className="w-4 h-4 text-emerald-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
                      <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase">Toggle</span>
                  </button>

                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full px-3 py-2 rounded-xl hover:bg-emerald-500/10 flex items-center gap-2.5 text-xs text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors"
                  >
                    <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Forecaster Dossier</span>
                  </Link>

                  <Link
                    to="/ranks"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full px-3 py-2 rounded-xl hover:bg-emerald-500/10 flex items-center gap-2.5 text-xs text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors"
                  >
                    <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span>Global Rankings</span>
                  </Link>

                  <Link
                    to="/admin"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full px-3 py-2 rounded-xl hover:bg-emerald-500/10 flex items-center gap-2.5 text-xs text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors"
                  >
                    <ShieldAlert className="w-4 h-4 text-red-500 dark:text-red-400" />
                    <span>Admin Authority</span>
                  </Link>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      signOut(auth);
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center gap-2.5 text-xs font-semibold transition-colors"
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

      {/* 3. Mobile Bottom Navigation Deck with Frosted Glass */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 border-t border-emerald-500/20 dark:bg-[#0c1017]/80 dark:border-emerald-500/20 backdrop-blur-2xl px-2 py-1.5 flex items-center justify-around transition-colors shadow-lg">
        <Link
          to="/feed"
          className={cn(
            "flex flex-col items-center gap-0.5 p-1 transition-colors",
            location.pathname === "/feed" || location.pathname === "/polls" || location.pathname === "/" 
              ? "text-emerald-600 dark:text-emerald-400 font-bold" 
              : "text-slate-500 dark:text-slate-400"
          )}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Feed</span>
        </Link>

        <Link
          to="/swipe"
          className={cn(
            "flex flex-col items-center gap-0.5 p-1 transition-colors",
            location.pathname === "/swipe" || location.pathname === "/reels" 
              ? "text-emerald-600 dark:text-emerald-400 font-bold" 
              : "text-slate-500 dark:text-slate-400"
          )}
        >
          <Zap className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Swipe</span>
        </Link>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 -mt-3 active:scale-95 hover:bg-emerald-400 transition-all shrink-0 border border-emerald-400"
          title="Create Market"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
        </button>

        <Link
          to="/ranks"
          className={cn(
            "flex flex-col items-center gap-0.5 p-1 transition-colors",
            location.pathname === "/ranks" || location.pathname === "/leaderboard" 
              ? "text-emerald-600 dark:text-emerald-400 font-bold" 
              : "text-slate-500 dark:text-slate-400"
          )}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Ranks</span>
        </Link>

        <Link
          to="/chat"
          className={cn(
            "relative flex flex-col items-center gap-0.5 p-1 transition-colors",
            location.pathname.startsWith("/chat") 
              ? "text-emerald-600 dark:text-emerald-400 font-bold" 
              : "text-slate-500 dark:text-slate-400"
          )}
        >
          <Send className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Chat</span>
          <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-red-500" />
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
