import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Award, Shield, Target, Grid, CheckCircle2, 
  Clock, Bookmark, Settings, Edit3, Flame, ExternalLink, Sparkles, X, Check,
  UserPlus, UserCheck, HeartHandshake, MessageSquare, ArrowLeft
} from "lucide-react";
import { auth, db } from "../firebase";
import { updateProfile } from "firebase/auth";
import { Layout } from "./Layout";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Poll, SocialProfile } from "../types";
import { FollowersModal } from "./FollowersModal";
import { cn } from "../lib/utils";

export function Profile() {
  const { uid } = useParams<{ uid?: string }>();
  const navigate = useNavigate();
  const isOwnProfile = !uid || uid === auth.currentUser?.uid;
  const targetUid = uid || auth.currentUser?.uid || "";

  const [activeTab, setActiveTab] = useState<"created" | "voted" | "saved" | "accuracy">("created");
  const [createdPolls, setCreatedPolls] = useState<Poll[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, any>>({});
  const [votedPolls, setVotedPolls] = useState<Poll[]>([]);
  const [userAccuracy, setUserAccuracy] = useState<number>(100);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Social Stats & Followers Modal
  const [socialStats, setSocialStats] = useState<SocialProfile>({
    followersCount: 0,
    followingCount: 0,
    friendsCount: 0,
    isFollowing: false,
    isFriend: false,
    friendRequestStatus: "none"
  });
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [socialModalTab, setSocialModalTab] = useState<"followers" | "following" | "friends">("followers");
  const [followActionLoading, setFollowActionLoading] = useState(false);
  const [friendActionLoading, setFriendActionLoading] = useState(false);

  // Edit Profile States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(auth.currentUser?.displayName || "");
  const [newBio, setNewBio] = useState(
    "Civic prediction node & consensus participant. Forecasting the future through collective intelligence."
  );
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchProfileAndSocialData = async () => {
    if (!targetUid) return;
    try {
      let headers: Record<string, string> = {};
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        headers["Authorization"] = `Bearer ${token}`;
      }

      // 1. Fetch public profile and social relationship stats
      const socialRes = await fetch(`/api/user/${targetUid}/social-profile`, { headers });
      if (socialRes.ok) {
        const socialData = await socialRes.json();
        setProfileUser(socialData.user);
        setSocialStats(socialData.stats);
        if (socialData.createdPolls) {
          setCreatedPolls(socialData.createdPolls);
        }
      }

      // 2. If own profile, fetch votes & accuracy
      if (isOwnProfile && auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        const votesRes = await fetch("/api/user/votes", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (votesRes.ok) {
          const votesData = await votesRes.json();
          setUserVotes(votesData);
        }

        const meRes = await fetch("/api/user/check", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.accuracyScore !== undefined) {
            setUserAccuracy(meData.accuracyScore);
          }
        }
      }

      // 3. Fetch all polls for voted tab
      const allPollsRes = await fetch("/api/polls?limit=100");
      if (allPollsRes.ok) {
        const allPolls: Poll[] = await allPollsRes.json();
        setVotedPolls(allPolls.filter(p => userVotes[p.id]));
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchProfileAndSocialData();
  }, [targetUid, isOwnProfile, auth.currentUser]);

  // Handle Follow / Unfollow
  const handleToggleFollow = async () => {
    if (!auth.currentUser) {
      navigate("/signin");
      return;
    }
    setFollowActionLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const endpoint = socialStats.isFollowing
        ? `/api/user/unfollow/${targetUid}`
        : `/api/user/follow/${targetUid}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSocialStats(prev => ({
          ...prev,
          isFollowing: data.isFollowing,
          isFriend: data.isFriend ?? prev.isFriend,
          followersCount: data.isFollowing ? prev.followersCount + 1 : Math.max(0, prev.followersCount - 1),
          friendsCount: data.isFriend ? prev.friendsCount + 1 : (prev.isFriend ? Math.max(0, prev.friendsCount - 1) : prev.friendsCount)
        }));
      }
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setFollowActionLoading(false);
    }
  };

  // Handle Friend Request / Respond
  const handleFriendAction = async () => {
    if (!auth.currentUser) {
      navigate("/signin");
      return;
    }
    setFriendActionLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      
      if (socialStats.friendRequestStatus === "pending_received") {
        // Accept request
        const res = await fetch(`/api/user/friend-request/${targetUid}/respond`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ action: "accept" })
        });
        if (res.ok) {
          setSocialStats(prev => ({
            ...prev,
            isFriend: true,
            isFollowing: true,
            friendRequestStatus: "accepted",
            friendsCount: prev.friendsCount + 1
          }));
        }
      } else if (socialStats.friendRequestStatus === "none") {
        // Send request
        const res = await fetch(`/api/user/friend-request/${targetUid}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setSocialStats(prev => ({
            ...prev,
            friendRequestStatus: "pending_sent"
          }));
        }
      }
    } catch (err) {
      console.error("Friend action error:", err);
    } finally {
      setFriendActionLoading(false);
    }
  };

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

  const displayName = isOwnProfile
    ? (auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "User")
    : (profileUser?.displayName || "Prediction Node");

  const userEmail = isOwnProfile
    ? (auth.currentUser?.email || "")
    : (profileUser?.email || "");

  const votesCount = Object.keys(userVotes).length;

  const openSocialModal = (tab: "followers" | "following" | "friends") => {
    setSocialModalTab(tab);
    setIsSocialModalOpen(true);
  };

  return (
    <Layout user={auth.currentUser}>
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-8 py-8 space-y-10">
        
        {/* Back Button if viewing other profile */}
        {!isOwnProfile && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-mono text-stone-400 hover:text-emerald-400 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Feed
          </button>
        )}

        {/* Instagram Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 sm:gap-12 pb-10 border-b border-white/10">
          
          {/* Avatar with glowing Emerald Ring */}
          <div className="relative group shrink-0">
            <div className={cn(
              "w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 transition-all duration-300",
              socialStats.isFriend
                ? "bg-gradient-to-tr from-emerald-400 via-teal-300 to-lime-400 shadow-[0_0_40px_rgba(16,185,129,0.35)]"
                : "bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-600 shadow-[0_0_35px_rgba(16,185,129,0.25)]"
            )}>
              <div className="w-full h-full rounded-full bg-[#0a0a0c] flex items-center justify-center overflow-hidden">
                <span className="text-4xl sm:text-5xl font-bold text-emerald-400 font-mono">
                  {displayName ? displayName.charAt(0).toUpperCase() : "U"}
                </span>
              </div>
            </div>
            {socialStats.isFriend ? (
              <div className="absolute bottom-1 right-1 p-2 rounded-full bg-emerald-500 text-black border-2 border-black shadow-lg" title="Mutual Friend">
                <HeartHandshake className="w-4 h-4" />
              </div>
            ) : (
              <div className="absolute bottom-1 right-1 p-1.5 rounded-full bg-emerald-500 text-black border-2 border-black" title="Verified Oracle Node">
                <Shield className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* User Bio, Statistics & Action Buttons */}
          <div className="flex-1 space-y-5 text-center sm:text-left min-w-0">
            {/* Top row: Handle, Badges & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{displayName}</h1>
                
                {socialStats.isFriend && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold">
                    <HeartHandshake className="w-3.5 h-3.5" /> Friends
                  </span>
                )}

                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Oracle Node
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                {isOwnProfile ? (
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono text-white transition-colors border border-white/10 flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                ) : (
                  <>
                    {/* Follow / Unfollow */}
                    <button
                      onClick={handleToggleFollow}
                      disabled={followActionLoading}
                      className={cn(
                        "px-4 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-md",
                        socialStats.isFollowing
                          ? "bg-white/10 hover:bg-red-500/10 text-stone-200 hover:text-red-400 border border-white/10"
                          : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20"
                      )}
                    >
                      {socialStats.isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>

                    {/* Friend Action */}
                    {!socialStats.isFriend && (
                      <button
                        onClick={handleFriendAction}
                        disabled={friendActionLoading || socialStats.friendRequestStatus === "pending_sent"}
                        className={cn(
                          "px-4 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border",
                          socialStats.friendRequestStatus === "pending_sent"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30 cursor-default"
                            : socialStats.friendRequestStatus === "pending_received"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30"
                            : "bg-white/5 hover:bg-white/10 text-stone-300 border-white/10"
                        )}
                      >
                        <HeartHandshake className="w-3.5 h-3.5" />
                        <span>
                          {socialStats.friendRequestStatus === "pending_sent"
                            ? "Request Sent"
                            : socialStats.friendRequestStatus === "pending_received"
                            ? "Accept Friend"
                            : "Add Friend"}
                        </span>
                      </button>
                    )}

                    {/* Direct Message */}
                    <Link
                      to="/chat"
                      className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-500/10 hover:text-emerald-400 text-xs font-mono text-white transition-colors border border-white/10 flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Message
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Metric Counters Row (Instagram Style with Clickable Social Counters) */}
            <div className="flex items-center justify-center sm:justify-start gap-6 sm:gap-8 text-sm flex-wrap">
              <div>
                <span className="font-bold text-white font-mono text-base">{createdPolls.length}</span>{" "}
                <span className="text-stone-400 text-xs">polls</span>
              </div>

              {isOwnProfile && (
                <div>
                  <span className="font-bold text-white font-mono text-base">{votesCount}</span>{" "}
                  <span className="text-stone-400 text-xs">predictions</span>
                </div>
              )}

              {/* Followers Counter (Clickable) */}
              <button
                onClick={() => openSocialModal("followers")}
                className="hover:opacity-80 transition-opacity text-left group"
              >
                <span className="font-bold text-white font-mono text-base group-hover:text-emerald-400 transition-colors">
                  {socialStats.followersCount}
                </span>{" "}
                <span className="text-stone-400 text-xs underline decoration-dotted decoration-white/20">followers</span>
              </button>

              {/* Following Counter (Clickable) */}
              <button
                onClick={() => openSocialModal("following")}
                className="hover:opacity-80 transition-opacity text-left group"
              >
                <span className="font-bold text-white font-mono text-base group-hover:text-emerald-400 transition-colors">
                  {socialStats.followingCount}
                </span>{" "}
                <span className="text-stone-400 text-xs underline decoration-dotted decoration-white/20">following</span>
              </button>

              {/* Friends Counter (Clickable) */}
              <button
                onClick={() => openSocialModal("friends")}
                className="hover:opacity-80 transition-opacity text-left group"
              >
                <span className="font-bold text-emerald-400 font-mono text-base group-hover:underline">
                  {socialStats.friendsCount}
                </span>{" "}
                <span className="text-stone-400 text-xs underline decoration-dotted decoration-emerald-500/40">friends</span>
              </button>

              <div>
                <span className="font-bold text-emerald-400 font-mono text-base">{userAccuracy}%</span>{" "}
                <span className="text-stone-400 text-xs">accuracy</span>
              </div>
            </div>

            {/* Bio & Details */}
            <div className="space-y-2 text-xs sm:text-sm">
              <p className="font-mono text-stone-300 leading-relaxed max-w-xl">{newBio}</p>
              {userEmail && <p className="text-stone-500 font-mono text-xs">{userEmail}</p>}
            </div>

            {/* Reputation Badges Tray */}
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-2 flex-wrap">
              <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Swarm Pioneer
              </div>
              <div className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-stone-300 text-[11px] font-mono flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" /> 100% Accuracy Club
              </div>
              <div className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-mono flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" /> Roast Master
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Navigation Bar */}
        <div className="flex items-center justify-center gap-8 sm:gap-12 border-b border-white/10">
          <button
            onClick={() => setActiveTab("created")}
            className={cn(
              "flex items-center gap-2 py-4 border-b-2 text-xs font-mono font-bold tracking-widest uppercase transition-colors",
              activeTab === "created"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-stone-400 hover:text-stone-200"
            )}
          >
            <Grid className="w-4 h-4" />
            <span>Polls ({createdPolls.length})</span>
          </button>

          {isOwnProfile && (
            <button
              onClick={() => setActiveTab("voted")}
              className={cn(
                "flex items-center gap-2 py-4 border-b-2 text-xs font-mono font-bold tracking-widest uppercase transition-colors",
                activeTab === "voted"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-stone-400 hover:text-stone-200"
              )}
            >
              <Award className="w-4 h-4" />
              <span>Predictions ({votedPolls.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("accuracy")}
            className={cn(
              "flex items-center gap-2 py-4 border-b-2 text-xs font-mono font-bold tracking-widest uppercase transition-colors",
              activeTab === "accuracy"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-stone-400 hover:text-stone-200"
            )}
          >
            <Target className="w-4 h-4" />
            <span>Accuracy Matrix</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="space-y-6">
          {/* TAB 1: Created Polls */}
          {activeTab === "created" && (
            <div>
              {createdPolls.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-stone-500">
                    <Grid className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-white text-lg">No Polls Published Yet</h3>
                  <p className="text-stone-400 text-xs font-mono max-w-sm mx-auto">
                    {isOwnProfile
                      ? "Create your first prediction ballot using the sidebar + button. Submissions undergo automated safety checks."
                      : "This user has not published any public prediction polls yet."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {createdPolls.map((poll) => {
                    const status = poll.status || "open";
                    return (
                      <Link
                        key={poll.id}
                        to={`/polls/${poll.id}`}
                        className="p-5 rounded-2xl bg-[#0f1012] border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 group shadow-lg"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-stone-400">
                              {poll.category || "General"}
                            </span>
                            
                            {/* Moderation Status Pill */}
                            {status === "open" || status === "active" ? (
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
                          <span className="text-emerald-400 group-hover:translate-x-1 transition-transform">Inspect →</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Predictions History (Own profile only) */}
          {activeTab === "voted" && isOwnProfile && (
            <div>
              {votedPolls.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-stone-500">
                    <Award className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-white text-lg">No Predictions Cast</h3>
                  <p className="text-stone-400 text-xs font-mono max-w-sm mx-auto">
                    Explore active topics on the feed to stake your accuracy weight and earn reputation badges.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {votedPolls.map((poll) => {
                    const vote = userVotes[poll.id];
                    return (
                      <Link
                        key={poll.id}
                        to={`/polls/${poll.id}`}
                        className="p-5 rounded-2xl bg-[#0f1012] border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 group shadow-lg"
                      >
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                            Voted • Confidence {vote?.confidence || 85}%
                          </span>
                          <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                            {poll.title}
                          </h3>
                        </div>

                        <div className="pt-2 text-[10px] font-mono text-stone-400 flex justify-between items-center border-t border-white/5">
                          <span>Selected: <code className="text-emerald-400 font-bold">{vote?.selectedOption || "Ballot"}</code></span>
                          <span className="text-emerald-400">View Outcome →</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Accuracy Matrix */}
          {activeTab === "accuracy" && (
            <div className="p-8 rounded-3xl bg-[#0f1012] border border-white/10 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Prediction Accuracy Breakdown</h3>
                  <p className="text-xs font-mono text-stone-400">Telemetry benchmark across decentralized swarm forecasts.</p>
                </div>
                <div className="text-3xl font-bold font-mono text-emerald-400">
                  {userAccuracy}%
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-stone-400">Brier Score Calibration</span>
                  <p className="text-xl font-bold font-mono text-white">0.142 <span className="text-xs text-emerald-400 font-normal">Optimal</span></p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-stone-400">Consensus Alpha</span>
                  <p className="text-xl font-bold font-mono text-emerald-400">+12.8%</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-stone-400">Reputation Tier</span>
                  <p className="text-xl font-bold font-mono text-white">Tier 1 Oracle</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Profile Modal */}
        {isEditOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0f1012] border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="font-bold text-white text-lg">Edit Predictive Node Profile</h3>
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="text-stone-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-stone-300">Display Name</label>
                  <input
                    type="text"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="Enter display name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-stone-300">Bio Statement</label>
                  <textarea
                    rows={3}
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="Describe your forecasting domain..."
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-mono text-stone-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Interactive Followers & Following Modal */}
        <FollowersModal
          isOpen={isSocialModalOpen}
          onClose={() => setIsSocialModalOpen(false)}
          targetUid={targetUid}
          targetName={displayName}
          initialTab={socialModalTab}
          counts={{
            followers: socialStats.followersCount,
            following: socialStats.followingCount,
            friends: socialStats.friendsCount
          }}
          onUpdateCounts={fetchProfileAndSocialData}
        />

      </div>
    </Layout>
  );
}
