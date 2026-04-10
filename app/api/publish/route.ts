import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptLinkedInToken } from "@/lib/linkedin-token-crypto";
 
export async function POST(request: Request) {

  const { text } = await request.json();
 
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Post text is required." }, { status: 400 });
  }
 
  // 2. Authenticate via Supabase — uses the project's existing server client helper
  const supabase = await createClient();
 
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
 
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
 
  // 3. Fetch the encrypted LinkedIn token and person ID from the profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("linkedin_access_token, linkedin_person_id")
    .eq("id", user.id)
    .single();
 
  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Could not retrieve LinkedIn profile." },
      { status: 500 }
    );
  }
 
  if (!profile.linkedin_access_token || !profile.linkedin_person_id) {
    return NextResponse.json(
      { error: "LinkedIn account is not connected." },
      { status: 400 }
    );
  }
 
  // 4. Decrypt the access token
  let accessToken: string;
  try {
    accessToken = await decryptLinkedInToken(profile.linkedin_access_token);
  } catch (err) {
    console.error("Failed to decrypt LinkedIn token:", err);
    return NextResponse.json(
      { error: "Failed to process LinkedIn credentials." },
      { status: 500 }
    );
  }
 
  // 5. Publish the post to LinkedIn using API version 202310
  const linkedInPayload = {
    author: `urn:li:person:${profile.linkedin_person_id}`,
    commentary: text.trim(),
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };
 
  let linkedInResponse: Response;
  try {
    linkedInResponse = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": "202401",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(linkedInPayload),
    });
  } catch (err) {
    console.error("[publish] LinkedIn fetch failed:", err);
    return NextResponse.json(
      { error: "Network error reaching LinkedIn. Please try again." },
      { status: 502 }
    );
  }
 
  if (!linkedInResponse.ok) {
    const errorBody = await linkedInResponse.text();
    console.error("[publish] LinkedIn API error:", linkedInResponse.status, errorBody);
    return NextResponse.json(
      { error: "LinkedIn rejected the post. Please try again." },
      { status: linkedInResponse.status }
    );
  }
 

  const postUrn = linkedInResponse.headers.get("x-restli-id");
 
  return NextResponse.json(
    { success: true, postUrn },
    { status: 201 }
  );
}