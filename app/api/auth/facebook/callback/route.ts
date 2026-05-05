// FILE PATH: app/api/auth/facebook/callback/route.ts
// Exchanges Facebook OAuth code for access token and saves to profiles table.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    console.error("[facebook callback] OAuth error:", error);
    return NextResponse.redirect(new URL("/dashboard?facebook=error", request.url));
  }

  // Exchange code for access token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
    new URLSearchParams({
      client_id:     process.env.FACEBOOK_APP_ID!,
      client_secret: process.env.FACEBOOK_APP_SECRET!,
      redirect_uri:  process.env.FACEBOOK_REDIRECT_URI!,
      code,
    })
  );

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    console.error("[facebook callback] No token:", tokenData);
    return NextResponse.redirect(new URL("/dashboard?facebook=error", request.url));
  }

  // Get the user's Facebook ID
  const meRes = await fetch(
    `https://graph.facebook.com/me?fields=id,name&access_token=${tokenData.access_token}`
  );
  const meData = await meRes.json();

  // Save to Supabase profiles
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      facebook_access_token: tokenData.access_token,
      facebook_person_id:    meData.id,
      facebook_connected:    true,
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("[facebook callback] DB update failed:", updateError);
    return NextResponse.redirect(new URL("/dashboard?facebook=error", request.url));
  }

  return NextResponse.redirect(new URL("/dashboard?facebook=connected", request.url));
}