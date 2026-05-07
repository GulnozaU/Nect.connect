// FILE PATH: app/dashboard/create/page.tsx

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
  // Instagram, // Commented out
  Radio,
  Linkedin,
  // MessageCircle, // Commented out
  ChevronDown,
  Check,
  Facebook, // Added Facebook
} from "lucide-react";

// type Platform = "linkedin" | "instagram" | "x" | "reddit";
type Platform = "linkedin" | "facebook" | "x"; // Strictly only the 3 you want
type GeneratedPosts = Partial<Record<Platform, string>>;
type ToastState = { type: "success" | "error"; message: string } | null;

const PLATFORM_META: Record<
  Platform,
  { label: string; icon: React.ElementType; color: string; bg: string; hint: string }
> = {
  linkedin:  { label: "LinkedIn",  icon: Linkedin,      color: "#0A66C2", bg: "bg-[#0A66C2]/10", hint: "Professional, 150-300 words, storytelling" },
  facebook:  { label: "Facebook",  icon: Facebook,      color: "#1877F2", bg: "bg-[#1877F2]/10", hint: "Professional but human and engaging. 150-300 words." }, 
  x:         { label: "X",         icon: Radio,         color: "#ffffff", bg: "bg-white/10",     hint: "Punchy, max 280 chars" },
  // instagram: { label: "Instagram", icon: Instagram,     color: "#E1306C", bg: "bg-[#E1306C]/10", hint: "Casual, emojis, hashtags, 80-150 words" },
  // reddit:    { label: "Reddit",    icon: MessageCircle, color: "#FF4500", bg: "bg-[#FF4500]/10", hint: "Authentic, no hashtags, community-focused" },
};

// This array controls what buttons show up in the "Select Platforms" section
const ALL_PLATFORMS: Platform[] = ["linkedin", "facebook", "x"]; 
const TONES = ["Professional", "Casual", "Witty", "Inspirational", "Educational"];
const GOALS = ["Build audience", "Drive engagement", "Share knowledge", "Promote product", "Start discussion"];

export default function CreatePostPage() {
  // Set default selection to your new trio
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

  function togglePlatform(platform: Platform) {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== platform);
      }
      if (prev.length >= 3) return prev;
      return [...prev, platform];
    });
  }

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  }

  async function generatePosts() {
    if (!idea.trim()) return;
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
          platforms: ["linkedin", "facebook", "x"], // Match your backend exactly
          customInstructions,
        }),
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
        body: JSON.stringify({
          text: posts[scheduleModal],
          platform: scheduleModal,
          scheduledAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to schedule");
      showToast("success", `Scheduled!`);
      setScheduleModal(null);
    } catch (err) {
      showToast("error", "Schedule failed");
    } finally {
      setScheduling(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const generatedPlatforms = posts ? (Object.keys(posts) as Platform[]) : [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur ${
          toast.type === "success" ? "border-green-800 bg-green-950 text-green-300" : "border-red-800 bg-red-950 text-red-300"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Create Post</h1>
        <p className="mt-1 text-sm text-zinc-500">AI generates unique posts for LinkedIn, Facebook, and X.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="mb-5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2 block">
            Select Platforms
          </label>
          <div className="grid grid-cols-3 gap-2">
            {ALL_PLATFORMS.map((platform) => {
              const { label, icon: Icon, color } = PLATFORM_META[platform];
              const isSelected = selectedPlatforms.includes(platform);
              return (
                <button
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                    isSelected ? "border-[#F97316]/50 bg-[#F97316]/[0.06] text-white" : "border-white/8 bg-white/[0.02] text-zinc-400"
                  }`}
                >
                  <Icon className="h-4 w-4" style={{ color: isSelected ? color : undefined }} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-white/8 pt-5">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="What's your idea?"
            rows={4}
            className="w-full bg-transparent text-base text-zinc-100 focus:outline-none"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-white/8 pt-4">
          <button
            onClick={generatePosts}
            disabled={generating || !idea.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-6 py-2.5 text-sm font-bold text-black hover:bg-[#fb923c] disabled:opacity-40"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate
          </button>
        </div>
      </div>

      {posts && !generating && (
        <div className="mt-8">
          <div className="mb-4 flex gap-1 rounded-xl border border-white/8 bg-black/30 p-1">
            {generatedPlatforms.map((platform) => (
              <button
                key={platform}
                onClick={() => setActiveTab(platform)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-all ${
                  activeTab === platform ? "bg-white/10 text-white" : "text-zinc-500"
                }`}
              >
                {PLATFORM_META[platform].label}
              </button>
            ))}
          </div>

          {generatedPlatforms.map((platform) => {
            if (platform !== activeTab) return null;
            const { label, icon: Icon, color, hint } = PLATFORM_META[platform];
            return (
              <div key={platform} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color }} />
                    <span className="text-sm font-medium text-zinc-300">{label}</span>
                  </div>
                  <button onClick={() => regeneratePlatform(platform)} className="text-xs text-zinc-400">Regenerate</button>
                </div>
                <textarea
                  value={posts[platform]}
                  onChange={(e) => setPosts({...posts, [platform]: e.target.value})}
                  className="w-full bg-transparent text-sm leading-7 text-zinc-100 focus:outline-none"
                  rows={8}
                />
                <div className="mt-4 border-t border-white/8 pt-4 flex gap-2">
                   <button onClick={() => publishNow(platform)} className="bg-[#F97316] px-4 py-2 rounded-xl text-black font-bold">Post now</button>
                   <button onClick={() => setScheduleModal(platform)} className="border border-white/10 px-4 py-2 rounded-xl text-zinc-300">Schedule</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Modal Logic same as before... */}
    </div>
  );
}