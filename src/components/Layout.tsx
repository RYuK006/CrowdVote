import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Swords, Trophy, BarChart3, User, Settings, LogOut, ShieldCheck, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

interface LayoutProps {
  children: ReactNode;
  user: any;
}

export function Layout({ children, user }: LayoutProps) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "VOTING", icon: LayoutDashboard, path: "/voting" },
    { label: "ARENA", icon: Swords, path: "/arena" },
    { label: "ELITE", icon: Trophy, path: "/leaderboard" },
    { label: "META", icon: BarChart3, path: "/analytics" },
    { label: "VAULT", icon: ShieldCheck, path: "/profile" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505]">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 glass border-r border-white/5 lg:static lg:translate-x-0",
        isCollapsed ? "w-20" : "w-64",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className={cn("p-6 flex items-center justify-between", isCollapsed && "px-4")}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex shrink-0 items-center justify-center emerald-glow">
              <ShieldCheck className="text-black w-5 h-5" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-lg tracking-tight whitespace-nowrap">CrowdVote <span className="text-emerald-500">OS</span></span>
            )}
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-white/5 lg:hidden"
          >
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                location.pathname === item.path
                  ? "bg-emerald-500/10 text-emerald-500 emerald-glow"
                  : "text-white/40 hover:text-white hover:bg-white/5",
                isCollapsed && "justify-center px-0"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", location.pathname === item.path ? "text-emerald-500" : "text-white/20 group-hover:text-white/40")} />
              {!isCollapsed && (
                <span className="text-sm font-medium tracking-widest whitespace-nowrap">{item.label}</span>
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-emerald-500 text-black text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5">
          {user ? (
            <div className={cn("p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4 overflow-hidden", isCollapsed && "p-2")}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex shrink-0 items-center justify-center border border-emerald-500/30">
                  <User className="text-emerald-500 w-5 h-5" />
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{user.displayName || "Predictor"}</span>
                    <span className="text-[10px] text-emerald-500/60 font-mono tracking-tighter uppercase">Verified Node</span>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <button
                  onClick={() => signOut(auth)}
                  className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono tracking-widest uppercase transition-colors"
                >
                  TERM. LOGOUT
                </button>
              )}
            </div>
          ) : (
            <Link
              to="/signin"
              className={cn(
                "flex items-center justify-center w-full py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm emerald-glow hover:bg-emerald-400 transition-all",
                isCollapsed && "py-2"
              )}
            >
              {isCollapsed ? <ShieldCheck className="w-5 h-5" /> : "AUTHENTICATE"}
            </Link>
          )}
        </div>

        {/* Collapse Toggle (Desktop Only) */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-emerald-500 text-black items-center justify-center emerald-glow hover:scale-110 transition-transform z-50"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-white/5 lg:hidden"
            >
              <Menu className="w-5 h-5 text-white/40" />
            </button>
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-white/40 tracking-[0.2em] uppercase hidden sm:inline">Network Status: Optimal</span>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
              <span className="text-[10px] font-mono text-emerald-500 uppercase">Phase:</span>
              <span className="text-[10px] font-mono text-white uppercase tracking-wider">Pre-Election</span>
            </div>
            <Settings className="w-5 h-5 text-white/20 hover:text-white cursor-pointer transition-colors" />
          </div>
        </header>

        <div className="p-4 lg:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
