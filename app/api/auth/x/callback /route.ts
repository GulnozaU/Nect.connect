// FILE PATH: app/api/auth/twitter/callback/route.ts
// Exchanges X OAuth code for tokens and saves to profiles table.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    console.error("[x callback] OAuth error:", error);
    return NextResponse.redirect(new URL("/dashboard?x=error", request.url));
  }

  // Verify state to prevent CSRF
  const cookieStore = cookies();
  const savedState    = cookieStore.get("x_oauth_state")?.value;
  const codeVerifier  = cookieStore.get("x_code_verifier")?.value;

  if (!savedState || savedState !== state || !codeVerifier) {
    console.error("[x callback] State mismatch or missing verifier");
    return NextResponse.redirect(new URL("/dashboard?x=error", request.url));
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      code,
      grant_type:    "authorization_code",
      redirect_uri:  process.env.X_REDIRECT_URI!,
      code_verifier: codeVerifier,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    console.error("[x callback] No token:", tokenData);
    return NextResponse.redirect(new URL("/dashboard?x=error", request.url));
  }

  // Get X user ID
  const meRes = await fetch("https://api.twitter.com/2/users/me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const meData = await meRes.json();
  const xUserId = meData?.data?.id;

  if (!xUserId) {
    console.error("[x callback] Could not get user ID:", meData);
    return NextResponse.redirect(new URL("/dashboard?x=error", request.url));
  }

  // Save to Supabase
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  const { error: dbError } = await supabase
    .from("profiles")
    .update({
      x_access_token:  tokenData.access_token,
      x_refresh_token: tokenData.refresh_token ?? null,
      x_person_id:     xUserId,
      x_connected:     true,
    })
    .eq("id", user.id);

  if (dbError) {
    console.error("[x callback] DB update failed:", dbError);
    return NextResponse.redirect(new URL("/dashboard?x=error", request.url));
  }

  // Clear cookies
  const response = NextResponse.redirect(new URL("/dashboard?x=connected", request.url));
  response.cookies.delete("x_code_verifier");
  response.cookies.delete("x_oauth_state");
  return response;
}