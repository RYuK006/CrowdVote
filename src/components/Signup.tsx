import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Phone, ArrowRight, Lock, User, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firebase-utils";

export function Signup() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
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
      setError(err.message || "Failed to send OTP. Ensure phone number is in E.164 format (e.g., +919876543210).");
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

      // Create user in Firestore
      try {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          displayName: name,
          phoneNumber: phone,
          influencePoints: 100,
          predictabilityScore: 0,
          accuracy: 0,
          rank: 0,
          role: "user",
          createdAt: new Date().toISOString(),
        });
      } catch (dbErr) {
        handleFirestoreError(dbErr, OperationType.CREATE, `users/${user.uid}`);
      }

      setStep(3);
      setTimeout(() => navigate("/arena"), 2000);
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
        className="w-full max-w-md glass p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-white/5 emerald-glow relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20">
          <motion.div
            className="h-full bg-emerald-500"
            animate={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="flex flex-col items-center text-center mb-10 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <ShieldCheck className="text-emerald-500 w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tighter">
            {step === 1 ? "Identity Registry" : step === 2 ? "Verification Node" : "Access Granted"}
          </h2>
          <p className="text-sm text-white/40">
            {step === 1 ? "Initialize your predictive agent profile." : step === 2 ? "Enter the 6-digit access key sent to your device." : "Synchronizing with the swarm..."}
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
                <label className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest ml-4">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. Aaron Alex"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest ml-4">Phone Number</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-400 text-center">{error}</p>}

              <button
                disabled={loading}
                type="submit"
                className="w-full py-4 rounded-2xl bg-emerald-500 text-black font-bold text-sm emerald-glow hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "SENDING..." : "SEND ACCESS KEY"}
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
                <label className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest ml-4">6-Digit OTP</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    required
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-2xl font-bold tracking-[0.5em] text-center focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-400 text-center">{error}</p>}

              <button
                disabled={loading}
                type="submit"
                className="w-full py-4 rounded-2xl bg-emerald-500 text-black font-bold text-sm emerald-glow hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "VERIFYING..." : "AUTHORIZE ACCESS"}
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-[10px] font-mono text-white/20 uppercase tracking-widest hover:text-white transition-colors"
              >
                Change Number
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
            Already registered? <Link to="/signin" className="text-emerald-500 hover:underline">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
