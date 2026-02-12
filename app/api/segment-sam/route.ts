import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

/**
 * SAM (Segment Anything Model) - Precise Object Segmentation
 * Takes image + bounding box, returns pixel-perfect mask
 */
export async function POST(request: NextRequest) {
  try {
    const replicateToken = process.env.REPLICATE_API_TOKEN;

    if (!replicateToken) {
      return NextResponse.json(
        { error: 'Replicate API token not configured. Add REPLICATE_API_TOKEN to .env' },
        { status: 500 }
      );
    }

    const { imageUrl, bbox } = await request.json();

    if (!imageUrl || !bbox) {
      return NextResponse.json(
        { error: 'imageUrl and bbox are required. bbox format: [x, y, width, height]' },
        { status: 400 }
      );
    }

    const [x, y, width, height] = bbox;

    console.log(`Calling SAM for object at bbox: [${x}, ${y}, ${width}, ${height}]`);

    const replicate = new Replicate({
      auth: replicateToken,
    });

    // Using SAM model on Replicate
    const output = await replicate.run(
      'facebookresearch/segment-anything:4c4b85c1c4f9b90e1f5b5f9e5e5e5e5e',
      {
        input: {
          image: imageUrl,
          // Convert bbox to box prompt format: "x1,y1,x2,y2"
          box: `${x},${y},${x + width},${y + height}`,
        },
      }
    ) as any;

    console.log('SAM segmentation complete');

    // SAM returns mask as image URL
    return NextResponse.json({
      maskUrl: output,
      bbox,
    });
  } catch (error: any) {
    console.error('SAM API error:', error);
    return NextResponse.json(
      { error: 'Failed to segment object', details: error.message },
      { status: 500 }
    );
  }
}
