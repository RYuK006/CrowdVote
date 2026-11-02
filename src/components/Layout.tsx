import React, { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, Compass, Clapperboard, Send, Search, Heart, 
  SquarePlus, Menu, Grid, Sun, Moon, ShieldCheck, 
  ShieldAlert, LogOut, BarChart3, Settings, Trophy, X
} from "lucide-react";
import { cn } from "../lib/utils";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useTheme } from "../context/ThemeContext";
import { CreatePollModal } from "./CreatePollModal";
import { InstagramSearchDrawer } from "./InstagramSearchDrawer";
import { InstagramNotifications } from "./InstagramNotifications";
import { FloatingChatPill } from "./FloatingChatPill";

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
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const isAdminRoute = location.pathname.startsWith("/admin") && location.pathname !== "/admin-login";

  return (
    <div className="flex min-h-screen bg-[#000000] text-white selection:bg-emerald-500/20 font-sans">
      {/* 1. Left Slim Navigation Rail (Instagram Web Desktop) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[72px] bg-[#000000] border-r border-[#262626] flex-col justify-between items-center py-6 select-none">
        {/* Top Logo (Camera / Brand Emblem) */}
        <div className="flex flex-col items-center">
          <Link
            to="/polls"
            className="w-11 h-11 rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform group"
            title="CrowdVote Home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-lime-400 p-[1.5px] shadow-lg shadow-emerald-500/10">
              <div className="w-full h-full rounded-[10px] bg-black flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Center Primary Icons Stack */}
        <nav className="flex flex-col items-center gap-6 my-auto">
          {/* Home */}
          <Link
            to="/polls"
            title="Home"
            className={cn(
              "p-2.5 rounded-xl hover:bg-white/10 transition-all hover:scale-110 active:scale-95",
              location.pathname === "/polls" || location.pathname === "/" ? "text-white" : "text-stone-400 hover:text-white"
            )}
          >
            <Home className={cn("w-6 h-6", (location.pathname === "/polls" || location.pathname === "/") && "stroke-[2.5] text-emerald-400")} />
          </Link>

          {/* Reels / Trending / Leaderboard */}
          <Link
            to="/leaderboard"
            title="Leaderboard & Top Predictions"
            className={cn(
              "p-2.5 rounded-xl hover:bg-white/10 transition-all hover:scale-110 active:scale-95",
              location.pathname === "/leaderboard" ? "text-white" : "text-stone-400 hover:text-white"
            )}
          >
            <Clapperboard className={cn("w-6 h-6", location.pathname === "/leaderboard" && "stroke-[2.5] text-emerald-400")} />
          </Link>

          {/* Messages / Direct (With Red Badge 6) */}
          <Link
            to="/chat"
            title="Direct Messages"
            className={cn(
              "relative p-2.5 rounded-xl hover:bg-white/10 transition-all hover:scale-110 active:scale-95",
              location.pathname.startsWith("/chat") ? "text-white" : "text-stone-400 hover:text-white"
            )}
          >
            <Send className={cn("w-6 h-6 -rotate-12", location.pathname.startsWith("/chat") && "stroke-[2.5] text-emerald-400")} />
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-extrabold leading-none shadow-md">
              6
            </span>
          </Link>

          {/* Search */}
          <button
            onClick={() => {
              setIsSearchOpen(true);
              setIsNotificationsOpen(false);
              setIsMoreMenuOpen(false);
            }}
            title="Search"
            className={cn(
              "p-2.5 rounded-xl hover:bg-white/10 transition-all hover:scale-110 active:scale-95",
              isSearchOpen ? "text-emerald-400" : "text-stone-400 hover:text-white"
            )}
          >
            <Search className="w-6 h-6" />
          </button>

          {/* Notifications (With Red Badge 1) */}
          <button
            onClick={() => {
              setIsNotificationsOpen(true);
              setIsSearchOpen(false);
              setIsMoreMenuOpen(false);
            }}
            title="Notifications"
            className={cn(
              "relative p-2.5 rounded-xl hover:bg-white/10 transition-all hover:scale-110 active:scale-95",
              isNotificationsOpen ? "text-emerald-400" : "text-stone-400 hover:text-white"
            )}
          >
            <Heart className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-extrabold leading-none shadow-md">
              1
            </span>
          </button>

          {/* Create Poll */}
          <button
            onClick={() => {
              setIsCreateOpen(true);
              setIsMoreMenuOpen(false);
            }}
            title="Create Poll"
            className="p-2.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition-all hover:scale-110 active:scale-95"
          >
            <SquarePlus className="w-6 h-6" />
          </button>

          {/* Profile Avatar */}
          <Link
            to="/profile"
            title="Profile"
            className={cn(
              "p-1 rounded-full border-2 transition-all hover:scale-110 active:scale-95",
              location.pathname.startsWith("/profile") ? "border-emerald-500" : "border-transparent hover:border-white/40"
            )}
          >
            <div className="w-7 h-7 rounded-full bg-stone-900 overflow-hidden flex items-center justify-center">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-emerald-400">
                  {user?.displayName?.charAt(0) || "U"}
                </span>
              )}
            </div>
          </Link>
        </nav>

        {/* Bottom Icons (More Menu & App Switcher) */}
        <div className="flex flex-col items-center gap-4 relative">
          {/* More Popover Dropdown */}
          {isMoreMenuOpen && (
            <div 
              className="absolute left-16 bottom-2 w-60 bg-[#18181b] border border-[#2c2c30] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-left-2 duration-150 divide-y divide-white/5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-1 pb-1">
                <button
                  onClick={() => {
                    toggleTheme();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-white/10 flex items-center gap-3 text-xs font-semibold text-stone-200 transition-colors"
                >
                  {theme === "light" ? <Moon className="w-4 h-4 text-emerald-400" /> : <Sun className="w-4 h-4 text-emerald-400" />}
                  <span>Switch Appearance ({theme === "light" ? "Dark" : "Light"})</span>
                </button>

                <Link
                  to="/analytics"
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="w-full p-2.5 rounded-xl hover:bg-white/10 flex items-center gap-3 text-xs font-semibold text-stone-200 transition-colors"
                >
                  <BarChart3 className="w-4 h-4 text-stone-400" />
                  <span>Meta Analytics</span>
                </Link>

                <Link
                  to="/admin"
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="w-full p-2.5 rounded-xl hover:bg-white/10 flex items-center gap-3 text-xs font-semibold text-stone-200 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Admin Authority</span>
                </Link>
              </div>

              <div className="pt-1">
                {user ? (
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      signOut(auth);
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-red-500/10 text-red-400 flex items-center gap-3 text-xs font-semibold transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                ) : (
                  <Link
                    to="/signin"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="w-full p-2.5 rounded-xl hover:bg-emerald-500/10 text-emerald-400 flex items-center gap-3 text-xs font-semibold transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Log In</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* More Hamburger Menu */}
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            title="More Options"
            className={cn(
              "p-2.5 rounded-xl hover:bg-white/10 transition-all hover:scale-110 active:scale-95",
              isMoreMenuOpen ? "text-emerald-400" : "text-stone-400 hover:text-white"
            )}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Grid / Threads Icon */}
          <Link
            to="/docs"
            title="Protocol Documentation"
            className="p-2.5 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition-all hover:scale-110 active:scale-95"
          >
            <Grid className="w-6 h-6" />
          </Link>
        </div>
      </aside>

      {/* 2. Main Content Container */}
      <main className="flex-1 lg:ml-[72px] min-h-screen overflow-y-auto pb-16 lg:pb-0 bg-[#000000]">
        {children}
      </main>

      {/* 3. Floating Messages Pill in Bottom Right (Exact Replica of Screenshot) */}
      <FloatingChatPill unreadCount={6} />

      {/* 4. Instagram Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#000000]/95 border-t border-[#262626] backdrop-blur-xl flex items-center justify-around py-3 px-2">
        <Link
          to="/polls"
          className={cn(
            "p-1 transition-colors",
            location.pathname === "/polls" ? "text-emerald-400" : "text-stone-400"
          )}
        >
          <Home className="w-6 h-6" />
        </Link>

        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-1 text-stone-400 hover:text-white transition-colors"
        >
          <Search className="w-6 h-6" />
        </button>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="p-1 text-stone-400 hover:text-white transition-colors"
        >
          <SquarePlus className="w-6 h-6" />
        </button>

        <Link
          to="/chat"
          className={cn(
            "relative p-1 transition-colors",
            location.pathname.startsWith("/chat") ? "text-emerald-400" : "text-stone-400"
          )}
        >
          <Send className="w-6 h-6 -rotate-12" />
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-extrabold leading-none">
            6
          </span>
        </Link>

        <Link
          to="/profile"
          className={cn(
            "p-0.5 rounded-full border",
            location.pathname.startsWith("/profile") ? "border-emerald-400" : "border-transparent"
          )}
        >
          <div className="w-6 h-6 rounded-full bg-stone-900 overflow-hidden flex items-center justify-center">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-emerald-400">
                {user?.displayName?.charAt(0) || "U"}
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* 5. Modals & Drawers */}
      <CreatePollModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onPollCreated={() => {
          if (location.pathname === "/polls") {
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
