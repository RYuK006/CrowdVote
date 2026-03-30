import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Phone, ArrowRight, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, signOut } from "firebase/auth";

export function AdminLogin() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any existing session to avoid token confusion
    signOut(auth);

    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
    (window as any).recaptchaVerifier = verifier;

    return () => {
      if (verifier) {
        verifier.clear();
        delete (window as any).recaptchaVerifier;
      }
    };
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const appVerifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(result);
      setStep(2);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send OTP. Ensure phone number is in E.164 format.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!confirmationResult) throw new Error("No confirmation result found.");
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      const idToken = await user.getIdToken();

      // Check if user is admin in backend
      console.log(`[ADMIN_AUTH] Verifying node with UID: ${user.uid}`);
      const checkRes = await fetch("/api/user/check", {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      const checkData = await checkRes.json();
      console.log(`[ADMIN_AUTH] Response:`, checkData);

      if (checkData.isAdmin) {
        setStep(3);
        setTimeout(() => navigate("/admin"), 1500);
      } else {
        // Not an admin, sign out and show error
        await signOut(auth);
        setError("UNAUTHORIZED: Your node is not registered in the 'admins' collection.");
        setStep(1);
        setOtp("");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 sm:p-8">
      <div id="recaptcha-container"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-red-500/10 shadow-[0_0_50px_rgba(239,68,68,0.05)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500/20">
          <motion.div
            className="h-full bg-red-500"
            animate={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="flex flex-col items-center text-center mb-10 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <Shield className="text-red-500 w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tighter">
            {step === 1 ? "Admin Oversight" : step === 2 ? "Security Node" : "Access Confirmed"}
          </h2>
          <p className="text-sm text-white/40">
            {step === 1 ? "Authorized administrative node entry only." : step === 2 ? "Enter the administrative access key." : "Synchronizing system permissions..."}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSendOtp}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-red-500 uppercase tracking-widest ml-4 font-bold">Admin Phone</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-red-500 transition-colors" />
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 00000 00000"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-red-500/50 transition-all font-mono"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 flex items-start gap-3">
                    <AlertTriangle className="text-red-500 w-4 h-4 shrink-0" />
                    <p className="text-[10px] font-mono text-red-400 uppercase leading-relaxed tracking-wider">{error}</p>
                </div>
              )}

              <button
                disabled={loading}
                type="submit"
                className="w-full py-4 rounded-2xl bg-red-500 text-black font-bold text-sm shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "COMMUNICATING..." : "INITIATE OVERSIGHT"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyOtp}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-red-500 uppercase tracking-widest ml-4 font-bold">Access Key</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-red-500 transition-colors" />
                  <input
                    required
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-2xl font-bold tracking-[0.5em] text-center focus:outline-none focus:border-red-500/50 transition-all font-mono"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 flex items-start gap-3">
                    <AlertTriangle className="text-red-500 w-4 h-4 shrink-0" />
                    <p className="text-[10px] font-mono text-red-400 uppercase leading-relaxed tracking-wider">{error}</p>
                </div>
              )}

              <button
                disabled={loading}
                type="submit"
                className="w-full py-4 rounded-2xl bg-red-500 text-black font-bold text-sm shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "VERIFYING..." : "CONFIRM AUTHORITY"}
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-[10px] font-mono text-white/20 uppercase tracking-widest hover:text-white transition-colors"
              >
                Change Admin Credentials
              </button>
            </motion.form>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-10 space-y-6"
            >
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <CheckCircle2 className="text-red-500 w-10 h-10" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-red-500 font-mono text-xs uppercase tracking-widest font-bold">Authority Recognized</p>
                <p className="text-white/40 text-sm">Synchronizing with Command Node...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          <p className="text-[8px] font-mono text-white/10 uppercase tracking-widest">
            Attention: All administrative actions are logged in the sovereign record.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
