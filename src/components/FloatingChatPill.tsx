import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Send, X, ExternalLink } from "lucide-react";

interface FloatingChatPillProps {
  unreadCount?: number;
}

const PREDICTION_CONTACTS = [
  {
    name: "Quantum Oracle",
    handle: "quantum_oracle",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&h=100&q=80",
    lastMsg: "Consensus probability shifted to 74% on autonomous reasoning.",
    time: "3m",
    online: true,
  },
  {
    name: "Alpha Macro",
    handle: "alpha_macro",
    avatar: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=100&h=100&q=80",
    lastMsg: "Bond yields are pricing a 50bps terminal rate cut.",
    time: "18m",
    online: true,
  },
  {
    name: "Cyber Pulse",
    handle: "cyber_pulse",
    avatar: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=100&h=100&q=80",
    lastMsg: "Double Ratchet key session refreshed for node mesh.",
    time: "45m",
    online: true,
  },
  {
    name: "Polity Matrix",
    handle: "polity_matrix",
    avatar: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=100&h=100&q=80",
    lastMsg: "Constituency swing district consensus updated.",
    time: "2h",
    online: false,
  }
];

export function FloatingChatPill({ unreadCount = 4 }: FloatingChatPillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end select-none">
      {/* Expanded Quick Direct Drawer */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 bg-[#121214] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-[#18181b] border-b border-[#262626] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Direct Messages</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate("/chat")}
                className="p-1.5 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
                title="Expand Full Chat"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Chat List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {PREDICTION_CONTACTS.map((node) => (
              <div
                key={node.handle}
                onClick={() => {
                  setIsOpen(false);
                  navigate("/chat");
                }}
                className="p-3 flex items-center gap-3 hover:bg-white/[0.04] cursor-pointer transition-colors"
              >
                <div className="relative">
                  <img
                    src={node.avatar}
                    alt={node.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#262626]"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  {node.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-black" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate">
                      {node.name}
                    </span>
                    <span className="text-[10px] font-mono text-stone-500">
                      {node.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 truncate mt-0.5">
                    {node.lastMsg}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer action */}
          <div className="p-2.5 bg-[#18181b]/50 border-t border-[#262626] text-center">
            <Link
              to="/chat"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors block py-1"
            >
              Open E2EE Direct Messenger →
            </Link>
          </div>
        </div>
      )}

      {/* Floating Pill Button (Exact Layout) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#18181b]/95 hover:bg-[#202024] border border-[#2c2c30] text-white shadow-2xl backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95"
      >
        {/* Unread badge + Icon */}
        <div className="relative flex items-center justify-center">
          <Send className="w-4 h-4 text-white -rotate-12 group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute -top-2.5 -left-2.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-extrabold leading-none shadow-md">
              {unreadCount}
            </span>
          )}
        </div>

        {/* Text */}
        <span className="text-xs font-bold tracking-tight">Messages</span>

        {/* Stacked Circular Avatars */}
        <div className="flex items-center -space-x-2 overflow-hidden ml-1">
          <img
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=48&h=48&q=80"
            alt="Quantum Oracle"
            className="w-5 h-5 rounded-full object-cover border border-[#18181b]"
          />
          <img
            src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=48&h=48&q=80"
            alt="Alpha Macro"
            className="w-5 h-5 rounded-full object-cover border border-[#18181b]"
          />
          <img
            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=48&h=48&q=80"
            alt="Cyber Pulse"
            className="w-5 h-5 rounded-full object-cover border border-[#18181b]"
          />
        </div>
      </button>
    </div>
  );
}
