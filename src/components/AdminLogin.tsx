import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, CheckCircle2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";

export function AdminLogin() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any existing session to avoid token confusion
    signOut(auth);
  }, []);

  const handleGoogleAdminLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      // Check if user is admin in backend
      console.log(`[ADMIN_AUTH] Verifying node with Email: ${user.email}`);
      const checkRes = await fetch("/api/user/check", {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      const checkData = await checkRes.json();
      console.log(`[ADMIN_AUTH] Response:`, checkData);

      if (checkData.isAdmin) {
        setStep(2);
        setTimeout(() => navigate("/admin"), 1500);
      } else {
        // Not an admin, sign out and show error
        await signOut(auth);
        setError("UNAUTHORIZED: Your node is not registered in the 'admins' collection.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to authenticate with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#d6d6d6] flex items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-black/10 shadow-[0_0_50px_rgba(0,0,0,0.05)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500/20">
          <motion.div
            className="h-full bg-red-500"
            animate={{ width: `${(step / 2) * 100}%` }}
          />
        </div>

        <div className="flex flex-col items-center text-center mb-10 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <Shield className="text-red-500 w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tighter">
            {step === 1 ? "Admin Oversight" : "Access Confirmed"}
          </h2>
          <p className="text-sm text-slate-800 font-medium">
            {step === 1 ? "Authorized administrative node entry only." : "Synchronizing system permissions..."}
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
                onClick={handleGoogleAdminLogin}
                className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="w-5 h-5" />
                {loading ? "COMMUNICATING..." : "SIGN IN WITH GOOGLE"}
              </button>

              {error && (
                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 flex items-start gap-3">
                    <AlertTriangle className="text-red-500 w-4 h-4 shrink-0" />
                    <p className="text-[10px] font-mono text-red-700 uppercase leading-relaxed tracking-wider font-bold">{error}</p>
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-10 space-y-6"
            >
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <CheckCircle2 className="text-red-500 w-10 h-10" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-red-500 font-mono text-xs uppercase tracking-widest font-bold">Authority Recognized</p>
                <p className="text-slate-800 text-sm font-medium">Synchronizing with Command Node...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 pt-8 border-t border-black/10 text-center">
          <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest font-bold">
            Attention: All administrative actions are logged in the sovereign record.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
