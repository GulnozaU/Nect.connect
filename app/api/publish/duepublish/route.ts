"use server";

import { createClient } from "@/lib/supabase/server";
import { decryptLinkedInToken } from "@/lib/linkedin-token-crypto";

export async function publishDuePosts() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Fetch this user's pending posts that are due
  const { data: posts, error } = await supabase
    .from("scheduled_posts")
    .select(
      `*, profiles (
        linkedin_access_token,
        linkedin_person_id
      )`
    )
    .eq("user_id", user.id)
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString());

  if (error || !posts || posts.length === 0) return;

  for (const post of posts) {
    try {
      let success = false;

      if (post.platform === "linkedin") {
        success = await publishToLinkedIn(post);
      }

      await supabase
        .from("scheduled_posts")
        .update({ status: success ? "published" : "failed" })
        .eq("id", post.id);

      // Update Google Calendar event color to reflect published/failed state
      // (optional — non-fatal if it fails)
      if (post.google_calendar_event_id) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select(
              "google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expiry, google_calendar_connected"
            )
            .eq("id", user.id)
            .single();

          if (profile?.google_calendar_connected && profile.google_calendar_access_token) {
            const { getCalendarClient } = await import("@/lib/google-calendar");
            const calendar = await getCalendarClient(
              profile.google_calendar_access_token,
              profile.google_calendar_refresh_token!,
              profile.google_calendar_token_expiry
            );

            await calendar.events.patch({
              calendarId: "primary",
              eventId: post.google_calendar_event_id,
              requestBody: {
                // Green (2) = published, Red (11) = failed
                colorId: success ? "2" : "11",
                summary: success
                  ? `✅ LinkedIn Post (published)`
                  : `❌ LinkedIn Post (failed)`,
              },
            });
          }
        } catch {
          // Non-fatal
        }
      }
    } catch (err) {
      console.error(`[publishDuePosts] Failed on post ${post.id}:`, err);
      await supabase
        .from("scheduled_posts")
        .update({ status: "failed" })
        .eq("id", post.id);
    }
  }
}

async function publishToLinkedIn(post: any): Promise<boolean> {
  const { linkedin_access_token, linkedin_person_id } = post.profiles;

  if (!linkedin_access_token || !linkedin_person_id) return false;

  let accessToken: string;
  try {
    accessToken = await decryptLinkedInToken(linkedin_access_token);
  } catch {
    return false;
  }

  const author = linkedin_person_id.startsWith("urn:")
    ? linkedin_person_id
    : `urn:li:member:${linkedin_person_id}`;

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
          shareCommentary: { text: post.text },
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
    console.error("[publishDuePosts] LinkedIn error:", res.status, body);
    return false;
  }

  return true;
}