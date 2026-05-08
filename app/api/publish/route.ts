
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptLinkedInToken } from "@/lib/linkedin-token-crypto";
import { getCalendarClient } from "@/lib/google-calendar";

export async function POST(request: Request) {
  const { text, scheduledAt, platform = "linkedin" } = await request.json();

  if (!text?.trim()) {
    return NextResponse.json({ error: "Post text is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("linkedin_access_token, linkedin_person_id, x_access_token, x_person_id, x_connected, google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expiry, google_calendar_connected")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Could not retrieve profile." }, { status: 500 });
  }

  // ── SCHEDULE path ────────────────────────────────────────────────────────
  if (scheduledAt) {
    const { data: scheduledPost, error: scheduleError } = await supabase
      .from("scheduled_posts")
      .insert({ user_id: user.id, text: text.trim(), scheduled_at: scheduledAt, platform, status: "pending" })
      .select().single();

    if (scheduleError || !scheduledPost) {
      return NextResponse.json({ error: "Failed to schedule post." }, { status: 500 });
    }

    // Google Calendar sync
    if (profile.google_calendar_connected && profile.google_calendar_access_token && profile.google_calendar_refresh_token) {
      try {
        const calendar = await getCalendarClient(
          profile.google_calendar_access_token,
          profile.google_calendar_refresh_token,
          profile.google_calendar_token_expiry
        );
        const start = new Date(scheduledAt);
        const end   = new Date(start.getTime() + 15 * 60 * 1000);
        const event = await calendar.events.insert({
          calendarId: "primary",
          requestBody: {
            summary: `📤 ${platform.charAt(0).toUpperCase() + platform.slice(1)} Post`,
            description: text.trim(),
            start: { dateTime: start.toISOString() },
            end:   { dateTime: end.toISOString() },
            colorId: "6",
          },
        });
        await supabase.from("scheduled_posts")
          .update({ google_calendar_event_id: event.data.id })
          .eq("id", scheduledPost.id);
      } catch (calErr) {
        console.error("[publish] Calendar error:", calErr);
      }
    }

    return NextResponse.json({ success: true, scheduledPostId: scheduledPost.id }, { status: 201 });
  }

  // ── IMMEDIATE publish ────────────────────────────────────────────────────
  if (platform === "linkedin") {
    return publishLinkedIn(text.trim(), profile);
  }

  if (platform === "x") {
    return publishX(text.trim(), profile);
  }

  return NextResponse.json({ error: `Platform "${platform}" not yet supported for immediate publishing.` }, { status: 400 });
}

// ── LinkedIn publisher ────────────────────────────────────────────────────
async function publishLinkedIn(text: string, profile: any) {
  if (!profile.linkedin_access_token || !profile.linkedin_person_id) {
    return NextResponse.json({ error: "LinkedIn account is not connected." }, { status: 400 });
  }

  let accessToken: string;
  try {
    accessToken = await decryptLinkedInToken(profile.linkedin_access_token);
  } catch {
    return NextResponse.json({ error: "Failed to process LinkedIn credentials." }, { status: 500 });
  }

  const author = profile.linkedin_person_id.startsWith("urn:")
    ? profile.linkedin_person_id
    : `urn:li:member:${profile.linkedin_person_id}`;

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[publish] LinkedIn error:", res.status, body);
    return NextResponse.json({ error: "LinkedIn rejected the post. Please try again." }, { status: res.status });
  }

  const postUrn = res.headers.get("x-restli-id");
  return NextResponse.json({ success: true, postUrn }, { status: 201 });
}

// ── X (Twitter) publisher ─────────────────────────────────────────────────
async function publishX(text: string, profile: any) {
  if (!profile.x_connected || !profile.x_access_token) {
    return NextResponse.json({ error: "X account is not connected." }, { status: 400 });
  }

  if (text.length > 280) {
    return NextResponse.json({ error: "X posts cannot exceed 280 characters." }, { status: 400 });
  }

  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${profile.x_access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[publish] X error:", res.status, body);

    // Token expired — attempt refresh
    if (res.status === 401 && profile.x_refresh_token) {
      const refreshed = await refreshXToken(profile.x_refresh_token, profile.id);
      if (refreshed) {
        // Retry once with new token
        const retry = await fetch("https://api.twitter.com/2/tweets", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${refreshed}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        });
        if (retry.ok) {
          const data = await retry.json();
          return NextResponse.json({ success: true, tweetId: data.data?.id }, { status: 201 });
        }
      }
    }

    return NextResponse.json({ error: "X rejected the post. Check your connection in Settings." }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ success: true, tweetId: data.data?.id }, { status: 201 });
}

async function refreshXToken(refreshToken: string, userId: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data.access_token) return null;

    // Save new tokens
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.from("profiles").update({
      x_access_token:  data.access_token,
      x_refresh_token: data.refresh_token ?? refreshToken,
    }).eq("id", userId);

    return data.access_token;
  } catch {
    return null;
  }
}