"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, Linkedin, Clock, X } from "lucide-react";

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

type ModalState = "confirm" | "schedule" | null;

const MAX_CHARS = 3000;

interface PostEditorProps {
  preferredPlatforms?: string[];
  onPostScheduled?: () => void;
}

export default function PostEditor({
  preferredPlatforms,
  onPostScheduled,
}: PostEditorProps) {
  const [text, setText] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const charsRemaining = MAX_CHARS - text.length;
  const isOverLimit = charsRemaining < 0;
  const isEmpty = text.trim().length === 0;

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }

  function handlePublishClick() {
    if (isEmpty || isOverLimit) return;
    setModal("confirm");
  }

  function handleScheduleClick() {
    if (isEmpty || isOverLimit) return;
    setModal("schedule");
  }

  function closeModal() {
    setModal(null);
    setScheduleDate("");
    setScheduleTime("");
  }

  // UPDATED: This now handles UTC conversion and sends the platform
  async function confirmPublish(scheduledAt?: string) {
    setModal(null);
    setIsPublishing(true);
    setToast(null);

    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: text.trim(), 
          scheduledAt: scheduledAt, // This is already ISO/UTC from handleConfirmSchedule
          platform: "linkedin"      // Hardcoded for now, or use preferredPlatforms[0]
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");

      setText("");
      showToast(
        "success",
        scheduledAt
          ? `Post scheduled for ${formatScheduled(scheduledAt)}.`
          : "Post published to LinkedIn!"
      );

      if (scheduledAt) onPostScheduled?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to publish. Please try again.";
      showToast("error", message);
    } finally {
      setIsPublishing(false);
    }
  }

  function handleConfirmSchedule() {
    if (!scheduleDate || !scheduleTime) return;
    
    // This creates a Date object based on user's local time and converts to UTC ISO string
    const localDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
    const scheduledAtUTC = localDateTime.toISOString();
    
    confirmPublish(scheduledAtUTC);
  }

  function formatScheduled(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <div className="mt-8 space-y-3">
        {toast && (
          <div
            role="status"
            className={`flex items-center gap-2.5 rounded-md border px-4 py-2.5 text-sm ${
              toast.type === "success"
                ? "border-green-800 bg-green-950 text-green-400"
                : "border-red-800 bg-red-950 text-red-400"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0" />
            )}
            {toast.message}
          </div>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isPublishing}
          placeholder="Write your next post here..."
          className="min-h-[360px] w-full resize-y bg-transparent text-lg leading-8 text-zinc-100 placeholder:text-zinc-600 focus:outline-none disabled:opacity-50"
        />

        <div className="flex items-center justify-between text-sm text-zinc-500">
          <div className="flex items-center gap-4">
            <span>
              Preferred channels:{" "}
              {preferredPlatforms?.length
                ? preferredPlatforms.join(", ")
                : "LinkedIn"}
            </span>
            {text.length > 0 && (
              <span className={`tabular-nums ${isOverLimit ? "text-red-500" : "text-zinc-600"}`}>
                {charsRemaining.toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleScheduleClick}
              disabled={isPublishing || isEmpty || isOverLimit}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-40 transition-colors"
            >
              <Clock className="h-3.5 w-3.5" />
              Schedule
            </button>

            <button
              type="button"
              onClick={handlePublishClick}
              disabled={isPublishing || isEmpty || isOverLimit}
              className="inline-flex items-center gap-2 rounded-md bg-[#F97316] px-4 py-2 text-sm font-semibold text-black hover:bg-[#ea580c] disabled:opacity-40 transition-colors"
            >
              {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish"}
            </button>
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-white">
                  {modal === "schedule" ? "Schedule your post" : "Ready to publish?"}
                </h2>
              </div>
              <button onClick={closeModal} className="text-zinc-500 hover:text-zinc-300"><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-5 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                <span className="text-xs font-medium text-zinc-400">LinkedIn</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-200">{text.trim()}</p>
            </div>

            {modal === "schedule" && (
              <div className="mt-4 flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Date</label>
                  <input type="date" min={today} value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 [color-scheme:dark]" />
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Time</label>
                  <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 [color-scheme:dark]" />
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button type="button" onClick={closeModal} className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300">Cancel</button>
              <button
                type="button"
                onClick={modal === "confirm" ? () => confirmPublish() : handleConfirmSchedule}
                className="rounded-md bg-[#F97316] px-4 py-2 text-sm font-semibold text-black hover:bg-[#ea580c]"
              >
                {modal === "confirm" ? "Yes, publish now" : "Schedule post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}