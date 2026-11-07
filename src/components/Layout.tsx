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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 dark:bg-[#080a0f] dark:text-[#f8fafc] selection:bg-emerald-500/25 font-sans flex flex-col transition-colors duration-200">
      {/* 1. Universal Top Cyber-Terminal Navigation Bar */}
      <header className="sticky top-0 z-40 w-full h-16 bg-white/95 border-b border-slate-200 dark:bg-[#0e1219]/95 dark:border-[#1e2533] backdrop-blur-xl px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3 transition-colors">
        {/* Left: Brand Identity & Live Status */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          <Link to="/feed" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-lime-400 p-[1.5px] shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                CrowdVote <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] uppercase tracking-widest font-black">AI</span>
              </span>
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                CONSENSUS MESH ACTIVE
              </span>
            </div>
          </Link>

          {/* Desktop Primary Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 ml-2 border-l border-slate-200 dark:border-[#1e2533] pl-3">
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
                    "px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5",
                    isActive
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#141923]"
                  )}
                >
                  <item.icon className={cn("w-3.5 h-3.5", isActive ? "text-white dark:text-slate-950" : "text-slate-400 dark:text-slate-500")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center: Quick Command / Search Bar (Cleanly shown on XL screens) */}
        <div className="hidden xl:flex items-center flex-1 max-w-sm mx-4 min-w-0">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-100/90 hover:bg-slate-200/90 border border-slate-200 hover:border-slate-300 text-slate-500 dark:bg-[#121722] dark:hover:bg-[#171e2b] dark:border-[#1e2533] dark:hover:border-slate-700 dark:text-slate-400 text-xs flex items-center justify-between transition-all group shadow-sm min-w-0"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors shrink-0" />
              <span className="truncate whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs">Search markets, forecasters...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#0e1219] border border-slate-200 dark:border-[#1e2533] text-[10px] font-mono text-slate-500 dark:text-slate-400 shadow-sm shrink-0 ml-2 whitespace-nowrap">
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

          {/* Create Market CTA */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create</span>
          </button>

          {/* Direct Messages (E2EE Chat) */}
          <Link
            to="/chat"
            className={cn(
              "hidden md:flex relative p-2 rounded-xl border transition-colors shrink-0",
              location.pathname.startsWith("/chat")
                ? "bg-slate-100 border-slate-300 text-slate-900 dark:bg-[#141923] dark:border-slate-700 dark:text-white"
                : "bg-slate-100/90 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:bg-[#121722] dark:border-[#1e2533] dark:text-slate-400 dark:hover:text-white dark:hover:border-slate-700"
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
              "relative p-2 rounded-xl border transition-colors shrink-0",
              isNotificationsOpen
                ? "bg-slate-100 border-slate-300 text-slate-900 dark:bg-[#141923] dark:border-slate-700 dark:text-white"
                : "bg-slate-100/90 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:bg-[#121722] dark:border-[#1e2533] dark:text-slate-400 dark:hover:text-white dark:hover:border-slate-700"
            )}
            title="Consensus Activity"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-extrabold leading-none">
              1
            </span>
          </button>

          {/* Appearance Toggle (With Ripple from button) */}
          <button
            onClick={(e) => toggleTheme(e)}
            className="p-2 rounded-xl bg-slate-100/90 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 dark:bg-[#121722] dark:border-[#1e2533] dark:text-slate-400 dark:hover:text-white transition-all active:scale-90 shrink-0"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300" />
            )}
          </button>

          {/* User Profile Pill & Dropdown */}
          <div className="relative shrink-0">
            {user ? (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-slate-100/90 border border-slate-200 hover:border-slate-300 dark:bg-[#121722] dark:border-[#1e2533] dark:hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col text-right hidden 2xl:block">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[110px]">
                    {user.displayName || "Node Forecaster"}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    98.4% Accuracy
                  </span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-[#1a2130] text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs border border-slate-300 dark:border-[#263147] overflow-hidden shrink-0">
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
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-xs font-bold transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Profile Dropdown Menu */}
            {isUserMenuOpen && (
              <div 
                className="absolute right-0 top-12 w-56 bg-white dark:bg-[#0e1219] border border-slate-200 dark:border-[#1e2533] rounded-2xl shadow-2xl p-2 z-50 divide-y divide-slate-100 dark:divide-white/5 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2 space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                    {user?.displayName || "Forecasting Node"}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block truncate">
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
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-between text-xs text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {theme === "light" ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
                      <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold uppercase">Toggle</span>
                  </button>

                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5 text-xs text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span>Forecaster Dossier</span>
                  </Link>

                  <Link
                    to="/ranks"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5 text-xs text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                  >
                    <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span>Global Rankings</span>
                  </Link>

                  <Link
                    to="/admin"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2.5 text-xs text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
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

      {/* 3. Mobile Bottom Navigation Deck */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200 dark:bg-[#0e1219]/95 dark:border-[#1e2533] backdrop-blur-xl px-2 py-1.5 flex items-center justify-around transition-colors">
        <Link
          to="/feed"
          className={cn(
            "flex flex-col items-center gap-0.5 p-1 transition-colors",
            location.pathname === "/feed" || location.pathname === "/polls" || location.pathname === "/" 
              ? "text-slate-900 dark:text-white font-bold" 
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
              ? "text-slate-900 dark:text-white font-bold" 
              : "text-slate-500 dark:text-slate-400"
          )}
        >
          <Zap className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Swipe</span>
        </Link>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 -mt-3 active:scale-95 hover:bg-emerald-400 transition-all shrink-0"
          title="Create Market"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
        </button>

        <Link
          to="/ranks"
          className={cn(
            "flex flex-col items-center gap-0.5 p-1 transition-colors",
            location.pathname === "/ranks" || location.pathname === "/leaderboard" 
              ? "text-slate-900 dark:text-white font-bold" 
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
              ? "text-slate-900 dark:text-white font-bold" 
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
