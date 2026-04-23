// FILE: app/actions/publishDuePosts.ts
// PURPOSE: Server action called on every dashboard load.
//          Finds pending/scheduled posts that are due and publishes them to LinkedIn.
//          This replaces the need for a cron job.

"use server";

import { createClient } from "@/lib/supabase/server";
import { decryptLinkedInToken } from "@/lib/linkedin-token-crypto";

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

  // Fetch the user's profile (LinkedIn tokens + Google Calendar tokens)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "linkedin_access_token, linkedin_person_id, google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expiry, google_calendar_connected"
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("[publishDuePosts] Could not load profile:", profileError?.message);
    return;
  }

  for (const post of posts) {
    let success = false;

    try {
      if (post.platform === "linkedin") {
        success = await publishToLinkedIn(post.id, post.text, profile);
      } else {
        // Other platforms not yet implemented — skip silently
        console.log(`[publishDuePosts] Platform '${post.platform}' not yet implemented, skipping`);
        continue;
      }
    } catch (err) {
      console.error(`[publishDuePosts] Uncaught error on post ${post.id}:`, err);
    }

    const newStatus = success ? "published" : "failed";

    await supabase
      .from("scheduled_posts")
      .update({ status: newStatus })
      .eq("id", post.id);

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
            summary: success
              ? "✅ LinkedIn Post (published)"
              : "❌ LinkedIn Post (failed)",
          },
        });
      } catch {
        // Calendar update failure is non-fatal
      }
    }
  }
}

async function publishToLinkedIn(
  postId: string,
  text: string,
  profile: {
    linkedin_access_token: string | null;
    linkedin_person_id: string | null;
  }
): Promise<boolean> {
  if (!profile.linkedin_access_token || !profile.linkedin_person_id) {
    console.error(`[publishDuePosts] Missing LinkedIn credentials for post ${postId}`);
    return false;
  }

  let accessToken: string;
  try {
    // decryptLinkedInToken MUST be awaited — it returns a Promise
    accessToken = await decryptLinkedInToken(profile.linkedin_access_token);
  } catch (err) {
    console.error(`[publishDuePosts] Token decrypt failed for post ${postId}:`, err);
    return false;
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
    console.error(`[publishDuePosts] LinkedIn API error for post ${postId}:`, res.status, body);
    return false;
  }

  return true;
}