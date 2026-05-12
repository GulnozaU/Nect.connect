"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send, MessageSquare } from "lucide-react";

type Row = { id: string; role: string; content: string; created_at?: string };

export default function ChatClient() {
  const [messages, setMessages] = useState<Row[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/chat");
        const data = await res.json();
        if (!cancelled && res.ok) setMessages(data.messages ?? []);
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    const optimistic: Row = { id: `temp-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      const reload = await fetch("/api/chat");
      const reloadData = await reload.json();
      if (reload.ok) setMessages(reloadData.messages ?? []);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-3xl flex-col px-5 py-8 md:px-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-[#F97316]">
          <MessageSquare className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">In-app</span>
        </div>
        <h1 className="text-2xl font-semibold text-white">Chat with Nect</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Ask for angles, hooks, or how to use Create Post and scheduling. For final drafts, use Create Post so you can review before publishing.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-12 text-zinc-500">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-600">
              No messages yet. Say what you want to post about, or ask for help with tone and platforms.
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[92%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-[#F97316]/15 text-zinc-100"
                    : "mr-auto border border-white/10 bg-black/40 text-zinc-300"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-white/10 p-3">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Message Nect…"
              rows={2}
              disabled={sending}
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#F97316]/40 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || !input.trim()}
              className="self-end rounded-xl bg-[#F97316] px-4 py-2 text-sm font-bold text-black hover:bg-[#fb923c] disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
