
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Groq from "groq-sdk";

const PLATFORM_PROMPTS: Record<string, string> = {
  linkedin: `Write a LinkedIn post. Professional but human. 150-300 words.
Start with a compelling hook. Include a story, insight, or lesson.
End with a question or call to action.
Add 3-5 relevant hashtags on a new line at the end. No hashtags in the main body.`,

  x: `Write a post for X (Twitter). Maximum 280 characters total.
Sharp, punchy, opinionated or insightful. No filler words. Make every word count.`,
  
  facebook: `Write a Facebook post. Professional but human and engaging. 150-300 words.
Start with a compelling hook. Include a story, insight, or lesson.
End with a question or call to action.
Add 3-5 relevant hashtags on a new line at the end. No hashtags in the main body.`,
};

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "Add GROQ_API_KEY to .env.local and restart." },
      { status: 500 }
    );
  }

  try {
    const {
      idea,
      tone = "Professional",
      goal = "Build audience",
      platforms = [],
      customInstructions = "",
    } = await request.json();

    if (!idea?.trim()) {
      return NextResponse.json({ error: "Idea is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to generate posts." }, { status: 401 });
    }

    const platformsToGenerate: string[] =
      Array.isArray(platforms) && platforms.length > 0
        ? platforms 
        : ["linkedin", "facebook", "x"];

    const results = await Promise.all(
      platformsToGenerate.map(async (platform) => {
      
        const key = platform.toLowerCase() === 'twitter' ? 'x' : platform.toLowerCase();
        const platformPrompt = PLATFORM_PROMPTS[key] ?? "Write a social media post.";

        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are an expert social media copywriter creating platform-native content.
Tone: ${tone}. Goal: ${goal}.
${customInstructions ? `Style preference: ${customInstructions}.` : ""}
Write ONLY the post content. No labels, no "Here is your post:", no preamble.`,
            },
            {
              role: "user",
              content: `${platformPrompt}\n\nIdea: "${idea.trim()}"`,
            },
          ],
          temperature: 0.8,
          max_tokens: 1024,
        });

        const text = completion.choices[0]?.message?.content?.trim() ?? "";
        return [platform, text] as [string, string];
      })
    );

    return NextResponse.json({ posts: Object.fromEntries(results) });

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[generate] Groq error:", errorMsg);

    if (errorMsg.includes("429") || errorMsg.includes("rate_limit")) {
      return NextResponse.json(
        { error: "Rate limit hit — Wait a moment and try again." },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: "Generation failed. Please try again." },
      { status: 500 }
    );
  }
}