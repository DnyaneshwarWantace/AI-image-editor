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
}

export interface ProcessedLayers {
  texts: DetectedText[];
  objects: DetectedObject[];
  background: string; // Base64 of original image
  originalWidth: number;
  originalHeight: number;
}

/**
 * Detect text in image using Tesseract OCR
 */
export async function detectTextInImage(imageUrl: string): Promise<DetectedText[]> {
  try {
    console.log('Initializing Tesseract OCR worker...');
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => console.log('Tesseract:', m)
    });

    console.log('Running OCR on image...');
    const result = await worker.recognize(imageUrl);

    console.log('OCR completed. Result structure:', {
      hasData: !!result.data,
      dataKeys: result.data ? Object.keys(result.data) : []
    });

    if (!result || !result.data) {
      console.warn('❌ No text data returned from OCR');
      await worker.terminate();
      return [];
    }

    // Try multiple ways to access text data (using any to avoid TypeScript issues)
    const data: any = result.data;
    console.log('Full OCR data text:', data.text);
    console.log('Has lines?', !!data.lines);
    console.log('Has words?', !!data.words);
    console.log('Has symbols?', !!data.symbols);

    const detectedTexts: DetectedText[] = [];

    // Method 1: Try using lines (more reliable)
    if (data.lines && Array.isArray(data.lines) && data.lines.length > 0) {
      console.log(`✓ Found ${data.lines.length} lines via data.lines`);
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

    // Method 2: Try using words if lines didn't work
    if (detectedTexts.length === 0 && data.words && Array.isArray(data.words) && data.words.length > 0) {
      console.log(`✓ Found ${data.words.length} words via data.words`);
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

      // Group words into lines if we used words
      await worker.terminate();
      console.log(`OCR found ${detectedTexts.length} words, grouping into lines...`);
      return groupWordsIntoLines(detectedTexts);
    }

    await worker.terminate();

    console.log(`✓ OCR complete! Found ${detectedTexts.length} text elements`);
    return detectedTexts;
  } catch (error) {
    console.error('❌ Text detection error:', error);
    return [];
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

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        // NOTE: uses same key as AIBackgroundRemovalPanel. Consider moving to env.
        'X-Api-Key': 'NasV7YXmRc9JJitY8y6X3cKM',
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
 * Fill background regions where objects AND text were detected (AI inpainting)
 * Uses content-aware fill by sampling surrounding pixels
 */
export async function fillBackgroundRegions(
  imageElement: HTMLImageElement,
  objects: DetectedObject[],
  texts: DetectedText[]
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  // Draw original image
  ctx.drawImage(imageElement, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // Combine all regions to fill (objects + text)
  const regionsToFill: Array<{ x: number; y: number; width: number; height: number; type: string }> = [];

  // Add object regions
  objects.forEach(obj => {
    regionsToFill.push({
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      type: `object (${obj.type})`
    });
  });

  // Add text regions
  texts.forEach(text => {
    regionsToFill.push({
      x: text.x,
      y: text.y,
      width: text.width,
      height: text.height,
      type: `text ("${text.text}")`
    });
  });

  console.log(`Filling ${regionsToFill.length} regions (${objects.length} objects + ${texts.length} texts)`);

  // For each region, fill with surrounding colors
  for (const region of regionsToFill) {
    const { x, y, width, height, type } = region;
    console.log(`Filling region: ${type} at (${x}, ${y})`);


    // Sample colors from border around the region (10px margin)
    const margin = 10;
    const borderColors: { r: number; g: number; b: number }[] = [];

    // Sample top border
    for (let i = Math.max(0, x - margin); i < Math.min(canvas.width, x + width + margin); i++) {
      const topY = Math.max(0, y - margin);
      const idx = (topY * canvas.width + i) * 4;
      borderColors.push({ r: pixels[idx], g: pixels[idx + 1], b: pixels[idx + 2] });
    }

    // Sample bottom border
    for (let i = Math.max(0, x - margin); i < Math.min(canvas.width, x + width + margin); i++) {
      const bottomY = Math.min(canvas.height - 1, y + height + margin);
      const idx = (bottomY * canvas.width + i) * 4;
      borderColors.push({ r: pixels[idx], g: pixels[idx + 1], b: pixels[idx + 2] });
    }

    // Sample left border
    for (let j = Math.max(0, y - margin); j < Math.min(canvas.height, y + height + margin); j++) {
      const leftX = Math.max(0, x - margin);
      const idx = (j * canvas.width + leftX) * 4;
      borderColors.push({ r: pixels[idx], g: pixels[idx + 1], b: pixels[idx + 2] });
    }

    // Sample right border
    for (let j = Math.max(0, y - margin); j < Math.min(canvas.height, y + height + margin); j++) {
      const rightX = Math.min(canvas.width - 1, x + width + margin);
      const idx = (j * canvas.width + rightX) * 4;
      borderColors.push({ r: pixels[idx], g: pixels[idx + 1], b: pixels[idx + 2] });
    }

    // Calculate average border color
    const avgColor = {
      r: Math.round(borderColors.reduce((sum, c) => sum + c.r, 0) / borderColors.length),
      g: Math.round(borderColors.reduce((sum, c) => sum + c.g, 0) / borderColors.length),
      b: Math.round(borderColors.reduce((sum, c) => sum + c.b, 0) / borderColors.length)
    };

    // Fill the region with averaged surrounding color
    for (let j = Math.round(y); j < Math.round(y + height) && j < canvas.height; j++) {
      for (let i = Math.round(x); i < Math.round(x + width) && i < canvas.width; i++) {
        const idx = (j * canvas.width + i) * 4;
        // Add slight noise for more natural look
        const noise = () => (Math.random() - 0.5) * 15;
        pixels[idx] = Math.max(0, Math.min(255, avgColor.r + noise()));
        pixels[idx + 1] = Math.max(0, Math.min(255, avgColor.g + noise()));
        pixels[idx + 2] = Math.max(0, Math.min(255, avgColor.b + noise()));
        pixels[idx + 3] = 255; // Full opacity
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Main function to process image and extract all layers
 */
export async function extractLayersFromImage(
  imageFile: File,
  onProgress?: (stage: string, progress: number) => void
): Promise<ProcessedLayers> {
  try {
    // Load image
    onProgress?.('Loading image...', 10);
    console.log('Creating image URL from file...');
    const imageUrl = URL.createObjectURL(imageFile);
    console.log('Loading image element...');
    const imageElement = await loadImageElement(imageUrl);
    console.log(`✓ Image loaded: ${imageElement.width}x${imageElement.height}`);

    // Detect text
    onProgress?.('Detecting text (this may take 10-20 seconds)...', 30);
    let texts: DetectedText[] = [];
    try {
      console.log('\n=== STARTING TEXT DETECTION ===');
      texts = await detectTextInImage(imageUrl);
      console.log(`✓ Detected ${texts.length} text elements`);
      if (texts.length > 0) {
        console.log('Text samples:', texts.slice(0, 3));
      }
    } catch (error) {
      console.error('❌ Text detection failed:', error);
      // Continue even if text detection fails
    }

    // Sample text color from image so extracted text matches poster style
    for (const text of texts) {
      const region = getImageRegion(imageElement, text.x, text.y, text.width, text.height);
      if (region) {
        text.color = extractDominantColor(region);
        console.log(`Text "${text.text}" color sampled: ${text.color}`);
      }
    }

    // Detect objects
    onProgress?.('Detecting objects (people, products, etc.)...', 50);
    let objects: DetectedObject[] = [];
    try {
      console.log('\n=== STARTING OBJECT DETECTION ===');
      objects = await detectObjectsInImage(imageElement);
      console.log(`✓ Detected ${objects.length} objects:`, objects.map(o => o.type));
      if (objects.length > 0) {
        console.log('Objects:', objects.map(o => `${o.type} at (${o.x}, ${o.y})`));
      }
    } catch (error) {
      console.error('❌ Object detection failed:', error);
      // Continue even if object detection fails
    }

    // Remove backgrounds from objects (and mask out overlapping text so person cutout is clean)
    onProgress?.('Removing backgrounds from objects...', 70);
    console.log(`Processing ${objects.length} objects to remove backgrounds (text masked out)...`);
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      try {
        // First mask text regions from the object so we don't get letters on the person
        const imageDataNoText = maskTextRegionsFromObjectImage(
          obj.imageData,
          obj.x,
          obj.y,
          obj.width,
          obj.height,
          texts
        );
        console.log(`Removing background from object ${i + 1}/${objects.length} (${obj.type}) using remove.bg...`);

        // First try high-quality Remove.bg (same as separate background removal tool)
        let imageWithoutBg = await removeBackgroundWithRemoveBg(imageDataNoText);

        // Fallback: if API fails, use local chroma-key remover
        if (!imageWithoutBg) {
          console.log('remove.bg failed or unavailable, falling back to local remover...');
          imageWithoutBg = await removeBackgroundFromRegion(imageDataNoText);
        }

        obj.imageWithoutBg = imageWithoutBg;
        console.log(`✓ Background removed for ${obj.type}`);
      } catch (error) {
        console.error(`❌ Background removal failed for object ${i + 1}:`, error);
      }
    }

    // Fill background where objects AND text were (AI inpainting)
    onProgress?.('Filling background (removing text & objects)...', 85);
    let cleanBackground = imageUrl;
    try {
      if (objects.length > 0 || texts.length > 0) {
        cleanBackground = await fillBackgroundRegions(imageElement, objects, texts);
        console.log(`✓ Background cleaned: filled ${objects.length} objects + ${texts.length} text regions`);
      }
    } catch (error) {
      console.error('❌ Background filling failed:', error);
      // Use original if filling fails
    }

    onProgress?.('Complete!', 100);

    return {
      texts,
      objects,
      background: cleanBackground, // Background with objects filled in
      originalWidth: imageElement.width,
      originalHeight: imageElement.height
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
 * Get ImageData for a region from an image element (for color sampling)
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
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const w = Math.min(imageElement.width - x0, Math.ceil(width));
  const h = Math.min(imageElement.height - y0, Math.ceil(height));
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
