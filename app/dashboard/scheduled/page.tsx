// FILE: app/dashboard/scheduled/page.tsx
// PURPOSE: The scheduled posts management page at /dashboard/scheduled
//          Shows all scheduled posts from Supabase (scheduled_posts table).
//          Allows inline editing of text, date, time for pending/scheduled posts.
//          Allows deletion of any post (also removes the Google Calendar event).
//          Filter tabs: All / Pending / Published / Failed

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Linkedin,
  RefreshCw,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  Instagram,
  Radio,
  MessageCircle,
  PenLine,
} from "lucide-react";

type ScheduledPost = {
  id: string;
  text: string;
  scheduled_at: string;
  platform: string;
  status: string;
  google_calendar_event_id: string | null;
};

type EditingState = {
  id: string;
  text: string;
  date: string;
  time: string;
};

const EDITABLE_STATUSES = ["pending", "scheduled"];

const STATUS_STYLES: Record<string, string> = {
  pending:   "border-zinc-700/60 text-zinc-500",
  scheduled: "border-zinc-700/60 text-zinc-500",
  published: "border-green-800/50 text-green-500",
  failed:    "border-red-800/50 text-red-500",
};

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  linkedin:  Linkedin,
  instagram: Instagram,
  x:         Radio,
  reddit:    MessageCircle,
  facebook:  Linkedin,
};

const PLATFORM_COLORS: Record<string, string> = {
  linkedin:  "#0A66C2",
  instagram: "#E1306C",
  x:         "#ffffff",
  reddit:    "#FF4500",
  facebook:  "#1877F2",
};

export default function ScheduledPage() {
  const [posts, setPosts]             = useState<ScheduledPost[]>([]);
  const [loading, setLoading]         = useState(true);
  const [editing, setEditing]         = useState<EditingState | null>(null);
  const [savingId, setSavingId]       = useState<string | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [errorId, setErrorId]         = useState<string | null>(null);
  const [filter, setFilter]           = useState<"all" | "pending" | "published" | "failed">("all");

  async function fetchPosts() {
    setLoading(true);
    try {
      const res = await fetch("/api/scheduled-posts");
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPosts(); }, []);

  function startEdit(post: ScheduledPost) {
    const dt = new Date(post.scheduled_at);
    setEditing({
      id:   post.id,
      text: post.text,
      date: dt.toISOString().split("T")[0],
      time: dt.toTimeString().slice(0, 5),
    });
    setErrorId(null);
  }

  async function saveEdit() {
    if (!editing) return;
    setSavingId(editing.id);
    setErrorId(null);
    try {
      const scheduled_at = new Date(`${editing.date}T${editing.time}`).toISOString();
      const res = await fetch(`/api/scheduled-posts/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editing.text, scheduled_at }),
      });
      if (!res.ok) throw new Error();
      setEditing(null);
      await fetchPosts();
    } catch {
      setErrorId(editing.id);
    } finally {
      setSavingId(null);
    }
  }

  async function deletePost(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/scheduled-posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setErrorId(id);
    } finally {
      setDeletingId(null);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  const filtered = filter === "all"
    ? posts
    : filter === "pending"
    ? posts.filter((p) => EDITABLE_STATUSES.includes(p.status))
    : posts.filter((p) => p.status === filter);

  const grouped = filtered.reduce<Record<string, ScheduledPost[]>>((acc, post) => {
    const key = new Date(post.scheduled_at).toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
    if (!acc[key]) acc[key] = [];
    acc[key].push(post);
    return acc;
  }, {});

  const counts = {
    all:       posts.length,
    pending:   posts.filter((p) => EDITABLE_STATUSES.includes(p.status)).length,
    published: posts.filter((p) => p.status === "published").length,
    failed:    posts.filter((p) => p.status === "failed").length,
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Scheduled Posts</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your content queue. Edit or delete before they go live.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPosts}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-500 hover:border-white/20 hover:text-zinc-300 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
          <Link
            href="/dashboard/create"
            className="flex items-center gap-1.5 rounded-xl bg-[#F97316] px-3 py-2 text-xs font-bold text-black hover:bg-[#ea580c] transition-colors"
          >
            <PenLine className="h-3 w-3" />
            New Post
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-white/8 bg-black/30 p-1">
        {(["all", "pending", "published", "failed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              filter === f ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
              filter === f ? "bg-white/15 text-zinc-300" : "bg-white/5 text-zinc-600"
            }`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Post list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl border border-white/8 bg-white/[0.02] animate-pulse" />
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-6 py-16 text-center">
          <Calendar className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
          <p className="text-sm font-medium text-zinc-500">No posts here yet.</p>
          <p className="mt-1 text-xs text-zinc-700 mb-6">
            {filter === "all"
              ? "Use Create Post to schedule content."
              : `No ${filter} posts.`}
          </p>
          <Link
            href="/dashboard/create"
            className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#ea580c] transition-colors"
          >
            Create a post
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([dateLabel, dayPosts]) => (
            <div key={dateLabel}>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                {dateLabel}
              </p>
              <div className="space-y-2">
                {dayPosts.map((post) => {
                  const isEditing  = editing?.id === post.id;
                  const isSaving   = savingId === post.id;
                  const isDeleting = deletingId === post.id;
                  const hasError   = errorId === post.id;
                  const canEdit    = EDITABLE_STATUSES.includes(post.status);
                  const Icon       = PLATFORM_ICONS[post.platform] ?? Linkedin;
                  const iconColor  = PLATFORM_COLORS[post.platform] ?? "#0A66C2";

                  return (
                    <div
                      key={post.id}
                      className={`rounded-2xl border bg-white/[0.02] px-5 py-4 transition-colors ${
                        hasError ? "border-red-800/50" : "border-white/8"
                      }`}
                    >
                      {isEditing ? (
                        /* ── Edit mode ── */
                        <div className="space-y-3">
                          <textarea
                            value={editing.text}
                            onChange={(e) =>
                              setEditing((prev) => prev ? { ...prev, text: e.target.value } : prev)
                            }
                            rows={4}
                            className="w-full resize-none bg-transparent text-sm leading-7 text-zinc-100 focus:outline-none"
                            autoFocus
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="date"
                              min={today}
                              value={editing.date}
                              onChange={(e) =>
                                setEditing((prev) => prev ? { ...prev, date: e.target.value } : prev)
                              }
                              className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none [color-scheme:dark]"
                            />
                            <input
                              type="time"
                              value={editing.time}
                              onChange={(e) =>
                                setEditing((prev) => prev ? { ...prev, time: e.target.value } : prev)
                              }
                              className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none [color-scheme:dark]"
                            />
                            <div className="ml-auto flex items-center gap-1.5">
                              <button
                                onClick={() => { setEditing(null); setErrorId(null); }}
                                disabled={isSaving}
                                className="rounded-lg border border-white/10 p-1.5 text-zinc-400 hover:border-white/20 hover:text-zinc-200 disabled:opacity-40 transition-colors"
                                aria-label="Cancel edit"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={saveEdit}
                                disabled={isSaving || !editing.text.trim() || !editing.date || !editing.time}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#F97316] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#ea580c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              >
                                {isSaving
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Check className="h-3.5 w-3.5" />}
                                Save
                              </button>
                            </div>
                          </div>
                          {hasError && (
                            <p className="text-xs text-red-400">Failed to save. Please try again.</p>
                          )}
                        </div>
                      ) : (
                        /* ── View mode ── */
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">
                            <Icon className="h-4 w-4" style={{ color: iconColor }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-relaxed text-zinc-200 line-clamp-2">
                              {post.text}
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-xs text-zinc-600">
                              <Clock className="h-3 w-3" />
                              {new Date(post.scheduled_at).toLocaleTimeString(undefined, {
                                hour: "numeric", minute: "2-digit",
                              })}
                              <span>·</span>
                              <span className="capitalize">{post.platform}</span>
                              {post.google_calendar_event_id && (
                                <>
                                  <span>·</span>
                                  <span className="text-zinc-700">📅 Calendar</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                              STATUS_STYLES[post.status] ?? STATUS_STYLES.pending
                            }`}>
                              {post.status}
                            </span>
                            {canEdit && (
                              <>
                                <button
                                  onClick={() => startEdit(post)}
                                  className="rounded-lg p-1.5 text-zinc-600 hover:bg-white/5 hover:text-zinc-300 transition-colors"
                                  aria-label="Edit post"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => deletePost(post.id)}
                                  disabled={isDeleting}
                                  className="rounded-lg p-1.5 text-zinc-600 hover:bg-red-950/40 hover:text-red-400 disabled:opacity-40 transition-colors"
                                  aria-label="Delete post"
                                >
                                  {isDeleting
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <Trash2 className="h-3.5 w-3.5" />}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}