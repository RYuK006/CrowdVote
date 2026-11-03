import React, { useState, useEffect } from "react";
import { ShieldCheck, Sliders, AlertTriangle, Save, Plus, X } from "lucide-react";
import { auth } from "../../firebase";

export function Safety() {
  const [prohibitedWords, setProhibitedWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState("");
  const [toxicityThreshold, setToxicityThreshold] = useState(0.85);
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState(60);
  const [spamFilterEnabled, setSpamFilterEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchSafety = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/admin/safety", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProhibitedWords(data.prohibitedWords || ["scam", "phishing", "hate", "malware", "ponzi"]);
        setToxicityThreshold(data.toxicityThreshold ?? 0.85);
        setRateLimitPerMinute(data.rateLimitPerMinute ?? 60);
        setSpamFilterEnabled(data.spamFilterEnabled ?? true);
      }
    } catch (err) {
      console.error("Safety fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSafety();
  }, []);

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;
    const term = newWord.trim().toLowerCase();
    if (!prohibitedWords.includes(term)) {
      setProhibitedWords([...prohibitedWords, term]);
      setNewWord("");
    }
  };

  const handleRemoveWord = (word: string) => {
    setProhibitedWords(prohibitedWords.filter(w => w !== word));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/admin/safety", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          prohibitedWords,
          toxicityThreshold,
          rateLimitPerMinute,
          spamFilterEnabled
        })
      });
      if (res.ok) {
        setStatusMsg("Safety rules and neural filters synchronized across all gateway endpoints.");
        setTimeout(() => setStatusMsg(null), 3000);
      }
    } catch (err) {
      console.error("Save safety error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center font-mono text-xs text-stone-500 animate-pulse">
        Loading safety filter configurations...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-base font-extrabold text-white font-mono uppercase tracking-wider">
          Safety & Content Policy
        </h2>
        <p className="text-xs text-stone-400 font-mono">
          Configure real-time censorship dictionaries, rate throttling, and autonomous spam heuristics
        </p>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
          {statusMsg}
        </div>
      )}

      {/* Prohibited Dictionary */}
      <div className="p-5 rounded-2xl bg-[#0c0f16] border border-[#1b202c] flex flex-col gap-3">
        <label className="text-xs font-bold text-white font-mono uppercase tracking-wider">
          Prohibited Keywords ({prohibitedWords.length})
        </label>
        <p className="text-[11px] text-stone-400 font-mono">
          Any user poll containing these terms is rejected immediately by the ingestion gateway.
        </p>

        {/* Word chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {prohibitedWords.map((word) => (
            <span
              key={word}
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-1.5"
            >
              {word}
              <button
                type="button"
                onClick={() => handleRemoveWord(word)}
                className="hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        {/* Add keyword input */}
        <form onSubmit={handleAddWord} className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="Add prohibited term..."
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-[#121622] border border-[#22293a] text-xs text-white placeholder-stone-500 outline-none focus:border-rose-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-200 text-xs font-mono font-bold transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </form>
      </div>

      {/* Thresholds and limits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Toxicity */}
        <div className="p-5 rounded-2xl bg-[#0c0f16] border border-[#1b202c] flex flex-col gap-2">
          <label className="text-xs font-bold text-white font-mono uppercase">
            Toxicity Threshold ({Math.round(toxicityThreshold * 100)}%)
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={toxicityThreshold}
            onChange={(e) => setToxicityThreshold(Number(e.target.value))}
            className="accent-rose-500"
          />
          <span className="text-[10px] text-stone-500 font-mono">
            Submissions exceeding this AI sentiment threshold are auto-quarantined.
          </span>
        </div>

        {/* Rate Limiting */}
        <div className="p-5 rounded-2xl bg-[#0c0f16] border border-[#1b202c] flex flex-col gap-2">
          <label className="text-xs font-bold text-white font-mono uppercase">
            Rate Limit / Minute
          </label>
          <input
            type="number"
            value={rateLimitPerMinute}
            onChange={(e) => setRateLimitPerMinute(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-[#121622] border border-[#22293a] text-xs text-white outline-none focus:border-emerald-500 font-mono"
          />
          <span className="text-[10px] text-stone-500 font-mono">
            Maximum API requests per IP before rate-throttling kicks in.
          </span>
        </div>
      </div>

      {/* Spam filter toggle */}
      <div className="p-4 rounded-2xl bg-[#0c0f16] border border-[#1b202c] flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white font-mono">
            Autonomous Heuristic Spam Filter
          </span>
          <span className="text-[10px] text-stone-400 font-mono">
            Automatically detect and block repetitive polling spam and Sybil clusters
          </span>
        </div>
        <input
          type="checkbox"
          checked={spamFilterEnabled}
          onChange={(e) => setSpamFilterEnabled(e.target.checked)}
          className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
        />
      </div>

      {/* Save Button */}
      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-mono font-extrabold uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4" /> {saving ? "Synchronizing..." : "Save Safety Rules"}
      </button>
    </div>
  );
}
