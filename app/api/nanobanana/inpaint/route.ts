import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type InpaintBody = {
  image: string; // data URL
  mask?: string; // data URL (optional – used as a guidance image)
  prompt?: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error('Invalid data URL');
  const mime = m[1];
  const base64 = m[2];
  return { mime, buffer: Buffer.from(base64, 'base64') };
}

function extForMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  return 'png';
}

async function uploadPublicImage(dataUrl: string, prefix: string): Promise<string> {
  const { mime, buffer } = parseDataUrl(dataUrl);
  const ext = extForMime(mime);
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${prefix}/${fileName}`;

  const { error } = await supabase.storage.from('materials').upload(path, buffer, {
    contentType: mime,
    upsert: true,
  });
  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  // Public bucket URL format used elsewhere in the app.
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${base}/storage/v1/object/public/materials/${path}`;
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export async function POST(request: Request) {
  const apiKey = process.env.NANOBANANA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'NANOBANANA_API_KEY not set' }, { status: 503 });
  }

  let body: InpaintBody;
  try {
    body = (await request.json()) as InpaintBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.image) {
    return NextResponse.json({ error: 'Missing image (data URL)' }, { status: 400 });
  }

  try {
    // 1) Upload original image (public URL required by Nano Banana)
    const imageUrl = await uploadPublicImage(body.image, 'nanobanana/inpaint');

    // 2) Upload mask as a second guidance image (optional)
    const imageUrls: string[] = [imageUrl];
    if (body.mask) {
      const maskUrl = await uploadPublicImage(body.mask, 'nanobanana/masks');
      imageUrls.push(maskUrl);
    }

    // 3) Create Nano Banana task (image-to-image edit)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callBackUrl = `${appUrl.replace(/\\/$/, '')}/api/nanobanana/callback`;

    const prompt =
      body.prompt ||
      [
        'Remove the person and remove all text.',
        'Use a seamless natural background fill where anything was removed.',
        'No letters, no watermark, no artifacts.',
        body.mask ? 'The second image is a mask: white = remove+fill, black = keep.' : '',
      ]
        .filter(Boolean)
        .join(' ');

    const createRes = await fetch('https://api.nanobananaapi.ai/api/v1/nanobanana/generate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        numImages: 1,
        type: 'IMAGETOIAMGE',
        imageUrls,
        callBackUrl,
      }),
    });

    if (!createRes.ok) {
      const text = await createRes.text().catch(() => '');
      return NextResponse.json(
        { error: `Nano Banana create task failed: ${text || createRes.statusText}` },
        { status: 502 }
      );
    }

    const createJson = (await createRes.json()) as { code?: number; msg?: string; data?: { taskId?: string } };
    const taskId = createJson?.data?.taskId;
    if (!taskId) {
      return NextResponse.json({ error: 'Nano Banana did not return taskId' }, { status: 502 });
    }

    // 4) Poll Nano Banana until finished (keeps client simple for extraction)
    const pollUrl = new URL('https://api.nanobananaapi.ai/api/v1/nanobanana/record-info');
    pollUrl.searchParams.set('taskId', taskId);

    const maxMs = 60_000;
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      const statusRes = await fetch(pollUrl.toString(), {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!statusRes.ok) {
        const text = await statusRes.text().catch(() => '');
        return NextResponse.json(
          { error: `Nano Banana status failed: ${text || statusRes.statusText}`, taskId },
          { status: 502 }
        );
      }
      const statusJson = (await statusRes.json()) as any;
      const successFlag = statusJson?.data?.successFlag;
      if (successFlag === 1) {
        const resultUrl = statusJson?.data?.response?.resultImageUrl;
        if (!resultUrl) {
          return NextResponse.json({ error: 'Nano Banana success but no resultImageUrl', taskId }, { status: 502 });
        }

        // Fetch result and return as data URL for the canvas
        const imgRes = await fetch(resultUrl);
        if (!imgRes.ok) {
          return NextResponse.json({ error: 'Failed to fetch Nano Banana result image', taskId }, { status: 502 });
        }
        const blob = await imgRes.blob();
        const arr = await blob.arrayBuffer();
        const base64 = Buffer.from(arr).toString('base64');
        const mime = blob.type || 'image/png';
        return NextResponse.json({ image: `data:${mime};base64,${base64}` });
      }
      if (successFlag === 2 || successFlag === 3) {
        return NextResponse.json(
          {
            error: statusJson?.data?.errorMessage || 'Nano Banana generation failed',
            taskId,
          },
          { status: 502 }
        );
      }

      await sleep(2000);
    }

    // Timeout: return taskId so caller could poll later if needed
    return NextResponse.json({ error: 'Timed out waiting for Nano Banana', taskId }, { status: 202 });
  } catch (e) {
    console.error('Nano Banana inpaint error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Nano Banana inpaint failed' },
      { status: 500 }
    );
  }
}

