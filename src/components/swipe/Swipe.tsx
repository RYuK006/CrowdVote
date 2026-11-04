import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ChevronUp, ChevronDown, Heart, MessageSquare, Share2, 
  Sparkles, CheckCircle2, TrendingUp, Trophy, ArrowRight, 
  X, ShieldCheck, Flame, Lock, Volume2, VolumeX, Music,
  Clapperboard, ExternalLink, Bookmark
} from "lucide-react";
import { auth } from "../../firebase";
import { Layout } from "../Layout";
import { Poll } from "../../types";
import { cn } from "../../lib/utils";
import { Versus } from "../formats/Versus";
import { Choice } from "../formats/Choice";
import { Scale } from "../formats/Scale";
import { Rank } from "../formats/Rank";
import { Open } from "../formats/Open";
import { Debate } from "../debate/Debate";

const FALLBACK_SWIPE_POLLS: Poll[] = [
  {
    id: "poll_versus_model_supremacy",
    title: "Frontier Model Supremacy: OpenAI o3 vs DeepSeek-R1",
    description: "Which reasoning architecture will dominate frontier agentic benchmarks through late 2026? Vote Side A or Side B.",
    category: "AI",
    format: "versus",
    versusLeft: { id: "side_a", text: "OpenAI o3", votes: 412, percentage: 56 },
    versusRight: { id: "side_b", text: "DeepSeek-R1", votes: 324, percentage: 44 },
    totalVotes: 736,
    status: "active",
    authorHandle: "quantum_oracle",
    authorName: "Quantum Oracle",
    authorAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80",
    authorAccuracy: 98.4,
  } as any,
  {
    id: "poll_choice_fed_terminal_rate",
    title: "US Federal Reserve Terminal Rate Cuts: Cumulative Policy Actions through 2026",
    description: "Standard multi-choice market. Predict the cumulative monetary easing cycle over the next 12 months.",
    category: "Finance",
    format: "choice",
    options: [
      { id: "opt_1", text: "Aggressive Easing (>75 bps total cuts)", votes: 310 },
      { id: "opt_2", text: "Moderate Easing (25 to 50 bps cuts)", votes: 280 },
      { id: "opt_3", text: "Pause or Further Rate Hikes (≤0 bps)", votes: 80 }
    ],
    totalVotes: 670,
    status: "active",
    isSponsored: true,
    sponsorName: "MacroCapital Labs",
    sponsorReward: "500 USDC Yield Bounty",
    sponsorUrl: "https://macrocapital.example",
    authorHandle: "alpha_macro",
    authorName: "Alpha Macro",
    authorAvatar: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=150&h=150&q=80",
    authorAccuracy: 97.2,
  } as any,
  {
    id: "poll_scale_agi_probability",
    title: "AGI Realization Probability: Odds of AGI Consensus before 2028",
    description: "Quantify your subjective probability (0-100%) that artificial general intelligence is verified by independent consensus before January 1, 2028.",
    category: "Science",
    format: "scale",
    scaleMin: 0,
    scaleMax: 100,
    scaleUnit: "%",
    scaleAverage: 73,
    scaleVotesCount: 680,
    totalVotes: 680,
    status: "active",
    authorHandle: "cyber_pulse",
    authorName: "Cyber Pulse",
    authorAvatar: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=150&h=150&q=80",
    authorAccuracy: 96.5,
  } as any,
  {
    id: "poll_rank_layer1_settlement",
    title: "Smart Contract Layer 1 Supremacy: Rank by 2026 Settlement Volume",
    description: "Drag and arrange the leading Layer 1 architectures from highest to lowest projected net economic transaction throughput.",
    category: "Crypto",
    format: "rank",
    options: [
      { id: "eth", text: "Ethereum (L1 + Rollup Superchain)" },
      { id: "sol", text: "Solana Parallel SVM Engine" },
      { id: "sui", text: "Sui Move Object Framework" },
      { id: "apt", text: "Aptos Block-STM Parallelism" }
    ],
    rankedItems: [
      { id: "eth", label: "Ethereum (L1 + Rollup Superchain)", score: 1420 },
      { id: "sol", label: "Solana Parallel SVM Engine", score: 1290 },
      { id: "sui", label: "Sui Move Object Framework", score: 810 },
      { id: "apt", label: "Aptos Block-STM Parallelism", score: 650 }
    ],
    totalVotes: 512,
    status: "active",
    authorHandle: "crypto_sentinel",
    authorName: "Crypto Sentinel",
    authorAvatar: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=150&h=150&q=80",
    authorAccuracy: 96.1,
  } as any,
  {
    id: "poll_open_trillion_dollar_breakthrough",
    title: "Next Trillion-Dollar Frontier Sector: Nominate & Back Candidate Theses",
    description: "Crowdsourced open ballot. Vote for existing community proposals or nominate a new paradigm-shifting sector.",
    category: "Tech",
    format: "open",
    openSubmissions: [
      { id: "sub_1", text: "Room-Temperature Superconducting Synthetics", authorName: "Quantum Oracle", votes: 342 },
      { id: "sub_2", text: "Autonomous Multi-Agent Sovereign Economic DAOs", authorName: "Alpha Macro", votes: 289 },
      { id: "sub_3", text: "In-Vivo CRISPR Epigenetic mRNA Diagnostics", authorName: "BioSynth Lab", votes: 215 }
    ],
    totalVotes: 846,
    status: "active",
    authorHandle: "polity_matrix",
    authorName: "Polity Matrix",
    authorAvatar: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=150&h=150&q=80",
    authorAccuracy: 97.9,
  } as any,
];

export function Swipe() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDebateOpen, setIsDebateOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [likedPolls, setLikedPolls] = useState<Record<string, boolean>>({});
  const [savedPolls, setSavedPolls] = useState<Record<string, boolean>>({});
  const [debateCounts, setDebateCounts] = useState<Record<string, number>>({});
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : null;
      const res = await fetch("/api/polls?limit=40", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPolls(data);
        } else {
          setPolls(FALLBACK_SWIPE_POLLS);
        }
      } else {
        setPolls(FALLBACK_SWIPE_POLLS);
      }
    } catch (err) {
      console.error("Failed to load polls for Swipe feed:", err);
      setPolls(FALLBACK_SWIPE_POLLS);
    } finally {
      setLoading(false);
    }
  };

  const currentPoll = polls[currentIndex] || polls[0];

  // Fetch debate count for current poll
  useEffect(() => {
    if (!currentPoll?.id) return;
    fetch(`/api/debate/${currentPoll.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDebateCounts(prev => ({ ...prev, [currentPoll.id]: data.length }));
        }
      })
      .catch(() => {});
  }, [currentPoll?.id]);

  const handleNext = () => {
    if (currentIndex < polls.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsDebateOpen(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsDebateOpen(false);
    }
  };

  // Keyboard navigation: arrow up and arrow down or j/k
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDebateOpen) return;
      if (e.key === "ArrowDown" || e.key === "j") handleNext();
      if (e.key === "ArrowUp" || e.key === "k") handlePrev();
      if (e.key === "m") setIsMuted(prev => !prev);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, polls.length, isDebateOpen]);

  // Touch Swipe Gesture Handler
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartY.current = null;
  };

  // Wheel gesture (with debouncing and inner scroll boundary check)
  const wheelLock = useRef(false);
  const handleWheel = (e: React.WheelEvent) => {
    if (isDebateOpen || wheelLock.current) return;

    // Check if the wheel event originated from inside an element with active scrollable content
    const target = e.target as HTMLElement | null;
    const scrollable = target?.closest('.overflow-y-auto') as HTMLElement | null;
    if (scrollable && scrollable.scrollHeight > scrollable.clientHeight) {
      const isScrollingDown = e.deltaY > 0;
      const atBottom = Math.ceil(scrollable.scrollTop + scrollable.clientHeight) >= scrollable.scrollHeight - 2;
      const atTop = scrollable.scrollTop <= 2;
      
      // If not at the boundary in the direction of scroll, let the inner element scroll naturally
      if ((isScrollingDown && !atBottom) || (!isScrollingDown && !atTop)) {
        return;
      }
    }

    if (Math.abs(e.deltaY) > 40) {
      wheelLock.current = true;
      if (e.deltaY > 0) {
        handleNext();
      } else {
        handlePrev();
      }
      setTimeout(() => {
        wheelLock.current = false;
      }, 400);
    }
  };

  const handleVote = async (optionValue: any) => {
    if (!currentPoll) return;
    if (!auth.currentUser) {
      navigate("/signin");
      return;
    }

    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pollId: currentPoll.id,
          selectedOption: optionValue,
          confidence: 100
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPolls(prev =>
          prev.map((p, idx) =>
            idx === currentIndex
              ? { ...p, ...(data.poll || {}), hasVoted: true, votedOption: optionValue, votedFaction: data.faction }
              : p
          )
        );
      }
    } catch (err) {
      console.error("Swipe voting error:", err);
    }
  };

  const handleOpenCandidateSubmit = async (text: string) => {
    if (!currentPoll) return;
    if (!auth.currentUser) {
      navigate("/signin");
      return;
    }
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(`/api/polls/${currentPoll.id}/open-submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ text })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.submission) {
        setPolls(prev =>
          prev.map((p, idx) =>
            idx === currentIndex
              ? {
                  ...p,
                  openSubmissions: [...(p.openSubmissions || []), data.submission],
                  hasVoted: true,
                  votedOption: data.submission.id
                }
              : p
          )
        );
      }
    }
  };

  const handleToggleLike = async (pollId: string) => {
    const isCurrentlyLiked = Boolean(likedPolls[pollId]);
    setLikedPolls(prev => ({ ...prev, [pollId]: !isCurrentlyLiked }));

    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        await fetch(`/api/polls/${pollId}/like`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to like:", err);
      }
    }
  };

  const handleToggleSave = (pollId: string) => {
    setSavedPolls(prev => ({ ...prev, [pollId]: !prev[pollId] }));
  };

  const handleShare = () => {
    if (!currentPoll) return;
    const url = `${window.location.origin}/polls/${currentPoll.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <Layout user={auth.currentUser}>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="animate-pulse font-mono text-xs tracking-widest text-emerald-400">
            INITIALIZING SWIPE CONSENSUS FEED...
          </div>
        </div>
      </Layout>
    );
  }

  const format = currentPoll.format || "choice";
  const isBlindMasked = Boolean((currentPoll as any).isBlindMasked && !currentPoll.hasVoted);

  // Author details
  const authorHandle = (currentPoll as any).authorHandle || (currentPoll.createdBy
    ? `node_${currentPoll.createdBy.slice(0, 6)}`
    : "quantum_oracle");
  const authorName = (currentPoll as any).authorName || authorHandle;
  const authorAvatar = (currentPoll as any).authorAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${authorHandle}`;
  const authorAccuracy = (currentPoll as any).authorAccuracy || 97.4;

  const currentCategory = currentPoll.category || "General";
  const isAiTheme = currentCategory.toLowerCase().includes("ai") || currentCategory.toLowerCase().includes("tech");
  const isCryptoTheme = currentCategory.toLowerCase().includes("crypto");
  const isFinanceTheme = currentCategory.toLowerCase().includes("finance");
  const isPoliticsTheme = currentCategory.toLowerCase().includes("politic");
  const isRoastTheme = currentCategory.toLowerCase().includes("startup") || currentCategory.toLowerCase().includes("roast");

  const commentCount = debateCounts[currentPoll.id] || 18;

  return (
    <Layout user={auth.currentUser}>
      <div 
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="w-full min-h-[calc(100vh-4.5rem)] flex items-center justify-center px-2 sm:px-4 py-3 sm:py-4 select-none relative"
      >
        {/* Dynamic Animated Ambient Background */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
          {isAiTheme && (
            <div className="w-full h-full bg-gradient-to-b from-emerald-950/40 via-cyan-950/20 to-transparent">
              <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
            </div>
          )}
          {isCryptoTheme && (
            <div className="w-full h-full bg-gradient-to-b from-amber-950/40 via-purple-950/20 to-transparent">
              <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
            </div>
          )}
          {isFinanceTheme && (
            <div className="w-full h-full bg-gradient-to-b from-blue-950/40 via-teal-950/20 to-transparent">
              <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
            </div>
          )}
          {isPoliticsTheme && (
            <div className="w-full h-full bg-gradient-to-b from-rose-950/40 via-stone-950 to-transparent">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
            </div>
          )}
          {isRoastTheme && (
            <div className="w-full h-full bg-gradient-to-b from-orange-950/40 via-red-950/20 to-transparent">
              <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl" />
            </div>
          )}
        </div>

        {/* Main Rapid Swipe Deck Frame */}
        <div className="relative z-10 w-full max-w-[560px] flex items-center justify-center">
          {/* Card Body */}
          <div 
            key={currentPoll.id}
            className="w-full bg-[#0a0d14]/95 backdrop-blur-2xl border border-[#1d222e] rounded-3xl p-4 sm:p-7 shadow-2xl flex flex-col justify-between min-h-[520px] sm:min-h-[580px] max-h-[85vh] overflow-y-auto custom-scrollbar relative animate-in fade-in zoom-in-95 duration-200"
          >
            
            {/* 1. Top Bar: Progress, Format, Category & Clapperboard Motif */}
            <div className="flex items-center justify-between pb-3 border-b border-[#181d29] gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                  {format.toUpperCase()}
                </span>

                <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-stone-300 text-[10px] font-mono">
                  {currentCategory}
                </span>

                <span className="text-[10px] font-mono text-stone-500 hidden sm:inline">
                  {currentIndex + 1} of {polls.length}
                </span>
              </div>

              {/* Clapperboard Leaderboard Link Motif */}
              <Link
                to="/ranks"
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-mono font-bold transition-all border border-amber-500/30 shadow-sm"
                title="Leaderboard & Top Predictions"
              >
                <Clapperboard className="w-3.5 h-3.5 text-amber-400 stroke-[2.2]" />
                <span>Ranks</span>
              </Link>
            </div>

            {/* Sponsored Bounty Tag */}
            {currentPoll.isSponsored && (
              <div className="my-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-mono font-bold text-amber-300">
                    Bounty: {currentPoll.sponsorReward || "Sponsored Prediction"}
                  </span>
                </div>
                {currentPoll.sponsorUrl && (
                  <a
                    href={currentPoll.sponsorUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-mono text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>Partner</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* 2. Simulated Consensus Audio Wave Indicator */}
            <div className="flex items-center justify-between py-1 text-xs text-stone-400 border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  <span className="w-1 h-2.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1 h-4 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" />
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  Live Consensus Signal
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-stone-400">
                  {currentPoll.totalVotes ? `${currentPoll.totalVotes.toLocaleString()} votes` : "Active"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1 text-stone-400 hover:text-white"
                  title="Toggle Audio Feedback"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-stone-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              </div>
            </div>

            {/* 3. Central Content & Polling Engine */}
            <div className="my-auto py-3 space-y-4">
              {/* Question & Description */}
              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {currentPoll.title}
                </h2>
                {currentPoll.description && (
                  <p className="text-xs text-stone-300 line-clamp-3 leading-relaxed">
                    {currentPoll.description}
                  </p>
                )}
              </div>

              {/* Format Specific Engine */}
              <div className="py-2">
                {format === "versus" ? (
                  <Versus
                    pollId={currentPoll.id}
                    leftSide={currentPoll.versusLeft}
                    rightSide={currentPoll.versusRight}
                    hasVoted={currentPoll.hasVoted}
                    votedOption={currentPoll.votedOption}
                    isBlindMasked={isBlindMasked}
                    onVote={handleVote}
                  />
                ) : format === "scale" ? (
                  <Scale
                    pollId={currentPoll.id}
                    scaleMin={currentPoll.scaleMin}
                    scaleMax={currentPoll.scaleMax}
                    scaleUnit={currentPoll.scaleUnit}
                    scaleAverage={currentPoll.scaleAverage}
                    scaleVotesCount={currentPoll.scaleVotesCount}
                    hasVoted={currentPoll.hasVoted}
                    votedOption={currentPoll.votedOption}
                    isBlindMasked={isBlindMasked}
                    onVote={handleVote}
                  />
                ) : format === "rank" ? (
                  <Rank
                    pollId={currentPoll.id}
                    options={currentPoll.options}
                    rankedItems={currentPoll.rankedItems}
                    hasVoted={currentPoll.hasVoted}
                    votedOption={currentPoll.votedOption}
                    isBlindMasked={isBlindMasked}
                    onVote={handleVote}
                  />
                ) : format === "open" ? (
                  <Open
                    pollId={currentPoll.id}
                    submissions={currentPoll.openSubmissions}
                    hasVoted={currentPoll.hasVoted}
                    votedOption={currentPoll.votedOption}
                    onVote={handleVote}
                    onOpenSubmit={handleOpenCandidateSubmit}
                  />
                ) : (
                  <Choice
                    pollId={currentPoll.id}
                    options={currentPoll.options || []}
                    hasVoted={currentPoll.hasVoted}
                    votedOption={currentPoll.votedOption}
                    isBlindMasked={isBlindMasked}
                    onVote={handleVote}
                  />
                )}
              </div>
            </div>

            {/* 4. Forecaster Dossier Row */}
            <div className="pt-3 border-t border-[#181d29] flex items-center justify-between">
              <Link
                to={`/profile/${authorHandle}`}
                className="flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="w-8 h-8 rounded-full object-cover border border-emerald-500/40"
                />
                <div>
                  <div className="flex items-center gap-1 font-bold text-xs text-white leading-tight">
                    <span>@{authorHandle}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {authorAccuracy}% Accuracy Calibration
                  </span>
                </div>
              </Link>

              {/* Progress Bar Indicator */}
              <div className="text-[11px] font-mono text-stone-500 font-bold">
                {currentIndex + 1} / {polls.length}
              </div>
            </div>
          </div>

          {/* Right Action Rail (Vertical TikTok / Reels Style Cluster) */}
          <div className="flex flex-col items-center gap-2.5 sm:gap-4 ml-2 sm:ml-4 select-none shrink-0">
            {/* Endorsement / Like */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => handleToggleLike(currentPoll.id)}
                className="p-2.5 sm:p-3 rounded-full bg-[#111318] hover:bg-[#1a1e26] border border-[#222836] text-white hover:scale-110 active:scale-95 transition-all shadow-xl"
                title="Endorse Market"
              >
                <Heart
                  className={cn(
                    "w-4 h-4 sm:w-5 sm:h-5 transition-colors",
                    likedPolls[currentPoll.id] ? "fill-red-500 text-red-500" : "text-stone-300"
                  )}
                />
              </button>
              <span className="text-[10px] font-mono font-bold text-stone-400">
                {likedPolls[currentPoll.id] ? "1" : "0"}
              </span>
            </div>

            {/* Debate Drawer Trigger */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => setIsDebateOpen(true)}
                className="p-2.5 sm:p-3 rounded-full bg-[#111318] hover:bg-emerald-500/20 hover:border-emerald-500/50 border border-[#222836] text-emerald-400 hover:scale-110 active:scale-95 transition-all shadow-xl"
                title="Open Faction Discourse"
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <span className="text-[10px] font-mono font-bold text-stone-400">
                {commentCount}
              </span>
            </div>

            {/* Bookmark / Save */}
            <button
              type="button"
              onClick={() => handleToggleSave(currentPoll.id)}
              className="p-2.5 sm:p-3 rounded-full bg-[#111318] hover:bg-[#1a1e26] border border-[#222836] text-white hover:scale-110 active:scale-95 transition-all shadow-xl"
              title="Bookmark Market"
            >
              <Bookmark
                className={cn(
                  "w-4 h-4 sm:w-5 sm:h-5 transition-colors",
                  savedPolls[currentPoll.id] ? "fill-amber-400 text-amber-400" : "text-stone-300"
                )}
              />
            </button>

            {/* Share */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={handleShare}
                className="p-2.5 sm:p-3 rounded-full bg-[#111318] hover:bg-[#1a1e26] border border-[#222836] text-stone-300 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-xl"
                title="Share Signal Link"
              >
                {copiedLink ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <span className="text-[9px] font-mono text-stone-500">
                {copiedLink ? "✓" : "Share"}
              </span>
            </div>

            {/* Previous Reel / Snap Up */}
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={handlePrev}
              className="p-2 sm:p-2.5 rounded-full bg-[#111318] hover:bg-white/10 disabled:opacity-25 text-stone-400 hover:text-white transition-all"
              title="Previous (Up Arrow / k)"
            >
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Next Reel / Snap Down */}
            <button
              type="button"
              disabled={currentIndex === polls.length - 1}
              onClick={handleNext}
              className="p-2 sm:p-2.5 rounded-full bg-[#111318] hover:bg-white/10 disabled:opacity-25 text-stone-400 hover:text-white transition-all"
              title="Next (Down Arrow / j)"
            >
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Slide-over Debate Arena Drawer */}
        {isDebateOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end">
            <div className="w-full max-w-lg bg-[#0a0d14] border-l border-[#1d222e] h-full p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-[#1d222e]">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                    Faction Discourse
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDebateOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 text-stone-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 my-4">
                <Debate
                  pollId={currentPoll.id}
                  pollTitle={currentPoll.title}
                  userFaction={currentPoll.votedFaction}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
