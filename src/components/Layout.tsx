import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Swords, Trophy, BarChart3, User, LogOut, ShieldCheck, Menu, X, ChevronLeft, ChevronRight, ShieldAlert, Users, Database, Sun, Moon, PlusCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { UnderDevelopmentPopup } from "./UnderDevelopmentPopup";
import { useTheme } from "../context/ThemeContext";

interface LayoutProps {
  children: ReactNode;
  user: any;
}

export function Layout({ children, user }: LayoutProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState({ title: "", message: "" });

  const defaultNavItems = [
    { label: "POLLS", icon: Swords, path: "/polls" },
    { label: "ELITE", icon: Trophy, path: "/leaderboard" },
    { label: "META", icon: BarChart3, path: "/analytics" },
    { label: "VAULT", icon: ShieldCheck, path: "/profile" },
  ];

  const adminNavItems = [
    { label: "NODES", icon: Users, path: "/admin?tab=nodes" },
    { label: "STREAM", icon: Database, path: "/admin?tab=data" },
    { label: "HOST POLLS", icon: PlusCircle, path: "/admin?tab=host" },
  ];

  const isAdminRoute = location.pathname.startsWith("/admin") && location.pathname !== "/admin-login";
  const navItems = isAdminRoute ? adminNavItems : defaultNavItems;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)] transition-colors">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 glass border-r border-[var(--glass-border)] lg:static lg:translate-x-0 bg-[var(--nav-bg)]",
        isCollapsed ? "w-20" : "w-64",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className={cn("p-6 flex items-center justify-between", isCollapsed && "px-4")}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={cn("w-8 h-8 rounded-lg flex shrink-0 items-center justify-center", isAdminRoute ? "bg-red-500 red-glow" : "bg-emerald-500 emerald-glow")}>
              {isAdminRoute ? <ShieldAlert className="text-black w-5 h-5" /> : <ShieldCheck className="text-black w-5 h-5" />}
            </div>
            {!isCollapsed && (
              <span className="font-bold text-lg tracking-tight whitespace-nowrap text-[var(--text-primary)]">
                {isAdminRoute ? (
                  <>Admin <span className="text-red-500">Command</span></>
                ) : (
                  <>CrowdVote <span className="text-emerald-500">OS</span></>
                )}
              </span>
            )}
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-black/5 lg:hidden"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isUnderConstruction = item.label === "ELITE" || item.label === "META";
            
            const content = (
              <>
                <item.icon className={cn("w-5 h-5 shrink-0", 
                   (item.path.includes("?tab=") ? location.search === item.path.split("?")[1] : location.pathname === item.path && !location.search)
                   ? (isAdminRoute ? "text-red-500" : "text-emerald-500") 
                   : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]")} />
                {!isCollapsed && (
                  <span className="text-sm font-medium tracking-widest whitespace-nowrap">{item.label}</span>
                )}
                {isCollapsed && (
                  <div className={cn("absolute left-full ml-4 px-2 py-1 text-black text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap", isAdminRoute ? "bg-red-500" : "bg-emerald-500")}>
                    {item.label}
                  </div>
                )}
              </>
            );

            const className = cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative w-full text-left",
              (item.path.includes("?tab=") ? location.search === item.path.split("?")[1] : location.pathname === item.path && !location.search)
                ? (isAdminRoute ? "bg-red-500/10 text-red-500 red-glow" : "bg-emerald-500/10 text-emerald-500 emerald-glow")
                : "text-[var(--text-primary)] hover:bg-[var(--glass-bg)]",
              isCollapsed && "justify-center px-0"
            );

            if (isUnderConstruction) {
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    setPopupData({
                      title: `${item.label} Module`,
                      message: `The ${item.label} system is currently being calibrated and will be online shortly.`
                    });
                    setShowPopup(true);
                  }}
                  className={className}
                >
                  {content}
                </button>
              );
            }

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
        </nav>

        <div className="p-4 mt-auto border-t border-[var(--glass-border)]">
          {user ? (
            <div className={cn("p-4 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] space-y-4 overflow-hidden", isCollapsed && "p-2")}>
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-full flex shrink-0 items-center justify-center border", isAdminRoute ? "bg-red-500/20 border-red-500/30" : "bg-emerald-500/20 border-emerald-500/30")}>
                  <User className={cn("w-5 h-5", isAdminRoute ? "text-red-500" : "text-emerald-500")} />
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-[var(--text-primary)] truncate">{user.displayName || (isAdminRoute ? "System Admin" : "Predictor")}</span>
                    <span className={cn("text-[10px] font-mono tracking-tighter uppercase font-bold", isAdminRoute ? "text-red-700" : "text-emerald-700")}>
                      {isAdminRoute ? "Admin Node" : "Verified Node"}
                    </span>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <button
                  onClick={() => signOut(auth)}
                  className="w-full py-2 rounded-lg bg-[var(--glass-bg)] hover:bg-black/10 text-[10px] font-mono tracking-widest uppercase transition-colors text-[var(--text-primary)]"
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
      <main className="flex-1 overflow-y-auto relative flex flex-col bg-[var(--bg-primary)]">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-[var(--glass-border)] bg-[var(--nav-bg)] backdrop-blur-md flex items-center justify-between px-4 lg:px-8 shrink-0 transition-colors">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-black/5 lg:hidden"
            >
              <Menu className="w-5 h-5 text-[var(--text-primary)]" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:emerald-glow transition-all group"
            >
              {theme === 'light' ? (
                <Sun className="w-5 h-5 text-emerald-500 group-hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-5 h-5 text-emerald-500 group-hover:-rotate-12 transition-transform" />
              )}
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-8 flex-1">
          {children}
        </div>
      </main>

      <UnderDevelopmentPopup 
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        title={popupData.title}
        message={popupData.message}
      />
    </div>
  );
}
