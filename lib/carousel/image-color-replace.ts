/**
 * Recolor an image by replacing specific colors
 */
export async function recolorImage(
  imageUrl: string,
  replacements: { from: string; to: string }[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Convert hex colors to RGB
      const replacementRGBs = replacements.map(r => ({
        from: hexToRgb(r.from),
        to: hexToRgb(r.to)
      }));

      // Replace colors
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Skip transparent pixels
        if (a === 0) continue;

        // Check each replacement
        for (const replacement of replacementRGBs) {
          if (
            isColorSimilar(
              { r, g, b },
              replacement.from,
              40 // tolerance
            )
          ) {
            data[i] = replacement.to.r;
            data[i + 1] = replacement.to.g;
            data[i + 2] = replacement.to.b;
            break;
          }
        }
      }

      // Put modified data back
      ctx.putImageData(imageData, 0, 0);

      // Return as data URL
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;
  });
}

/**
 * Apply color overlay/tint to entire image (simpler approach)
 */
export async function tintImage(
  imageUrl: string,
  tintColor: string,
  intensity: number = 0.5
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Apply tint color overlay
      const tint = hexToRgb(tintColor);
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = `rgba(${tint.r}, ${tint.g}, ${tint.b}, ${intensity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Return as data URL
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;
  });
}

/**
 * Extract colors from image (find dominant/common colors)
 */
export async function extractColors(
  imageUrl: string,
  numColors: number = 5
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Scale down for faster processing
      const scale = 0.1;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Count color occurrences
      const colorCounts = new Map<string, number>();

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Skip transparent pixels
        if (a < 128) continue;

        // Quantize color to reduce variations
        const qr = Math.round(r / 32) * 32;
        const qg = Math.round(g / 32) * 32;
        const qb = Math.round(b / 32) * 32;

        const colorKey = `${qr},${qg},${qb}`;
        colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
      }

      // Sort by frequency
      const sortedColors = Array.from(colorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, numColors)
        .map(([color]) => {
          const [r, g, b] = color.split(',').map(Number);
          return rgbToHex(r, g, b);
        });

      resolve(sortedColors);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;
  });
}

// Helper functions
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function isColorSimilar(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
  tolerance: number
): boolean {
  return (
    Math.abs(color1.r - color2.r) <= tolerance &&
    Math.abs(color1.g - color2.g) <= tolerance &&
    Math.abs(color1.b - color2.b) <= tolerance
  );
}
