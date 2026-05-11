import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { postReplyTweet, refreshXPersisted } from "@/lib/x-twitter";
import { getValidXAccessToken } from "@/lib/analytics-x-session";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { platform?: string; inReplyToTweetId?: string; text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const platform = body.platform ?? "x";
  const inReplyToTweetId = body.inReplyToTweetId?.trim();
  const text = body.text?.trim() ?? "";

  if (platform !== "x") {
    return NextResponse.json({ error: "Only X replies are supported right now." }, { status: 400 });
  }
  if (!inReplyToTweetId || !text) {
    return NextResponse.json({ error: "inReplyToTweetId and text are required." }, { status: 400 });
  }
  if (text.length > 280) {
    return NextResponse.json({ error: "X replies cannot exceed 280 characters." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("x_access_token, x_refresh_token, x_connected")
    .eq("id", user.id)
    .single();

  if (!profile?.x_connected) {
    return NextResponse.json({ error: "X is not connected." }, { status: 400 });
  }

  let token = await getValidXAccessToken(supabase, user.id, profile);
  if (!token) {
    return NextResponse.json({ error: "Could not obtain X access token. Reconnect X." }, { status: 401 });
  }

  let attempt = await postReplyTweet(token, text, inReplyToTweetId);
  if (!attempt.ok && attempt.status === 401 && profile.x_refresh_token) {
    const refreshed = await refreshXPersisted(supabase, user.id, profile.x_refresh_token);
    if (refreshed) attempt = await postReplyTweet(refreshed, text, inReplyToTweetId);
  }

  if (!attempt.ok) {
    console.error("[analytics/reply] X error:", attempt.status, attempt.body);
    return NextResponse.json(
      { error: "X rejected the reply.", detail: attempt.body.slice(0, 300) },
      { status: attempt.status }
    );
  }

  return NextResponse.json({ success: true, tweetId: attempt.tweetId }, { status: 201 });
}
