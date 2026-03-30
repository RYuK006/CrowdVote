import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Zap, Target, Award, Settings, LogOut, Shield, MapPin, Calendar, Bell, ChevronRight, Trophy } from "lucide-react";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc, onSnapshot, query, collection, where, deleteDoc } from "firebase/firestore";
import { CONSTITUENCIES } from "../data";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Layout } from "./Layout";
import { cn } from "../lib/utils";
import { handleFirestoreError, OperationType } from "../lib/firebase-utils";

export function Profile() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [userPredictions, setUserPredictions] = useState<any[]>([]);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, "users", auth.currentUser.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser?.uid}`);
    });

    // Fetch user's predictions
    const q = query(collection(db, "predictions"), where("userId", "==", auth.currentUser.uid));
    const unsubPredictions = onSnapshot(q, (snapshot) => {
      const preds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserPredictions(preds);
    });

    return () => {
      unsubscribe();
      unsubPredictions();
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <Layout user={auth.currentUser}>
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="relative group">
            <div className="w-40 h-40 rounded-[40px] bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden emerald-glow border-emerald-500/30">
              <User className="w-16 h-16 text-white/20" />
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="absolute -bottom-4 -right-4 w-12 h-12 rounded-2xl bg-emerald-500 text-black flex items-center justify-center emerald-glow">
              <Award className="w-6 h-6" />
            </div>
          </div>

          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter text-center sm:text-left truncate w-full max-w-[300px] sm:max-w-none">{userData?.displayName || "Anonymous Agent"}</h1>
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-500 uppercase tracking-widest shrink-0">
                  Level 12
                </div>
              </div>
              <p className="text-white/40 font-mono text-[10px] sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em]">Predictive Agent ID: {auth.currentUser?.uid.slice(0, 12)}</p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="glass px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-3">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold">{userData?.influencePoints || 0} IP</span>
              </div>
              <div className="glass px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-3">
                <Target className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold">{userData?.predictabilityScore || 0}% Score</span>
              </div>
              <div className="glass px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-3">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold">Verified Node</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            <button className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold flex items-center justify-center gap-3">
              <Settings className="w-5 h-5" />
              Settings
            </button>
            <button 
              onClick={handleLogout}
              className="px-8 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all font-bold text-red-400 flex items-center justify-center gap-3"
            >
              <LogOut className="w-5 h-5" />
              Disconnect
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          <div className="glass p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-white/5 space-y-6">
            <div className="flex items-center gap-3">
              <MapPin className="text-emerald-500 w-5 h-5" />
              <h3 className="text-sm font-bold tracking-widest uppercase">Geographic Range</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Constituencies Targetted</span>
                <span className="text-sm font-mono font-bold">42/140</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 emerald-glow" style={{ width: '30%' }} />
              </div>
              <p className="text-[10px] text-white/20 leading-relaxed">
                Your primary influence is concentrated in the Malappuram and Kozhikode districts.
              </p>
            </div>
          </div>

          <div className="glass p-8 rounded-[40px] border border-white/5 space-y-6">
            <div className="flex items-center gap-3">
              <Calendar className="text-emerald-500 w-5 h-5" />
              <h3 className="text-sm font-bold tracking-widest uppercase">Neural Activity</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Last Sync</span>
                <span className="text-sm font-mono font-bold">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Uptime</span>
                <span className="text-sm font-mono font-bold">12 days</span>
              </div>
              <div className="pt-4 flex gap-1">
                {[1,1,0,1,1,1,0,1,1,1,1,1,0,1].map((v, i) => (
                  <div key={i} className={cn("flex-1 h-6 rounded-sm", v ? "bg-emerald-500/20" : "bg-white/5")} />
                ))}
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-[40px] border border-white/5 space-y-6">
            <div className="flex items-center gap-3">
              <Bell className="text-emerald-500 w-5 h-5" />
              <h3 className="text-sm font-bold tracking-widest uppercase">Recent Alerts</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                <span className="text-xs text-white/60">Prediction Locked: Varkala</span>
                <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-emerald-500 transition-colors" />
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                <span className="text-xs text-white/60">Influence Points Awarded</span>
                <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-emerald-500 transition-colors" />
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                <span className="text-xs text-white/60">Phase Shift: Campaign Node</span>
                <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-emerald-500 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Your Predictions */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tighter">Your <span className="text-emerald-500">Signals</span></h2>
            <span className="text-xs font-mono text-white/20 uppercase tracking-widest">{userPredictions.length} Active Nodes</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userPredictions.length > 0 ? (
              userPredictions.map((pred) => {
                const constituency = CONSTITUENCIES.find(c => c.id === pred.constituencyId);
                return (
                  <div key={pred.id} className="glass p-6 rounded-[32px] border border-white/5 space-y-4 group relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold tracking-tight uppercase">{constituency?.name}</h4>
                        <p className="text-[10px] font-mono text-white/20 uppercase">{constituency?.district}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-500">{pred.predictedParty}</span>
                        <p className="text-[10px] font-mono text-white/20">{pred.confidence}%</p>
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        try {
                          await deleteDoc(doc(db, "predictions", pred.id));
                        } catch (err) {
                          handleFirestoreError(err, OperationType.DELETE, `predictions/${pred.id}`);
                        }
                      }}
                      className="w-full py-2 rounded-xl bg-red-500/5 border border-red-500/10 text-[10px] font-mono text-red-400 uppercase tracking-widest hover:bg-red-500/10 transition-all"
                    >
                      Delete Signal
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full p-12 text-center glass rounded-[40px] border border-white/5">
                <p className="text-sm text-white/20 font-mono uppercase">No active signals detected in your node.</p>
              </div>
            )}
          </div>
        </div>

        {/* Achievements */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tighter">Neural <span className="text-emerald-500">Achievements</span></h2>
            <button className="text-xs font-mono text-emerald-500 uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { name: "Early Adopter", desc: "Joined during Alpha phase", icon: Zap },
              { name: "Swarm Leader", desc: "Top 1% in predictability", icon: Trophy },
              { name: "District Expert", desc: "Predicted all seats in one district", icon: MapPin },
              { name: "High Conviction", desc: "10 predictions with 90%+ confidence", icon: Target },
            ].map((a, i) => (
              <div key={i} className="glass p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-white/5 flex flex-row sm:flex-col items-center sm:text-center space-x-4 sm:space-x-0 sm:space-y-4 group hover:border-emerald-500/30 transition-all text-left">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex shrink-0 items-center justify-center group-hover:emerald-glow transition-all">
                  <a.icon className="w-6 h-6 text-white/20 group-hover:text-emerald-500 transition-colors" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold tracking-tight">{a.name}</h4>
                  <p className="text-[10px] text-white/20 leading-tight">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
