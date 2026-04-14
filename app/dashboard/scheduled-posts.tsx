"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
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

interface ScheduledCalendarProps {
  googleCalendarConnected: boolean;
}

export interface ScheduledCalendarHandle {
  refresh: () => void;
}

// Posts with these statuses can be edited/deleted
const EDITABLE_STATUSES = ["pending", "scheduled"];

const statusStyles: Record<string, string> = {
  pending:   "border-zinc-700 text-zinc-500",
  scheduled: "border-zinc-700 text-zinc-500",
  published: "border-green-800 text-green-600",
  failed:    "border-red-800 text-red-600",
};

const ScheduledCalendar = forwardRef<
  ScheduledCalendarHandle,
  ScheduledCalendarProps
>(({ googleCalendarConnected }, ref) => {
  const [posts, setPosts]         = useState<ScheduledPost[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState<EditingState | null>(null);
  const [savingId, setSavingId]   = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorId, setErrorId]     = useState<string | null>(null);

  async function fetchPosts() {
    setLoading(true);
    try {
      const res  = await fetch("/api/scheduled-posts");
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPosts(); }, []);
  useImperativeHandle(ref, () => ({ refresh: fetchPosts }));

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

  function cancelEdit() {
    setEditing(null);
    setErrorId(null);
  }

  async function saveEdit() {
    if (!editing) return;
    setSavingId(editing.id);
    setErrorId(null);

    try {
      const scheduled_at = new Date(
        `${editing.date}T${editing.time}`
      ).toISOString();

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
    setErrorId(null);

    try {
      const res = await fetch(`/api/scheduled-posts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setErrorId(id);
    } finally {
      setDeletingId(null);
    }
  }

  // Group by date label
  const grouped = posts.reduce<Record<string, ScheduledPost[]>>(
    (acc, post) => {
      const key = new Date(post.scheduled_at).toLocaleDateString(undefined, {
        weekday: "long",
        month:   "long",
        day:     "numeric",
      });
      if (!acc[key]) acc[key] = [];
      acc[key].push(post);
      return acc;
    },
    {}
  );

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="mt-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-medium text-zinc-300">Scheduled posts</h2>
        </div>
        <div className="flex items-center gap-3">
          {googleCalendarConnected ? (
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Synced to Google Calendar
            </span>
          ) : (
            <a
              href="/api/auth/google-calendar"
              className="text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-300 transition-colors"
            >
              Connect Google Calendar
            </a>
          )}
          <button
            onClick={fetchPosts}
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
            aria-label="Refresh scheduled posts"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Post list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg border border-zinc-800 bg-zinc-900 animate-pulse"
            />
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-5 py-8 text-center">
          <p className="text-sm text-zinc-600">No posts scheduled yet.</p>
          <p className="mt-1 text-xs text-zinc-700">
            Use the Schedule button above to queue a post.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateLabel, dayPosts]) => (
            <div key={dateLabel}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-600">
                {dateLabel}
              </p>
              <div className="space-y-2">
                {dayPosts.map((post) => {
                  const isEditing  = editing?.id === post.id;
                  const isSaving   = savingId === post.id;
                  const isDeleting = deletingId === post.id;
                  const hasError   = errorId === post.id;
                  const canEdit    = EDITABLE_STATUSES.includes(post.status);

                  return (
                    <div
                      key={post.id}
                      className={`rounded-lg border bg-zinc-950 px-4 py-3 transition-colors ${
                        hasError ? "border-red-800" : "border-zinc-800"
                      }`}
                    >
                      {isEditing ? (
                        /* ── Edit mode ── */
                        <div className="space-y-3">
                          <textarea
                            value={editing.text}
                            onChange={(e) =>
                              setEditing((prev) =>
                                prev ? { ...prev, text: e.target.value } : prev
                              )
                            }
                            rows={3}
                            className="w-full resize-none bg-transparent text-sm leading-7 text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="date"
                              min={today}
                              value={editing.date}
                              onChange={(e) =>
                                setEditing((prev) =>
                                  prev ? { ...prev, date: e.target.value } : prev
                                )
                              }
                              className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500 [color-scheme:dark]"
                            />
                            <input
                              type="time"
                              value={editing.time}
                              onChange={(e) =>
                                setEditing((prev) =>
                                  prev ? { ...prev, time: e.target.value } : prev
                                )
                              }
                              className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500 [color-scheme:dark]"
                            />
                            <div className="ml-auto flex items-center gap-1.5">
                              <button
                                onClick={cancelEdit}
                                disabled={isSaving}
                                className="rounded-md border border-zinc-700 p-1.5 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-40 transition-colors"
                                aria-label="Cancel edit"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={saveEdit}
                                disabled={
                                  isSaving ||
                                  !editing.text.trim() ||
                                  !editing.date ||
                                  !editing.time
                                }
                                className="inline-flex items-center gap-1.5 rounded-md bg-[#F97316] px-3 py-1.5 text-xs font-semibold text-black hover:bg-[#ea580c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              >
                                {isSaving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                Save
                              </button>
                            </div>
                          </div>
                          {hasError && (
                            <p className="text-xs text-red-500">
                              Failed to save. Please try again.
                            </p>
                          )}
                        </div>
                      ) : (
                        /* ── View mode ── */
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">
                            <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-zinc-300">
                              {post.text}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-600">
                              <Clock className="h-3 w-3" />
                              {new Date(post.scheduled_at).toLocaleTimeString(
                                undefined,
                                { hour: "numeric", minute: "2-digit" }
                              )}
                              {post.google_calendar_event_id && (
                                <>
                                  <span>·</span>
                                  <span className="text-zinc-700">
                                    On Google Calendar
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Status + actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs ${
                                statusStyles[post.status] ?? statusStyles.pending
                              }`}
                            >
                              {post.status}
                            </span>

                            {canEdit && (
                              <>
                                <button
                                  onClick={() => startEdit(post)}
                                  className="text-zinc-600 hover:text-zinc-300 transition-colors"
                                  aria-label="Edit post"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => deletePost(post.id)}
                                  disabled={isDeleting}
                                  className="text-zinc-600 hover:text-red-500 disabled:opacity-40 transition-colors"
                                  aria-label="Delete post"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
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
});

ScheduledCalendar.displayName = "ScheduledCalendar";
export default ScheduledCalendar;