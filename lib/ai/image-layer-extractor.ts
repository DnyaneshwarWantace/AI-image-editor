"use client";

import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import Tesseract from 'tesseract.js';

export interface DetectedText {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

export interface DetectedObject {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  imageData: ImageData;
  imageWithoutBg?: string; // Base64 image with background removed (transparent)
  /** When we used a padded crop for bg removal, origin of that crop (so canvas places it correctly). */
  cropOriginX?: number;
  cropOriginY?: number;
}

export interface ProcessedLayers {
  texts: DetectedText[];
  objects: DetectedObject[];
  /** Full image with background removed (one layer at 0,0). When set, use this instead of per-object cutouts. */
  fullImageWithoutBg?: string;
  background: string; // Base64 of original image
  originalWidth: number;
  originalHeight: number;
}

export interface ExtractionAnalysis {
  originalDataUrl: string;
  originalWidth: number;
  originalHeight: number;
  objects: DetectedObject[];
  texts: DetectedText[];
}

/**
 * Preprocess image for better OCR: contrast + light binarization so text stands out.
 * Same dimensions as input so Tesseract bboxes match the original image.
 */
function preprocessImageForOcr(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;

  // Contrast stretch and darken text (helps Tesseract on posters/photos)
  const contrast = 1.4;
  const shift = 128 * (1 - contrast);
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const out = Math.max(0, Math.min(255, gray * contrast + shift));
    d[i] = d[i + 1] = d[i + 2] = out;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Fallback: detect text using OCR.space API (good for text on images/posters).
 * Uses free API; set NEXT_PUBLIC_OCR_SPACE_API_KEY for higher limits.
 */
async function detectTextWithOcrSpace(img: HTMLImageElement): Promise<DetectedText[]> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.9);

    const apiKey = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_OCR_SPACE_API_KEY
      ? process.env.NEXT_PUBLIC_OCR_SPACE_API_KEY
      : 'helloworld';

    const form = new FormData();
    form.append('base64Image', base64);
    form.append('language', 'eng');
    form.append('isOverlayRequired', 'true');
    form.append('OCREngine', '2'); // Better for text on images

    const res = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: { apikey: apiKey },
      body: form,
    });
    const json = await res.json();

    if (json.IsErroredOnProcessing || !json.ParsedResults?.[0]) {
      console.warn('OCR.space error:', json.ErrorMessage || json);
      return [];
    }

    const overlay = json.ParsedResults[0].TextOverlay;
    if (!overlay?.Lines?.length) {
      console.log('OCR.space: no overlay lines');
      return [];
    }

    const detected: DetectedText[] = [];
    for (const line of overlay.Lines) {
      const words = line.Words || [];
      if (words.length === 0) continue;
      const texts = words.map((w: { WordText?: string }) => (w.WordText || '').trim()).filter(Boolean);
      if (texts.length === 0) continue;
      const first = words[0];
      const last = words[words.length - 1];
      const x = first.Left ?? 0;
      const y = first.Top ?? 0;
      const width = (last.Left + (last.Width ?? 0)) - x;
      const height = (line.MaxHeight ?? first.Height ?? 20);
      const text = texts.join(' ');
      detected.push({
        text,
        x,
        y,
        width,
        height,
        confidence: 85,
        fontSize: height,
        fontFamily: 'Arial',
        color: '#000000',
      });
    }
    console.log(`✓ OCR.space fallback: ${detected.length} lines`);
    return detected;
  } catch (e) {
    console.warn('OCR.space fallback failed:', e);
    return [];
  }
}

/**
 * Detect text using Google Cloud Vision API (best quality)
 */
export async function detectTextWithVisionAPI(imageBase64: string): Promise<DetectedText[]> {
  try {
    console.log('📸 Calling Google Vision API for text detection...');

    const response = await fetch('/api/vision-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.warn('⚠️  Vision API not available:', error.error);
      return [];
    }

    const data = await response.json();
    console.log(`✓ Google Vision API detected ${data.texts.length} text elements`);

    return data.texts;
  } catch (error) {
    console.error('❌ Vision API error:', error);
    return [];
  }
}

/**
 * Detect text in image: Tesseract first (with preprocessing), then OCR.space if nothing found.
 * FALLBACK when Vision API is not configured.
 */
export async function detectTextInImage(imageUrl: string): Promise<DetectedText[]> {
  let img: HTMLImageElement;
  try {
    img = await loadImageElement(imageUrl);
  } catch (e) {
    console.error('Failed to load image for OCR:', e);
    return [];
  }

  const preprocessedUrl = preprocessImageForOcr(img);
  if (!preprocessedUrl) {
    console.warn('Preprocessing failed, using original image');
  }
  const ocrInputUrl = preprocessedUrl || imageUrl;

  try {
    console.log('Initializing Tesseract OCR worker...');
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => console.log('Tesseract:', m)
    });

    console.log('Running OCR on preprocessed image...');
    const result = await worker.recognize(ocrInputUrl);

    if (!result || !result.data) {
      console.warn('❌ No text data from Tesseract');
      await worker.terminate();
      const fallback = await detectTextWithOcrSpace(img);
      return fallback;
    }

    const data: any = result.data;
    const detectedTexts: DetectedText[] = [];

    if (data.lines && Array.isArray(data.lines) && data.lines.length > 0) {
      console.log(`✓ Tesseract: ${data.lines.length} lines`);
      data.lines.forEach((line: any) => {
        if (line.text && line.text.trim().length > 0 && line.confidence > 10) {
          detectedTexts.push({
            text: line.text,
            x: line.bbox.x0,
            y: line.bbox.y0,
            width: line.bbox.x1 - line.bbox.x0,
            height: line.bbox.y1 - line.bbox.y0,
            confidence: line.confidence,
            fontSize: line.bbox.y1 - line.bbox.y0,
            fontFamily: 'Arial',
            color: '#000000'
          });
        }
      });
    }

    if (detectedTexts.length === 0 && data.words && Array.isArray(data.words) && data.words.length > 0) {
      console.log(`✓ Tesseract: ${data.words.length} words`);
      data.words.forEach((word: any) => {
        if (word.text && word.text.trim().length > 0 && word.confidence > 10) {
          detectedTexts.push({
            text: word.text,
            x: word.bbox.x0,
            y: word.bbox.y0,
            width: word.bbox.x1 - word.bbox.x0,
            height: word.bbox.y1 - word.bbox.y0,
            confidence: word.confidence,
            fontSize: word.bbox.y1 - word.bbox.y0,
            fontFamily: 'Arial',
            color: '#000000'
          });
        }
      });
      await worker.terminate();
      return groupWordsIntoLines(detectedTexts);
    }

    await worker.terminate();

    if (detectedTexts.length === 0) {
      console.log('Tesseract found nothing, trying OCR.space...');
      return detectTextWithOcrSpace(img);
    }
    return detectedTexts;
  } catch (error) {
    console.error('❌ Text detection error:', error);
    return detectTextWithOcrSpace(img);
  }
}

/**
 * Group individual words into text lines
 */
function groupWordsIntoLines(words: DetectedText[]): DetectedText[] {
  if (words.length === 0) return [];

  // Sort by Y position
  const sorted = [...words].sort((a, b) => a.y - b.y);
  const lines: DetectedText[] = [];
  let currentLine: DetectedText[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const word = sorted[i];
    const prevWord = sorted[i - 1];

    // If Y position is similar (within font height), add to same line
    if (Math.abs(word.y - prevWord.y) < prevWord.height * 0.5) {
      currentLine.push(word);
    } else {
      // Create combined text element for this line
      if (currentLine.length > 0) {
        lines.push(combineWordsInLine(currentLine));
      }
      currentLine = [word];
    }
  }

  // Add last line
  if (currentLine.length > 0) {
    lines.push(combineWordsInLine(currentLine));
  }

  return lines;
}

/**
 * Combine multiple words into a single text element
 */
function combineWordsInLine(words: DetectedText[]): DetectedText {
  const sortedByX = [...words].sort((a, b) => a.x - b.x);
  const text = sortedByX.map(w => w.text).join(' ');
  const x = Math.min(...sortedByX.map(w => w.x));
  const y = Math.min(...sortedByX.map(w => w.y));
  const maxX = Math.max(...sortedByX.map(w => w.x + w.width));
  const maxY = Math.max(...sortedByX.map(w => w.y + w.height));
  const avgConfidence = sortedByX.reduce((sum, w) => sum + w.confidence, 0) / sortedByX.length;
  const avgFontSize = sortedByX.reduce((sum, w) => sum + (w.fontSize || 0), 0) / sortedByX.length;

  return {
    text,
    x,
    y,
    width: maxX - x,
    height: maxY - y,
    confidence: avgConfidence,
    fontSize: avgFontSize,
    fontFamily: 'Arial',
    color: '#000000'
  };
}

/**
 * Detect objects in image using COCO-SSD
 */
export async function detectObjectsInImage(imageElement: HTMLImageElement): Promise<DetectedObject[]> {
  try {
    console.log('Initializing TensorFlow...');
    console.log('Image dimensions:', imageElement.width, 'x', imageElement.height);

    // Initialize TensorFlow backend
    await tf.ready();
    console.log('✓ TensorFlow ready, backend:', tf.getBackend());

    // Try to set WebGL backend first, fallback to CPU
    try {
      await tf.setBackend('webgl');
      await tf.ready();
      console.log('✓ Using WebGL backend');
    } catch (e) {
      console.warn('WebGL backend not available, trying CPU', e);
      try {
        await tf.setBackend('cpu');
        await tf.ready();
        console.log('✓ Using CPU backend');
      } catch (e2) {
        console.error('Both WebGL and CPU backends failed:', e2);
        return [];
      }
    }

    // Load the model
    console.log('Loading COCO-SSD model...');
    const model = await cocoSsd.load({
      base: 'lite_mobilenet_v2' // Use lighter model for faster loading
    });
    console.log('✓ COCO-SSD model loaded');

    // Detect objects
    console.log('Running object detection on image...');
    const predictions = await model.detect(imageElement, undefined, 0.3); // Lower threshold to 0.3
    console.log(`✓ Found ${predictions.length} predictions`);

    if (predictions.length > 0) {
      predictions.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.class} (${(p.score * 100).toFixed(1)}%) at [${p.bbox.map(n => Math.round(n)).join(', ')}]`);
      });
    } else {
      console.warn('⚠️  No objects detected by COCO-SSD');
    }

    const detectedObjects: DetectedObject[] = [];

    for (const prediction of predictions) {
      const [x, y, width, height] = prediction.bbox;

      // Create canvas to extract object region
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        try {
          // Draw the cropped region
          ctx.drawImage(imageElement, x, y, width, height, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);

          detectedObjects.push({
            type: prediction.class,
            x: Math.round(x),
            y: Math.round(y),
            width: Math.round(width),
            height: Math.round(height),
            confidence: prediction.score,
            imageData
          });
        } catch (error) {
          console.error(`Failed to extract region for ${prediction.class}:`, error);
        }
      }
    }

    console.log(`✓ Successfully extracted ${detectedObjects.length} object regions`);
    return detectedObjects;
  } catch (error) {
    console.error('❌ Object detection error:', error);
    return [];
  }
}

/**
 * Mask out text regions from an object's imageData so the person cutout
 * doesn't include overlapping text (e.g. headline behind the model's head).
 * Text bboxes are in full-image coordinates; object crop is at (objectX, objectY).
 */
function maskTextRegionsFromObjectImage(
  imageData: ImageData,
  objectX: number,
  objectY: number,
  objectW: number,
  objectH: number,
  texts: DetectedText[]
): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const w = imageData.width;
  const h = imageData.height;

  for (const text of texts) {
    // Text bbox in full-image coords → overlap in object-local coords
    const startX = Math.max(0, Math.floor(text.x - objectX));
    const startY = Math.max(0, Math.floor(text.y - objectY));
    const endX = Math.min(w, Math.ceil(text.x + text.width - objectX));
    const endY = Math.min(h, Math.ceil(text.y + text.height - objectY));

    if (startX >= endX || startY >= endY) continue;

    for (let py = startY; py < endY; py++) {
      for (let px = startX; px < endX; px++) {
        const idx = (py * w + px) * 4;
        data[idx + 3] = 0; // transparent
      }
    }
  }

  return new ImageData(data, w, h);
}

/**
 * Remove background using Remove.bg API (same as AI Background Removal panel)
 * Returns base64 PNG with transparent background, or null on failure.
 */
async function removeBackgroundWithRemoveBg(imageData: ImageData): Promise<string | null> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.putImageData(imageData, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');

    // Convert data URL to blob (same pattern as AIBackgroundRemovalPanel)
    const blobResponse = await fetch(dataUrl);
    const imageBlob = await blobResponse.blob();

    const formData = new FormData();
    formData.append('image_file', imageBlob);
    formData.append('size', 'auto');

    const envKey =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_REMOVE_BG_API_KEY) || '';
    const apiKey = envKey || 'NasV7YXmRc9JJitY8y6X3cKM';
    if (!envKey) {
      console.warn(
        'remove.bg: NEXT_PUBLIC_REMOVE_BG_API_KEY not set, using built-in key. ' +
          'Set NEXT_PUBLIC_REMOVE_BG_API_KEY to use your own key.'
      );
    }

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        // NOTE: uses same key as AIBackgroundRemovalPanel. Consider moving to env.
        'X-Api-Key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      console.error('remove.bg background removal failed:', await response.text());
      return null;
    }

    const resultBlob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(resultBlob);
    });
  } catch (error) {
    console.error('Error calling remove.bg:', error);
    return null;
  }
}

/**
 * Create a simple inpainting mask from object + text regions.
 * White = areas to remove (person + text), black = keep background.
 */
function createInpaintMask(
  imageElement: HTMLImageElement,
  objects: DetectedObject[],
  texts: DetectedText[]
): string {
  const w = imageElement.width;
  const h = imageElement.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Start fully black (keep everything)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);

  // Mark object + text regions as white (areas to inpaint)
  ctx.fillStyle = '#ffffff';
  objects.forEach(obj => {
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
  });
  texts.forEach(text => {
    ctx.fillRect(text.x, text.y, text.width, text.height);
  });

  return canvas.toDataURL('image/png');
}

/**
 * Background fill using Google Gemini “Nano Banana” (prompt-based image editing).
 * Model: gemini-2.5-flash-image
 * We send:
 * - original image (data URL)
 * - a mask image (data URL) as a second guidance image (optional, but helps)
 * - a prompt telling Gemini to remove the subject + remove text + fill naturally
 */
async function generativeFillBackground(
  imageElement: HTMLImageElement,
  objects: DetectedObject[],
  texts: DetectedText[],
  referenceImages?: string[]
): Promise<string | null> {
  try {
    console.log('🍌 Using Gemini (Nano Banana) to generate clean background...');

    const imageDataUrl = imageToDataUrl(imageElement);
    const maskDataUrl = createInpaintMask(imageElement, objects, texts);

    if (!imageDataUrl || !maskDataUrl) {
      console.warn('⚠️  Could not create image or mask data URL for inpainting.');
      return null;
    }

    const objectLines = objects.slice(0, 10).map((o, idx) => {
      const x = Math.round(o.x);
      const y = Math.round(o.y);
      const w = Math.round(o.width);
      const h = Math.round(o.height);
      return `OBJ_${idx + 1}: type=${o.type}, bbox=[${x},${y},${w},${h}]`;
    });

    const textLines = texts.slice(0, 20).map((t, idx) => {
      const x = Math.round(t.x);
      const y = Math.round(t.y);
      const w = Math.round(t.width);
      const h = Math.round(t.height);
      const s = (t.text || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      return `TEXT_${idx + 1}: "${s}", bbox=[${x},${y},${w},${h}]`;
    });

    // STRICT prompt: remove ONLY listed items; keep everything else unchanged.
    const prompt = [
      'Task: Create a clean background image by removing ONLY the specified items.',
      '',
      'CRITICAL RULES:',
      '1) Remove ONLY the objects/text listed below (and inside the provided mask).',
      '2) Do NOT remove or change any other people/objects/logos that are NOT listed.',
      '3) Do NOT change colors, lighting, composition, or camera perspective outside the mask.',
      '4) Fill removed regions with seamless continuation of the surrounding background.',
      '5) Do NOT add any new text. No watermark. No artifacts.',
      '',
      'Inputs:',
      '- Image 1: original image',
      '- Image 2: mask (white = remove+fill, black = keep)',
      referenceImages?.length ? '- Additional images: cutouts/references of the items to remove (use them to identify what to remove)' : '',
      '',
      objectLines.length ? 'Objects to remove:' : 'Objects to remove: (none)',
      ...objectLines,
      '',
      textLines.length ? 'Text to remove:' : 'Text to remove: (none)',
      ...textLines,
    ]
      .filter(Boolean)
      .join('\n');

    console.log(
      `Creating background with Gemini: ${objects.length} objects + ${texts.length} texts to remove`
    );

    // Call our Gemini inpainting endpoint
    const res = await fetch('/api/gemini/inpaint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageDataUrl,
        mask: maskDataUrl,
        prompt,
        references: referenceImages?.slice(0, 4) || [],
      }),
    });

    if (!res.ok) {
      const contentType = res.headers.get('content-type') || '';
      let errorMsg = `${res.status} ${res.statusText}`;
      if (contentType.includes('application/json')) {
        const json = await res.json().catch(() => null);
        if (json?.error && typeof json.error === 'string') errorMsg = json.error;
      } else {
        const text = await res.text().catch(() => '');
        if (text) errorMsg = text;
      }

      console.error('❌ Gemini inpaint API error:', errorMsg);
      return null;
    }

    const json = await res.json();

    if (!json?.image) {
      console.warn('⚠️  Inpainting API did not return image field.');
      return null;
    }

    console.log('✓ Gemini background generation successful!');
    return json.image as string;
  } catch (e) {
    console.error('❌ Inpainting API call failed:', e);
    return null;
  }
}

/**
 * Remove background using chroma key / green screen technique (local fallback)
 * This is a simplified version - detects edges and makes background transparent
 */
export async function removeBackgroundFromRegion(
  imageData: ImageData
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  // Put original image
  ctx.putImageData(imageData, 0, 0);

  // Get image data for processing
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = data.data;

  // Simple background removal: make similar edge pixels transparent
  // This is basic - for better results, use external API or ML model
  const threshold = 30; // Similarity threshold

  // Sample corner pixels to detect background color
  const cornerSamples = [
    { r: pixels[0], g: pixels[1], b: pixels[2] },
    { r: pixels[(canvas.width - 1) * 4], g: pixels[(canvas.width - 1) * 4 + 1], b: pixels[(canvas.width - 1) * 4 + 2] },
    { r: pixels[(canvas.height - 1) * canvas.width * 4], g: pixels[(canvas.height - 1) * canvas.width * 4 + 1], b: pixels[(canvas.height - 1) * canvas.width * 4 + 2] },
  ];

  const avgBg = {
    r: Math.round((cornerSamples[0].r + cornerSamples[1].r + cornerSamples[2].r) / 3),
    g: Math.round((cornerSamples[0].g + cornerSamples[1].g + cornerSamples[2].g) / 3),
    b: Math.round((cornerSamples[0].b + cornerSamples[1].b + cornerSamples[2].b) / 3),
  };

  // Make similar pixels transparent
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    const diff = Math.sqrt(
      Math.pow(r - avgBg.r, 2) +
      Math.pow(g - avgBg.g, 2) +
      Math.pow(b - avgBg.b, 2)
    );

    if (diff < threshold) {
      pixels[i + 3] = 0; // Make transparent
    }
  }

  ctx.putImageData(data, 0, 0);

  return canvas.toDataURL('image/png');
}

/**
 * Sample average color from a strip of pixels (helper for fill)
 */
function sampleStrip(
  pixels: Uint8ClampedArray,
  width: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): { r: number; g: number; b: number } {
  let r = 0, g = 0, b = 0, n = 0;
  const xMin = Math.max(0, Math.floor(Math.min(x0, x1)));
  const xMax = Math.min(width - 1, Math.ceil(Math.max(x0, x1)));
  const yMin = Math.max(0, Math.floor(Math.min(y0, y1)));
  const yMax = Math.min((pixels.length / 4) / width - 1, Math.ceil(Math.max(y0, y1)));
  for (let j = yMin; j <= yMax; j++) {
    for (let i = xMin; i <= xMax; i++) {
      const idx = (j * width + i) * 4;
      r += pixels[idx];
      g += pixels[idx + 1];
      b += pixels[idx + 2];
      n++;
    }
  }
  if (n === 0) return { r: 255, g: 255, b: 255 };
  return {
    r: Math.round(r / n),
    g: Math.round(g / n),
    b: Math.round(b / n)
  };
}

/**
 * Fill background regions where text (and optionally objects) were removed.
 * Uses wide sampling + smooth gradient fill + edge feathering so the poster
 * background looks clean and natural (no obvious patches).
 */
export async function fillBackgroundRegions(
  imageElement: HTMLImageElement,
  objects: DetectedObject[],
  texts: DetectedText[]
): Promise<string> {
  const w = imageElement.width;
  const h = imageElement.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.drawImage(imageElement, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const pixels = imageData.data;

  const regionsToFill: Array<{ x: number; y: number; width: number; height: number; type: string }> = [];
  objects.forEach(obj => {
    regionsToFill.push({
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      type: `object (${obj.type})`
    });
  });
  texts.forEach(text => {
    regionsToFill.push({
      x: text.x,
      y: text.y,
      width: text.width,
      height: text.height,
      type: `text ("${text.text}")`
    });
  });

  const margin = 28; // Sample further out for truer background color
  const featherPx = 2;   // Soften seam at fill boundary
  const noiseAmount = 4;  // Subtle variation so fill isn’t flat

  for (const region of regionsToFill) {
    const { x, y, width, height } = region;
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(w, Math.ceil(x + width));
    const y1 = Math.min(h, Math.ceil(y + height));
    if (x1 <= x0 || y1 <= y0) continue;

    // Safety: if OCR gave us a HUGE box (e.g. almost whole poster),
    // do NOT fill it or we’ll wipe the entire background to one color.
    const regionArea = (x1 - x0) * (y1 - y0);
    const imageArea = w * h;
    if (regionArea / imageArea > 0.35) {
      console.warn('Skipping over-large fill region to avoid wiping background:', region);
      continue;
    }

    // Sample from strips OUTSIDE the region (wider margin = better match to poster bg)
    const topAvg = sampleStrip(pixels, w, x0 - margin, Math.max(0, y0 - margin), x1 + margin, y0);
    const bottomAvg = sampleStrip(pixels, w, x0 - margin, y1, x1 + margin, Math.min(h, y1 + margin));
    const leftAvg = sampleStrip(pixels, w, Math.max(0, x0 - margin), y0 - margin, x0, y1 + margin);
    const rightAvg = sampleStrip(pixels, w, x1, y0 - margin, Math.min(w, x1 + margin), y1 + margin);

    const rw = x1 - x0;
    const rh = y1 - y0;
    if (rw <= 0 || rh <= 0) continue;

    for (let j = y0; j < y1; j++) {
      const normY = (j - y0) / rh;
      const distFromTop = j - y0;
      const distFromBottom = y1 - 1 - j;
      for (let i = x0; i < x1; i++) {
        const normX = (i - x0) / rw;
        const distFromLeftEdge = i - x0;
        const distFromRightEdge = x1 - 1 - i;

        // Bilinear blend from the four edge samples (smooth gradient)
        const topW = 1 - normY;
        const bottomW = normY;
        const leftW = 1 - normX;
        const rightW = normX;
        const totalW = topW + bottomW + leftW + rightW;
        let r = (topAvg.r * topW + bottomAvg.r * bottomW + leftAvg.r * leftW + rightAvg.r * rightW) / totalW;
        let g = (topAvg.g * topW + bottomAvg.g * bottomW + leftAvg.g * leftW + rightAvg.g * rightW) / totalW;
        let b = (topAvg.b * topW + bottomAvg.b * bottomW + leftAvg.b * leftW + rightAvg.b * rightW) / totalW;

        // Feather: near the edge of the region, blend with original pixel so no hard seam
        const distToEdge = Math.min(distFromTop, distFromBottom, distFromLeftEdge, distFromRightEdge);
        let blend = 1;
        if (featherPx > 0 && distToEdge < featherPx) {
          blend = distToEdge / featherPx;
        }
        const idx = (j * w + i) * 4;
        if (blend < 1) {
          r = r * blend + pixels[idx] * (1 - blend);
          g = g * blend + pixels[idx + 1] * (1 - blend);
          b = b * blend + pixels[idx + 2] * (1 - blend);
        }

        // Very subtle noise so fill isn’t perfectly flat
        const n = () => (Math.random() - 0.5) * noiseAmount;
        pixels[idx] = Math.max(0, Math.min(255, Math.round(r) + n()));
        pixels[idx + 1] = Math.max(0, Math.min(255, Math.round(g) + n()));
        pixels[idx + 2] = Math.max(0, Math.min(255, Math.round(b) + n()));
        pixels[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Step 1 (Analyze): detect objects + texts, but DO NOT decide what to remove.
 * Returns the original image as data URL so later steps are stable (no blob URL).
 */
export async function analyzeImageForLayerExtraction(
  imageFile: File,
  onProgress?: (stage: string, progress: number) => void
): Promise<ExtractionAnalysis> {
  // Load image
  onProgress?.('Loading image...', 10);
  const imageUrl = URL.createObjectURL(imageFile);
  const imageElement = await loadImageElement(imageUrl);

  const originalDataUrl = imageToDataUrl(imageElement);

  // Objects
  onProgress?.('Detecting objects (people, products)...', 30);
  let objects: DetectedObject[] = [];
  try {
    objects = await detectObjectsInImage(imageElement);
  } catch (e) {
    console.error('❌ Object detection failed:', e);
  }

  // Text
  onProgress?.('Detecting text with AI...', 55);
  let texts: DetectedText[] = [];
  try {
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(imageElement, 0, 0);
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.95);
      texts = await detectTextWithVisionAPI(imageBase64);
      if (texts.length === 0) {
        texts = await detectTextInImage(imageUrl);
      }
    } else {
      texts = await detectTextInImage(imageUrl);
    }
  } catch (e) {
    console.error('❌ Text detection failed:', e);
  }

  // Sample text color
  for (const text of texts) {
    const region = getImageRegion(imageElement, text.x, text.y, text.width, text.height);
    if (region) text.color = extractDominantColor(region);
  }

  onProgress?.('Analysis complete', 100);
  return {
    originalDataUrl,
    originalWidth: imageElement.width,
    originalHeight: imageElement.height,
    objects,
    texts,
  };
}

/**
 * Step 2 (Build): user chooses what to remove/extract.
 * - Only selected objects are extracted as transparent layers using Nano Banana
 * - Only selected texts are added as editable text layers
 * - Background is the original image (user can separately use AI BG Remove if needed)
 */
export async function buildLayersFromAnalysis(
  analysis: ExtractionAnalysis,
  options: {
    removeObjectIndexes: number[];
    removeTextIndexes: number[];
    extractObjectIndexes: number[];
    extractTextIndexes: number[];
  },
  onProgress?: (stage: string, progress: number) => void
): Promise<ProcessedLayers> {
  // Objects (extract only selected using Nano Banana)
  onProgress?.('Extracting selected objects with Nano Banana...', 40);
  const extractedObjects: DetectedObject[] = [];

  const objectsToExtract = options.extractObjectIndexes
    .map((i) => analysis.objects[i])
    .filter(Boolean);

  for (let i = 0; i < objectsToExtract.length; i++) {
    const obj = objectsToExtract[i];
    onProgress?.(`Extracting ${obj.type} ${i + 1}/${objectsToExtract.length}...`, 40 + (i / objectsToExtract.length) * 40);

    const transparentPng = await extractObjectWithNanoBanana(analysis.originalDataUrl, obj);

    if (transparentPng) {
      extractedObjects.push({
        ...obj,
        imageWithoutBg: transparentPng,
      });
    }
  }

  console.log(`✓ Extracted ${extractedObjects.length}/${objectsToExtract.length} objects with Nano Banana`);

  // Background: Generate clean background (remove all objects/text and fill)
  onProgress?.('Generating clean background with Gemini...', 85);
  let backgroundDataUrl = analysis.originalDataUrl;

  // Only generate clean background if we have objects or texts to remove
  if (options.removeObjectIndexes.length > 0 || options.removeTextIndexes.length > 0) {
    const cleanBg = await generateCleanBackground(analysis.originalDataUrl);
    if (cleanBg) {
      backgroundDataUrl = cleanBg;
      console.log('✓ Clean background generated');
    } else {
      console.warn('⚠️  Background cleaning failed, using original image');
    }
  } else {
    console.log('ℹ️  No objects/texts to remove, using original as background');
  }

  // Texts (editable only selected)
  const extractedTexts = options.extractTextIndexes.map((i) => analysis.texts[i]).filter(Boolean);

  onProgress?.('Complete!', 100);
  return {
    texts: extractedTexts,
    objects: extractedObjects,
    fullImageWithoutBg: undefined,
    background: backgroundDataUrl,
    originalWidth: analysis.originalWidth,
    originalHeight: analysis.originalHeight,
  };
}

/**
 * Remove solid background color (like white) and make it transparent
 * With edge smoothing to handle hair/fine details
 */
async function removeColorBackground(imageDataUrl: string, threshold: number = 50): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const w = canvas.width;
      const h = canvas.height;

      // Sample multiple points to detect background color (more reliable)
      const samplePoints = [
        0, // top-left
        w - 1, // top-right
        (h - 1) * w, // bottom-left
        (h - 1) * w + (w - 1), // bottom-right
        Math.floor(w / 2), // top-center
        (h - 1) * w + Math.floor(w / 2), // bottom-center
      ];

      let rSum = 0, gSum = 0, bSum = 0;
      for (const idx of samplePoints) {
        const i = idx * 4;
        rSum += pixels[i];
        gSum += pixels[i + 1];
        bSum += pixels[i + 2];
      }

      const bgColor = {
        r: Math.round(rSum / samplePoints.length),
        g: Math.round(gSum / samplePoints.length),
        b: Math.round(bSum / samplePoints.length),
      };

      console.log(`  Background color detected: rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`);

      // Pass 1: Calculate alpha based on color difference
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        const diff = Math.sqrt(
          Math.pow(r - bgColor.r, 2) +
          Math.pow(g - bgColor.g, 2) +
          Math.pow(b - bgColor.b, 2)
        );

        if (diff < threshold) {
          // Fully transparent if very close to background
          pixels[i + 3] = 0;
        } else if (diff < threshold * 1.5) {
          // Partial transparency for edge pixels (smooth transition)
          const alpha = Math.min(255, Math.max(0, ((diff - threshold) / (threshold * 0.5)) * 255));
          pixels[i + 3] = Math.round(alpha);
        }
        // else: keep original alpha
      }

      // Pass 2: Edge cleanup - erode edge pixels to remove halos
      const tempPixels = new Uint8ClampedArray(pixels);
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = (y * w + x) * 4;
          const alpha = tempPixels[idx + 3];

          // If pixel is semi-transparent or at edge, check neighbors
          if (alpha > 0 && alpha < 200) {
            // Check if surrounded by transparent pixels
            const neighbors = [
              tempPixels[((y - 1) * w + x) * 4 + 3], // top
              tempPixels[((y + 1) * w + x) * 4 + 3], // bottom
              tempPixels[(y * w + (x - 1)) * 4 + 3], // left
              tempPixels[(y * w + (x + 1)) * 4 + 3], // right
            ];

            const transparentCount = neighbors.filter(a => a < 50).length;

            // If mostly surrounded by transparent, make this more transparent too
            if (transparentCount >= 2) {
              pixels[idx + 3] = Math.round(alpha * 0.5);
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = imageDataUrl;
  });
}

/**
 * Extract object using Nano Banana (Gemini) - returns transparent PNG
 */
async function extractObjectWithNanoBanana(
  imageBase64: string,
  object: DetectedObject
): Promise<string | null> {
  try {
    console.log(`🍌 Extracting ${object.type} with Gemini Nano Banana...`);

    const response = await fetch('/api/nano-banana', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        operation: 'extract_object',
        prompt: `the ${object.type}`, // e.g., "the person", "the car"
        bbox: { x: object.x, y: object.y, width: object.width, height: object.height }
      }),
    });

    if (!response.ok) {
      console.warn(`⚠️  Nano Banana failed for ${object.type}:`, await response.text());
      return null;
    }

    const data = await response.json();
    console.log(`✓ ${object.type} extracted from Gemini (solid background)`);

    // Remove solid background color to make transparent
    if (data.removeWhiteBackground) {
      console.log(`  Removing background color locally...`);
      const transparentImage = await removeColorBackground(data.image, 40);
      console.log(`  ✓ Background removed, object is now transparent`);
      return transparentImage;
    }

    return data.image;
  } catch (error) {
    console.error(`❌ Nano Banana error for ${object.type}:`, error);
    return null;
  }
}

/**
 * Generate clean background using Nano Banana (Gemini) - removes all objects/text and fills
 */
async function generateCleanBackground(
  imageBase64: string
): Promise<string | null> {
  try {
    console.log(`🍌 Generating clean background with Gemini Nano Banana...`);

    const response = await fetch('/api/nano-banana', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        operation: 'clean_background',
      }),
    });

    if (!response.ok) {
      console.warn(`⚠️  Nano Banana background cleaning failed:`, await response.text());
      return null;
    }

    const data = await response.json();
    console.log(`✓ Clean background generated successfully`);

    return data.image;
  } catch (error) {
    console.error(`❌ Nano Banana background error:`, error);
    return null;
  }
}

/**
 * Main function to process image and extract all layers
 * Uses Nano Banana for object extraction
 */
export async function extractLayersFromImage(
  imageFile: File,
  onProgress?: (stage: string, progress: number) => void
): Promise<ProcessedLayers> {
  try {
    // 1. Load image
    onProgress?.('Loading image...', 10);
    const imageUrl = URL.createObjectURL(imageFile);
    const imageElement = await loadImageElement(imageUrl);

    // Convert to base64 for APIs
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    ctx.drawImage(imageElement, 0, 0);
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.95);

    // 2. Detect objects (COCO-SSD)
    onProgress?.('Detecting objects (people, products)...', 25);
    let objects: DetectedObject[] = [];
    try {
      objects = await detectObjectsInImage(imageElement);
      console.log(`✓ Found ${objects.length} objects`);
    } catch (e) {
      console.error('❌ Object detection failed:', e);
    }

    // 3. Detect text (Google Vision API -> Tesseract fallback)
    onProgress?.('Detecting text with AI...', 40);
    let texts: DetectedText[] = [];
    try {
      texts = await detectTextWithVisionAPI(imageBase64);
      if (texts.length === 0) {
        console.log('Google Vision found no text, trying Tesseract...');
        texts = await detectTextInImage(imageUrl);
      }
      console.log(`✓ Found ${texts.length} text elements`);
    } catch (e) {
      console.error('❌ Text detection failed:', e);
    }

    // 4. Sample text colors from original image
    for (const text of texts) {
      const region = getImageRegion(imageElement, text.x, text.y, text.width, text.height);
      if (region) text.color = extractDominantColor(region);
    }

    // 5. Extract each object as transparent PNG using Nano Banana
    onProgress?.('Extracting objects with Nano Banana...', 60);
    const extractedObjects: DetectedObject[] = [];

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      onProgress?.(` Extracting ${obj.type} ${i + 1}/${objects.length}...`, 60 + (i / objects.length) * 20);

      const transparentPng = await extractObjectWithNanoBanana(imageBase64, obj);

      if (transparentPng) {
        extractedObjects.push({
          ...obj,
          imageWithoutBg: transparentPng,
        });
      }
    }

    console.log(`✓ Extracted ${extractedObjects.length}/${objects.length} objects`);

    // 6. Background: Generate clean background (remove all objects/text and fill)
    onProgress?.('Generating clean background with Gemini...', 85);
    let backgroundDataUrl = imageToDataUrl(imageElement);

    // Generate clean background if we have objects or texts
    if (objects.length > 0 || texts.length > 0) {
      const cleanBg = await generateCleanBackground(imageBase64);
      if (cleanBg) {
        backgroundDataUrl = cleanBg;
        console.log('✓ Clean background generated');
      } else {
        console.warn('⚠️  Background cleaning failed, using original image');
      }
    }

    onProgress?.('Complete!', 100);

    return {
      texts,
      objects: extractedObjects,
      fullImageWithoutBg: undefined, // Not needed - we have individual object PNGs
      background: backgroundDataUrl,
      originalWidth: imageElement.width,
      originalHeight: imageElement.height,
    };
  } catch (error) {
    console.error('Layer extraction error:', error);
    throw error;
  }
}

/**
 * Helper to load image as HTMLImageElement
 */
function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Convert image element to a data URL so the background layer always loads (no blob URL issues).
 */
function imageToDataUrl(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Get ImageData for a region from an image element (for color sampling).
 * We sample from slightly INSIDE the text box (shrink 20%) so we pick
 * mostly glyph pixels, not surrounding background. This makes the color
 * closer to the real text color.
 */
function getImageRegion(
  imageElement: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
): ImageData | null {
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(imageElement, 0, 0);

  const inset = 0.2; // 20% border crop
  const innerX = x + width * inset;
  const innerY = y + height * inset;
  const innerW = width * (1 - inset * 2);
  const innerH = height * (1 - inset * 2);

  const x0 = Math.max(0, Math.floor(innerX));
  const y0 = Math.max(0, Math.floor(innerY));
  const w = Math.min(imageElement.width - x0, Math.ceil(innerW));
  const h = Math.min(imageElement.height - y0, Math.ceil(innerH));
  if (w <= 0 || h <= 0) return null;
  return ctx.getImageData(x0, y0, w, h);
}

/**
 * Luminance (0–1) for a pixel
 */
function luminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Extract dominant color from image region.
 * For text: prefer darker color when region is mostly light (e.g. dark text on white poster).
 */
export function extractDominantColor(imageData: ImageData): string {
  const data = imageData.data;
  const pixels: { r: number; g: number; b: number; L: number }[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 128) continue;
    pixels.push({ r, g, b, L: luminance(r, g, b) });
  }
  if (pixels.length === 0) return 'rgb(0, 0, 0)';

  let r = 0, g = 0, b = 0;
  for (const p of pixels) {
    r += p.r;
    g += p.g;
    b += p.b;
  }
  const n = pixels.length;
  r = Math.round(r / n);
  g = Math.round(g / n);
  b = Math.round(b / n);
  const avgL = luminance(r, g, b);
  // If average is very light (e.g. white background), use average of darker pixels (text)
  if (avgL > 0.85) {
    const darker = pixels.filter((p) => p.L < 0.7).sort((a, b) => a.L - b.L);
    const take = Math.max(1, Math.floor(darker.length * 0.5));
    const use = darker.slice(0, take);
    if (use.length > 0) {
      r = Math.round(use.reduce((s, p) => s + p.r, 0) / use.length);
      g = Math.round(use.reduce((s, p) => s + p.g, 0) / use.length);
      b = Math.round(use.reduce((s, p) => s + p.b, 0) / use.length);
    }
  }
  return `rgb(${r}, ${g}, ${b})`;
}
