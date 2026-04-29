import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";

const PLATFORM_PROMPTS: Record<string, string> = {
  linkedin: `Write a LinkedIn post. Professional but human. 150-300 words. Hook, story/insight, and CTA. 3-5 hashtags.`,
  instagram: `Write an Instagram caption. Conversational and energetic. 80-150 words. Emojis and 8-12 hashtags.`,
  x: `Write a post for X (Twitter). Max 280 characters. Sharp and punchy.`,
  reddit: `Write a Reddit post. Authentic, community-focused. Title first, then body. No hashtags.`,
};

// Initialize the client outside the handler
const ai = new GoogleGenAI({ 
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY 
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      idea, 
      tone = "Professional", 
      goal = "Build audience", 
      platforms = [], 
      customInstructions = "" 
    } = body;

    if (!idea?.trim()) {
      return NextResponse.json({ error: "Idea is required." }, { status: 400 });
    }

    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    // Limit to 3 platforms
    const platformsToGenerate = Array.isArray(platforms) && platforms.length > 0 
      ? platforms.slice(0, 3) 
      : ["linkedin", "instagram", "x"];

    const results: [string, string][] = [];

    // Loop through platforms
    for (const p of platformsToGenerate) {
      const platformPrompt = PLATFORM_PROMPTS[p] || "Write a social media post.";
      
      const response = await ai.models.generateContent({
        // This is the most reliable model string for the v1/v1beta API
        model: "gemini-2.0-flash", 
        contents: `Base the post on this idea: "${idea.trim()}". ${platformPrompt}`,
        config: {
          systemInstruction: `You are an expert social media copywriter. Tone: ${tone}. Goal: ${goal}. Instructions: ${customInstructions}. Write ONLY the content.`,
        },
      });

      const generatedText = response.text || "Generation failed.";
      results.push([p, generatedText.trim()]);

      // Delay to prevent 429 Rate Limit
      if (platformsToGenerate.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }

    return NextResponse.json({ posts: Object.fromEntries(results) });

  } catch (err: any) {
    console.error("[generate] API Error:", err);
    
    // Check for specific error status
    const status = err?.status || 500;
    const errorMessage = err?.message || "Failed to generate posts.";

    return NextResponse.json(
      { error: errorMessage }, 
      { status: status }
    );
  }
}