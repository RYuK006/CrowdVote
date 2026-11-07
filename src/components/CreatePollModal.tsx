import React, { useState } from "react";
import { 
  X, Plus, Trash2, Sparkles, Swords, ListFilter, 
  Gauge, Trophy, Users, ShieldCheck, Lock, RefreshCw 
} from "lucide-react";
import { auth } from "../firebase";
import { evaluatePollSafety } from "../lib/safetyRules";
import { PollFormat } from "../types";
import { cn } from "../lib/utils";

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES = [
  "Tech & AI",
  "Markets & Crypto",
  "Startups",
  "Politics",
  "Sports",
  "Pop Culture",
  "Science"
];

const FORMAT_TABS: Array<{ format: PollFormat; label: string; icon: any; desc: string }> = [
  { format: "choice", label: "Choice", icon: ListFilter, desc: "Standard multi-option list" },
  { format: "versus", label: "Versus", icon: Swords, desc: "Split-screen A vs B faceoff" },
  { format: "scale", label: "Scale", icon: Gauge, desc: "0-100% sentiment slider" },
  { format: "rank", label: "Rank", icon: Trophy, desc: "Instant-Runoff preference order" },
  { format: "open", label: "Open", icon: Users, desc: "Crowdsourced candidate ballot" },
];

export function CreatePollModal({ isOpen, onClose, onSuccess }: CreatePollModalProps) {
  const [format, setFormat] = useState<PollFormat>("choice");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Tech & AI");
  const [description, setDescription] = useState("");
  
  // Choice & Rank options
  const [options, setOptions] = useState<string[]>(["", ""]);

  // Versus options
  const [versusLeftLabel, setVersusLeftLabel] = useState("");
  const [versusRightLabel, setVersusRightLabel] = useState("");

  // Scale options
  const [scaleMin, setScaleMin] = useState(0);
  const [scaleMax, setScaleMax] = useState(100);
  const [scaleUnit, setScaleUnit] = useState("%");

  // Voting dynamics toggles
  const [blind, setBlind] = useState(true);
  const [changeable, setChangeable] = useState(true);
  const [durationHours, setDurationHours] = useState(72); // 3 days default

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    // Safety check
    const contentToCheck = format === "versus" 
      ? [versusLeftLabel, versusRightLabel]
      : options;
    const safetyCheck = evaluatePollSafety(title, description, contentToCheck);
    if (!safetyCheck.passed) {
      setError(safetyCheck.reason || "Please ensure poll meets safety guidelines.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const lockDate = new Date(Date.now() + durationHours * 3600000).toISOString();

      const payload: any = {
        title: title.trim(),
        category,
        description: description.trim(),
        format,
        blind,
        changeable,
        lockAt: lockDate
      };

      if (format === "versus") {
        payload.versusLeft = { label: versusLeftLabel.trim() };
        payload.versusRight = { label: versusRightLabel.trim() };
      } else if (format === "scale") {
        payload.scaleMin = scaleMin;
        payload.scaleMax = scaleMax;
        payload.scaleUnit = scaleUnit;
      } else if (format === "rank" || format === "choice") {
        payload.options = options.map(o => o.trim()).filter(Boolean);
      } else if (format === "open") {
        payload.options = [];
      }

      const res = await fetch("/api/user/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit poll.");

      setSuccessMsg(data.message || "Poll submitted for moderation review!");
      setTimeout(() => {
        setSuccessMsg(null);
        setTitle("");
        setDescription("");
        setOptions(["", ""]);
        setVersusLeftLabel("");
        setVersusRightLabel("");
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0e1219] border border-slate-200 dark:border-[#1e2533] shadow-2xl p-6 sm:p-8 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#1e2533]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#161d2a] border border-slate-200 dark:border-[#1e2533] flex items-center justify-center text-slate-700 dark:text-slate-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Prediction Node</h3>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Deploy a consensus question into the mesh</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="mt-5">
          <label className="block text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-2">
            Select Poll Format
          </label>
          <div className="grid grid-cols-5 gap-2">
            {FORMAT_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = format === tab.format;
              return (
                <button
                  key={tab.format}
                  type="button"
                  onClick={() => setFormat(tab.format)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all",
                    isActive
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold border-transparent shadow-sm"
                      : "bg-slate-50 dark:bg-[#121722] border-slate-200 dark:border-[#1e2533] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161d2a]"
                  )}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span className="text-[11px] font-bold font-mono">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1">
              Title / Proposition *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Will Ethereum flip Bitcoin market cap by 2028?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#121722] border border-slate-200 dark:border-[#1e2533] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors"
            />
          </div>

          {/* Category & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1">
                Domain Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121722] border border-slate-200 dark:border-[#1e2533] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-slate-400 dark:focus:border-slate-600"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1">
                Resolution Lifespan
              </label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121722] border border-slate-200 dark:border-[#1e2533] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-slate-400 dark:focus:border-slate-600"
              >
                <option value={1}>1 Hour (Flash Thesis)</option>
                <option value={24}>24 Hours (Daily Lock)</option>
                <option value={72}>3 Days</option>
                <option value={168}>7 Days (Standard)</option>
                <option value={720}>30 Days (Macro Horizon)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1">
              Context / Resolution Criteria (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="State clear resolution sources and criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-[#121722] border border-slate-200 dark:border-[#1e2533] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors"
            />
          </div>

          {/* Format-Specific Option Inputs */}
          {format === "versus" ? (
            <div className="space-y-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#121722] border border-slate-200 dark:border-[#1e2533]">
              <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                Versus Contenders
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1">Side A Label *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OpenAI o3"
                    value={versusLeftLabel}
                    onChange={(e) => setVersusLeftLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#161d2a] border border-slate-200 dark:border-[#1e2533] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-slate-400 dark:focus:border-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1">Side B Label *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DeepSeek-R1"
                    value={versusRightLabel}
                    onChange={(e) => setVersusRightLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#161d2a] border border-slate-200 dark:border-[#1e2533] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-slate-400 dark:focus:border-slate-600"
                  />
                </div>
              </div>
            </div>
          ) : format === "scale" ? (
            <div className="space-y-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#121722] border border-slate-200 dark:border-[#1e2533]">
              <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                Scale Range & Metric
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1">Min Value</label>
                  <input
                    type="number"
                    value={scaleMin}
                    onChange={(e) => setScaleMin(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#161d2a] border border-slate-200 dark:border-[#1e2533] text-slate-900 dark:text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1">Max Value</label>
                  <input
                    type="number"
                    value={scaleMax}
                    onChange={(e) => setScaleMax(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#161d2a] border border-slate-200 dark:border-[#1e2533] text-slate-900 dark:text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1">Unit</label>
                  <input
                    type="text"
                    value={scaleUnit}
                    onChange={(e) => setScaleUnit(e.target.value)}
                    placeholder="%"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#161d2a] border border-slate-200 dark:border-[#1e2533] text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>
            </div>
          ) : format === "open" ? (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#121722] border border-slate-200 dark:border-[#1e2533] text-xs font-mono text-slate-500 dark:text-slate-400">
              Community voters will dynamically submit candidate choices to this open ballot.
            </div>
          ) : (
            /* Choice & Rank Builder */
            <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-[#121722] border border-slate-200 dark:border-[#1e2533]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">
                  {format === "rank" ? "Rank Candidates (2 - 6)" : "Options (2 - 6)"}
                </span>
                {options.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs font-mono text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                )}
              </div>

              {options.map((opt, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-[#161d2a] border border-slate-300 dark:border-[#1e2533] text-[10px] font-mono font-bold flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <input
                    type="text"
                    required
                    placeholder={`Option ${index + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(e.target.value, index)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#161d2a] border border-slate-200 dark:border-[#1e2533] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-slate-400 dark:focus:border-slate-600"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Voting Dynamics Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#121722] border border-slate-200 dark:border-[#1e2533] cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={blind}
                onChange={(e) => setBlind(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" /> Blind Voting
                </span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  Mask consensus until vote is cast
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#121722] border border-slate-200 dark:border-[#1e2533] cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={changeable}
                onChange={(e) => setChangeable(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-slate-400 dark:text-slate-500" /> Modifiable Stance
                </span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  Allow updating vote before lock
                </span>
              </div>
            </label>
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">
              {successMsg}
            </div>
          )}

          {/* CTA */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-[0.99] uppercase tracking-wider font-mono"
          >
            {submitting ? "Broadcasting..." : "Publish to Swarm Feed"}
          </button>
        </form>
      </div>
    </div>
  );
}
