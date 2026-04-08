import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Zap, Target, Award, Settings, LogOut, Shield, MapPin, Calendar, Bell, ChevronRight, Trophy } from "lucide-react";
import { db, auth } from "../firebase";
import { doc, onSnapshot, query, collection, where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Layout } from "./Layout";
import { cn } from "../lib/utils";
import { handleFirestoreError, OperationType } from "../lib/firebase-utils";
import { UnderDevelopmentPopup } from "./UnderDevelopmentPopup";

export function Profile() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [userPredictions, setUserPredictions] = useState<any[]>([]);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    // Fetch user's predictions for "Signals Cast" count
    const q = query(collection(db, "predictions"), where("userId", "==", auth.currentUser.uid));
    const unsubPredictions = onSnapshot(q, (snapshot) => {
      const preds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserPredictions(preds);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "predictions");
      setLoading(false);
    });

    return () => unsubPredictions();
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
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter text-center sm:text-left truncate w-full max-w-[300px] sm:max-w-none">
                  {auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || "User"}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="glass px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-3">
                <Target className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold">{userPredictions.length} Signals Cast</span>
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

        {/* Masked Content */}
        <div 
          onClick={() => setShowPopup(true)}
          className="relative cursor-pointer group"
        >
          {/* Overlay */}
          <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-3xl backdrop-blur-sm">
            <span className="text-white/80 font-mono tracking-widest uppercase text-xl">Under Construction</span>
          </div>
          
          {/* Faded Background Content */}
          <div className="opacity-10 pointer-events-none select-none space-y-12">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="glass p-8 rounded-[40px] border border-white/5 space-y-6">
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
                    <div className="h-full bg-emerald-500" style={{ width: '30%' }} />
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
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <span className="text-xs text-white/60">Prediction Locked: Varkala</span>
                    <ChevronRight className="w-3 h-3 text-white/20" />
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <span className="text-xs text-white/60">Node Sync Complete</span>
                    <ChevronRight className="w-3 h-3 text-white/20" />
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <span className="text-xs text-white/60">Phase Shift: Campaign Node</span>
                    <ChevronRight className="w-3 h-3 text-white/20" />
                  </div>
                </div>
              </div>
            </div>

            {/* Your Predictions / Signals */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tighter">Your <span className="text-emerald-500">Signals</span></h2>
                <span className="text-xs font-mono text-white/20 uppercase tracking-widest">0 Active Nodes</span>
              </div>
              <div className="p-12 text-center glass rounded-[40px] border border-white/5">
                <p className="text-sm text-white/20 font-mono uppercase">No active signals detected in your node.</p>
              </div>
            </div>

            {/* Achievements */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tighter">Neural <span className="text-emerald-500">Achievements</span></h2>
                <button className="text-xs font-mono text-emerald-500 uppercase tracking-widest hover:underline">View All</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { name: "Early Adopter", desc: "Joined during Alpha phase", icon: Zap },
                  { name: "Swarm Leader", desc: "Top 1% in predictability", icon: Trophy },
                  { name: "District Expert", desc: "Predicted all seats in one district", icon: MapPin },
                  { name: "High Conviction", desc: "10 predictions with 90%+ confidence", icon: Target },
                ].map((a, i) => (
                  <div key={i} className="glass p-6 rounded-[32px] border border-white/5 flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <a.icon className="w-6 h-6 text-white/20" />
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
        </div>
      </div>
      <UnderDevelopmentPopup 
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        title="Vault Access Restricted"
        message="Your neural achievements and historical data are currently being indexed. Full vault access will be granted once the sync is complete."
      />
    </Layout>
  );
}
