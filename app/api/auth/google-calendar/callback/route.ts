import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOAuthClient } from "@/lib/google-calendar";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/dashboard?gcal=error", request.url)
    );
  }

  // Exchange code for tokens
  const client = getOAuthClient();
  let tokens;
  try {
    const response = await client.getToken(code);
    tokens = response.tokens;
  } catch (err) {
    console.error("[gcal callback] Token exchange failed:", err);
    return NextResponse.redirect(
      new URL("/dashboard?gcal=error", request.url)
    );
  }

  if (!tokens.access_token || !tokens.refresh_token) {
    console.error("[gcal callback] Missing tokens in response");
    return NextResponse.redirect(
      new URL("/dashboard?gcal=error", request.url)
    );
  }

  // Save tokens to the user's profile
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      google_calendar_access_token: tokens.access_token,
      google_calendar_refresh_token: tokens.refresh_token,
      google_calendar_token_expiry: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
      google_calendar_connected: true,
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("[gcal callback] Failed to save tokens:", updateError);
    return NextResponse.redirect(
      new URL("/dashboard?gcal=error", request.url)
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard?gcal=connected", request.url)
  );
}