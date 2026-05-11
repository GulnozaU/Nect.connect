import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchUserTweetsTimeline } from "@/lib/x-twitter";
import { getValidXAccessToken } from "@/lib/analytics-x-session";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("x_access_token, x_refresh_token, x_connected, x_person_id, linkedin_connected")
    .eq("id", user.id)
    .single();

  const linkedinConnected = !!profile?.linkedin_connected;

  const x: {
    tweets: Awaited<ReturnType<typeof fetchUserTweetsTimeline>>;
    error?: string;
  } = { tweets: [] };

  if (profile?.x_connected && profile.x_person_id) {
    const token = await getValidXAccessToken(supabase, user.id, profile);
    if (!token) {
      x.error = "X session expired or not connected. Reconnect in Settings.";
    } else {
      x.tweets = await fetchUserTweetsTimeline(token, profile.x_person_id, 15);
    }
  } else if (profile?.x_connected && !profile.x_person_id) {
    x.error = "Reconnect X in Settings so we can load your profile timeline.";
  }

  return NextResponse.json({
    x,
    linkedin: linkedinConnected
      ? {
          available: false as const,
          message:
            "LinkedIn home feeds and comments in Nect need LinkedIn Community Management / social APIs beyond basic posting.",
        }
      : { available: false as const, message: "Connect LinkedIn in Settings to prepare for future feed support." },
  });
}
