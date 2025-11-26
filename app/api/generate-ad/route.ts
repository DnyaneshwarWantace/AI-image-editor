import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI } from "@google/genai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

export async function POST(request: NextRequest) {
  try {
    const { referenceAds, brandInfo, referenceAdIds, userId } = await request.json();

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Step 1: Analyze reference ads with Gemini (including images)
    console.log("🔍 Analyzing reference ads with Gemini Vision...");

    // Build multimodal content with both text and images
    const contentParts: any[] = [
      { text: `Analyze these Facebook ads and extract design patterns:\n\nBrand Information:\n- Brand: ${brandInfo.brandName}\n- Industry: ${brandInfo.industry}\n- Product: ${brandInfo.productName}\n- Target: ${brandInfo.targetAudience}\n- Message: ${brandInfo.keyMessage}\n- CTA: ${brandInfo.cta}\n- Colors: ${brandInfo.colors}\n\nReference Ads:\n` }
    ];

    // Add each reference ad with its image
    for (let i = 0; i < referenceAds.length; i++) {
      const ad = referenceAds[i];
      contentParts.push({
        text: `\nAd ${i + 1}:\n- Title: ${ad.title}\n- Description: ${ad.description}\n- CTA: ${ad.cta}\n`
      });

      // Add the ad image for visual analysis
      if (ad.image) {
        console.log(`📸 Including reference ad ${i + 1} image in analysis`);
        contentParts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: await fetchImageAsBase64(ad.image)
          }
        });
      }
    }

    contentParts.push({
      text: `\n\nBased on the visual design of these reference ads, provide a JSON response with:\n1. design_style: Overall visual style (e.g., "modern", "minimal", "bold")\n2. color_scheme: Recommended colors based on brand and references\n3. layout: Suggested layout structure\n4. headline: Catchy headline for the ad\n5. subheading: Supporting text\n6. cta_text: Call-to-action text\n7. image_prompt: Detailed prompt for Imagen 3 to generate background image that matches the visual style of the reference ads\n\nReturn ONLY valid JSON, no markdown formatting.`
    });

    const analysisResult = await model.generateContent(contentParts);
    const analysisText = analysisResult.response.text();

    // Parse JSON from response (handle markdown code blocks if present)
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(analysisText);
    } catch (e) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Step 2: Generate image with Imagen
    console.log("🔄 Generating image with Imagen...");
    const imageUrl = await generateImageWithImagen(analysis.image_prompt ||
      `Professional Facebook ad background for ${brandInfo.brandName} - ${brandInfo.productName}. Style: ${analysis.design_style}. Colors: ${analysis.color_scheme?.join(', ')}. Clean, modern, eye-catching design.`);
    console.log("🖼️ Image generation result:", imageUrl ? `Success (${imageUrl.substring(0, 50)}...)` : "Failed (null)");

    // Step 3: Create Fabric.js template
    const template = {
      version: "5.3.0",
      objects: [
        // Background
        {
          type: "rect",
          left: 0,
          top: 0,
          width: 1200,
          height: 628,
          fill: analysis.color_scheme?.[0] || "#1a1a2e",
          selectable: false,
        },
        // Background Image (if generated)
        ...(imageUrl ? [{
          type: "image",
          left: 0,
          top: 0,
          width: 1200,
          height: 628,
          src: imageUrl,
          selectable: true,
        }] : []),
        // Headline
        {
          type: "textbox",
          left: 100,
          top: 150,
          width: 1000,
          fontSize: 72,
          fontWeight: "bold",
          fontFamily: "Arial",
          fill: "#ffffff",
          text: analysis.headline || brandInfo.productName,
          textAlign: "left",
          selectable: true,
          editable: true,
        },
        // Subheading
        {
          type: "textbox",
          left: 100,
          top: 280,
          width: 800,
          fontSize: 32,
          fontFamily: "Arial",
          fill: "#e0e0e0",
          text: analysis.subheading || brandInfo.keyMessage || "Your message here",
          textAlign: "left",
          selectable: true,
          editable: true,
        },
        // CTA Button Background
        {
          type: "rect",
          left: 100,
          top: 480,
          width: 250,
          height: 70,
          fill: analysis.color_scheme?.[1] || "#ff6b6b",
          rx: 10,
          ry: 10,
          selectable: true,
        },
        // CTA Button Text
        {
          type: "text",
          left: 175,
          top: 500,
          fontSize: 28,
          fontWeight: "bold",
          fontFamily: "Arial",
          fill: "#ffffff",
          text: analysis.cta_text || brandInfo.cta || "Shop Now",
          originX: "center",
          selectable: true,
          editable: true,
        },
        // Brand Name
        {
          type: "text",
          left: 100,
          top: 50,
          fontSize: 24,
          fontFamily: "Arial",
          fill: "#ffffff",
          text: brandInfo.brandName,
          selectable: true,
          editable: true,
        },
      ],
    };

    // Save generated ad to Convex database
    let generatedAdId = null;
    if (CONVEX_URL && referenceAdIds && referenceAdIds.length > 0) {
      try {
        console.log("💾 Saving generated ad to database...");
        console.log("🖼️ imageUrl being saved:", imageUrl ? `${imageUrl.substring(0, 50)}...` : "undefined");
        const convex = new ConvexHttpClient(CONVEX_URL);
        generatedAdId = await convex.mutation(api.ads.saveGeneratedAd, {
          name: `${brandInfo.brandName} - ${brandInfo.productName}`,
          json: template,
          imageUrl: imageUrl || undefined, // Save the generated image URL
          brandInfo: brandInfo,
          referenceAdIds: referenceAdIds,
          analysis: analysis,
          userId: userId,
        });
        console.log("✅ Ad saved successfully with ID:", generatedAdId);
      } catch (saveError) {
        console.error("❌ Error saving generated ad to database:", saveError);
        // Continue even if save fails
      }
    } else {
      console.log("⚠️ Skipping database save - missing CONVEX_URL or referenceAdIds");
    }

    return NextResponse.json({
      template,
      analysis,
      generatedAdId,
      message: "Ad generated successfully"
    });
  } catch (error) {
    console.error("Error generating ad:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate ad" },
      { status: 500 }
    );
  }
}

// Generate image using Imagen (Gemini 2.5 Flash Image)
async function generateImageWithImagen(prompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    console.log("❌ No Gemini API key, skipping image generation");
    return null;
  }

  console.log("🎨 Starting image generation with Imagen...");
  console.log("📝 Prompt:", prompt);

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    console.log("📡 Calling Imagen API...");
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: prompt,
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: "16:9", // Facebook ad format
          imageSize: "1K", // 1024px resolution
        },
      },
    });

    console.log("✅ Imagen API response received");
    console.log("📦 Response structure:", JSON.stringify(response, null, 2));

    // Extract base64 image from response
    const parts = response.candidates?.[0]?.content?.parts;
    console.log("🔍 Parts found:", parts?.length || 0);

    if (parts && parts.length > 0) {
      for (const part of parts) {
        console.log("🧩 Checking part:", Object.keys(part));
        if (part.inlineData && part.inlineData.data) {
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || "image/png";
          console.log("🖼️ Image data found! Size:", imageData.length, "MIME:", mimeType);
          // Return as data URL for browser display
          return `data:${mimeType};base64,${imageData}`;
        }
      }
    }

    console.log("❌ No image data in response");
    console.log("Full response:", JSON.stringify(response, null, 2));
    return null;
  } catch (error) {
    console.error("❌ Error generating image with Imagen:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return null;
  }
}
