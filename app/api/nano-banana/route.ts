import { NextRequest, NextResponse } from 'next/server';

// Nano Banana = Gemini for extraction + local chroma key to remove solid backgrounds

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, operation, prompt, bbox } = await request.json();

    if (operation === 'extract_object') {
      // Step 1: Ask Gemini to isolate the object on solid white background
      console.log(`🍌 Gemini: Extract "${prompt}" on solid background...`);

      const extractPrompt = `Extract only ${prompt} from this image. Place ${prompt} on a SOLID WHITE BACKGROUND (#FFFFFF). Remove all other elements completely. Keep the ${prompt} centered and at full size. Make the background pure white everywhere except where ${prompt} is.`;

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/gemini/inpaint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageBase64,
          prompt: extractPrompt,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gemini extraction failed');
      }

      const data = await response.json();
      console.log('✓ Object extracted with Gemini (solid white background)');

      // Step 2: Return the image - client will remove white background locally
      return NextResponse.json({
        success: true,
        image: data.image,
        removeWhiteBackground: true, // Signal to client to remove white
      });

    } else if (operation === 'clean_background') {
      // Remove objects and text, fill background cleanly
      console.log(`🍌 Gemini Nano Banana: Clean background`);

      const bgPrompt = `Remove all text and objects from this image. Fill the removed areas with seamless continuation of the surrounding background. Match the background style, colors, gradients, and patterns exactly. Keep everything natural and photorealistic. Do NOT add any new text, watermarks, or objects. Only clean background with removed elements filled in naturally.`;

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/gemini/inpaint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageBase64,
          prompt: bgPrompt,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gemini inpaint failed');
      }

      const data = await response.json();
      console.log('✓ Background cleaned with Gemini');

      return NextResponse.json({
        success: true,
        image: data.image,
      });
    }

    return NextResponse.json(
      { error: 'Invalid operation' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Gemini (Nano Banana) error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process with Gemini' },
      { status: 500 }
    );
  }
}
