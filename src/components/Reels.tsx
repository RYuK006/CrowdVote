import React, { useState, useEffect, useRef } from "react";
import { 
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal, 
  Volume2, VolumeX, Music, Sparkles, Flame, Trophy, Medal, 
  ChevronUp, ChevronDown, CheckCircle2, Share2, X, Play, Pause, 
  ShieldCheck, ArrowUpRight, TrendingUp, Users
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "./Layout";
import { auth } from "../firebase";
import { cn } from "../lib/utils";

interface ReelItem {
  id: string;
  pollId: string;
  title: string;
  authorHandle: string;
  authorName: string;
  authorAvatar: string;
  authorAccuracy: number;
  category: string;
  caption: string;
  options: string[];
  votes: Record<string, number>;
  likes: number;
  commentsCount: number;
  audioTrack: string;
  theme: "ai" | "crypto" | "finance" | "politics" | "roast" | "science";
  isSponsored?: boolean;
  sponsorName?: string;
  sponsorReward?: string;
}

const REELS_DATA: ReelItem[] = [
  {
    id: "reel_1",
    pollId: "poll_quantum_oracle_2026",
    title: "Will open-weight reasoning models surpass frontier proprietary LLMs by Q3 2026?",
    authorHandle: "quantum_oracle",
    authorName: "Quantum Oracle",
    authorAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80",
    authorAccuracy: 98.4,
    category: "Tech & AI",
    caption: "Open-weight synthesis curves are accelerating. Autonomous agent benchmarks show a 74% probability of frontier parity before fall 2026. 🔥 #ai #singularity #forecast",
    options: ["Surpass Frontier", "Parity with Frontier", "Proprietary Remains Ahead"],
    votes: { "0": 58, "1": 32, "2": 10 },
    likes: 14820,
    commentsCount: 942,
    audioTrack: "Original Audio - Quantum Oracle • Autonomous Reasoning Synthesis",
    theme: "ai",
  },
  {
    id: "reel_2",
    pollId: "poll_alpha_macro_2026",
    title: "US Federal Reserve interest rates: How many rate cuts will occur before December 2026?",
    authorHandle: "alpha_macro",
    authorName: "Alpha Macro",
    authorAvatar: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=150&h=150&q=80",
    authorAccuracy: 97.2,
    category: "Finance & Crypto",
    caption: "Bond market pricing is completely decoupled from real terminal yield curves. The asymmetric bet is in cross-currency spreads. 📊 #macro #interestrates #fed",
    options: ["3 or More Cuts (>75 bps)", "1 to 2 Cuts (25-50 bps)", "No Cuts or Rate Hikes"],
    votes: { "0": 46, "1": 42, "2": 12 },
    likes: 21300,
    commentsCount: 1240,
    audioTrack: "Original Audio - Alpha Macro • Terminal Yield Breakdown",
    theme: "finance",
    isSponsored: true,
    sponsorName: "MacroCapital Labs",
    sponsorReward: "500 USDC Yield Bounty",
  },
  {
    id: "reel_3",
    pollId: "poll_venture_roast_2026",
    title: "Will the median Series A SaaS revenue multiple drop below 8x ARR by late 2026?",
    authorHandle: "venture_roast",
    authorName: "Venture Roast",
    authorAvatar: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=150&h=150&q=80",
    authorAccuracy: 94.6,
    category: "Startups & Roasts",
    caption: "If your software product is just a glorified wrapper around an API endpoint, you have a negative gross margin masquerading as hypergrowth. Roasting stage live! 💀 #startups #roast #valuation",
    options: ["Drop Below 8x", "Stabilize at 10x-14x", "Rebound Above 15x"],
    votes: { "0": 71, "1": 21, "2": 8 },
    likes: 38900,
    commentsCount: 3120,
    audioTrack: "Original Audio - Venture Roast • The SaaS Valuation Reality Check",
    theme: "roast",
  },
  {
    id: "reel_4",
    pollId: "poll_crypto_sentinel_2026",
    title: "Will Bitcoin breach $150,000 before the end of Q4 2026?",
    authorHandle: "crypto_sentinel",
    authorName: "Crypto Sentinel",
    authorAvatar: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=150&h=150&q=80",
    authorAccuracy: 96.1,
    category: "Finance & Crypto",
    caption: "Layer 2 data availability compression has slashed settlement overhead by 90%. Spot exchange order books are thinning out on the ask side. ⚡ #crypto #bitcoin #web3",
    options: ["Yes, Above $150k", "Peaks Between $110k-$145k", "Stays Below $100k"],
    votes: { "0": 63, "1": 28, "2": 9 },
    likes: 45200,
    commentsCount: 4210,
    audioTrack: "Original Audio - Crypto Sentinel • On-Chain Liquidity Wave",
    theme: "crypto",
    isSponsored: true,
    sponsorName: "ChainSentinel Prime",
    sponsorReward: "1,000 CSP Rewards",
  },
  {
    id: "reel_5",
    pollId: "poll_polity_matrix_2026",
    title: "Kerala Assembly Elections 2026: Coalition Seat Majority Projection",
    authorHandle: "polity_matrix",
    authorName: "Polity Matrix",
    authorAvatar: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=150&h=150&q=80",
    authorAccuracy: 97.9,
    category: "Politics",
    caption: "Youth voter demographic swings in Central Travancore and Malabar are upending historical incumbency cycles. Consensus model updated. 🗳️ #elections #politics #kerala",
    options: ["LDF Majority", "UDF Majority", "Hung Assembly / Others"],
    votes: { "0": 51, "1": 43, "2": 6 },
    likes: 18400,
    commentsCount: 1650,
    audioTrack: "Original Audio - Polity Matrix • Demographic Coalition Model",
    theme: "politics",
  },
];

export function Reels() {
  const [activeTab, setActiveTab] = useState<"reels" | "leaderboard">("reels");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});
  const [savedReels, setSavedReels] = useState<Record<string, boolean>>({});
  const [votedOptions, setVotedOptions] = useState<Record<string, string>>({});
  const [followedUsers, setFollowedUsers] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [commentsList, setCommentsList] = useState<string[]>([
    "This is why accuracy weighting is the only way.",
    "Already voted, consensus seems spot on.",
    "Contrarian take has the real alpha here."
  ]);

  // Leaderboard data
  const [leaderboardUsers, setLeaderboardUsers] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/suggestions")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLeaderboardUsers(data);
        }
      })
      .catch(() => {});
  }, []);

  // Keyboard navigation for reels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== "reels" || showComments) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        handleNextReel();
      } else if (e.key === "ArrowUp" || e.key === "k") {
        handlePrevReel();
      } else if (e.key === "m") {
        setIsMuted(prev => !prev);
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, activeTab, showComments]);

  const currentReel = REELS_DATA[currentIndex];

  const handleNextReel = () => {
    if (currentIndex < REELS_DATA.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevReel = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleToggleLike = (reelId: string) => {
    setLikedReels(prev => ({ ...prev, [reelId]: !prev[reelId] }));
  };

  const handleToggleSave = (reelId: string) => {
    setSavedReels(prev => ({ ...prev, [reelId]: !prev[reelId] }));
  };

  const handleToggleFollow = (handle: string) => {
    setFollowedUsers(prev => ({ ...prev, [handle]: !prev[handle] }));
  };

  const handleVote = (reelId: string, optionIndex: string) => {
    if (votedOptions[reelId]) return;
    setVotedOptions(prev => ({ ...prev, [reelId]: optionIndex }));
  };

  const handleShare = (pollId: string) => {
    const url = `${window.location.origin}/polls/${pollId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setCommentsList(prev => [...prev, commentInput.trim()]);
    setCommentInput("");
  };

  return (
    <Layout user={auth.currentUser}>
      <div className="min-h-screen bg-[#000000] text-white flex flex-col items-center select-none py-2 px-2 sm:px-4">
        {/* Top Dual Tab Switcher (Forecast Briefs vs Leaderboard Elite) */}
        <div className="flex items-center gap-2 mb-4 p-1 rounded-2xl bg-[#111318] border border-[#20242e] shadow-xl z-20">
          <button
            onClick={() => setActiveTab("reels")}
            className={cn(
              "px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeTab === "reels"
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                : "text-stone-400 hover:text-white"
            )}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Briefs</span>
          </button>

          <button
            onClick={() => setActiveTab("leaderboard")}
            className={cn(
              "px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeTab === "leaderboard"
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                : "text-stone-400 hover:text-white"
            )}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Ranks</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: PREDICTION REELS (Vertical 9:16 Feed)             */}
        {/* ======================================================== */}
        {activeTab === "reels" && currentReel && (
          <div className="relative flex items-center justify-center w-full max-w-[540px] my-auto">
            {/* Main 9:16 Reel Card */}
            <div className="relative w-full max-w-[400px] sm:max-w-[420px] h-[calc(100vh-140px)] max-h-[820px] min-h-[580px] bg-[#09090b] border border-[#262626] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
              
              {/* Dynamic Animated Canvas Background per Topic */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {currentReel.theme === "ai" && (
                  <div className="w-full h-full bg-gradient-to-b from-emerald-950/40 via-cyan-950/30 to-black relative">
                    <div className="absolute inset-0 bg-[radial-gradient(#10b981_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-25 animate-pulse" />
                    <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl" />
                  </div>
                )}
                {currentReel.theme === "finance" && (
                  <div className="w-full h-full bg-gradient-to-b from-blue-950/40 via-emerald-950/20 to-black relative">
                    <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#10b981_1px,transparent_1px),linear-gradient(to_bottom,#10b981_1px,transparent_1px)] bg-[size:4rem_4rem]" />
                    <div className="absolute top-1/3 -right-20 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl" />
                  </div>
                )}
                {currentReel.theme === "roast" && (
                  <div className="w-full h-full bg-gradient-to-b from-orange-950/50 via-red-950/30 to-black relative">
                    <div className="absolute -top-20 -right-20 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 -left-20 w-64 h-64 bg-red-500/15 rounded-full blur-3xl" />
                  </div>
                )}
                {currentReel.theme === "crypto" && (
                  <div className="w-full h-full bg-gradient-to-b from-amber-950/40 via-purple-950/20 to-black relative">
                    <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
                    <div className="absolute top-1/4 -right-16 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl" />
                  </div>
                )}
                {currentReel.theme === "politics" && (
                  <div className="w-full h-full bg-gradient-to-b from-rose-950/40 via-stone-950 to-black relative">
                    <div className="absolute inset-0 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
                    <div className="absolute -top-16 -left-16 w-64 h-64 bg-rose-500/15 rounded-full blur-3xl" />
                  </div>
                )}
              </div>

              {/* Top Controls Overlay */}
              <div className="relative z-20 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                    {currentReel.category}
                  </span>
                  {currentReel.isSponsored && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-black text-[10px] font-mono font-extrabold uppercase tracking-wider shadow-lg">
                      <Sparkles className="w-3 h-3" />
                      Bounty
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Audio Mute/Unmute */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white hover:bg-black/80 transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  </button>

                  {/* Play/Pause */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white hover:bg-black/80 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Center Stage: Interactive Prediction Challenge */}
              <div className="relative z-10 px-5 my-auto space-y-4">
                {/* Audio Spectrum Waves Animation */}
                <div className="flex items-center gap-1 justify-center py-1 opacity-80">
                  <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1 h-6 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1 h-8 bg-teal-400 rounded-full animate-bounce" />
                  <span className="w-1 h-4 bg-lime-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
                  <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.4s]" />
                  <span className="text-[10px] font-mono text-emerald-400/90 font-bold ml-2 uppercase tracking-widest">
                    Simulated Consensus Audio
                  </span>
                </div>

                {/* Big Question Card */}
                <div className="p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 space-y-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-white leading-snug tracking-tight">
                    {currentReel.title}
                  </h2>
                  {currentReel.sponsorReward && (
                    <div className="text-[11px] font-mono text-amber-300 font-bold">
                      🎁 Sponsor Yield: {currentReel.sponsorReward}
                    </div>
                  )}
                </div>

                {/* Interactive Voting Options */}
                <div className="space-y-2">
                  {currentReel.options.map((option, idx) => {
                    const optKey = String(idx);
                    const isVoted = votedOptions[currentReel.id] !== undefined;
                    const isSelected = votedOptions[currentReel.id] === optKey;
                    const pct = currentReel.votes[optKey] || 33;

                    return (
                      <button
                        key={idx}
                        disabled={isVoted}
                        onClick={() => handleVote(currentReel.id, optKey)}
                        className={cn(
                          "relative w-full py-2.5 px-4 rounded-xl text-left text-xs font-semibold border transition-all overflow-hidden flex items-center justify-between",
                          isSelected
                            ? "border-emerald-500 bg-emerald-500/20 text-white"
                            : isVoted
                            ? "border-white/10 bg-black/50 text-stone-300"
                            : "border-white/20 bg-black/50 hover:bg-white/15 hover:border-emerald-500/60 text-white"
                        )}
                      >
                        {/* Fill Percentage Bar */}
                        {isVoted && (
                          <div
                            className={cn(
                              "absolute inset-y-0 left-0 transition-all duration-700 pointer-events-none rounded-xl",
                              isSelected ? "bg-emerald-500/30" : "bg-white/10"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        )}

                        <span className="relative z-10 flex items-center gap-2 truncate">
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                          {option}
                        </span>

                        {isVoted && (
                          <span className="relative z-10 font-mono text-xs font-bold text-stone-300 shrink-0">
                            {pct}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Information & Marquee */}
              <div className="relative z-20 p-5 space-y-2 bg-gradient-to-t from-black via-black/80 to-transparent pt-8">
                {/* Creator Profile Row */}
                <div className="flex items-center gap-3">
                  <Link
                    to={`/profile/${currentReel.authorHandle}`}
                    className="p-0.5 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-lime-400"
                  >
                    <img
                      src={currentReel.authorAvatar}
                      alt={currentReel.authorName}
                      className="w-9 h-9 rounded-full object-cover border border-black"
                    />
                  </Link>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/profile/${currentReel.authorHandle}`}
                      className="font-bold text-sm text-white hover:underline flex items-center gap-1"
                    >
                      <span>@{currentReel.authorHandle}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </Link>

                    <button
                      onClick={() => handleToggleFollow(currentReel.authorHandle)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[11px] font-bold border transition-colors",
                        followedUsers[currentReel.authorHandle]
                          ? "bg-transparent border-white/30 text-stone-300"
                          : "bg-emerald-500 border-emerald-500 text-black hover:bg-emerald-400"
                      )}
                    >
                      {followedUsers[currentReel.authorHandle] ? "Following" : "Follow"}
                    </button>
                  </div>
                </div>

                {/* Caption */}
                <p className="text-xs text-stone-200 line-clamp-2 leading-snug">
                  {currentReel.caption}
                </p>

                {/* Audio Track Marquee */}
                <div className="flex items-center gap-2 text-[11px] text-stone-400 font-mono pt-1">
                  <Music className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div className="overflow-hidden whitespace-nowrap w-full">
                    <span className="inline-block truncate">
                      {currentReel.audioTrack}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Line at Bottom */}
              <div className="w-full h-1 bg-white/20">
                <div className="h-full bg-emerald-500 rounded-full animate-pulse w-2/3" />
              </div>
            </div>

            {/* Right Action Rail (Standard Instagram Reels Layout) */}
            <div className="flex flex-col items-center gap-5 ml-3 sm:ml-4 select-none">
              {/* Like Button */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => handleToggleLike(currentReel.id)}
                  className="p-3 rounded-full bg-[#18181b] hover:bg-[#242428] border border-[#2c2c30] text-white hover:scale-110 active:scale-90 transition-all shadow-xl"
                >
                  <Heart
                    className={cn(
                      "w-6 h-6 transition-colors",
                      likedReels[currentReel.id] ? "fill-red-500 text-red-500" : "text-white"
                    )}
                  />
                </button>
                <span className="text-[11px] font-bold text-stone-300">
                  {((currentReel.likes + (likedReels[currentReel.id] ? 1 : 0)) / 1000).toFixed(1)}k
                </span>
              </div>

              {/* Comment Button */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="p-3 rounded-full bg-[#18181b] hover:bg-[#242428] border border-[#2c2c30] text-white hover:scale-110 active:scale-90 transition-all shadow-xl"
                >
                  <MessageCircle className="w-6 h-6 -rotate-90" />
                </button>
                <span className="text-[11px] font-bold text-stone-300">
                  {currentReel.commentsCount}
                </span>
              </div>

              {/* Share / Send Button */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => handleShare(currentReel.pollId)}
                  className="p-3 rounded-full bg-[#18181b] hover:bg-[#242428] border border-[#2c2c30] text-white hover:scale-110 active:scale-90 transition-all shadow-xl"
                  title="Share link"
                >
                  <Send className="w-6 h-6 -rotate-12" />
                </button>
                <span className="text-[10px] font-bold text-stone-400">
                  {copiedLink ? "✓" : "Share"}
                </span>
              </div>

              {/* Save / Bookmark Button */}
              <button
                onClick={() => handleToggleSave(currentReel.id)}
                className="p-3 rounded-full bg-[#18181b] hover:bg-[#242428] border border-[#2c2c30] text-white hover:scale-110 active:scale-90 transition-all shadow-xl"
              >
                <Bookmark
                  className={cn(
                    "w-6 h-6 transition-colors",
                    savedReels[currentReel.id] ? "fill-white text-white" : "text-white"
                  )}
                />
              </button>

              {/* Spinning Vinyl Record Disc */}
              <div className="pt-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-stone-900 to-black p-1 border-2 border-emerald-500/60 shadow-lg animate-spin [animation-duration:4s] flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
              </div>

              {/* Vertical Navigation Chevrons */}
              <div className="flex flex-col gap-1 pt-2">
                <button
                  onClick={handlePrevReel}
                  disabled={currentIndex === 0}
                  className="p-2 rounded-full bg-[#18181b] hover:bg-white/10 text-stone-400 hover:text-white disabled:opacity-20 transition-all"
                  title="Previous Reel (Up Arrow)"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>

                <button
                  onClick={handleNextReel}
                  disabled={currentIndex === REELS_DATA.length - 1}
                  className="p-2 rounded-full bg-[#18181b] hover:bg-white/10 text-stone-400 hover:text-white disabled:opacity-20 transition-all"
                  title="Next Reel (Down Arrow)"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sliding In-Reel Comments Drawer */}
            {showComments && (
              <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-xl rounded-3xl p-5 flex flex-col justify-between border border-[#262626] animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
                  <h3 className="font-bold text-sm text-white">Reel Comments ({commentsList.length})</h3>
                  <button
                    onClick={() => setShowComments(false)}
                    className="p-1 rounded-full text-stone-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-3 space-y-3 custom-scrollbar">
                  {commentsList.map((c, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs">
                      <div className="w-7 h-7 rounded-full bg-stone-800 flex items-center justify-center font-bold text-emerald-400 shrink-0">
                        {String.fromCharCode(65 + (i % 6))}
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-white mr-1.5">node_predictor_{i + 1}</span>
                        <span className="text-stone-300">{c}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handlePostComment} className="pt-2 border-t border-[#262626] flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add a prediction remark..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="flex-1 bg-[#18181b] border border-white/10 rounded-full px-4 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={!commentInput.trim()}
                    className="px-4 py-2 rounded-full bg-emerald-500 text-black text-xs font-bold disabled:opacity-30"
                  >
                    Post
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: LEADERBOARD ELITE MATRIX                          */}
        {/* ======================================================== */}
        {activeTab === "leaderboard" && (
          <div className="w-full max-w-3xl py-4 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Trophy className="w-4 h-4" />
                Elite Forecaster Rankings
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Swarm Grandmasters
              </h1>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                Nodes ranked by cumulative Brier prediction accuracy, signal calibration, and high-spread prediction wins.
              </p>
            </div>

            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {leaderboardUsers.slice(0, 3).map((user, idx) => {
                const rank = idx + 1;
                const medalColor = rank === 1 ? "from-amber-400 to-yellow-600 border-amber-400" : rank === 2 ? "from-slate-300 to-slate-500 border-slate-300" : "from-amber-700 to-amber-900 border-amber-700";
                return (
                  <div
                    key={user.uid}
                    className="relative p-5 rounded-2xl bg-[#121214] border border-[#262626] hover:border-emerald-500/40 transition-all flex flex-col items-center text-center space-y-3 shadow-xl"
                  >
                    <div className="relative">
                      <div className={cn("w-16 h-16 rounded-full p-1 bg-gradient-to-tr border-2", medalColor)}>
                        <img
                          src={user.avatar}
                          alt={user.displayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black border border-white/20 text-[10px] font-extrabold">
                        #{rank}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-white">{user.displayName}</h3>
                      <span className="text-[11px] font-mono text-emerald-400">@{user.handle}</span>
                    </div>

                    <div className="w-full py-1.5 px-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-stone-300 flex items-center justify-between">
                      <span>Accuracy:</span>
                      <span className="font-bold text-emerald-400">{user.accuracy}%</span>
                    </div>

                    <Link
                      to={`/profile/${user.uid}`}
                      className="w-full py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500 hover:text-black text-xs font-bold text-stone-300 transition-colors"
                    >
                      View Profile
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Table of Other Forecasters */}
            <div className="bg-[#121214] border border-[#262626] rounded-2xl overflow-hidden divide-y divide-white/5 shadow-xl">
              <div className="p-4 bg-[#18181b] flex items-center justify-between text-xs font-bold text-stone-400 uppercase tracking-wider">
                <span>Rank & Forecaster</span>
                <span>Accuracy Calibration</span>
              </div>

              {leaderboardUsers.map((user, idx) => (
                <div
                  key={user.uid}
                  className="p-4 flex items-center justify-between hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-stone-500 w-5">
                      #{idx + 1}
                    </span>
                    <img
                      src={user.avatar}
                      alt={user.displayName}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        {user.displayName}
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      </h4>
                      <span className="text-[11px] font-mono text-stone-400">@{user.handle} • {user.subtitle}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {user.accuracy}%
                    </span>
                    <Link
                      to={`/profile/${user.uid}`}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

