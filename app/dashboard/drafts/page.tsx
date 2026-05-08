// FILE PATH: app/dashboard/drafts/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Pencil, Trash2, Send, PenLine, Linkedin, Radio, Clock } from "lucide-react";

type Draft = {
  id: string;
  text: string;
  platform: "linkedin" | "x";
  created_at: string;
};

const PLATFORM_META = {
  linkedin: { icon: Linkedin, color: "#0A66C2", label: "LinkedIn" },
  x:        { icon: Radio,    color: "#e4e4e7", label: "X" },
};

export default function DraftsPage() {
  const [drafts, setDrafts]   = useState<Draft[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("nect_drafts") ?? "[]");
      setDrafts(stored);
    } catch {
      setDrafts([]);
    }
  }, []);

  function save(updated: Draft[]) {
    setDrafts(updated);
    localStorage.setItem("nect_drafts", JSON.stringify(updated));
  }

  function deleteDraft(id: string) {
    save(drafts.filter((d) => d.id !== id));
  }

  function startEdit(draft: Draft) {
    setEditing(draft.id);
    setEditText(draft.text);
  }

  function saveEdit(id: string) {
    save(drafts.map((d) => d.id === id ? { ...d, text: editText } : d));
    setEditing(null);
  }

  async function publishDraft(draft: Draft) {
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft.text, platform: draft.platform }),
      });
      if (res.ok) {
        deleteDraft(draft.id);
        alert(`Published to ${PLATFORM_META[draft.platform].label}!`);
      } else {
        const data = await res.json();
        alert(data.error ?? "Publish failed");
      }
    } catch {
      alert("Network error. Try again.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 md:px-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Drafts</h1>
          <p className="mt-1 text-sm text-zinc-500">Posts you saved but haven't published yet.</p>
        </div>
        <Link href="/dashboard/create"
          className="flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2 text-sm font-bold text-black hover:bg-[#fb923c] transition-colors">
          <PenLine className="h-3.5 w-3.5" /> New post
        </Link>
      </div>

      {drafts.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-6 py-16 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
          <p className="text-sm font-medium text-zinc-500">No drafts yet.</p>
          <p className="mt-1 text-xs text-zinc-700 mb-6">
            When you save a post as a draft in the Create page, it appears here.
          </p>
          <Link href="/dashboard/create"
            className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#fb923c] transition-colors">
            Create a post
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => {
            const meta = PLATFORM_META[draft.platform] ?? PLATFORM_META.linkedin;
            const Icon = meta.icon;
            const isEditing = editing === draft.id;

            return (
              <div key={draft.id}
                className="rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={5}
                      className="w-full resize-none bg-transparent text-sm leading-7 text-zinc-100 focus:outline-none"
                      autoFocus
                    />
                    {draft.platform === "x" && (
                      <p className={`text-right text-xs ${editText.length > 280 ? "text-red-400 font-bold" : "text-zinc-700"}`}>
                        {editText.length}/280
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(null)}
                        className="rounded-xl border border-white/10 px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
                        Cancel
                      </button>
                      <button onClick={() => saveEdit(draft.id)}
                        className="rounded-xl bg-[#F97316] px-4 py-2 text-xs font-bold text-black hover:bg-[#fb923c] transition-colors">
                        Save changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: meta.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-relaxed text-zinc-300 line-clamp-3">{draft.text}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-zinc-600">
                        <Clock className="h-3 w-3" />
                        Saved {new Date(draft.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        <span>·</span>
                        <span>{meta.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => publishDraft(draft)}
                        className="flex items-center gap-1 rounded-lg bg-[#F97316]/10 px-2.5 py-1.5 text-xs font-semibold text-[#F97316] hover:bg-[#F97316]/20 transition-colors">
                        <Send className="h-3 w-3" /> Publish
                      </button>
                      <button onClick={() => startEdit(draft)}
                        className="rounded-lg p-1.5 text-zinc-600 hover:bg-white/5 hover:text-zinc-300 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteDraft(draft.id)}
                        className="rounded-lg p-1.5 text-zinc-600 hover:bg-red-950/40 hover:text-red-400 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}