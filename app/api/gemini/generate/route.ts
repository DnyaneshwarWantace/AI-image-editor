import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

type Body = {
  prompt: string;
  style?: 'auto' | 'photo' | 'product' | 'illustration' | 'icon' | '3d' | 'background';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
};

function getGenAiClient(): GoogleGenAI {
  const useVertex =
    (process.env.GOOGLE_GENAI_USE_VERTEXAI || '').toLowerCase() === 'true' ||
    (process.env.GEMINI_USE_VERTEXAI || '').toLowerCase() === 'true';

  if (useVertex) {
    const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.VERTEX_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || process.env.VERTEX_LOCATION || 'us-central1';
    if (!project) {
      throw new Error(
        'Vertex AI is enabled but GOOGLE_CLOUD_PROJECT is not set. Set GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION.'
      );
    }
    return new GoogleGenAI({
      vertexai: true,
      project,
      location,
    });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY not set. Create one in Google AI Studio and add it to .env (GEMINI_API_KEY=...).'
    );
  }
  return new GoogleGenAI({ apiKey });
}

function buildBoostedPrompt(userPrompt: string, style: Body['style'], aspectRatio: Body['aspectRatio']) {
  const p = (userPrompt || '').trim();
  const safePrompt = p.length > 0 ? p : 'A beautiful abstract gradient background';

  const styleHints: Record<NonNullable<Body['style']>, string> = {
    auto: '',
    photo:
      'Photorealistic, natural lighting, high dynamic range, sharp focus, realistic textures, professional composition.',
    product:
      'Professional product photography, studio lighting, clean background, realistic shadows, crisp details, commercial look.',
    illustration:
      'High-quality illustration, clean shapes, pleasing color palette, well-defined edges, consistent style.',
    icon:
      'Simple clean icon, minimal vector style, centered composition, flat design, no background clutter.',
    '3d': '3D render, soft global illumination, realistic materials, clean composition, high detail.',
    background:
      'Seamless background texture, no main subject, no people, no text, smooth, usable as a design background.',
  };

  const baseRules = [
    'Generate a high-quality image.',
    'No watermark, no logos.',
    'Avoid gibberish text. If the user did not ask for text, do not include any text.',
    aspectRatio ? `Aspect ratio ${aspectRatio}.` : '',
    style && style !== 'auto' ? styleHints[style] : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Keep user intent first, then add booster rules.
  return `${safePrompt}\n\nRequirements: ${baseRules}`.trim();
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const boostedPrompt = buildBoostedPrompt(body?.prompt || '', body?.style || 'auto', body?.aspectRatio);

  try {
    const ai = getGenAiClient();

    const resp = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: boostedPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const partsOut = resp?.candidates?.[0]?.content?.parts || [];
    const imgPart = partsOut.find((p: any) => p?.inlineData?.data);
    const base64 = imgPart?.inlineData?.data;
    const mimeType = imgPart?.inlineData?.mimeType || 'image/png';

    if (!base64) return NextResponse.json({ error: 'Gemini returned no image' }, { status: 502 });

    return NextResponse.json({
      image: `data:${mimeType};base64,${base64}`,
      boostedPrompt,
      model: 'gemini-2.5-flash-image',
    });
  } catch (e) {
    const err = e as any;
    const message = err?.message || (e instanceof Error ? e.message : 'Gemini generate failed');
    const status = Number(err?.status || err?.code) || undefined;

    // Friendly quota message (common when the key is on free tier with 0 quota).
    if (status === 429 || (typeof message === 'string' && message.includes('RESOURCE_EXHAUSTED'))) {
      return NextResponse.json(
        {
          error:
            'Gemini quota exceeded (429). If you want to use your $300 Google Cloud credits, enable Vertex mode (GOOGLE_GENAI_USE_VERTEXAI=true) and use a GCP project with billing.',
          details: message,
        },
        { status: 429 }
      );
    }

    if (typeof message === 'string' && message.includes('GEMINI_API_KEY not set')) {
      return NextResponse.json({ error: message }, { status: 503 });
    }

    console.error('Gemini generate error:', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

