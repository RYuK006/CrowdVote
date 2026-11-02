import React, { useState } from "react";
import { X, Plus, Trash2, ShieldCheck, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import { auth } from "../firebase";
import { evaluatePollSafety } from "../lib/safetyRules";

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES = [
  "Tech & AI",
  "Startups & Roasts",
  "Finance & Crypto",
  "Politics",
  "Sports",
  "Pop Culture",
  "Science"
];

export function CreatePollModal({ isOpen, onClose, onSuccess }: CreatePollModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Tech & AI");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [daysOpen, setDaysOpen] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (text: string, index: number) => {
    const updated = [...options];
    updated[index] = text;
    setOptions(updated);
  };

  // Real-time safety evaluation
  const safetyCheck = evaluatePollSafety(title, description, options);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!safetyCheck.passed) {
      setError(safetyCheck.reason || "Please ensure poll meets safety guidelines.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const lockDate = new Date(Date.now() + daysOpen * 86400000).toISOString();

      const res = await fetch("/api/user/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          category,
          description: description.trim(),
          options: options.map(o => o.trim()).filter(Boolean),
          lockAt: lockDate
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit poll.");

      setSuccessMsg(data.message || "Poll submitted! Admin review in progress.");
      setTimeout(() => {
        setSuccessMsg(null);
        setTitle("");
        setDescription("");
        setOptions(["", ""]);
        onClose();
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-[32px] bg-[#0c0d0e] border border-white/10 shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Create New Poll</h3>
              <p className="text-xs font-mono text-stone-400">Post prediction topic to the neural mesh</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider font-bold text-stone-300 mb-1.5">
              Poll Title / Question *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Will AGI be achieved before 2028?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-stone-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Category & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider font-bold text-stone-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#141517] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider font-bold text-stone-300 mb-1.5">
                Duration (Days)
              </label>
              <select
                value={daysOpen}
                onChange={(e) => setDaysOpen(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl bg-[#141517] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value={3}>3 Days</option>
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider font-bold text-stone-300 mb-1.5">
              Context / Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Add key context, rules, or criteria for voters..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-stone-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Options Builder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider font-bold text-stone-300">
                Poll Options (2 - 6)
              </label>
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Option
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-stone-400 w-5 text-right">{idx + 1}.</span>
                  <input
                    type="text"
                    required
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(e.target.value, idx)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-2 rounded-xl text-stone-500 hover:text-red-400 hover:bg-white/5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Safety Rule Feedback Banner */}
          <div className={`p-3 rounded-2xl border text-xs font-mono flex items-center gap-2.5 ${
            safetyCheck.passed
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-amber-500/10 border-amber-500/30 text-amber-300"
          }`}>
            {safetyCheck.passed ? (
              <>
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Automated safety checks: <strong>PASSED</strong>. Compliant with community rules.</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{safetyCheck.reason}</span>
              </>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono text-center">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {successMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-mono text-stone-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !safetyCheck.passed}
              className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-mono font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
            >
              {submitting ? "Submitting..." : "Submit Poll"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
