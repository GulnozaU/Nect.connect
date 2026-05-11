// FILE: app/actions/publishDuePosts.ts
// PURPOSE: Server action called on every dashboard load.
//          Finds pending/scheduled posts that are due and publishes them to LinkedIn.
//          This replaces the need for a cron job.

"use server";

import { createClient } from "@/lib/supabase/server";
import { decryptLinkedInToken } from "@/lib/linkedin-token-crypto";
import { postTweetV2, refreshXPersisted } from "@/lib/x-twitter";

export async function publishDuePosts(): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const now = new Date().toISOString();

  // Fetch all posts for this user that are due right now
  const { data: posts, error } = await supabase
    .from("scheduled_posts")
    .select("id, text, platform, scheduled_at, google_calendar_event_id")
    .eq("user_id", user.id)
    .in("status", ["pending", "scheduled"])
    .lte("scheduled_at", now);

  if (error) {
    console.error("[publishDuePosts] DB error:", error.message);
    return;
  }

  if (!posts || posts.length === 0) return;

  console.log(`[publishDuePosts] ${posts.length} post(s) due for ${user.email}`);

  // Fetch the user's profile (LinkedIn + X + Google Calendar tokens)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "linkedin_access_token, linkedin_person_id, x_access_token, x_refresh_token, x_connected, google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expiry, google_calendar_connected"
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("[publishDuePosts] Could not load profile:", profileError?.message);
    return;
  }

  for (const post of posts) {
    let success = false;
    let platformPostId: string | null = null;

    try {
      if (post.platform === "linkedin") {
        const r = await publishToLinkedIn(post.text, profile);
        success = r.ok;
        platformPostId = r.platformPostId ?? null;
      } else if (post.platform === "x") {
        const r = await publishToXDue(post.text, user.id, profile, supabase);
        success = r.ok;
        platformPostId = r.tweetId ?? null;
      } else {
        console.log(`[publishDuePosts] Platform '${post.platform}' not yet implemented, skipping`);
        continue;
      }
    } catch (err) {
      console.error(`[publishDuePosts] Uncaught error on post ${post.id}:`, err);
    }

    const newStatus = success ? "published" : "failed";
    const label = post.platform === "x" ? "X" : "LinkedIn";

    const updatePayload: { status: string; platform_post_id?: string } = { status: newStatus };
    if (success && platformPostId) updatePayload.platform_post_id = platformPostId;

    await supabase.from("scheduled_posts").update(updatePayload).eq("id", post.id);

    console.log(`[publishDuePosts] Post ${post.id} → ${newStatus}`);

    // Update the Google Calendar event color to reflect the result
    if (post.google_calendar_event_id && profile.google_calendar_connected) {
      try {
        const { getCalendarClient } = await import("@/lib/google-calendar");
        const calendar = await getCalendarClient(
          profile.google_calendar_access_token!,
          profile.google_calendar_refresh_token!,
          profile.google_calendar_token_expiry
        );
        await calendar.events.patch({
          calendarId: "primary",
          eventId: post.google_calendar_event_id,
          requestBody: {
            colorId: success ? "2" : "11", // green = published, red = failed
            summary: success ? `✅ ${label} Post (published)` : `❌ ${label} Post (failed)`,
          },
        });
      } catch {
        // Calendar update failure is non-fatal
      }
    }
  }
}

async function publishToXDue(
  text: string,
  userId: string,
  profile: {
    x_access_token: string | null;
    x_refresh_token: string | null;
    x_connected: boolean | null;
  },
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ ok: boolean; tweetId?: string }> {
  if (!profile.x_connected || !profile.x_access_token) {
    console.error("[publishDuePosts] Missing X credentials");
    return { ok: false };
  }
  if (text.length > 280) {
    console.error("[publishDuePosts] X post exceeds 280 characters");
    return { ok: false };
  }

  let attempt = await postTweetV2(profile.x_access_token, text);
  if (!attempt.ok && attempt.status === 401 && profile.x_refresh_token) {
    const refreshed = await refreshXPersisted(supabase, userId, profile.x_refresh_token);
    if (refreshed) attempt = await postTweetV2(refreshed, text);
  }
  if (!attempt.ok) {
    console.error("[publishDuePosts] X API error:", attempt.status, attempt.body);
    return { ok: false };
  }
  return { ok: true, tweetId: attempt.tweetId };
}

async function publishToLinkedIn(
  text: string,
  profile: {
    linkedin_access_token: string | null;
    linkedin_person_id: string | null;
  }
): Promise<{ ok: boolean; platformPostId?: string | null }> {
  if (!profile.linkedin_access_token || !profile.linkedin_person_id) {
    console.error("[publishDuePosts] Missing LinkedIn credentials");
    return { ok: false };
  }

  let accessToken: string;
  try {
    // decryptLinkedInToken MUST be awaited — it returns a Promise
    accessToken = await decryptLinkedInToken(profile.linkedin_access_token);
  } catch (err) {
    console.error("[publishDuePosts] Token decrypt failed:", err);
    return { ok: false };
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
      // NO LinkedIn-Version header — not needed on /v2/ugcPosts
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
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[publishDuePosts] LinkedIn API error:", res.status, body);
    return { ok: false };
  }

  const platformPostId = res.headers.get("x-restli-id");
  return { ok: true, platformPostId };
}