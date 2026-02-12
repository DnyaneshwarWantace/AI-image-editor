import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

type Body = {
  image: string; // data URL
  mask?: string; // data URL (optional)
  references?: string[]; // additional reference images (optional)
  prompt: string;
};

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error('Invalid data URL');
  return { mimeType: m[1], base64: m[2] };
}

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

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body?.image || !body?.prompt) {
    return NextResponse.json({ error: 'Missing image or prompt' }, { status: 400 });
  }

  try {
    const ai = getGenAiClient();
    const image = parseDataUrl(body.image);
    const parts: any[] = [
      { text: body.prompt },
      { inlineData: { mimeType: image.mimeType, data: image.base64 } },
    ];

    if (body.mask) {
      const mask = parseDataUrl(body.mask);
      // Provide mask as an additional image + explain in prompt.
      parts.push({ inlineData: { mimeType: mask.mimeType, data: mask.base64 } });
    }

    if (Array.isArray(body.references)) {
      for (const ref of body.references.slice(0, 4)) {
        if (!ref) continue;
        const r = parseDataUrl(ref);
        parts.push({ inlineData: { mimeType: r.mimeType, data: r.base64 } });
      }
    }

    const resp = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: parts,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const partsOut = resp?.candidates?.[0]?.content?.parts || [];
    const imgPart = partsOut.find((p: any) => p?.inlineData?.data);
    const base64 = imgPart?.inlineData?.data;
    const mimeType = imgPart?.inlineData?.mimeType || 'image/png';

    if (!base64) return NextResponse.json({ error: 'Gemini returned no image' }, { status: 502 });

    return NextResponse.json({ image: `data:${mimeType};base64,${base64}` });
  } catch (e) {
    const err = e as any;
    const message = err?.message || (e instanceof Error ? e.message : 'Gemini inpaint failed');
    const status = Number(err?.status || err?.code) || undefined;

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

    console.error('Gemini inpaint error:', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

