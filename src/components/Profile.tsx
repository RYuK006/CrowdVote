import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Award, Shield, Target, Grid, CheckCircle2, 
  Clock, Bookmark, Settings, Edit3, Flame, ExternalLink, Sparkles, X, Check 
} from "lucide-react";
import { auth, db } from "../firebase";
import { updateProfile } from "firebase/auth";
import { Layout } from "./Layout";
import { Link } from "react-router-dom";
import { Poll } from "../types";

export function Profile() {
  const [activeTab, setActiveTab] = useState<"created" | "voted" | "saved" | "accuracy">("created");
  const [createdPolls, setCreatedPolls] = useState<Poll[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, any>>({});
  const [votedPolls, setVotedPolls] = useState<Poll[]>([]);
  const [userAccuracy, setUserAccuracy] = useState<number>(100);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(auth.currentUser?.displayName || "");
  const [newBio, setNewBio] = useState(
    "Civic prediction node & consensus participant. Forecasting the future through collective intelligence."
  );
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    async function loadProfileData() {
      if (!auth.currentUser) return;
      try {
        const token = await auth.currentUser.getIdToken();

        // 1. Fetch user accuracy and votes
        const votesRes = await fetch("/api/user/votes", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (votesRes.ok) {
          const votesData = await votesRes.json();
          setUserVotes(votesData);
        }

        // 2. Fetch user's created polls
        const pollsRes = await fetch(`/api/user/created-polls`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (pollsRes.ok) {
          const pData = await pollsRes.json();
          setCreatedPolls(pData);
        }

        // 3. Fetch all polls to map voted polls
        const allPollsRes = await fetch("/api/polls?limit=100");
        if (allPollsRes.ok) {
          const allPolls: Poll[] = await allPollsRes.json();
          setVotedPolls(allPolls.filter(p => userVotes[p.id]));
        }

        // 4. Fetch user accuracy score from server
        const meRes = await fetch("/api/user/check", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.accuracyScore !== undefined) {
            setUserAccuracy(meData.accuracyScore);
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfileData();
  }, [auth.currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setSavingProfile(true);
    try {
      if (newDisplayName.trim()) {
        await updateProfile(auth.currentUser, { displayName: newDisplayName.trim() });
      }
      setIsEditOpen(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  const displayName = auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "User";
  const userEmail = auth.currentUser?.email || "";
  const votesCount = Object.keys(userVotes).length;

  return (
    <Layout user={auth.currentUser}>
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-8 py-8 space-y-10">
        
        {/* Instagram Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 sm:gap-12 pb-10 border-b border-white/10">
          
          {/* Avatar with glowing Emerald Ring */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-600 p-1 shadow-[0_0_35px_rgba(16,185,129,0.25)]">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                <User className="w-14 h-14 sm:w-16 sm:h-16 text-emerald-400" />
              </div>
            </div>
            <div className="absolute bottom-1 right-1 p-1.5 rounded-full bg-emerald-500 text-black border-2 border-black" title="Verified Oracle Node">
              <Shield className="w-4 h-4" />
            </div>
          </div>

          {/* User Bio & Statistics */}
          <div className="flex-1 space-y-5 text-center sm:text-left min-w-0">
            {/* Top row: Handle & Edit Profile */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{displayName}</h1>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Oracle Node
                </span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono text-white transition-colors border border-white/10 flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </button>
              </div>
            </div>

            {/* Metric Counters Row (Instagram Style) */}
            <div className="flex items-center justify-center sm:justify-start gap-8 sm:gap-10 text-sm">
              <div>
                <span className="font-bold text-white font-mono text-base">{createdPolls.length}</span>{" "}
                <span className="text-stone-400 text-xs">polls</span>
              </div>
              <div>
                <span className="font-bold text-white font-mono text-base">{votesCount}</span>{" "}
                <span className="text-stone-400 text-xs">predictions</span>
              </div>
              <div>
                <span className="font-bold text-emerald-400 font-mono text-base">{userAccuracy}%</span>{" "}
                <span className="text-stone-400 text-xs">accuracy</span>
              </div>
              <div>
                <span className="font-bold text-white font-mono text-base">Top 5%</span>{" "}
                <span className="text-stone-400 text-xs">tier</span>
              </div>
            </div>

            {/* Bio & Details */}
            <div className="space-y-2 text-xs sm:text-sm">
              <p className="font-mono text-stone-300 leading-relaxed max-w-xl">{newBio}</p>
              <p className="text-stone-500 font-mono text-xs">{userEmail}</p>
            </div>

            {/* Reputation Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Swarm Pioneer
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1">
                <Award className="w-3 h-3" /> 100% Accuracy Club
              </span>
              <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-mono font-bold flex items-center gap-1">
                <Flame className="w-3 h-3" /> Roast Master
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation (Instagram Style) */}
        <div className="flex items-center justify-center gap-8 sm:gap-14 border-b border-white/10 text-xs font-mono uppercase font-bold tracking-widest">
          <button
            onClick={() => setActiveTab("created")}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "created"
                ? "border-emerald-500 text-white"
                : "border-transparent text-stone-500 hover:text-stone-300"
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Created Polls ({createdPolls.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("voted")}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "voted"
                ? "border-emerald-500 text-white"
                : "border-transparent text-stone-500 hover:text-stone-300"
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Predictions ({votesCount})</span>
          </button>

          <button
            onClick={() => setActiveTab("accuracy")}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "accuracy"
                ? "border-emerald-500 text-white"
                : "border-transparent text-stone-500 hover:text-stone-300"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Accuracy Matrix</span>
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {/* TAB 1: Created Polls */}
          {activeTab === "created" && (
            <div className="space-y-4">
              {createdPolls.length === 0 ? (
                <div className="py-16 text-center text-stone-500 space-y-2">
                  <Grid className="w-8 h-8 mx-auto text-stone-600" />
                  <p className="text-sm font-bold text-white">No Polls Created Yet</p>
                  <p className="text-xs font-mono">Click the '+' button in the sidebar to post your first prediction topic.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {createdPolls.map((poll) => {
                    const status = poll.status || "open";
                    return (
                      <Link
                        key={poll.id}
                        to={`/polls/${poll.id}`}
                        className="p-5 rounded-2xl bg-[#0f1012] border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-stone-400">
                              {poll.category || "General"}
                            </span>
                            
                            {/* Moderation Status Pill */}
                            {status === "open" ? (
                              <span className="flex items-center gap-1 text-[9px] font-mono uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" /> Live
                              </span>
                            ) : status === "pending_approval" ? (
                              <span className="flex items-center gap-1 text-[9px] font-mono uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                                <Clock className="w-3 h-3" /> In Review
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono uppercase font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/30">
                                Rejected
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                            {poll.title}
                          </h3>
                        </div>

                        <div className="pt-2 text-[10px] font-mono text-stone-500 flex justify-between items-center border-t border-white/5">
                          <span>{poll.options?.length || 2} Options</span>
                          <span className="flex items-center gap-1 text-emerald-400 group-hover:translate-x-1 transition-transform">
                            View <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Predictions History */}
          {activeTab === "voted" && (
            <div className="space-y-3">
              {votedPolls.length === 0 && votesCount === 0 ? (
                <div className="py-16 text-center text-stone-500 space-y-2">
                  <Target className="w-8 h-8 mx-auto text-stone-600" />
                  <p className="text-sm font-bold text-white">No Predictions Cast</p>
                  <p className="text-xs font-mono">Head over to Explore Polls to cast your accuracy-weighted votes.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(userVotes).map(([pId, voteData]: [string, any]) => (
                    <Link
                      key={pId}
                      to={`/polls/${pId}`}
                      className="p-5 rounded-2xl bg-[#0f1012] border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest">
                          Poll #{pId}
                        </span>
                        <h4 className="text-sm font-bold text-white">Prediction Locked</h4>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-mono text-stone-400 uppercase font-bold">Your Option</div>
                          <div className="text-xs font-bold text-emerald-400">{voteData.selectedOption}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-mono text-stone-400 uppercase font-bold">Confidence</div>
                          <div className="text-xs font-bold font-mono text-white">{voteData.confidence}%</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Accuracy Matrix */}
          {activeTab === "accuracy" && (
            <div className="p-6 rounded-3xl bg-[#0f1012] border border-white/10 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h3 className="font-bold text-lg text-white">Swarm Accuracy Formula</h3>
                  <p className="text-xs font-mono text-stone-400">How your prediction influence is computed in consensus voting</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono text-emerald-400">{userAccuracy} pts</div>
                  <div className="text-[10px] font-mono text-stone-500">Weight Multiplier: {(userAccuracy / 100).toFixed(2)}x</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs text-stone-300 space-y-2">
                <div className="text-emerald-400 font-bold">Consensus Weight Equation:</div>
                <div className="text-sm bg-black/60 p-3 rounded-xl border border-emerald-500/20 text-emerald-300">
                  Weight = (AccuracyScore / 100) × Confidence%
                </div>
                <p className="text-[11px] text-stone-400 pt-1">
                  New users start with a base accuracy score of 100. Accurate predictions on resolved polls boost your score, increasing your future vote weighting across all community predictions.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#0f1012] border border-white/10 p-6 space-y-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-base">Edit Profile</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-stone-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-stone-400 mb-1">Bio / Tagline</label>
                <textarea
                  rows={3}
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 text-xs font-mono text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 rounded-full bg-emerald-500 text-black font-mono font-bold text-xs hover:bg-emerald-400"
                >
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
