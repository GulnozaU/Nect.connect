"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Radio, Linkedin, Loader2, ArrowRight } from "lucide-react";

type CommentRow = {
  id: string;
  tweetId: string;
  platform: string;
  author: string;
  text: string;
  createdAt: string;
};

interface Props {
  xConnected: boolean;
  linkedinConnected: boolean;
}

export function DashboardCommentsStrip({ xConnected, linkedinConnected }: Props) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!xConnected && !linkedinConnected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/insights");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      const list = (data.comments ?? []) as CommentRow[];
      setComments(list.slice(0, 8));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load comments");
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [xConnected, linkedinConnected]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!xConnected && !linkedinConnected) return null;

  return (
    <div className="mt-10 rounded-2xl border border-white/8 bg-white/[0.02] p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#F97316]" />
          <h2 className="text-sm font-semibold text-zinc-200">Recent activity from your channels</h2>
        </div>
        <Link
          href="/dashboard/analytics?tab=comments"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#F97316] hover:underline"
        >
          Open in Analytics
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading comments…
        </div>
      ) : error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-zinc-600">
          {xConnected
            ? "No thread replies found yet for posts published through Nect, or X Search is limited on your plan. Publish to X from Nect and check Analytics → Comments."
            : "Connect X to load replies here. LinkedIn comment threads need additional LinkedIn API products."}
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5">
              {c.platform === "x" ? (
                <Radio className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
              ) : (
                <Linkedin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0A66C2]" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-zinc-500">
                  <span className="font-medium text-zinc-300">{c.author}</span>
                  {c.createdAt ? (
                    <span className="text-zinc-600">
                      {" · "}
                      {new Date(c.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">{c.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
