
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  
 
  const cookieStore = await cookies();
  const code_verifier = cookieStore.get("x_code_verifier")?.value;

 
  if (error || !code || !code_verifier) {
    console.error("[x callback] Auth failed or session expired");
    return NextResponse.redirect(new URL("/dashboard?x=error", request.url));
  }


  const BasicAuth = Buffer.from(
    `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
  ).toString("base64");

  try {
    // 3. Exchange the code for an Access Token
    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${BasicAuth}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.X_REDIRECT_URI!,
        code_verifier: code_verifier, 
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error("Failed to obtain access token from X");
    }

    // 4. Get the user's X Profile details (ID and Name)
    const meRes = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const meResult = await meRes.json();
    const xUser = meResult.data;

    // 5. Connect to Supabase and get the current logged-in user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }

    // 6. Update the profiles table with the new X credentials
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        x_access_token: tokenData.access_token,
        x_refresh_token: tokenData.refresh_token, // X tokens expire every 2 hours
        x_user_id: xUser.id,
        x_username: xUser.username,
        x_connected: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      throw updateError;
    }

   
    cookieStore.delete("x_code_verifier");


    return NextResponse.redirect(new URL("/dashboard?x=connected", request.url));

  } catch (err) {
    console.error("[x callback] Error:", err);
    return NextResponse.redirect(new URL("/dashboard?x=error", request.url));
  }
}