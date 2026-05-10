
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PostEditor from "@/components/post-editor";
import ScheduledCalendar from "@/components/scheduled-calendar";
import { CheckCircle2, XCircle } from "lucide-react";

interface DashboardClientProps {
  preferredPlatforms: string[];
  googleCalendarConnected: boolean;
  gcalStatus?: string;
}

export default function DashboardClient({
  preferredPlatforms,
  googleCalendarConnected,
  gcalStatus,
}: DashboardClientProps) {
  const calendarRef = useRef<{ refresh: () => void }>(null);
  const [gcalToast, setGcalToast] = useState<"connected" | "error" | null>(
    gcalStatus === "connected" || gcalStatus === "error" ? gcalStatus : null
  );

  useEffect(() => {
    if (!gcalToast) return;
    const t = setTimeout(() => setGcalToast(null), 5000);
    window.history.replaceState({}, "", "/dashboard");
    return () => clearTimeout(t);
  }, [gcalToast]);

  const handlePostScheduled = useCallback(() => {
    calendarRef.current?.refresh();
  }, []);

  return (
    <>
      {gcalToast && (
        <div
          role="status"
          aria-live="polite"
          className={`mt-6 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${
            gcalToast === "connected"
              ? "border-green-800 bg-green-950 text-green-400"
              : "border-red-800 bg-red-950 text-red-400"
          }`}
        >
          {gcalToast === "connected" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {gcalToast === "connected"
            ? "Google Calendar connected. Scheduled posts will appear as events."
            : "Google Calendar connection failed. Please try again."}
        </div>
      )}

      <PostEditor
        preferredPlatforms={preferredPlatforms}
        onPostScheduled={handlePostScheduled}
      />

      <ScheduledCalendar
        ref={calendarRef}
        googleCalendarConnected={googleCalendarConnected}
      />
    </>
  );
}