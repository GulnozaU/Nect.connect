"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Calendar, Clock, Linkedin, RefreshCw } from "lucide-react";

type ScheduledPost = {
  id: string;
  text: string;
  scheduled_at: string;
  platform: string;
  status: string;
  google_calendar_event_id: string | null;
};

interface ScheduledCalendarProps {
  googleCalendarConnected: boolean;
}

export interface ScheduledCalendarHandle {
  refresh: () => void;
}

const ScheduledCalendar = forwardRef<ScheduledCalendarHandle, ScheduledCalendarProps>(
  ({ googleCalendarConnected }, ref) => {
    const [posts, setPosts] = useState<ScheduledPost[]>([]);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
      fetchPosts();
    }, []);

    // Expose refresh() to parent via ref
    useImperativeHandle(ref, () => ({ refresh: fetchPosts }));

    // Group by readable date label
    const grouped = posts.reduce<Record<string, ScheduledPost[]>>((acc, post) => {
      const key = new Date(post.scheduled_at).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      if (!acc[key]) acc[key] = [];
      acc[key].push(post);
      return acc;
    }, {});

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

        {/* Content */}
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
                  {dayPosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3"
                    >
                      <div className="mt-0.5 shrink-0">
                        <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-zinc-300">{post.text}</p>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-600">
                          <Clock className="h-3 w-3" />
                          {new Date(post.scheduled_at).toLocaleTimeString(undefined, {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {post.google_calendar_event_id && (
                            <>
                              <span>·</span>
                              <span className="text-zinc-700">On Google Calendar</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-zinc-800 px-2 py-0.5 text-xs text-zinc-600">
                        {post.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

ScheduledCalendar.displayName = "ScheduledCalendar";
export default ScheduledCalendar;