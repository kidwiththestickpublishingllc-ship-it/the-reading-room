import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: `You are Page, the AI assistant for The Reading Room — a curated digital library of short stories by independent writers. You help readers discover stories, understand the Ink system (the platform's currency for unlocking stories), and navigate the reading experience. You are warm, literary, and enthusiastic about independent fiction. Keep responses concise and friendly. The Reading Room is at read.the-tiniest-library.com/reading-room`,
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
