import React, { useState, useEffect } from "react";
import { MessageSquare, ThumbsUp, Send, Filter, ShieldCheck, User } from "lucide-react";
import { cn } from "../../lib/utils";
import { auth } from "../../firebase";
import { DebateItem } from "../../types";

interface DebateProps {
  pollId: string;
  pollTitle?: string;
  userFaction?: string;
}

export function Debate({ pollId, pollTitle, userFaction }: DebateProps) {
  const [comments, setComments] = useState<DebateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeFactionFilter, setActiveFactionFilter] = useState("all");

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/debate/${pollId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load debate comments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pollId) {
      fetchComments();
    }
  }, [pollId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      window.location.href = "/signin";
      return;
    }
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const currentUser = auth.currentUser;
      const token = await currentUser.getIdToken();

      const res = await fetch(`/api/debate/${pollId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: newComment.trim() })
      });

      if (res.ok) {
        const posted = await res.json();
        setComments(prev => [posted, ...prev]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Failed to post debate argument:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (commentId: string) => {
    if (!auth.currentUser) {
      window.location.href = "/signin";
      return;
    }
    try {
      const currentUser = auth.currentUser;
      const token = await currentUser.getIdToken();

      const res = await fetch(`/api/debate/${commentId}/upvote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setComments(prev =>
          prev.map(c => (c.id === commentId ? { ...c, upvotes: data.upvotes } : c))
        );
      }
    } catch (err) {
      console.error("Failed to upvote argument:", err);
    }
  };

  // Derive unique faction list from comments for filtering tabs
  const availableFactions = [
    "all",
    ...Array.from(new Set(comments.map(c => c.userFaction).filter(Boolean)))
  ];

  const filteredComments = activeFactionFilter === "all"
    ? comments
    : comments.filter(c => c.userFaction === activeFactionFilter);

  return (
    <div className="w-full flex flex-col gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-[#1e2533]">
      {/* Header & Faction Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            Debate Arena ({comments.length})
          </h3>
        </div>

        {userFaction && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full w-fit">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Your Stance: <strong>{userFaction}</strong></span>
          </div>
        )}
      </div>

      {/* Faction Filter Tabs */}
      {availableFactions.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {availableFactions.map(faction => (
            <button
              key={faction}
              type="button"
              onClick={() => setActiveFactionFilter(faction)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap transition-all border",
                activeFactionFilter === faction
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold border-transparent shadow-sm"
                  : "bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10"
              )}
            >
              {faction === "all" ? "All Factions" : faction}
            </button>
          ))}
        </div>
      )}

      {/* Argument Submission Form */}
      {auth.currentUser ? (
        <form onSubmit={handlePostComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Defend your thesis or challenge the consensus..."
            disabled={submitting}
            className="flex-1 bg-slate-50 dark:bg-[#121722] border border-slate-200 dark:border-[#1e2533] focus:border-slate-400 dark:focus:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 disabled:opacity-40 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            {submitting ? "Posting..." : <><Send className="w-3.5 h-3.5" /> Argue</>}
          </button>
        </form>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-100 dark:bg-[#121722] border border-slate-200 dark:border-[#1e2533] text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <User className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <span>Connect your forecaster node to submit thesis and upvote</span>
          </div>
          <a
            href="/signin"
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 font-bold text-xs font-sans transition-all shadow-sm self-start sm:self-auto"
          >
            Sign In to Argue
          </a>
        </div>
      )}

      {/* Comments List */}
      <div className="flex flex-col gap-2.5">
        {loading ? (
          <div className="p-4 text-center text-xs font-mono text-slate-500 dark:text-slate-400">
            Loading debate telemetry...
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#121722] border border-slate-200 dark:border-[#1e2533] text-center text-xs font-mono text-slate-500 dark:text-slate-400">
            No arguments submitted under this faction yet. Lead the discourse!
          </div>
        ) : (
          filteredComments.map(comment => (
            <div
              key={comment.id}
              className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-[#121722] border border-slate-200 dark:border-[#1e2533] flex flex-col gap-2 transition-all hover:border-slate-300 dark:hover:border-slate-700"
            >
              {/* Top: Author, Avatar & Faction Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <img
                    src={comment.userAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${comment.userId}`}
                    alt={comment.userName}
                    className="w-5 h-5 rounded-full bg-slate-200 dark:bg-black/60 border border-slate-300 dark:border-white/10 object-cover"
                  />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                    {comment.userName}
                  </span>
                  {/* Faction Badge */}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold">
                    [{comment.userFaction || "Forecaster"}]
                  </span>
                </div>

                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-500">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Text */}
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-7">
                {comment.text}
              </p>

              {/* Bottom Actions: Upvote */}
              <div className="flex items-center gap-3 pl-7 pt-1">
                <button
                  type="button"
                  onClick={() => handleUpvote(comment.id)}
                  className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors group"
                >
                  <ThumbsUp className="w-3 h-3 group-hover:scale-110 transition-transform" />
                  <span>{comment.upvotes || 0} Upvotes</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
