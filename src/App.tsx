import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import { ThemeProvider } from "./context/ThemeContext";

import { Landing } from "./components/Landing";
import { Signup } from "./components/Signup";
import { Signin } from "./components/Signin";
import { Arena } from "./components/Arena";
import { Leaderboard } from "./components/Leaderboard";
import { Analytics } from "./components/Analytics";
import { Profile } from "./components/Profile";
import { Admin } from "./components/Admin";
import { AdminLogin } from "./components/AdminLogin";
import { Voting } from "./components/Voting";
import { ErrorBoundary } from "./components/ErrorBoundary";

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
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-emerald-700 font-mono font-bold">
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
              <Route path="/" element={<Landing />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/signin" element={<Signin />} />
              <Route path="/arena" element={user ? <Arena /> : <Navigate to="/signin" />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/voting" element={user ? <Voting /> : <Navigate to="/signin" />} />
              <Route path="/profile" element={user ? <Profile /> : <Navigate to="/signin" />} />
              <Route path="/admin" element={user ? <Admin /> : <Navigate to="/admin-login" />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/adminlogin" element={<Navigate to="/admin-login" replace />} />
            </Routes>
          </Router>
        </ErrorBoundary>
      </div>
    </ThemeProvider>
  );
}
