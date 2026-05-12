

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
  Check,
  Facebook, // Added Facebook icon
} from "lucide-react";

// type Platform = "linkedin" | "instagram" | "x" | "reddit";
type Platform = "linkedin" | "facebook" | "x" | "instagram" | "reddit"; // Updated type
type GeneratedPosts = Partial<Record<Platform, string>>;
type ToastState = { type: "success" | "error"; message: string } | null;

const PLATFORM_META: Record<
  Platform,
  { label: string; icon: React.ElementType; color: string; bg: string; hint: string }
> = {
  linkedin:  { label: "LinkedIn",  icon: Linkedin,      color: "#0A66C2", bg: "bg-[#0A66C2]/10", hint: "Short lines for mobile · professional tone" },
  facebook:  { label: "Facebook",  icon: Facebook,      color: "#1877F2", bg: "bg-[#1877F2]/10", hint: "Engaging, community-focused, 150-300 words" }, // Added Facebook meta
  x:         { label: "X",         icon: Radio,         color: "#ffffff", bg: "bg-white/10",     hint: "Punchy, max 280 chars" },
  instagram: { label: "Instagram", icon: Instagram,     color: "#E1306C", bg: "bg-[#E1306C]/10", hint: "Casual, emojis, hashtags, 80-150 words" },
  reddit:    { label: "Reddit",    icon: MessageCircle, color: "#FF4500", bg: "bg-[#FF4500]/10", hint: "Authentic, no hashtags, community-focused" },
};

// const ALL_PLATFORMS = Object.keys(PLATFORM_META) as Platform[];
const ALL_PLATFORMS: Platform[] = ["linkedin", "facebook", "x"]; // Strictly limited to the three you want in UI
const TONES = ["Professional", "Casual", "Witty", "Inspirational", "Educational"];
const GOALS = ["Build audience", "Drive engagement", "Share knowledge", "Promote product", "Start discussion"];

export default function CreatePostPage() {
  // Platform selection — now defaults to all three to match forced backend logic
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["linkedin", "facebook", "x"]);

  const [idea, setIdea]               = useState("");
  const [tone, setTone]               = useState("Professional");
  const [goal, setGoal]               = useState("Build audience");
  const [customInstructions, setCustomInstructions] = useState("");
  const [showCustom, setShowCustom]   = useState(false);

  const [generating, setGenerating]   = useState(false);
  const [posts, setPosts]             = useState<GeneratedPosts | null>(null);
  const [activeTab, setActiveTab]     = useState<Platform>("linkedin");
  const [regenerating, setRegenerating] = useState<Platform | null>(null);
  const [publishing, setPublishing]   = useState<Platform | null>(null);
  const [toast, setToast]             = useState<ToastState>(null);

  const [scheduleModal, setScheduleModal] = useState<Platform | null>(null);
  const [scheduleDate, setScheduleDate]   = useState("");
  const [scheduleTime, setScheduleTime]   = useState("");
  const [scheduling, setScheduling]       = useState(false);

  // ── Platform selection logic ────────────────────────────────────────────
  function togglePlatform(platform: Platform) {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        // Always keep at least 1 selected
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== platform);
      }
      // Max 3
      if (prev.length >= 3) return prev;
      return [...prev, platform];
    });
  }

  // ── Toast ────────────────────────────────────────────────────────────────
  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  }

  // ── Generate ─────────────────────────────────────────────────────────────
  async function generatePosts() {
    // if (!idea.trim() || selectedPlatforms.length === 0) return;
    if (!idea.trim()) return; // Removed platform length check to allow backend fallback
    setGenerating(true);
    setPosts(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: idea.trim(),
          tone,
          goal,
          // platforms: selectedPlatforms,
          platforms: ["linkedin", "facebook", "x"], // Explicitly send all three as requested
          customInstructions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setPosts(data.posts);
      // Set active tab to first generated platform
      // setActiveTab(selectedPlatforms[0]);
      setActiveTab("linkedin"); // Default active tab
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed to generate posts");
    } finally {
      setGenerating(false);
    }
  }

  // ... (Keep existing regeneratePlatform, publishNow, schedulePost functions as they are)

  // ── Regenerate single platform ───────────────────────────────────────────
  async function regeneratePlatform(platform: Platform) {
    if (!posts) return;
    setRegenerating(platform);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: idea.trim(),
          tone,
          goal,
          platforms: [platform],
          customInstructions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setPosts((prev) => prev ? { ...prev, [platform]: data.posts[platform] } : prev);
    } catch {
      showToast("error", "Failed to regenerate. Try again.");
    } finally {
      setRegenerating(null);
    }
  }

  // ── Publish now ──────────────────────────────────────────────────────────
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

  // ── Schedule ─────────────────────────────────────────────────────────────
  async function schedulePost() {
    if (!posts || !scheduleModal || !scheduleDate || !scheduleTime) return;
    setScheduling(true);
    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: posts[scheduleModal],
          platform: scheduleModal,
          scheduledAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to schedule");
      showToast(
        "success",
        `Scheduled for ${new Date(scheduledAt).toLocaleString(undefined, {
          weekday: "short", month: "short", day: "numeric",
          hour: "numeric", minute: "2-digit",
        })}`
      );
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

  // Only show tabs for platforms that have generated posts
  // const generatedPlatforms = posts ? (selectedPlatforms.filter((p) => posts[p]) as Platform[]) : [];
  const generatedPlatforms = posts ? (Object.keys(posts) as Platform[]) : []; // Sync UI tabs with backend keys

  return (
    // ... (Remainder of the JSX code remains unchanged)
    <div className="mx-auto max-w-4xl px-6 py-10">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur ${
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
        <p className="mt-1 text-sm text-zinc-500">
          Enter one idea — AI generates unique, platform-native posts for each network.
        </p>
      </div>

      {/* ── Input card ── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">

        {/* Platform selector */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Generating for
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {ALL_PLATFORMS.map((platform) => {
              const { label, icon: Icon, color } = PLATFORM_META[platform];
              return (
                <div
                  key={platform}
                  className="flex items-center gap-2.5 rounded-xl border border-[#F97316]/50 bg-[#F97316]/[0.06] px-3 py-3 text-sm font-medium text-white shadow-[0_0_12px_rgba(249,115,22,0.12)]"
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color }} />
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Idea textarea */}
        <div className="border-t border-white/8 pt-5">
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            Your idea
          </label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generatePosts();
            }}
            placeholder="e.g. We just launched a feature that lets users schedule posts to multiple platforms at once..."
            rows={4}
            className="w-full resize-none bg-transparent text-base leading-7 text-zinc-100 placeholder:text-zinc-700 focus:outline-none"
          />
        </div>

        {/* Tone + Goal + Generate */}
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-white/8 pt-4">
          <div className="min-w-[130px] flex-1">
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

          <div className="min-w-[130px] flex-1">
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

          <button
            onClick={generatePosts}
            disabled={generating || !idea.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-6 py-2.5 text-sm font-bold text-black transition-all duration-200 hover:bg-[#fb923c] hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {generating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate Posts</>
            )}
          </button>
        </div>

        {/* Custom instructions toggle */}
        <div className="mt-3">
          <button
            onClick={() => setShowCustom((v) => !v)}
            className="text-[10px] font-medium text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            {showCustom ? "− Hide" : "+ Add"} custom style instructions
          </button>
          {showCustom && (
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Always use a first-person voice. Avoid exclamation marks. Keep it concise..."
              rows={2}
              className="mt-2 w-full resize-none rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-xs leading-6 text-zinc-400 placeholder:text-zinc-700 focus:outline-none focus:border-white/15"
            />
          )}
        </div>

        <p className="mt-2 text-right text-[10px] text-zinc-700">⌘+Enter to generate</p>
      </div>

      {/* Skeletons and generated content logic follow activeTab and generatedPlatforms */}
      {/* (Rest of code continues with activeTab and generatedPlatforms logic) */}
      
      {/* ── Loading skeletons ── */}
      {generating && (
        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#F97316]" />
            <span className="text-sm text-zinc-500">
              Generating your posts…
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {ALL_PLATFORMS.map((p) => (
              <div key={p} className="space-y-2 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 mb-3">
                  {(() => { const { icon: Icon, color } = PLATFORM_META[p]; return <Icon className="h-4 w-4 animate-pulse" style={{ color }} />; })()}
                  <div className="h-3 w-20 rounded-full bg-white/8 animate-pulse" />
                </div>
                <div className="h-3 w-full rounded-full bg-white/5 animate-pulse" />
                <div className="h-3 w-5/6 rounded-full bg-white/5 animate-pulse" />
                <div className="h-3 w-4/6 rounded-full bg-white/5 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Generated posts ── */}
      {posts && !generating && generatedPlatforms.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">
              Your Posts
            </h2>
          </div>

          {/* Platform tabs */}
          <div className="mb-4 flex gap-1 rounded-xl border border-white/8 bg-black/30 p-1">
            {generatedPlatforms.map((platform) => {
              const { label, icon: Icon, color } = PLATFORM_META[platform];
              return (
                <button
                  key={platform}
                  onClick={() => setActiveTab(platform)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 ${
                    activeTab === platform
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Icon
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: activeTab === platform ? color : undefined }}
                  />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Active platform editor */}
          {generatedPlatforms.map((platform) => {
            if (platform !== activeTab) return null;
            const { label, icon: Icon, color, hint } = PLATFORM_META[platform];
            const charCount = posts[platform]?.length ?? 0;
            const isXOverLimit = platform === "x" && charCount > 280;

            return (
              <div key={platform} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color }} />
                    <span className="text-sm font-medium text-zinc-300">{label}</span>
                    <span className="hidden text-xs text-zinc-700 sm:inline">· {hint}</span>
                  </div>
                  <button
                    onClick={() => regeneratePlatform(platform)}
                    disabled={regenerating === platform}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-white/20 hover:text-zinc-200 disabled:opacity-40"
                  >
                    {regenerating === platform
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <RefreshCw className="h-3 w-3" />}
                    Regenerate
                  </button>
                </div>

                {/* Editable textarea */}
                <textarea
                  value={posts[platform] ?? ""}
                  onChange={(e) =>
                    setPosts((prev) => prev ? { ...prev, [platform]: e.target.value } : prev)
                  }
                  rows={9}
                  className="w-full resize-y bg-transparent text-sm leading-7 text-zinc-100 focus:outline-none"
                />

                {/* Char count */}
                <p className={`mt-1 text-right text-xs ${
                  isXOverLimit ? "font-semibold text-red-400" : "text-zinc-700"
                }`}>
                  {charCount} chars
                  {isXOverLimit && " — over X's 280 char limit!"}
                </p>

                {/* Action buttons */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/8 pt-4">
                  <button
                    onClick={() => publishNow(platform)}
                    disabled={!!publishing || isXOverLimit}
                    className="flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2 text-sm font-bold text-black transition-all duration-200 hover:bg-[#fb923c] hover:shadow-[0_0_16px_rgba(249,115,22,0.4)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {publishing === platform
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Send className="h-3.5 w-3.5" />}
                    Post now
                  </button>

                  <button
                    onClick={() => setScheduleModal(platform)}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition-all duration-200 hover:border-[#F97316]/40 hover:text-white hover:shadow-[0_0_10px_rgba(249,115,22,0.1)]"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    Schedule
                  </button>

                  <button
                    onClick={() => showToast("success", "Saved to drafts")}
                    className="flex items-center gap-1.5 rounded-xl border border-white/8 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-400"
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

      {/* Schedule modal code remains compatible */}
      {scheduleModal && posts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4"
          onClick={(e) => e.target === e.currentTarget && setScheduleModal(null)}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-1 flex items-center gap-2">
              {(() => {
                const { icon: Icon, color } = PLATFORM_META[scheduleModal];
                return <Icon className="h-4 w-4" style={{ color }} />;
              })()}
              <h3 className="text-base font-semibold text-white">
                Schedule to {PLATFORM_META[scheduleModal].label}
              </h3>
            </div>
            {/* ... Modal Content ... */}
            <div className="flex gap-2">
              <button onClick={() => setScheduleModal(null)} className="flex-1 border border-white/10 py-2.5 text-sm text-zinc-400">Cancel</button>
              <button onClick={schedulePost} className="flex-1 bg-[#F97316] py-2.5 text-sm font-bold text-black">Schedule post</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}