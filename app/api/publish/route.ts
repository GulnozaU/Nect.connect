// FILE: app/api/publish/route.ts
// PURPOSE: Handles both immediate publishing and scheduling.
//          POST /api/publish
//          Body: { text, platform?, scheduledAt? }
//          - If scheduledAt is provided: saves to scheduled_posts table + creates Google Calendar event
//          - If no scheduledAt: publishes immediately to LinkedIn

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptLinkedInToken } from "@/lib/linkedin-token-crypto";
import { getCalendarClient } from "@/lib/google-calendar";

export async function POST(request: Request) {
  const { text, scheduledAt, platform = "linkedin" } = await request.json();

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Post text is required." }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "linkedin_access_token, linkedin_person_id, google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expiry, google_calendar_connected"
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Could not retrieve profile." }, { status: 500 });
  }

  if (!profile.linkedin_access_token || !profile.linkedin_person_id) {
    return NextResponse.json({ error: "LinkedIn account is not connected." }, { status: 400 });
  }

  // ── SCHEDULE path ────────────────────────────────────────────────────────
  if (scheduledAt) {
    const { data: scheduledPost, error: scheduleError } = await supabase
      .from("scheduled_posts")
      .insert({
        user_id: user.id,
        text: text.trim(),
        scheduled_at: scheduledAt,
        platform,
        status: "pending",
      })
      .select()
      .single();

    if (scheduleError || !scheduledPost) {
      console.error("[publish] Failed to save scheduled post:", scheduleError);
      return NextResponse.json({ error: "Failed to schedule post." }, { status: 500 });
    }

    // Create Google Calendar event if connected
    if (
      profile.google_calendar_connected &&
      profile.google_calendar_access_token &&
      profile.google_calendar_refresh_token
    ) {
      try {
        const calendar = await getCalendarClient(
          profile.google_calendar_access_token,
          profile.google_calendar_refresh_token,
          profile.google_calendar_token_expiry
        );

        const startTime = new Date(scheduledAt);
        const endTime = new Date(startTime.getTime() + 15 * 60 * 1000);

        const event = await calendar.events.insert({
          calendarId: "primary",
          requestBody: {
            summary: `📤 ${platform.charAt(0).toUpperCase() + platform.slice(1)} Post`,
            description: text.trim(),
            start: { dateTime: startTime.toISOString() },
            end: { dateTime: endTime.toISOString() },
            colorId: "6", // orange
          },
        });

        await supabase
          .from("scheduled_posts")
          .update({ google_calendar_event_id: event.data.id })
          .eq("id", scheduledPost.id);
      } catch (calErr) {
        console.error("[publish] Calendar event creation failed:", calErr);
        // Non-fatal — post is still scheduled
      }
    }

    return NextResponse.json({ success: true, scheduledPostId: scheduledPost.id }, { status: 201 });
  }

  // ── IMMEDIATE PUBLISH path ───────────────────────────────────────────────
  let accessToken: string;
  try {
    accessToken = await decryptLinkedInToken(profile.linkedin_access_token);
  } catch (err) {
    console.error("[publish] Token decryption failed:", err);
    return NextResponse.json({ error: "Failed to process LinkedIn credentials." }, { status: 500 });
  }

  const author = profile.linkedin_person_id.startsWith("urn:")
    ? profile.linkedin_person_id
    : `urn:li:member:${profile.linkedin_person_id}`;

  let linkedInResponse: Response;
  try {
    linkedInResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        // NO LinkedIn-Version header — not needed on /v2/ugcPosts
      },
      body: JSON.stringify({
        author,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: text.trim() },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      }),
    });
  } catch (err) {
    console.error("[publish] LinkedIn fetch failed:", err);
    return NextResponse.json({ error: "Network error reaching LinkedIn." }, { status: 502 });
  }

  if (!linkedInResponse.ok) {
    const errorBody = await linkedInResponse.text();
    console.error("[publish] LinkedIn API error:", linkedInResponse.status, errorBody);
    return NextResponse.json(
      { error: "LinkedIn rejected the post. Please try again." },
      { status: linkedInResponse.status }
    );
  }

  const postUrn = linkedInResponse.headers.get("x-restli-id");
  return NextResponse.json({ success: true, postUrn }, { status: 201 });
}