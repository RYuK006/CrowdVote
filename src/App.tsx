import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import { ThemeProvider } from "./context/ThemeContext";

import { Landing } from "./components/Landing";
import { Signup } from "./components/Signup";
import { Signin } from "./components/Signin";
import { PollsList } from "./components/PollsList";
import { PollView } from "./components/PollView";
import { Swipe } from "./components/swipe/Swipe";
import { Ranks } from "./components/Ranks";
import { Analytics } from "./components/Analytics";
import { Profile } from "./components/Profile";
import { ChatDirect } from "./components/ChatDirect";
import { Admin } from "./components/Admin";
import { AdminLogin } from "./components/AdminLogin";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Documentation } from "./components/Documentation";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-emerald-500 font-mono font-bold tracking-widest">
        INITIALIZING SWARM_OS...
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-emerald-500/20 transition-colors">
        <ErrorBoundary>
          <Router>
            <Routes>
              {/* Canonical Landing & Information */}
              <Route path="/" element={<Landing />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/signin" element={<Signin />} />

              {/* Canonical Primary Feeds & Markets */}
              <Route path="/feed" element={<PollsList />} />
              <Route path="/swipe" element={<Swipe />} />
              <Route path="/ranks" element={<Ranks />} />
              <Route path="/polls/:pollId" element={<PollView />} />
              <Route path="/analytics" element={<Analytics />} />

              {/* Legacy Aliases & 301 Redirects */}
              <Route path="/polls" element={<Navigate to="/feed" replace />} />
              <Route path="/reels" element={<Navigate to="/swipe" replace />} />
              <Route path="/leaderboard" element={<Navigate to="/ranks" replace />} />
              <Route path="/direct" element={<Navigate to="/chat" replace />} />
              <Route path="/messages" element={<Navigate to="/chat" replace />} />

              {/* Authenticated Node Dossier & Encrypted Messenger */}
              <Route path="/profile" element={user ? <Profile /> : <Navigate to="/signin" />} />
              <Route path="/profile/:uid" element={user ? <Profile /> : <Navigate to="/signin" />} />
              <Route path="/chat" element={user ? <ChatDirect /> : <Navigate to="/signin" />} />

              {/* Governance & Console */}
              <Route path="/admin" element={user ? <Admin /> : <Navigate to="/admin-login" />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/adminlogin" element={<Navigate to="/admin-login" replace />} />

              {/* Catch-all redirect to canonical feed */}
              <Route path="*" element={<Navigate to="/feed" replace />} />
            </Routes>
          </Router>
        </ErrorBoundary>
      </div>
    </ThemeProvider>
  );
}
