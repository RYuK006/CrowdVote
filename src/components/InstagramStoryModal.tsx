import React, { useEffect, useState } from "react";
import { X, Heart, Flame, Sparkles, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

export interface StoryItem {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  role: string;
  timeAgo: string;
  quote: string;
  category: string;
  pollId?: string;
}

interface InstagramStoryModalProps {
  stories: StoryItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectStory: (index: number) => void;
}

export function InstagramStoryModal({
  stories,
  currentIndex,
  isOpen,
  onClose,
  onSelectStory,
}: InstagramStoryModalProps) {
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sentReply, setSentReply] = useState(false);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (!isOpen || !currentStory) return;
    setProgress(0);
    setLiked(false);
    setSentReply(false);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            onSelectStory(currentIndex + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, currentIndex, stories.length, onSelectStory, onClose, currentStory]);

  if (!isOpen || !currentStory) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      onSelectStory(currentIndex - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < stories.length - 1) {
      onSelectStory(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSentReply(true);
    setReplyText("");
    setTimeout(() => setSentReply(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      {/* Navigation Arrow Left */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrev}
          className="hidden md:flex absolute left-8 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-all z-50"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Main Story Card (Instagram 9:16 format) */}
      <div 
        className="relative w-full max-w-[420px] h-[750px] max-h-[92vh] bg-gradient-to-b from-[#18181b] via-[#09090b] to-[#000000] rounded-3xl border border-white/10 overflow-hidden flex flex-col justify-between p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Progress Bars */}
        <div className="flex items-center gap-1.5 w-full z-20">
          {stories.map((s, idx) => (
            <div key={s.id} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                style={{
                  width: idx < currentIndex ? "100%" : idx === currentIndex ? `${progress}%` : "0%"
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Header */}
        <div className="flex items-center justify-between mt-3 z-20">
          <div className="flex items-center gap-3">
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-lime-400">
              <img
                src={currentStory.avatar}
                alt={currentStory.name}
                className="w-10 h-10 rounded-full object-cover border border-black"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-bold tracking-tight">{currentStory.handle}</span>
                <span className="text-white/60 text-xs font-mono">{currentStory.timeAgo}</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-medium block">
                {currentStory.role}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Center Stage / Media */}
        <div className="my-auto flex flex-col items-center justify-center text-center px-4 space-y-6 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase tracking-widest font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            {currentStory.category}
          </div>

          <div className="relative p-6 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md max-w-sm w-full">
            <div className="absolute -top-3 left-6 px-2 py-0.5 rounded bg-emerald-500 text-black text-[10px] font-mono font-extrabold uppercase tracking-wider">
              Neural Thesis
            </div>
            <p className="text-white font-medium text-lg leading-relaxed pt-2">
              "{currentStory.quote}"
            </p>
          </div>

          <div className="text-xs font-mono text-stone-400">
            Tap left/right to navigate • Predictive consensus
          </div>
        </div>

        {/* Story Footer / Direct Reply */}
        <div className="mt-auto space-y-3 z-20">
          {sentReply ? (
            <div className="py-2.5 px-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold text-center">
              ✓ Prediction note sent to {currentStory.handle}
            </div>
          ) : (
            <form onSubmit={handleSendReply} className="flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${currentStory.handle}...`}
                className="flex-1 bg-black/50 border border-white/20 rounded-full px-4 py-2.5 text-xs text-white placeholder-white/50 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setLiked(!liked)}
                className={cn(
                  "p-2.5 rounded-full border transition-all",
                  liked 
                    ? "bg-red-500/20 border-red-500 text-red-500 scale-110" 
                    : "border-white/20 text-white/70 hover:text-white hover:border-white/40"
                )}
              >
                <Heart className={cn("w-5 h-5", liked && "fill-red-500")} />
              </button>
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="p-2.5 rounded-full bg-emerald-500 text-black disabled:opacity-30 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Navigation Arrow Right */}
      {currentIndex < stories.length - 1 && (
        <button
          onClick={handleNext}
          className="hidden md:flex absolute right-8 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-all z-50"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
