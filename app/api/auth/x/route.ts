import { NextResponse } from "next/server";
import crypto from "crypto";

import { getXRedirectUri } from "@/lib/x-oauth";

function base64url(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function GET(request: Request) {
  if (!process.env.X_CLIENT_ID) {
    return new Response("X_CLIENT_ID is not set in environment variables", { status: 500 });
  }

  const redirectUri = getXRedirectUri(request.url);

  const codeVerifier  = base64url(crypto.randomBytes(32));
  const codeChallenge = base64url(crypto.createHash("sha256").update(codeVerifier).digest());
  const state         = crypto.randomUUID();

  const params = new URLSearchParams({
    response_type:         "code",
    client_id:             process.env.X_CLIENT_ID,
    redirect_uri:          redirectUri,
    scope:                 "tweet.read tweet.write users.read offline.access",
    state,
    code_challenge:        codeChallenge,
    code_challenge_method: "S256",
  });

  const response = NextResponse.redirect(
    `https://x.com/i/oauth2/authorize?${params.toString()}`
  );

  // Store verifier + state in cookies for the callback
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge:   600, // 10 minutes
    path:     "/",
  };

  response.cookies.set("x_code_verifier", codeVerifier, cookieOpts);
  response.cookies.set("x_oauth_state",   state,        cookieOpts);

  return response;
}