// FILE PATH: app/dashboard/create/page.tsx

"use client";

import { useState } from "react";
import {
  Sparkles, Loader2, RefreshCw, Send, CalendarDays,
  CheckCircle2, XCircle, Radio, Linkedin, ChevronDown,
  Check, X, Clock, FileText,
} from "lucide-react";

// ── Only LinkedIn and X ──────────────────────────────────────────────────────
type Platform = "linkedin" | "x";
type GeneratedPosts = Partial<Record<Platform, string>>;
type Toast = { type: "success" | "error"; message: string } | null;

const PLATFORM_META: Record<Platform, {
  label: string; icon: React.ElementType; color: string; hint: string; maxChars?: number;
}> = {
  linkedin: { label: "LinkedIn", icon: Linkedin, color: "#0A66C2", hint: "150-300 words · professional · hashtags at end" },
  x:        { label: "X",        icon: Radio,    color: "#e4e4e7", hint: "Max 280 chars · punchy · no filler", maxChars: 280 },
};

const PLATFORMS = Object.keys(PLATFORM_META) as Platform[];
const TONES = ["Professional", "Casual", "Witty", "Inspirational", "Educational", "Storytelling"];
const GOALS = ["Build audience", "Drive engagement", "Share knowledge", "Promote product", "Start discussion", "Personal brand"];

export default function CreatePostPage() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["linkedin", "x"]);
  const [idea, setIdea]                 = useState("");
  const [tone, setTone]                 = useState("Professional");
  const [goal, setGoal]                 = useState("Build audience");
  const [userInstructions, setUserInstructions] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const [generating, setGenerating]     = useState(false);
  const [posts, setPosts]               = useState<GeneratedPosts | null>(null);
  const [activeTab, setActiveTab]       = useState<Platform>("linkedin");
  const [regenerating, setRegenerating] = useState<Platform | null>(null);
  const [publishing, setPublishing]     = useState<Platform | null>(null);
  const [published, setPublished]       = useState<Set<Platform>>(new Set());
  const [toast, setToast]               = useState<Toast>(null);
  const [scheduleModal, setScheduleModal] = useState<Platform | null>(null);
  const [scheduleDate, setScheduleDate]   = useState("");
  const [scheduleTime, setScheduleTime]   = useState("");
  const [scheduling, setScheduling]       = useState(false);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  }

  function togglePlatform(p: Platform) {
    setSelectedPlatforms((prev) => {
      if (prev.includes(p)) return prev.length === 1 ? prev : prev.filter((x) => x !== p);
      return [...prev, p];
    });
  }

  async function generatePosts() {
    if (!idea.trim() || selectedPlatforms.length === 0) return;
    setGenerating(true);
    setPosts(null);
    setPublished(new Set());
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: idea.trim(), tone, goal,
          platforms: selectedPlatforms,
          customInstructions: userInstructions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setPosts(data.posts);
      setActiveTab(selectedPlatforms[0]);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  }

  async function regeneratePlatform(platform: Platform) {
    if (!posts) return;
    setRegenerating(platform);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: idea.trim(), tone, goal, platforms: [platform], customInstructions: userInstructions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setPosts((prev) => prev ? { ...prev, [platform]: data.posts[platform] } : prev);
    } catch {
      showToast("error", "Regeneration failed. Try again.");
    } finally {
      setRegenerating(null);
    }
  }

  async function publishNow(platform: Platform) {
    if (!posts?.[platform]) return;
    setPublishing(platform);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: posts[platform], platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Publish failed");
      setPublished((prev) => new Set([...prev, platform]));
      showToast("success", `Published to ${PLATFORM_META[platform].label}!`);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(null);
    }
  }

  function saveDraft(platform: Platform) {
    if (!posts?.[platform]) return;
    try {
      const existing = JSON.parse(localStorage.getItem("nect_drafts") ?? "[]");
      const draft = {
        id: crypto.randomUUID(),
        text: posts[platform]!,
        platform,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem("nect_drafts", JSON.stringify([draft, ...existing]));
      showToast("success", `Saved to Drafts!`);
    } catch {
      showToast("error", "Could not save draft.");
    }
  }

  async function schedulePost() {
    if (!posts || !scheduleModal || !scheduleDate || !scheduleTime) return;
    setScheduling(true);
    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: posts[scheduleModal], platform: scheduleModal, scheduledAt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Schedule failed");
      showToast("success", `Scheduled for ${new Date(scheduledAt).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`);
      setScheduleModal(null);
      setScheduleDate("");
      setScheduleTime("");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Schedule failed");
    } finally {
      setScheduling(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const generatedPlatforms = posts ? selectedPlatforms.filter((p) => posts[p]) : [];

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-8">

      {/* Toast */}
      {toast && (
        <div className={`fixed right-5 top-5 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-sm ${
          toast.type === "success" ? "border-green-800 bg-green-950 text-green-300" : "border-red-800 bg-red-950 text-red-300"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Create Post</h1>
        <p className="mt-1 text-sm text-zinc-500">Enter one idea — AI writes platform-native posts for LinkedIn and X.</p>
      </div>

      {/* ── Input card ── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">

        {/* Platform selector — LinkedIn + X toggle */}
        <div className="mb-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Platforms</p>
            <p className="text-[10px] text-zinc-700">Select one or both</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map((p) => {
              const { label, icon: Icon, color } = PLATFORM_META[p];
              const selected = selectedPlatforms.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`relative flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium transition-all duration-150 ${
                    selected
                      ? "border-[#F97316]/50 bg-[#F97316]/[0.06] text-white shadow-[0_0_16px_rgba(249,115,22,0.12)]"
                      : "border-white/8 bg-white/[0.02] text-zinc-400 hover:border-white/15 hover:text-zinc-200"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" style={{ color: selected ? color : undefined }} />
                  <span className="font-semibold">{label}</span>
                  {selected && (
                    <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#F97316]">
                      <Check className="h-2.5 w-2.5 text-black" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Idea */}
        <div className="border-t border-white/8 pt-5 mb-5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">Your idea</p>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generatePosts(); }}
            placeholder="e.g. I just shipped a feature that lets users schedule posts to multiple platforms from one editor..."
            rows={4}
            className="w-full resize-none bg-transparent text-base leading-7 text-zinc-100 placeholder:text-zinc-700 focus:outline-none"
          />
        </div>

        {/* Tone + Goal + Generate */}
        <div className="flex flex-wrap items-end gap-3 border-t border-white/8 pt-5">
          <div className="min-w-[130px] flex-1">
            <label className="mb-1.5 block text-[10px] text-zinc-600">Tone</label>
            <div className="relative">
              <select value={tone} onChange={(e) => setTone(e.target.value)}
                className="w-full appearance-none rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-300 focus:outline-none">
                {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
            </div>
          </div>
          <div className="min-w-[130px] flex-1">
            <label className="mb-1.5 block text-[10px] text-zinc-600">Goal</label>
            <div className="relative">
              <select value={goal} onChange={(e) => setGoal(e.target.value)}
                className="w-full appearance-none rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-300 focus:outline-none">
                {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
            </div>
          </div>
          <button
            onClick={generatePosts}
            disabled={generating || !idea.trim() || selectedPlatforms.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-6 py-2.5 text-sm font-bold text-black transition-all duration-200 hover:bg-[#fb923c] hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Generate Posts</>}
          </button>
        </div>

        {/* Custom instructions */}
        <div className="mt-3">
          <button onClick={() => setShowInstructions((v) => !v)}
            className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
            {showInstructions ? "− Hide" : "+ Add"} custom instructions for the AI
          </button>
          {showInstructions && (
            <textarea
              value={userInstructions}
              onChange={(e) => setUserInstructions(e.target.value)}
              placeholder="e.g. Always write in first person. Keep LinkedIn posts under 200 words. Make X posts a question..."
              rows={2}
              className="mt-2 w-full resize-none rounded-xl border border-white/8 bg-black/30 px-3 py-2.5 text-xs leading-6 text-zinc-400 placeholder:text-zinc-700 focus:border-white/15 focus:outline-none"
            />
          )}
        </div>
        <p className="mt-2 text-right text-[10px] text-zinc-700">⌘+Enter to generate</p>
      </div>

      {/* Loading */}
      {generating && (
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#F97316]" />
            <span className="text-sm text-zinc-500">Writing {selectedPlatforms.length} post{selectedPlatforms.length > 1 ? "s" : ""}…</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {selectedPlatforms.map((p) => {
              const { icon: Icon, color } = PLATFORM_META[p];
              return (
                <div key={p} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Icon className="h-4 w-4 animate-pulse" style={{ color }} />
                    <div className="h-3 w-16 animate-pulse rounded-full bg-white/8" />
                  </div>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="mb-2 h-2.5 animate-pulse rounded-full bg-white/5" style={{ width: `${90 - i * 10}%` }} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Generated posts */}
      {posts && !generating && generatedPlatforms.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">
              Your Posts
              <span className="ml-2 text-xs font-normal text-zinc-600">edit inline · then publish or schedule</span>
            </h2>
          </div>

          {/* Tabs */}
          <div className="mb-4 flex gap-1 rounded-xl border border-white/8 bg-black/30 p-1">
            {generatedPlatforms.map((platform) => {
              const { label, icon: Icon, color } = PLATFORM_META[platform];
              return (
                <button key={platform} onClick={() => setActiveTab(platform)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                    activeTab === platform ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}>
                  <Icon className="h-4 w-4" style={{ color: activeTab === platform ? color : undefined }} />
                  {label}
                  {published.has(platform) && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
                </button>
              );
            })}
          </div>

          {/* Active post */}
          {generatedPlatforms.map((platform) => {
            if (platform !== activeTab) return null;
            const { label, icon: Icon, color, hint, maxChars } = PLATFORM_META[platform];
            const charCount   = posts[platform]?.length ?? 0;
            const isOverLimit = maxChars ? charCount > maxChars : false;
            const isPublished = published.has(platform);

            return (
              <div key={platform} className={`rounded-2xl border bg-white/[0.02] p-5 transition-all ${
                isPublished ? "border-green-800/40" : "border-white/10"
              }`}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color }} />
                    <span className="text-sm font-semibold text-zinc-200">{label}</span>
                    <span className="hidden text-xs text-zinc-700 sm:inline">· {hint}</span>
                    {isPublished && (
                      <span className="flex items-center gap-1 text-[10px] text-green-500">
                        <CheckCircle2 className="h-3 w-3" /> Published
                      </span>
                    )}
                  </div>
                  <button onClick={() => regeneratePlatform(platform)} disabled={regenerating === platform}
                    className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-[10px] text-zinc-500 hover:border-white/20 hover:text-zinc-300 disabled:opacity-40 transition-colors">
                    {regenerating === platform ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    Rewrite
                  </button>
                </div>

                <textarea
                  value={posts[platform] ?? ""}
                  onChange={(e) => setPosts((prev) => prev ? { ...prev, [platform]: e.target.value } : prev)}
                  rows={10}
                  className="w-full resize-y bg-transparent text-sm leading-7 text-zinc-100 focus:outline-none"
                />

                <p className={`mt-1 mb-4 text-right text-[10px] ${isOverLimit ? "font-bold text-red-400" : "text-zinc-700"}`}>
                  {charCount}{maxChars ? `/${maxChars}` : ""} chars{isOverLimit ? " — over limit!" : ""}
                </p>

                <div className="flex flex-wrap gap-2 border-t border-white/8 pt-4">
                  <button onClick={() => publishNow(platform)}
                    disabled={!!publishing || isOverLimit || isPublished}
                    className="flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2 text-sm font-bold text-black transition-all duration-200 hover:bg-[#fb923c] hover:shadow-[0_0_16px_rgba(249,115,22,0.4)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40">
                    {publishing === platform ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    {isPublished ? "Published ✓" : "Post now"}
                  </button>
                  <button onClick={() => setScheduleModal(platform)}
                    disabled={isPublished}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition-all duration-200 hover:border-[#F97316]/40 hover:text-white hover:shadow-[0_0_10px_rgba(249,115,22,0.1)] disabled:opacity-40">
                    <Clock className="h-3.5 w-3.5" /> Schedule
                  </button>
                  <button onClick={() => saveDraft(platform)}
                    className="flex items-center gap-1.5 rounded-xl border border-white/8 px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-400 transition-colors">
                    <FileText className="h-3.5 w-3.5" /> Save draft
                  </button>
                </div>
              </div>
            );
          })}

          {/* Publish both */}
          {generatedPlatforms.length > 1 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => generatedPlatforms.forEach((p) => { if (!published.has(p)) publishNow(p); })}
                disabled={!!publishing || generatedPlatforms.every((p) => published.has(p))}
                className="flex items-center gap-2 rounded-xl border border-[#F97316]/30 px-5 py-2.5 text-sm font-bold text-[#F97316] transition-all duration-200 hover:border-[#F97316]/60 hover:shadow-[0_0_14px_rgba(249,115,22,0.2)] disabled:cursor-not-allowed disabled:opacity-40">
                <Send className="h-4 w-4" /> Publish to both platforms
              </button>
            </div>
          )}
        </div>
      )}

      {/* Schedule modal */}
      {scheduleModal && posts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4"
          onClick={(e) => e.target === e.currentTarget && setScheduleModal(null)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(() => { const { icon: Icon, color } = PLATFORM_META[scheduleModal]; return <Icon className="h-4 w-4" style={{ color }} />; })()}
                <h3 className="text-base font-semibold text-white">Schedule to {PLATFORM_META[scheduleModal].label}</h3>
              </div>
              <button onClick={() => setScheduleModal(null)} className="text-zinc-600 hover:text-zinc-400"><X className="h-4 w-4" /></button>
            </div>
            <p className="mb-4 text-xs text-zinc-600">Syncs to Google Calendar if connected.</p>
            <div className="mb-4 max-h-24 overflow-hidden rounded-xl border border-white/8 bg-black/30 p-3">
              <p className="line-clamp-3 text-xs leading-6 text-zinc-500">{posts[scheduleModal]}</p>
            </div>

            <div className="mb-5 flex gap-3">
              <div className="flex-1">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-600">Date</label>
                <input type="date" min={today} value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:outline-none [color-scheme:dark]" />
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-600">Time</label>
                <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:outline-none [color-scheme:dark]" />
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setScheduleModal(null)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Cancel</button>
              <button onClick={schedulePost} disabled={scheduling || !scheduleDate || !scheduleTime}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#F97316] py-2.5 text-sm font-bold text-black hover:bg-[#fb923c] hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                {scheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
                Schedule post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}