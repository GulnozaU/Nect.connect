"use client";

import { useState, useEffect } from "react";
import { Loader2, X, Send, CalendarDays } from "lucide-react";

type Mode = "publish_now" | "schedule";

type Props = {
  open: boolean;
  mode: Mode;
  platformLabel: string;
  postText: string;
  scheduleSummary?: string | null;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function PublishConfirmModal({
  open,
  mode,
  platformLabel,
  postText,
  scheduleSummary,
  loading = false,
  onCancel,
  onConfirm,
}: Props) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (open) setChecked(false);
  }, [open, mode, platformLabel, postText]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-confirm-title"
      onClick={(e) => e.target === e.currentTarget && !loading && onCancel()}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 id="publish-confirm-title" className="text-base font-semibold text-white">
            {mode === "schedule" ? "Confirm schedule" : "Confirm publish"}
          </h2>
          <button
            type="button"
            onClick={() => !loading && onCancel()}
            className="rounded-lg p-1 text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <p className="text-sm text-zinc-400">
            You are about to {mode === "schedule" ? "schedule" : "publish live"} to{" "}
            <span className="font-medium text-zinc-200">{platformLabel}</span>.
            {scheduleSummary ? (
              <span className="block pt-1 text-xs text-zinc-500">{scheduleSummary}</span>
            ) : null}
          </p>

          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-600">Post preview</p>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-3 text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">
              {postText || "(empty)"}
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              disabled={loading}
            />
            <span className="text-sm text-zinc-400">
              I have reviewed this post. It is accurate and appropriate for my audience and for{" "}
              {platformLabel}.
            </span>
          </label>
        </div>

        <div className="flex gap-2 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={() => !loading && onCancel()}
            className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
          >
            Back to edit
          </button>
          <button
            type="button"
            disabled={!checked || loading}
            onClick={() => {
              if (!checked || loading) return;
              onConfirm();
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#F97316] py-2.5 text-sm font-bold text-black hover:bg-[#fb923c] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "schedule" ? (
              <>
                <CalendarDays className="h-4 w-4" /> Confirm schedule
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Publish now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
