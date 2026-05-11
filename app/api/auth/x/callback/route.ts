import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getXRedirectUri } from "@/lib/x-oauth";

function fail(request: Request, reason: string, detail?: string) {
  console.error("[x/callback]", reason, detail ?? "");
  const to = new URL("/dashboard", request.url);
  to.searchParams.set("x", "error");
  to.searchParams.set("x_reason", reason);
  if (detail) to.searchParams.set("x_detail", encodeURIComponent(detail.slice(0, 200)));
  return NextResponse.redirect(to);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  const oauthDesc = searchParams.get("error_description");

  if (oauthError || !code) {
    return fail(request, "oauth", oauthDesc || oauthError || "missing_code");
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("x_oauth_state")?.value;
  const codeVerifier = cookieStore.get("x_code_verifier")?.value;

  if (!savedState || savedState !== state || !codeVerifier) {
    return fail(
      request,
      "state",
      "PKCE cookie missing or state mismatch. Try again, avoid private/incognito if it persists."
    );
  }

  if (!process.env.X_CLIENT_ID || !process.env.X_CLIENT_SECRET) {
    return fail(request, "config", "X_CLIENT_ID or X_CLIENT_SECRET missing on server.");
  }

  const redirectUri = getXRedirectUri(request.url);

  const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      client_id: process.env.X_CLIENT_ID,
    }),
  });

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenData.access_token) {
    const detail = [tokenData.error, tokenData.error_description].filter(Boolean).join(": ") || JSON.stringify(tokenData);
    return fail(request, "token", detail);
  }

  const meRes = await fetch(
    "https://api.twitter.com/2/users/me?user.fields=id,name,username",
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
  );
  const meData = (await meRes.json()) as { data?: { id?: string }; errors?: { message?: string }[] };
  const xUserId = meData?.data?.id;

  if (!xUserId) {
    const detail =
      meData?.errors?.map((e) => e.message).join(", ") || JSON.stringify(meData);
    return fail(request, "user", detail);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  const { error: dbError } = await supabase
    .from("profiles")
    .update({
      x_access_token: tokenData.access_token,
      x_refresh_token: tokenData.refresh_token ?? null,
      x_person_id: xUserId,
      x_connected: true,
    })
    .eq("id", user.id);

  if (dbError) {
    return fail(request, "db", dbError.message);
  }

  const response = NextResponse.redirect(new URL("/dashboard?x=connected", request.url));
  response.cookies.delete("x_code_verifier");
  response.cookies.delete("x_oauth_state");
  return response;
}
