
import { NextResponse } from "next/server";
import crypto from "crypto";

function base64url(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function GET() {
  if (!process.env.X_CLIENT_ID || !process.env.X_REDIRECT_URI) {
    return new Response("X_CLIENT_ID or X_REDIRECT_URI not set in environment variables", {
      status: 500,
    });
  }

  const codeVerifier  = base64url(crypto.randomBytes(32));
  const codeChallenge = base64url(crypto.createHash("sha256").update(codeVerifier).digest());
  const state         = crypto.randomUUID();

  const params = new URLSearchParams({
    response_type:         "code",
    client_id:             process.env.X_CLIENT_ID,
    redirect_uri:          process.env.X_REDIRECT_URI,
    scope:                 "tweet.read tweet.write users.read offline.access",
    state,
    code_challenge:        codeChallenge,
    code_challenge_method: "S256",
  });

  const response = NextResponse.redirect(
    `https://twitter.com/i/oauth2/authorize?${params.toString()}`
  );

  // Store verifier + state in cookies for the callback
  const cookieOpts = {
    httpOnly: true,
    secure:   true,
    sameSite: "lax" as const,
    maxAge:   600, // 10 minutes
    path:     "/",
  };

  response.cookies.set("x_code_verifier", codeVerifier, cookieOpts);
  response.cookies.set("x_oauth_state",   state,        cookieOpts);

  return response;
}