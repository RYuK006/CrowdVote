import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

export function Signin() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      // Check if user exists in backend
      const checkRes = await fetch("/api/user/check", {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      const checkData = await checkRes.json();

      if (checkData.exists) {
        setStep(2);
        setTimeout(() => navigate("/arena"), 1500);
      } else {
        // User doesn't exist, redirect to signup
        setError("Account not found. Redirecting to registration...");
        setTimeout(() => navigate("/signup"), 1500);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to authenticate with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-white/5 emerald-glow relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20">
          <motion.div
            className="h-full bg-emerald-500"
            animate={{ width: `${(step / 2) * 100}%` }}
          />
        </div>

        <div className="flex flex-col items-center text-center mb-10 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <ShieldCheck className="text-emerald-500 w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tighter">
            {step === 1 ? "Continue Sequence" : "Access Granted"}
          </h2>
          <p className="text-sm text-white/40">
            {step === 1 ? "Secure entry point for verified election archivists." : "Synchronizing with the swarm..."}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <button
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full py-4 rounded-2xl bg-white text-black font-bold text-sm hover:bg-gray-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="w-5 h-5" />
                {loading ? "AUTHENTICATING..." : "SIGN IN WITH GOOGLE"}
              </button>

              {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-10 space-y-6"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 emerald-glow">
                <CheckCircle2 className="text-emerald-500 w-10 h-10" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-emerald-500 font-mono text-xs uppercase tracking-widest">Protocol Success</p>
                <p className="text-white/40 text-sm">Redirecting to Neural Arena...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          <p className="text-xs text-white/20">
            New predictor? <Link to="/signup" className="text-emerald-500 hover:underline">Register Node</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
