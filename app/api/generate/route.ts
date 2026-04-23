// FILE: app/api/generate/route.ts
// PURPOSE: POST /api/generate
//          Uses Claude AI to generate platform-native posts from one idea.
//          Body: { idea, tone?, goal?, platform? }
//          - If platform is specified: regenerates just that one platform
//          - If no platform: generates all 4 platforms in parallel
//          Requires ANTHROPIC_API_KEY in .env.local

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PLATFORM_PROMPTS: Record<string, string> = {
  linkedin: `Write a LinkedIn post. Professional but human. 150-300 words.
Start with a compelling hook. Include a story, insight, or lesson.
End with a question or call to action.
Add 3-5 relevant hashtags on a new line at the end.
No hashtags in the main body.`,

  instagram: `Write an Instagram caption. Conversational, relatable, energetic. 80-150 words.
Start with an attention-grabbing first line (no "Hey" or "Hi").
Use 2-4 emojis naturally throughout.
End with a question or CTA.
Add 8-12 relevant hashtags on a new line at the end.`,

  x: `Write a post for X (Twitter). Maximum 280 characters total.
Sharp, punchy, opinionated or insightful. No filler words.
No hashtags unless essential. Make every single word count.
If the idea truly needs more space, write a thread (1/ 2/ 3/).`,

  reddit: `Write a Reddit post. Authentic, community-focused — zero marketing speak.
150-250 words. Sound like a real person sharing something genuinely interesting.
Include context, be specific, invite discussion.
NO hashtags. NO excessive emojis. NO calls to action.
First line is the post title, rest is the body.`,
};

export async function POST(request: Request) {
  const { idea, tone = "Professional", goal = "Build audience", platform } =
    await request.json();

  if (!idea || typeof idea !== "string" || idea.trim().length === 0) {
    return NextResponse.json({ error: "Idea is required." }, { status: 400 });
  }

  // Auth required for AI generation
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to generate posts." },
      { status: 401 }
    );
  }

  const platformsToGenerate = platform
    ? [platform as string]
    : ["linkedin", "instagram", "x", "reddit"];

  try {
    const results = await Promise.all(
      platformsToGenerate.map(async (p) => {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY!,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-opus-4-5",
            max_tokens: 1024,
            system: `You are an expert social media copywriter who creates platform-native content.
You deeply understand each platform's culture, format, tone, and audience.
You never copy-paste across platforms — each post is uniquely crafted.
Tone preference for this request: ${tone}.
Goal for this request: ${goal}.
Write ONLY the post content. No explanations, no labels, no preamble.`,
            messages: [
              {
                role: "user",
                content: `${PLATFORM_PROMPTS[p]}\n\nIdea to base the post on:\n"${idea.trim()}"`,
              },
            ],
          }),
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`Claude error for ${p}: ${response.status} ${err}`);
        }

        const data = await response.json();
        const text = data.content?.[0]?.text?.trim() ?? "";
        return [p, text] as [string, string];
      })
    );

    return NextResponse.json({ posts: Object.fromEntries(results) });
  } catch (err) {
    console.error("[generate] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate posts. Please try again." },
      { status: 500 }
    );
  }
}