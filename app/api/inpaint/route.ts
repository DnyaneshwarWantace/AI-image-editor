import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const LAMA_VERSION =
  'allenhooo/lama:cdac78a1bec5b23c07fd29692fb70baa513ea403a39e643c48ec5edadb15fe72';

/**
 * Inpainting API: accepts image + mask (data URLs or URLs), calls Replicate LaMa,
 * returns { image: dataUrl } for the inpainted image.
 * Requires REPLICATE_API_TOKEN in .env (get free credits at replicate.com).
 */
export async function POST(request: Request) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'REPLICATE_API_TOKEN not set. Add it to .env for generative fill.' },
      { status: 503 }
    );
  }

  let body: { image?: string; mask?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { image: imageInput, mask: maskInput } = body;
  if (!imageInput || !maskInput) {
    return NextResponse.json(
      { error: 'Missing image or mask (data URLs or URLs)' },
      { status: 400 }
    );
  }

  try {
    const replicate = new Replicate({ auth: token });

    const input = {
      image: imageInput,
      mask: maskInput,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const output = await replicate.run(LAMA_VERSION as any, { input });

    // SDK output: can be URL string or object with .url() (FileOutput)
    const resultUrl =
      typeof output === 'string'
        ? output
        : output && typeof (output as { url?: () => string }).url === 'function'
          ? (output as { url: () => string }).url()
          : (output as { url?: string })?.url;

    if (!resultUrl) {
      return NextResponse.json(
        { error: 'No output URL from Replicate' },
        { status: 502 }
      );
    }

    // Fetch the result image and return as data URL so the client can use it
    const imgRes = await fetch(resultUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!imgRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch result image' },
        { status: 502 }
      );
    }
    const blob = await imgRes.blob();
    const buffer = await blob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mime = blob.type || 'image/png';
    const dataUrl = `data:${mime};base64,${base64}`;

    return NextResponse.json({ image: dataUrl });
  } catch (e) {
    const err = e as unknown as {
      message?: string;
      status?: number;
      response?: { status?: number; statusText?: string; text?: () => Promise<string> };
    };

    const message = err?.message || (e instanceof Error ? e.message : 'Inpainting failed');
    const status =
      err?.status ||
      err?.response?.status ||
      (typeof message === 'string' && message.includes('status 402') ? 402 : undefined);

    // Replicate returns 402 when your account has no credit.
    if (status === 402 || (typeof message === 'string' && message.toLowerCase().includes('insufficient credit'))) {
      console.warn('Inpaint error: insufficient Replicate credit');
      return NextResponse.json(
        {
          error: 'Insufficient Replicate credit. Add credit at replicate.com/account/billing.',
        },
        { status: 402 }
      );
    }

    console.error('Inpaint error:', e);
    return NextResponse.json({ error: message || 'Inpainting failed' }, { status: 500 });
  }
}
