import { NextRequest, NextResponse } from 'next/server';

/**
 * Google Cloud Vision API - Text Detection
 * Detects text in images with exact bounding boxes
 * Better than Tesseract for complex layouts
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Cloud Vision API key not configured. Add GOOGLE_CLOUD_VISION_API_KEY to .env' },
        { status: 500 }
      );
    }

    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'imageBase64 is required' },
        { status: 400 }
      );
    }

    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    console.log('Calling Google Vision API for text detection...');

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Data,
              },
              features: [
                {
                  type: 'TEXT_DETECTION', // Detects all text with bounding boxes
                  maxResults: 50,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Vision API error:', errorData);
      return NextResponse.json(
        { error: 'Vision API request failed', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Vision API response received');

    // Parse response into our format
    const textAnnotations = data.responses[0]?.textAnnotations || [];

    if (textAnnotations.length === 0) {
      console.log('No text detected by Vision API');
      return NextResponse.json({ texts: [] });
    }

    // First annotation is the full text, skip it
    // Rest are individual words/blocks
    const detectedTexts = textAnnotations.slice(1).map((annotation: any) => {
      const vertices = annotation.boundingPoly.vertices;

      // Calculate bounding box from vertices
      const x = Math.min(...vertices.map((v: any) => v.x || 0));
      const y = Math.min(...vertices.map((v: any) => v.y || 0));
      const x1 = Math.max(...vertices.map((v: any) => v.x || 0));
      const y1 = Math.max(...vertices.map((v: any) => v.y || 0));
      const width = x1 - x;
      const height = y1 - y;

      return {
        text: annotation.description,
        x,
        y,
        width,
        height,
        confidence: 95, // Vision API doesn't provide confidence, but it's very accurate
        fontSize: height, // Use height as fontSize approximation
        fontFamily: 'Arial', // Default, user can change
        color: '#000000', // Will be sampled from image on frontend
      };
    });

    console.log(`✓ Detected ${detectedTexts.length} text elements via Vision API`);

    return NextResponse.json({
      texts: detectedTexts,
      fullText: textAnnotations[0]?.description || '', // Full detected text
    });
  } catch (error: any) {
    console.error('Vision API error:', error);
    return NextResponse.json(
      { error: 'Failed to detect text', details: error.message },
      { status: 500 }
    );
  }
}
