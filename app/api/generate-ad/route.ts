import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Helper function to fetch an image and convert it to base64
async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  try {
    console.log(`📥 Fetching image: ${imageUrl}`);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    console.log(`✅ Image fetched successfully (${base64.length} chars)`);
    return base64;
  } catch (error) {
    console.error(`❌ Error fetching image from ${imageUrl}:`, error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { referenceAds, brandInfo } = await request.json();

    console.log("🚀 Starting ad generation...");
    console.log(`📊 Reference ads: ${referenceAds?.length || 0}`);
    console.log(`🏢 Brand: ${brandInfo?.brandName}`);

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    if (!referenceAds || referenceAds.length === 0) {
      return NextResponse.json(
        { error: "No reference ads provided" },
        { status: 400 }
      );
    }

    // Step 1: Analyze reference ads with Gemini Vision (Text + Images)
    console.log("🔍 Step 1: Analyzing reference ads with Gemini Vision...");

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const visionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Build multimodal content with both text and images
    const contentParts: any[] = [
      { text: `Analyze these Facebook ads and extract visual design patterns:\n\nBrand Information:\n- Brand: ${brandInfo.brandName}\n- Industry: ${brandInfo.industry}\n- Product: ${brandInfo.productName}\n- Target Audience: ${brandInfo.targetAudience}\n- Key Message: ${brandInfo.keyMessage}\n- CTA: ${brandInfo.cta}\n- Brand Colors: ${brandInfo.colors}\n\nReference Ads to analyze:\n` }
    ];

    // Add each reference ad with its image for VISUAL analysis
    for (let i = 0; i < Math.min(referenceAds.length, 5); i++) {
      const ad = referenceAds[i];

      contentParts.push({
        text: `\n### Reference Ad ${i + 1}:\n- Title: ${ad.title}\n- Description: ${ad.description || "N/A"}\n- CTA: ${ad.cta || "N/A"}\n`
      });

      // IMPORTANT: Include the actual ad IMAGE for visual analysis
      if (ad.image) {
        try {
          console.log(`📸 Including reference ad ${i + 1} image for visual analysis`);
          const imageBase64 = await fetchImageAsBase64(ad.image);
          contentParts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64
            }
          });
        } catch (error) {
          console.error(`⚠️ Failed to fetch image for ad ${i + 1}:`, error);
        }
      }
    }

    contentParts.push({
      text: `\n\n## Task:
Based on the VISUAL design of these reference ad images (colors, layout, typography, imagery style), provide a JSON response with:

1. **design_style**: Overall visual style you observe (e.g., "modern minimalist", "vibrant and energetic", "professional corporate", "bold and dramatic")
2. **color_scheme**: Array of 3-5 hex color codes extracted from the reference images
3. **layout_approach**: Description of the layout structure observed
4. **headline**: Catchy headline for the new ad (based on brand info)
5. **subheading**: Supporting text (based on brand message)
6. **cta_text**: Call-to-action text
7. **image_prompt**: Detailed, descriptive prompt for generating a NEW background image that matches the visual style, mood, and aesthetic of the reference ads. Include specific details about colors, lighting, composition, and subject matter.

Return ONLY valid JSON, no markdown code blocks.`
    });

    const analysisResult = await visionModel.generateContent(contentParts);
    const analysisText = analysisResult.response.text();
    console.log("📄 Analysis response:", analysisText.substring(0, 200) + "...");

    // Parse JSON from response
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(analysisText);
      console.log("✅ Analysis parsed successfully");
    } catch (e) {
      console.error("❌ Failed to parse analysis:", e);
      return NextResponse.json(
        { error: "Failed to parse AI analysis response" },
        { status: 500 }
      );
    }

    // Step 2: Generate image with Imagen
    console.log("\n🎨 Step 2: Generating image with Imagen...");
    const imagePrompt = analysis.image_prompt ||
      `Professional Facebook ad background for ${brandInfo.brandName} - ${brandInfo.productName}.
       Style: ${analysis.design_style}.
       Colors: ${analysis.color_scheme?.join(', ')}.
       Clean, modern, eye-catching design suitable for ${brandInfo.targetAudience}.`;

    console.log("📝 Image prompt:", imagePrompt);

    const imageUrl = await generateImageWithImagen(imagePrompt);

    if (!imageUrl) {
      console.error("❌ Image generation failed!");
      return NextResponse.json(
        { error: "Image generation failed. Please try again." },
        { status: 500 }
      );
    }

    console.log("✅ Image generated successfully!");

    // Step 3: Create Fabric.js template
    console.log("\n📐 Step 3: Creating Fabric.js template...");
    const template = {
      version: "5.3.0",
      objects: [
        // Background color
        {
          type: "rect",
          left: 0,
          top: 0,
          width: 1200,
          height: 628,
          fill: analysis.color_scheme?.[0] || "#1a1a2e",
          selectable: false,
        },
        // Background Image
        {
          type: "image",
          left: 0,
          top: 0,
          width: 1200,
          height: 628,
          src: imageUrl,
          selectable: true,
        },
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

    console.log("✅ Template created successfully!");

    // Step 4: Save to database automatically
    console.log("\n💾 Step 4: Saving to database...");
    let generatedAdId = null;

    try {
      const { ConvexHttpClient } = await import("convex/browser");
      const { api } = await import("@/convex/_generated/api");
      const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

      if (CONVEX_URL) {
        const convex = new ConvexHttpClient(CONVEX_URL);
        generatedAdId = await convex.mutation(api.ads.saveGeneratedAd, {
          name: `${brandInfo.brandName} - ${brandInfo.productName}`,
          json: template,
          imageUrl: imageUrl,
          brandInfo: brandInfo,
          referenceAdIds: [], // We'll handle this differently since we're not tracking scraped ads
          analysis: analysis,
          userId: undefined,
        });
        console.log("✅ Ad saved to database with ID:", generatedAdId);
      } else {
        console.log("⚠️ No CONVEX_URL - skipping database save");
      }
    } catch (saveError) {
      console.error("❌ Failed to save to database:", saveError);
      // Continue anyway - we still want to show the preview
    }

    console.log("\n🎉 Ad generation complete!\n");

    return NextResponse.json({
      success: true,
      template,
      analysis,
      imageUrl,
      generatedAdId,
      message: "Ad generated and saved successfully!"
    });

  } catch (error) {
    console.error("\n❌ ERROR in ad generation:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate ad",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Compress base64 image to reduce size
async function compressBase64Image(base64Data: string, maxSizeKB: number = 800): Promise<string> {
  try {
    const sharp = (await import('sharp')).default;

    console.log(`🗜️ Compressing image... Original size: ${(base64Data.length / 1024).toFixed(2)} KB`);

    // Extract the base64 string without the data URL prefix
    const base64Only = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Only, 'base64');
    const originalSizeKB = buffer.length / 1024;

    console.log(`📊 Original buffer size: ${originalSizeKB.toFixed(2)} KB`);

    // If already small enough, return as is
    if (originalSizeKB <= maxSizeKB) {
      console.log(`✅ Image already small enough (${originalSizeKB.toFixed(2)} KB)`);
      return base64Data;
    }

    // Calculate compression quality needed (sharp uses 1-100 scale)
    const targetQuality = Math.max(60, Math.min(85, Math.round((maxSizeKB / originalSizeKB) * 90)));
    console.log(`🎯 Target quality: ${targetQuality}%`);

    // Compress using sharp - convert to JPEG with quality compression
    const compressedBuffer = await sharp(buffer)
      .jpeg({ quality: targetQuality, mozjpeg: true })
      .toBuffer();

    const compressedSizeKB = compressedBuffer.length / 1024;

    console.log(`✅ Compressed to ${compressedSizeKB.toFixed(2)} KB (${((1 - compressedSizeKB/originalSizeKB) * 100).toFixed(1)}% reduction)`);

    // If still too large, resize the image
    if (compressedSizeKB > maxSizeKB) {
      console.log(`⚠️ Still too large, resizing image...`);
      const resizeScale = Math.sqrt(maxSizeKB / compressedSizeKB) * 0.9;
      const metadata = await sharp(buffer).metadata();
      const newWidth = Math.round((metadata.width || 1200) * resizeScale);

      const resizedBuffer = await sharp(buffer)
        .resize({ width: newWidth, withoutEnlargement: true })
        .jpeg({ quality: targetQuality, mozjpeg: true })
        .toBuffer();

      const finalSizeKB = resizedBuffer.length / 1024;
      console.log(`✅ Resized and compressed to ${finalSizeKB.toFixed(2)} KB`);

      return `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
    }

    return `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
  } catch (error) {
    console.error('⚠️ Compression failed, using original:', error);
    return base64Data;
  }
}

// Generate image using Imagen 3 (Gemini Native Image Generation)
async function generateImageWithImagen(prompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    console.log("❌ No Gemini API key, skipping image generation");
    return null;
  }

  console.log("🎨 Calling Imagen API...");

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Use gemini-2.5-flash-image for fast, efficient image generation
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: "16:9", // Facebook ad format
        },
      },
    });

    console.log("✅ Imagen API response received");

    // Extract base64 image from response
    const parts = response.candidates?.[0]?.content?.parts;

    if (parts && parts.length > 0) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || "image/png";
          console.log(`🖼️ Image generated! Size: ${imageData.length} chars, MIME: ${mimeType}`);

          // Create data URL
          const dataUrl = `data:${mimeType};base64,${imageData}`;

          // Compress the image before returning
          const compressedUrl = await compressBase64Image(dataUrl, 800);

          return compressedUrl;
        }
      }
    }

    console.log("❌ No image data in API response");
    console.log("Response structure:", JSON.stringify(response, null, 2));
    return null;

  } catch (error) {
    console.error("❌ Imagen API Error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    return null;
  }
}
