"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  RefreshCw,
  Send,
  CalendarDays,
  FileText,
  CheckCircle2,
  XCircle,
  Instagram,
  Radio,
  Linkedin,
  MessageCircle,
  ChevronDown,
} from "lucide-react";

type Platform = "linkedin" | "instagram" | "x" | "reddit";

type GeneratedPosts = Record<Platform, string>;

type ToastState = { type: "success" | "error"; message: string } | null;

const PLATFORM_META: Record<Platform, { label: string; icon: React.ElementType; color: string; hint: string }> = {
  linkedin:  { label: "LinkedIn",  icon: Linkedin,       color: "#0A66C2", hint: "Professional tone, insights, storytelling" },
  instagram: { label: "Instagram", icon: Instagram,       color: "#E1306C", hint: "Visual, casual, emojis, hashtags" },
  x:         { label: "X",         icon: Radio,          color: "#ffffff", hint: "Short, punchy, conversational" },
  reddit:    { label: "Reddit",    icon: MessageCircle,  color: "#FF4500", hint: "Detailed, community-focused, no hard sell" },
};

const PLATFORMS = Object.keys(PLATFORM_META) as Platform[];

const TONES = ["Professional", "Casual", "Witty", "Inspirational", "Educational"];
const GOALS = ["Build audience", "Drive engagement", "Share knowledge", "Promote product", "Start discussion"];

export default function CreatePostPage() {
  const [idea, setIdea]             = useState("");
  const [tone, setTone]             = useState("Professional");
  const [goal, setGoal]             = useState("Build audience");
  const [generating, setGenerating] = useState(false);
  const [posts, setPosts]           = useState<GeneratedPosts | null>(null);
  const [activeTab, setActiveTab]   = useState<Platform>("linkedin");
  const [regenerating, setRegenerating] = useState<Platform | null>(null);
  const [publishing, setPublishing] = useState<Platform | null>(null);
  const [toast, setToast]           = useState<ToastState>(null);

  // Schedule modal state
  const [scheduleModal, setScheduleModal] = useState<Platform | null>(null);
  const [scheduleDate, setScheduleDate]   = useState("");
  const [scheduleTime, setScheduleTime]   = useState("");
  const [scheduling, setScheduling]       = useState(false);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function generatePosts() {
    if (!idea.trim()) return;
    setGenerating(true);
    setPosts(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: idea.trim(), tone, goal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setPosts(data.posts);
      setActiveTab("linkedin");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to generate posts");
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
        body: JSON.stringify({ idea: idea.trim(), tone, goal, platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setPosts((prev) => prev ? { ...prev, [platform]: data.posts[platform] } : prev);
    } catch {
      showToast("error", "Failed to regenerate. Try again.");
    } finally {
      setRegenerating(null);
    }
  }

  async function publishNow(platform: Platform) {
    if (!posts) return;
    setPublishing(platform);

    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: posts[platform], platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to publish");
      showToast("success", `Published to ${PLATFORM_META[platform].label}!`);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(null);
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
      if (!res.ok) throw new Error(data.error ?? "Failed to schedule");
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

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-2xl ${
          toast.type === "success"
            ? "border-green-800 bg-green-950 text-green-300"
            : "border-red-800 bg-red-950 text-red-300"
        }`}>
          {toast.type === "success"
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <XCircle className="h-4 w-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Create Post</h1>
        <p className="mt-1 text-sm text-zinc-500">Enter an idea — AI generates platform-perfect posts for each network.</p>
      </div>

      {/* Input section */}
      <div className="rounded-2xl border border-white/10 bg-white/3 p-6 backdrop-blur-sm">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Your idea
        </label>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="e.g. We just launched a new feature that lets users schedule posts to multiple platforms at once..."
          rows={4}
          className="w-full resize-none bg-transparent text-base leading-7 text-zinc-100 placeholder:text-zinc-700 focus:outline-none"
        />

        {/* Tone + Goal row */}
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-600">Tone</label>
            <div className="relative">
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full appearance-none rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-white/20"
              >
                {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
            </div>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-600">Goal</label>
            <div className="relative">
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full appearance-none rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-white/20"
              >
                {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={generatePosts}
              disabled={generating || !idea.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-6 py-2.5 text-sm font-bold text-black hover:bg-[#ea580c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generate Posts</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated posts */}
      {posts && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Your Posts</h2>
            <span className="text-xs text-zinc-600">Click any tab to edit</span>
          </div>

          {/* Platform tabs */}
          <div className="flex gap-1 rounded-xl border border-white/8 bg-black/30 p-1 mb-4">
            {PLATFORMS.map((platform) => {
              const { label, icon: Icon, color } = PLATFORM_META[platform];
              return (
                <button
                  key={platform}
                  onClick={() => setActiveTab(platform)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    activeTab === platform
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: activeTab === platform ? color : undefined }} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Active platform post */}
          {PLATFORMS.map((platform) => {
            const { label, icon: Icon, color, hint } = PLATFORM_META[platform];
            if (platform !== activeTab) return null;

            return (
              <div key={platform} className="rounded-2xl border border-white/10 bg-white/3 p-5">
                {/* Platform header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color }} />
                    <span className="text-sm font-medium text-zinc-300">{label}</span>
                    <span className="text-xs text-zinc-700">· {hint}</span>
                  </div>
                  <button
                    onClick={() => regeneratePlatform(platform)}
                    disabled={regenerating === platform}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:border-white/20 hover:text-zinc-200 disabled:opacity-40 transition-colors"
                  >
                    {regenerating === platform
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <RefreshCw className="h-3 w-3" />}
                    Regenerate
                  </button>
                </div>

                {/* Editable post */}
                <textarea
                  value={posts[platform]}
                  onChange={(e) => setPosts((prev) => prev ? { ...prev, [platform]: e.target.value } : prev)}
                  rows={8}
                  className="w-full resize-y bg-transparent text-sm leading-7 text-zinc-100 placeholder:text-zinc-700 focus:outline-none"
                />

                {/* Char count */}
                <p className="mt-1 text-right text-xs text-zinc-700">
                  {posts[platform].length} chars
                </p>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2 border-t border-white/8 pt-4">
                  <button
                    onClick={() => publishNow(platform)}
                    disabled={!!publishing}
                    className="flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2 text-sm font-bold text-black hover:bg-[#ea580c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {publishing === platform
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Send className="h-3.5 w-3.5" />}
                    Post now
                  </button>
                  <button
                    onClick={() => setScheduleModal(platform)}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-white/20 hover:text-white transition-colors"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    Schedule
                  </button>
                  <button
                    onClick={() => showToast("success", "Saved to drafts")}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-zinc-500 hover:border-white/10 hover:text-zinc-300 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Save draft
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule modal */}
      {scheduleModal && posts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={(e) => e.target === e.currentTarget && setScheduleModal(null)}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-1">Schedule post</h3>
            <p className="text-xs text-zinc-500 mb-5">
              Scheduling to {PLATFORM_META[scheduleModal].label}. Will be synced to Google Calendar if connected.
            </p>

            {/* Post preview */}
            <div className="mb-4 rounded-xl border border-white/8 bg-black/30 p-3">
              <p className="line-clamp-3 text-xs leading-6 text-zinc-400">{posts[scheduleModal]}</p>
            </div>

            <div className="flex gap-3 mb-5">
              <div className="flex-1">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-600">Date</label>
                <input
                  type="date"
                  min={today}
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:outline-none [color-scheme:dark]"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-600">Time</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:outline-none [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setScheduleModal(null)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={schedulePost}
                disabled={scheduling || !scheduleDate || !scheduleTime}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#F97316] py-2.5 text-sm font-bold text-black hover:bg-[#ea580c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {scheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}