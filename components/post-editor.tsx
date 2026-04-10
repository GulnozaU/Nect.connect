"use client";
 
import { useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
 
type ToastState = {
  type: "success" | "error";
  message: string;
} | null;
 
const MAX_CHARS = 3000; // LinkedIn's text post character limit
 
export default function PostEditor() {
  const [text, setText] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
 
  const charsRemaining = MAX_CHARS - text.length;
  const isOverLimit = charsRemaining < 0;
  const isEmpty = text.trim().length === 0;
 
  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }
 
  async function handlePublish() {
    if (isEmpty || isPublishing || isOverLimit) return;
 
    setIsPublishing(true);
    setToast(null);
 
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
 
      const data = await res.json();
 
      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }
 
      setText("");
      showToast("success", "Post published to LinkedIn!");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to publish. Please try again.";
      showToast("error", message);
    } finally {
      setIsPublishing(false);
    }
  }
 
  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto p-4">
 
      {/* Toast notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium border ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
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
 
      {/* Textarea */}
      <div className="relative">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isPublishing}
          placeholder="What do you want to share?"
          rows={6}
          className={`resize-none pr-16 ${
            isOverLimit ? "border-red-400 focus-visible:ring-red-300" : ""
          }`}
        />
        {/* Character counter */}
        <span
          className={`absolute bottom-3 right-3 text-xs tabular-nums pointer-events-none ${
            isOverLimit
              ? "text-red-500 font-semibold"
              : charsRemaining < 100
              ? "text-amber-500"
              : "text-muted-foreground"
          }`}
        >
          {charsRemaining.toLocaleString()}
        </span>
      </div>
 
      {/* Publish button */}
      <div className="flex justify-end">
        <Button
          onClick={handlePublish}
          disabled={isPublishing || isEmpty || isOverLimit}
          className="bg-[#0A66C2] hover:bg-[#004182] text-white"
        >
          {isPublishing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing…
            </>
          ) : (
            "Publish to LinkedIn"
          )}
        </Button>
      </div>
 
    </div>
  );
}
