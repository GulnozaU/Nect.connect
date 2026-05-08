
import { NextResponse } from "next/server";
import crypto from "crypto";

function base64URLEncode(buffer: Buffer) {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function GET() {
  // PKCE code verifier + challenge
  const codeVerifier  = base64URLEncode(crypto.randomBytes(32));
  const codeChallenge = base64URLEncode(
    crypto.createHash("sha256").update(codeVerifier).digest()
  );
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    response_type:         "code",
    client_id:             process.env.X_CLIENT_ID!,
    redirect_uri:          process.env.X_REDIRECT_URI!,
    scope:                 "tweet.read tweet.write users.read offline.access",
    state,
    code_challenge:        codeChallenge,
    code_challenge_method: "S256",
  });

  // Store verifier in a short-lived cookie so callback can use it
  const response = NextResponse.redirect(
    `https://twitter.com/i/oauth2/authorize?${params.toString()}`
  );
  response.cookies.set("x_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });
  response.cookies.set("x_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}