/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";

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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-emerald-500 font-mono">
        INITIALIZING SWARM_OS...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30">
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
          </Routes>
        </Router>
      </ErrorBoundary>
    </div>
  );
}
