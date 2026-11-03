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
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : null;

      const res = await fetch(`/api/debate/${pollId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
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
    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await currentUser.getIdToken() : null;

      const res = await fetch(`/api/debate/${commentId}/upvote`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
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
    <div className="w-full flex flex-col gap-4 mt-6 pt-6 border-t border-[#1d222e]">
      {/* Header & Faction Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Debate Arena ({comments.length})
          </h3>
        </div>

        {userFaction && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full w-fit">
            <ShieldCheck className="w-3 h-3" />
            <span>Your Faction: <strong>{userFaction}</strong></span>
          </div>
        )}
      </div>

      {/* Faction Filter Tabs */}
      {availableFactions.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-mono text-stone-500 uppercase mr-1 flex items-center gap-1">
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
                  ? "bg-emerald-500 text-black font-bold border-emerald-400 shadow-sm"
                  : "bg-white/5 hover:bg-white/10 text-stone-400 border-white/5"
              )}
            >
              {faction === "all" ? "All Factions" : faction}
            </button>
          ))}
        </div>
      )}

      {/* Argument Submission Form */}
      <form onSubmit={handlePostComment} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Defend your thesis or challenge the consensus..."
          disabled={submitting}
          className="flex-1 bg-[#0b0e14] border border-[#20242e] focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-500 outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95"
        >
          {submitting ? "Posting..." : <><Send className="w-3.5 h-3.5" /> Argue</>}
        </button>
      </form>

      {/* Comments List */}
      <div className="flex flex-col gap-2.5">
        {loading ? (
          <div className="p-4 text-center text-xs font-mono text-stone-500">
            Loading debate telemetry...
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="p-6 rounded-xl bg-black/30 border border-white/5 text-center text-xs font-mono text-stone-500">
            No arguments submitted under this faction yet. Lead the discourse!
          </div>
        ) : (
          filteredComments.map(comment => (
            <div
              key={comment.id}
              className="p-3.5 rounded-xl bg-[#0c0f16] border border-[#1b202c] flex flex-col gap-2 transition-all hover:border-[#283042]"
            >
              {/* Top: Author, Avatar & Faction Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <img
                    src={comment.userAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${comment.userId}`}
                    alt={comment.userName}
                    className="w-5 h-5 rounded-full bg-black/60 border border-white/10 object-cover"
                  />
                  <span className="text-xs font-bold text-stone-200">
                    {comment.userName}
                  </span>
                  {/* Faction Badge */}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                    [{comment.userFaction || "Forecaster"}]
                  </span>
                </div>

                <span className="text-[10px] font-mono text-stone-500">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Text */}
              <p className="text-xs text-stone-300 leading-relaxed pl-7">
                {comment.text}
              </p>

              {/* Bottom Actions: Upvote */}
              <div className="flex items-center gap-3 pl-7 pt-1">
                <button
                  type="button"
                  onClick={() => handleUpvote(comment.id)}
                  className="flex items-center gap-1.5 text-[11px] font-mono text-stone-400 hover:text-emerald-400 transition-colors group"
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
