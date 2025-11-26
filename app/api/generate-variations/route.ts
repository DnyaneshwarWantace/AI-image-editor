import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const { prompt, count } = await request.json();

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    console.log("🤖 Generating text variations with Gemini...");
    console.log("📝 Prompt:", prompt.substring(0, 100) + "...");

    // Generate variations
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log("✅ Gemini response received");
    console.log("📄 Response:", responseText.substring(0, 200) + "...");

    // Parse variations from numbered list
    const variations = parseVariationsFromResponse(responseText, count);

    if (variations.length === 0) {
      console.log("⚠️ No variations parsed, returning raw response");
      return NextResponse.json({
        variations: [responseText],
        rawResponse: responseText,
      });
    }

    return NextResponse.json({
      variations,
      rawResponse: responseText,
    });
  } catch (error) {
    console.error("❌ Error generating variations:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate variations",
      },
      { status: 500 }
    );
  }
}

/**
 * Parse variations from AI response
 * Expects numbered list format like:
 * 1. First variation
 * 2. Second variation
 * etc.
 */
function parseVariationsFromResponse(text: string, expectedCount: number): string[] {
  const variations: string[] = [];

  // Split by lines
  const lines = text.split("\n").filter((line) => line.trim());

  // Try to match numbered list patterns
  const numberedPattern = /^\s*\d+[\.\)]\s*(.+)$/;

  for (const line of lines) {
    const match = line.match(numberedPattern);
    if (match && match[1]) {
      let variation = match[1].trim();
      // Remove quotes if present
      variation = variation.replace(/^["'](.+)["']$/, "$1");
      variations.push(variation);
    }
  }

  // If no numbered list found, try splitting by common delimiters
  if (variations.length === 0) {
    const bulletPattern = /^\s*[-•*]\s*(.+)$/;
    for (const line of lines) {
      const match = line.match(bulletPattern);
      if (match && match[1]) {
        let variation = match[1].trim();
        variation = variation.replace(/^["'](.+)["']$/, "$1");
        variations.push(variation);
      }
    }
  }

  // Limit to expected count
  return variations.slice(0, expectedCount);
}
