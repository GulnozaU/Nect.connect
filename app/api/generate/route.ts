
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Groq from "groq-sdk";
import { formatLinkedInPost } from "@/lib/format-linkedin-post";

const PLATFORM_PROMPTS: Record<string, string> = {
  linkedin: `Write a LinkedIn post. Professional but human. 150-300 words.
FORMAT (critical — mobile feed readability): Do NOT write one dense paragraph. Use short lines: one sentence or one short thought per line, with a blank line between ideas (double newline). Hooks and punchy lines can stand alone on a single line. Optional: use a short bullet list with "• " only if it fits the idea.
Start with a compelling hook line. Build with story, insight, or lesson in short vertical blocks.
End with a question or call to action on its own lines.
Add 3-5 relevant hashtags on a new line at the very end (one line or a short block). No hashtags in the main body.`,

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
      language = "English",
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

    const lang = typeof language === "string" && language.trim() ? language.trim() : "English";

    const results = await Promise.all(
      platformsToGenerate.map(async (platform) => {
      
        const key = platform.toLowerCase() === 'twitter' ? 'x' : platform.toLowerCase();
        const platformPrompt = PLATFORM_PROMPTS[key] ?? "Write a social media post.";

        const systemLines = [
          "You are an expert social media copywriter creating platform-native content.",
          `User-selected TONE (match vocabulary, formality, warmth, and voice throughout): "${tone}".`,
          `User-selected GOAL (shape CTA, framing, and emphasis for this goal): "${goal}".`,
          `User-selected OUTPUT LANGUAGE — write the entire post in this language only, with native phrasing: "${lang}".`,
          customInstructions.trim()
            ? `User style / extra instructions (must follow): ${customInstructions.trim()}`
            : null,
          "Write ONLY the post content. No labels, no \"Here is your post:\", no preamble.",
        ].filter(Boolean) as string[];

        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: systemLines.join("\n"),
            },
            {
              role: "user",
              content: [
                `Reminder: tone="${tone}", goal="${goal}", language="${lang}".`,
                "",
                platformPrompt,
                "",
                `Idea to turn into a post:\n"${idea.trim()}"`,
              ].join("\n"),
            },
          ],
          temperature: 0.8,
          max_tokens: 1024,
        });

        let text = completion.choices[0]?.message?.content?.trim() ?? "";
        if (key === "linkedin") text = formatLinkedInPost(text);
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