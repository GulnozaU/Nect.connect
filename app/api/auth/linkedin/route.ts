import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

import {
  LINKEDIN_AUTH_URL,
  LINKEDIN_OAUTH_SCOPES,
  getLinkedInRedirectUri,
} from "@/lib/linkedin-oauth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const to = new URL("/auth", new URL(request.url).origin);
    to.searchParams.set("next", "/dashboard");
    to.searchParams.set("intent", "connect");
    return NextResponse.redirect(to);
  }

  const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "LinkedIn client ID is not configured." },
      { status: 500 }
    );
  }

  const state = randomBytes(32).toString("hex");
  const redirectUri = getLinkedInRedirectUri();

  const url = new URL(LINKEDIN_AUTH_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", LINKEDIN_OAUTH_SCOPES);

  const res = NextResponse.redirect(url.toString(), 302);
  res.cookies.set("linkedin_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return res;
}
