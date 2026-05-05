import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("scheduled_posts")
    .select(
      "id, text, scheduled_at, platform, status, google_calendar_event_id"
    )
    .eq("user_id", user.id)
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("[scheduled-posts] Failed to load posts:", error);
    return NextResponse.json({ error: "Failed to load scheduled posts." }, { status: 500 });
  }

  return NextResponse.json({ posts: data ?? [] });
}