import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { encryptLinkedInToken } from "@/lib/linkedin-token-crypto";
import {
  LINKEDIN_TOKEN_URL,
  LINKEDIN_USERINFO_URL,
  getLinkedInRedirectUri,
} from "@/lib/linkedin-oauth";
import { createClient } from "@/lib/supabase/server";

type LinkedInTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type?: string;
};

type LinkedInUserInfo = {
  sub: string;
  name?: string;
  email?: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");
  const errDesc = url.searchParams.get("error_description");

  const fail = (message: string) => {
    const to = new URL("/dashboard", url.origin);
    to.searchParams.set("linkedin", "error");
    to.searchParams.set("message", message);
    return NextResponse.redirect(to);
  };

  if (err) {
    return fail(errDesc || err);
  }

  if (!code || !state) {
    return fail("Missing authorization code or state.");
  }

  const jar = await cookies();
  const expectedState = jar.get("linkedin_oauth_state")?.value;

  if (!expectedState || expectedState !== state) {
    return fail("Invalid OAuth state. Try connecting again.");
  }

  const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return fail("LinkedIn OAuth is not configured.");
  }

  const redirectUri = getLinkedInRedirectUri();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  let tokenJson: LinkedInTokenResponse;
  try {
    const tokenRes = await fetch(LINKEDIN_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    if (!tokenRes.ok) {
      const t = await tokenRes.text();
      return fail(`Token exchange failed: ${t}`);
    }
    tokenJson = (await tokenRes.json()) as LinkedInTokenResponse;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Token request failed.");
  }

  const accessToken = tokenJson.access_token;
  if (!accessToken) {
    return fail("No access token returned.");
  }

  let personId: string;
  try {
    const meRes = await fetch(LINKEDIN_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!meRes.ok) {
      const t = await meRes.text();
      return fail(`Profile fetch failed: ${t}`);
    }
    const me = (await meRes.json()) as LinkedInUserInfo;
    if (!me.sub) {
      return fail("LinkedIn userinfo did not return a person id (sub).");
    }
    personId = me.sub.startsWith("urn:li:person:")
      ? me.sub
      : `urn:li:person:${me.sub}`;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Profile request failed.");
  }

  let encryptedToken: string;
  try {
    encryptedToken = encryptLinkedInToken(accessToken);
  } catch (e) {
    return fail(
      e instanceof Error
        ? e.message
        : "Token encryption failed. Set LINKEDIN_TOKEN_ENCRYPTION_KEY."
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const to = new URL("/auth", url.origin);
    to.searchParams.set("next", "/dashboard");
    to.searchParams.set("intent", "connect");
    to.searchParams.set("linkedin", "session");
    return NextResponse.redirect(to);
  }

  const { error: dbError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      linkedin_access_token: encryptedToken,
      linkedin_person_id: personId,
      linkedin_connected: true,
    },
    { onConflict: "id" }
  );

  if (dbError) {
    return fail(dbError.message);
  }

  const to = new URL("/dashboard", url.origin);
  to.searchParams.set("linkedin", "connected");
  const res = NextResponse.redirect(to);
  res.cookies.set("linkedin_oauth_state", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
