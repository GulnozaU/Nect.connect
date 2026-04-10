import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptLinkedInToken } from "@/lib/linkedin-token-crypto";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('key');

  if (secret !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = await createClient();

  // 1. Fetch posts across ALL platforms
  const { data: posts, error } = await supabase
    .from("scheduled_posts")
    .select(`
      *,
      profiles (
        linkedin_access_token,
        linkedin_person_id,
        twitter_access_token,
        instagram_access_token
      )
    `)
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString());

  if (error || !posts || posts.length === 0) {
    return NextResponse.json({ message: "No posts due." });
  }

  const results = [];

  for (const post of posts) {
    let success = false;

    try {
      // 2. Route based on platform
      switch (post.platform) {
        case 'linkedin':
          success = await handleLinkedInPost(post);
          break;
        
        case 'twitter':
          // success = await handleTwitterPost(post); 
          console.log("Twitter logic goes here");
          break;

        case 'instagram':
          // success = await handleInstagramPost(post);
          console.log("Instagram logic goes here");
          break;

        default:
          console.error(`Unknown platform: ${post.platform}`);
      }

      // 3. Update status only if the specific platform succeeded
      if (success) {
        await supabase
          .from("scheduled_posts")
          .update({ status: "published" })
          .eq("id", post.id);
        results.push({ id: post.id, platform: post.platform, status: "success" });
      }

    } catch (err) {
      console.error(`Failed processing post ${post.id}:`, err);
    }
  }

  return NextResponse.json({ processed: results });
}

// --- Helper Function for LinkedIn ---
async function handleLinkedInPost(post: any) {
  const accessToken = decryptLinkedInToken(post.profiles.linkedin_access_token);
  
  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202401",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: post.profiles.linkedin_person_id,
      commentary: post.text,
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: "PUBLISHED",
    }),
  });

  return res.ok;
}