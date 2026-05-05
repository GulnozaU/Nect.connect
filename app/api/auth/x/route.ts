import { NextResponse } from "next/server";
import { cookies } from "next/headers"; // Next.js cookie helper

export async function GET() {
  const state = crypto.randomUUID();
  const code_verifier = crypto.randomUUID() + crypto.randomUUID(); // Long random string

  // Store the verifier in an encrypted HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set("x_code_verifier", code_verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.X_CLIENT_ID!,
    redirect_uri: process.env.X_REDIRECT_URI!,
    scope: "tweet.read tweet.write users.read offline.access",
    state: state,
    code_challenge: code_verifier, // X "Plain" method
    code_challenge_method: "plain",
  });

  return NextResponse.redirect(`https://twitter.com/i/oauth2/authorize?${params.toString()}`);
}