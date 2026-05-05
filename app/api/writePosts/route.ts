import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PLATFORM_INSTRUCTIONS: Record<string, string> = {
  linkedin: `Write a LinkedIn post. Professional yet human tone. 150-300 words. 
    Include a hook first line, insight or story, and end with a question or CTA. 
    No hashtags in the body — add 3-5 relevant hashtags at the end on a new line.`,

 /* instagram: `Write an Instagram caption. Conversational, energetic, relatable. 
    80-150 words. Start with an attention-grabbing first line. 
    Use 2-4 relevant emojis naturally throughout. 
    End with a question or CTA. Add 8-12 hashtags on a new line at the end.`,
*/
  x: `Write a tweet (X post). Maximum 280 characters. 
    Sharp, punchy, opinionated or insightful. 
    No hashtags unless essential. No filler words. 
    Make every word count. Can use a thread format (1/ 2/ etc.) if the idea needs more space.`,
 facebook: `Write a Facebook post. Professional yet human tone. 150-300 words. 
    Include a hook first line, insight or story, and end with a question or CTA. 
    No hashtags in the body — add 3-5 relevant hashtags at the end on a new line.`,
  /*reddit: `Write a Reddit post. Authentic, community-focused, no marketing speak. 
    150-250 words. Sound like a real person sharing something genuinely interesting. 
    Include relevant context, be specific, and invite discussion. 
    Do NOT use hashtags. Do NOT use emojis excessively. Title on first line, body below.`,
*/
};

export async function POST(request: Request) {
  const { idea, tone, goal, platform } = await request.json();

  if (!idea || typeof idea !== "string" || idea.trim().length === 0) {
    return NextResponse.json({ error: "Idea is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to generate posts." }, { status: 401 });
  }

  const platformsToGenerate = platform
    ? [platform]
    : ["linkedin", "x", "facebook"];

  try {
    const results = await Promise.all(
      platformsToGenerate.map(async (p) => {
        const systemPrompt = `You are an expert social media copywriter who creates 
          platform-native content. You understand each platform's culture, format, and audience deeply.
          Always write content that feels native to the platform — never copy-paste.
          Tone preference: ${tone}. Goal: ${goal}.`;

        const userPrompt = `${PLATFORM_INSTRUCTIONS[p]}
          
          Here is the idea/content to base the post on:
          "${idea}"
          
          Write ONLY the post content. No explanations, no labels, no preamble.`;

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY || "", // No hardcoded key here!
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-latest", // Updated to a valid model name
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error(" API detailed error:", errorData);
          throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.content?.[0]?.text?.trim() ?? "";
        return [p, text] as [string, string];
      })
    );

    const posts = Object.fromEntries(results);
    return NextResponse.json({ posts }, { status: 200 });

  } catch (err) {
    console.error("[generate] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate posts. Please try again." },
      { status: 500 }
    );
  }
}