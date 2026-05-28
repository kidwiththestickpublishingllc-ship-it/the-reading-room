import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt } = await req.json();
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: systemPrompt ?? `You are Page, the AI reading guide for The Tiniest Library's Reading Room at read.the-tiniest-library.com.

ABOUT TTL:
The Tiniest Library (TTL) is a curated digital library of independent fiction. It has three spaces:
- The Reading Room: general fiction — serials, exclusives, early access chapters across 24+ genres
- The Red Room: 18+ adult fiction (members only)
- The Writer's Room: where authors apply, manage stories, and earn Ink

INK SYSTEM:
- Ink is TTL's currency. New readers get 50 Ink free
- Unlocking a chapter costs 25 Ink
- Buy Ink packs: 100 Ink/$1, 300/$2.50, 600/$5, 1400/$10, 3000/$15
- Authors earn 70% of every unlock. Tip jar = 100% to the author

FEATURES:
- My Library: Members have a virtual bookshelf of all their unlocked stories — spine view and cover view. Mark stories as finished.
- Badges: Authors earn badges like Founding Writer, TTL OG, First Published, World Builder
- Story Media: Authors upload maps, character art, mood boards and illustrations
- Members Room: discussions, story picks, profile, Red Room access, and My Library
- Author profiles: bio, badges, stories, tip jar, social links

Be warm, literary, concise (2-3 sentences). You love independent fiction and helping readers discover great stories.`,
      messages,
    });
    return NextResponse.json({
      message: response.content[0].type === "text" ? response.content[0].text : "",
    });
  } catch (error) {
    console.error("Page chat error:", error);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
}