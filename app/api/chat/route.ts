import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET() {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "Chat is not configured." }, { status: 500 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const chronological = [...(data ?? [])].reverse();
  return NextResponse.json({ messages: chronological });
}

export async function POST(request: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "Chat is not configured." }, { status: 500 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const { error: insUserErr } = await supabase.from("chat_messages").insert({
    user_id: user.id,
    role: "user",
    content,
  });
  if (insUserErr) {
    return NextResponse.json({ error: insUserErr.message }, { status: 500 });
  }

  const { data: history } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(40);

  const ordered = [...(history ?? [])].reverse();
  const msgs = ordered.map((m) => ({
    role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: m.content,
  }));

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are Nect, an in-app assistant for a social media tool. You help users brainstorm ideas, refine tone, plan LinkedIn/X posts, and explain how to use scheduling and the Create Post flow.
Rules: Be concise. Do not claim posts were published or scheduled unless the user did it in the UI. If they want generated posts, tell them to use Dashboard → Create Post with their idea, tone, goal, and language. No markdown headings unless short.`,
      },
      ...msgs.slice(-24).map((m) => ({ role: m.role, content: m.content })),
    ],
    temperature: 0.65,
    max_tokens: 900,
  });

  const reply = completion.choices[0]?.message?.content?.trim() ?? "Sorry — I could not generate a reply. Try again.";

  const { error: insAsstErr } = await supabase.from("chat_messages").insert({
    user_id: user.id,
    role: "assistant",
    content: reply,
  });
  if (insAsstErr) {
    return NextResponse.json({ error: insAsstErr.message }, { status: 500 });
  }

  return NextResponse.json({ reply });
}
