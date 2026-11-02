import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Swords, Trophy, BarChart3, User, LogOut, ShieldCheck, 
  Menu, X, ChevronLeft, ChevronRight, ShieldAlert, Users, Database, 
  Sun, Moon, PlusCircle, Send, CheckCircle2, Plus, Compass, MessageSquare
} from "lucide-react";
import { cn } from "../lib/utils";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { UnderDevelopmentPopup } from "./UnderDevelopmentPopup";
import { useTheme } from "../context/ThemeContext";
import { CreatePollModal } from "./CreatePollModal";

interface LayoutProps {
  children: ReactNode;
  user: any;
}

export function Layout({ children, user }: LayoutProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState({ title: "", message: "" });

  const defaultNavItems = [
    { label: "FEED", icon: Compass, path: "/polls" },
    { label: "MESSAGES", icon: Send, path: "/chat" },
    { label: "ELITE", icon: Trophy, path: "/leaderboard" },
    { label: "META", icon: BarChart3, path: "/analytics" },
    { label: "PROFILE", icon: User, path: "/profile" },
  ];

  const adminNavItems = [
    { label: "NODES", icon: Users, path: "/admin?tab=nodes" },
    { label: "MODERATION", icon: CheckCircle2, path: "/admin?tab=moderation" },
    { label: "STREAM", icon: Database, path: "/admin?tab=data" },
    { label: "HOST POLLS", icon: PlusCircle, path: "/admin?tab=host" },
  ];

  const isAdminRoute = location.pathname.startsWith("/admin") && location.pathname !== "/admin-login";
  const navItems = isAdminRoute ? adminNavItems : defaultNavItems;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)] transition-colors pb-16 lg:pb-0">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Instagram Web Style) */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 glass border-r border-[var(--glass-border)] lg:static lg:translate-x-0 bg-[var(--nav-bg)]",
        isCollapsed ? "w-20" : "w-64",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand Logo Header */}
        <div className={cn("p-6 flex items-center justify-between border-b border-[var(--glass-border)]/50", isCollapsed && "px-4")}>
          <Link to="/" className="flex items-center gap-3 overflow-hidden group">
            <div className={cn("w-9 h-9 rounded-xl flex shrink-0 items-center justify-center transition-transform group-hover:scale-105", isAdminRoute ? "bg-red-500 red-glow" : "bg-emerald-500 emerald-glow")}>
              {isAdminRoute ? <ShieldAlert className="text-black w-5 h-5" /> : <ShieldCheck className="text-black w-5 h-5" />}
            </div>
            {!isCollapsed && (
              <span className="font-bold text-lg tracking-tight whitespace-nowrap text-[var(--text-primary)]">
                {isAdminRoute ? (
                  <>Admin <span className="text-red-500">Command</span></>
                ) : (
                  <>CrowdVote <span className="text-emerald-500 font-mono text-sm uppercase tracking-widest">OS</span></>
                )}
              </span>
            )}
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-black/5 lg:hidden"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = (item.path.includes("?tab=") 
              ? location.search === item.path.split("?")[1] 
              : location.pathname === item.path && !location.search);

            const content = (
              <>
                <item.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", 
                   isActive 
                   ? (isAdminRoute ? "text-red-500" : "text-emerald-400") 
                   : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]")} />
                {!isCollapsed && (
                  <span className={cn("text-xs font-semibold tracking-wider whitespace-nowrap uppercase", isActive && "font-bold text-white")}>
                    {item.label}
                  </span>
                )}
                {isCollapsed && (
                  <div className={cn("absolute left-full ml-4 px-2 py-1 text-black text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap", isAdminRoute ? "bg-red-500" : "bg-emerald-500")}>
                    {item.label}
                  </div>
                )}
              </>
            );

            const className = cn(
              "flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-200 group relative w-full text-left",
              isActive
                ? (isAdminRoute ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20")
                : "text-[var(--text-primary)] hover:bg-white/5",
              isCollapsed && "justify-center px-0"
            );

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={className}
              >
                {content}
              </Link>
            );
          })}

          {/* Dedicated Create Poll Button (Instagram-Style Create Action) */}
          {!isAdminRoute && user && (
            <div className="pt-2">
              <button
                onClick={() => {
                  setIsCreateOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-200 group w-full text-left bg-emerald-500 text-black font-bold hover:bg-emerald-400 shadow-lg shadow-emerald-500/20",
                  isCollapsed && "justify-center px-0"
                )}
              >
                <Plus className="w-5 h-5 shrink-0 stroke-[3]" />
                {!isCollapsed && (
                  <span className="text-xs uppercase tracking-wider font-extrabold whitespace-nowrap">
                    CREATE POLL
                  </span>
                )}
              </button>
            </div>
          )}
        </nav>

        {/* User Card / Auth */}
        <div className="p-3 mt-auto border-t border-[var(--glass-border)]">
          {user ? (
            <div className={cn("p-3.5 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] space-y-3 overflow-hidden", isCollapsed && "p-2")}>
              <div className="flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-full flex shrink-0 items-center justify-center border", isAdminRoute ? "bg-red-500/20 border-red-500/30" : "bg-emerald-500/20 border-emerald-500/30")}>
                  <User className={cn("w-4 h-4", isAdminRoute ? "text-red-500" : "text-emerald-400")} />
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate">{user.displayName || (isAdminRoute ? "System Admin" : "Neural Predictor")}</span>
                    <span className={cn("text-[9px] font-mono tracking-tighter uppercase font-bold", isAdminRoute ? "text-red-500" : "text-emerald-400")}>
                      {isAdminRoute ? "Admin Authority" : "Active Node"}
                    </span>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <button
                  onClick={() => signOut(auth)}
                  className="w-full py-1.5 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-[10px] font-mono tracking-widest uppercase transition-colors text-[var(--text-secondary)] border border-white/5"
                >
                  DISCONNECT
                </button>
              )}
            </div>
          ) : (
            <Link
              to="/signin"
              className={cn(
                "flex items-center justify-center w-full py-3 rounded-2xl bg-emerald-500 text-black font-bold text-xs uppercase tracking-wider emerald-glow hover:bg-emerald-400 transition-all",
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
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-emerald-500 text-black items-center justify-center emerald-glow hover:scale-110 transition-transform z-50 shadow-md"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative flex flex-col bg-[var(--bg-primary)]">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-[var(--glass-border)] bg-[var(--nav-bg)]/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 shrink-0 transition-colors">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl hover:bg-white/5 lg:hidden text-[var(--text-primary)]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="lg:hidden font-bold text-base tracking-tight text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              CrowdVote
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Create Poll Button in Header for Mobile & Desktop */}
            {user && !isAdminRoute && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold hover:bg-emerald-500/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Poll</span>
              </button>
            )}

            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:emerald-glow transition-all group"
            >
              {theme === 'light' ? (
                <Sun className="w-4 h-4 text-emerald-500 group-hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-emerald-500 group-hover:-rotate-12 transition-transform" />
              )}
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-8 flex-1">
          {children}
        </div>
      </main>

      {/* Instagram-Style Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0c]/95 border-t border-white/10 backdrop-blur-xl flex items-center justify-around py-2.5 px-2">
        <Link
          to="/polls"
          className={cn(
            "flex flex-col items-center gap-1 p-1.5 transition-colors",
            location.pathname === "/polls" ? "text-emerald-400" : "text-stone-400"
          )}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[9px] font-mono uppercase font-bold">Feed</span>
        </Link>

        <Link
          to="/chat"
          className={cn(
            "flex flex-col items-center gap-1 p-1.5 transition-colors",
            location.pathname === "/chat" ? "text-emerald-400" : "text-stone-400"
          )}
        >
          <Send className="w-5 h-5" />
          <span className="text-[9px] font-mono uppercase font-bold">Direct</span>
        </Link>

        {user && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 -mt-3"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        )}

        <Link
          to="/leaderboard"
          className={cn(
            "flex flex-col items-center gap-1 p-1.5 transition-colors",
            location.pathname === "/leaderboard" ? "text-emerald-400" : "text-stone-400"
          )}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[9px] font-mono uppercase font-bold">Rank</span>
        </Link>

        <Link
          to="/profile"
          className={cn(
            "flex flex-col items-center gap-1 p-1.5 transition-colors",
            location.pathname === "/profile" ? "text-emerald-400" : "text-stone-400"
          )}
        >
          <User className="w-5 h-5" />
          <span className="text-[9px] font-mono uppercase font-bold">Profile</span>
        </Link>
      </div>

      {/* Global Create Poll Modal */}
      <CreatePollModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onPollCreated={() => {
          // If on polls or profile page, user can refresh or see toast
        }}
      />

      <UnderDevelopmentPopup 
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        title={popupData.title}
        message={popupData.message}
      />
    </div>
  );
}
