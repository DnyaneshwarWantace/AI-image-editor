export interface BackgroundEffect {
  id: string;
  name: string;
  thumbnail: string;
  generateSVG: (accentColor: string, backgroundColor: string) => string;
}

// Helper to create gradient circles with accent color
function createCircleGradient(id: string, color: string, opacity: number): string {
  return `
    <radialGradient id="${id}">
      <stop offset="0%" stop-color="${color}" stop-opacity="${opacity}"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </radialGradient>
  `;
}

export const BACKGROUND_EFFECTS: BackgroundEffect[] = [
  {
    id: 'circles-modern',
    name: 'Modern Circles',
    thumbnail: 'circles',
    generateSVG: (accentColor: string, backgroundColor: string) => `
      <svg width="1080" height="1350" viewBox="0 0 1080 1350" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Soft gradient circles -->
          <radialGradient id="circle1">
            <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.35"/>
            <stop offset="70%" stop-color="${accentColor}" stop-opacity="0.15"/>
            <stop offset="100%" stop-color="${accentColor}" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="circle2">
            <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.30"/>
            <stop offset="70%" stop-color="${accentColor}" stop-opacity="0.12"/>
            <stop offset="100%" stop-color="${accentColor}" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="circle3">
            <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.25"/>
            <stop offset="70%" stop-color="${accentColor}" stop-opacity="0.10"/>
            <stop offset="100%" stop-color="${accentColor}" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="circle4">
            <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.28"/>
            <stop offset="70%" stop-color="${accentColor}" stop-opacity="0.12"/>
            <stop offset="100%" stop-color="${accentColor}" stop-opacity="0"/>
          </radialGradient>
          <filter id="blur1" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="30"/>
          </filter>
        </defs>

        <!-- Background -->
        <rect width="1080" height="1350" fill="${backgroundColor}"/>

        <!-- Top left circle (overflow top-left) -->
        <circle cx="-50" cy="-50" r="300" fill="url(#circle1)" filter="url(#blur1)"/>

        <!-- Top right circle (overflow top-right) -->
        <circle cx="1130" cy="-30" r="280" fill="url(#circle2)" filter="url(#blur1)"/>

        <!-- Bottom left circle (overflow bottom-left) -->
        <circle cx="-80" cy="1400" r="320" fill="url(#circle3)" filter="url(#blur1)"/>

        <!-- Bottom center circle -->
        <circle cx="540" cy="1380" r="300" fill="url(#circle3)" filter="url(#blur1)"/>

        <!-- Bottom right circle (overflow bottom-right) -->
        <circle cx="1150" cy="1420" r="340" fill="url(#circle4)" filter="url(#blur1)"/>
      </svg>
    `
  },

  {
    id: 'circles-minimal',
    name: 'Minimal Circles',
    thumbnail: 'circles-minimal',
    generateSVG: (accentColor: string, backgroundColor: string) => `
      <svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
        <rect width="1080" height="1350" fill="${backgroundColor}"/>
        <defs>
          ${createCircleGradient('cmin1', accentColor, 0.15)}
          ${createCircleGradient('cmin2', accentColor, 0.1)}
        </defs>

        <!-- Top right -->
        <circle cx="900" cy="150" r="200" fill="url(#cmin1)"/>

        <!-- Bottom left -->
        <circle cx="200" cy="1200" r="250" fill="url(#cmin2)"/>
      </svg>
    `
  },

  {
    id: 'circles-bold',
    name: 'Bold Circles',
    thumbnail: 'circles-bold',
    generateSVG: (accentColor: string, backgroundColor: string) => `
      <svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
        <rect width="1080" height="1350" fill="${backgroundColor}"/>
        <defs>
          ${createCircleGradient('cbold1', accentColor, 0.4)}
          ${createCircleGradient('cbold2', accentColor, 0.35)}
          ${createCircleGradient('cbold3', accentColor, 0.3)}
          ${createCircleGradient('cbold4', accentColor, 0.35)}
        </defs>

        <!-- Top left -->
        <circle cx="-50" cy="-50" r="300" fill="url(#cbold1)"/>

        <!-- Top right -->
        <circle cx="1130" cy="100" r="350" fill="url(#cbold2)"/>

        <!-- Center -->
        <circle cx="540" cy="675" r="400" fill="url(#cbold3)"/>

        <!-- Bottom right -->
        <circle cx="1080" cy="1400" r="450" fill="url(#cbold4)"/>
      </svg>
    `
  },

  {
    id: 'blobs-organic',
    name: 'Organic Blobs',
    thumbnail: 'blobs',
    generateSVG: (accentColor: string, backgroundColor: string) => `
      <svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
        <rect width="1080" height="1350" fill="${backgroundColor}"/>
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -10" result="goo" />
          </filter>
        </defs>
        <g filter="url(#goo)" opacity="0.2">
          <circle cx="150" cy="150" r="180" fill="${accentColor}"/>
          <circle cx="300" cy="100" r="150" fill="${accentColor}"/>
          <circle cx="950" cy="200" r="200" fill="${accentColor}"/>
          <circle cx="800" cy="120" r="160" fill="${accentColor}"/>
          <circle cx="200" cy="1200" r="220" fill="${accentColor}"/>
          <circle cx="350" cy="1150" r="180" fill="${accentColor}"/>
        </g>
      </svg>
    `
  },

  {
    id: 'gradient-diagonal',
    name: 'Diagonal Gradient',
    thumbnail: 'gradient',
    generateSVG: (accentColor: string, backgroundColor: string) => `
      <svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="diagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${backgroundColor}" stop-opacity="1"/>
            <stop offset="50%" stop-color="${accentColor}" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="${backgroundColor}" stop-opacity="1"/>
          </linearGradient>
        </defs>
        <rect width="1080" height="1350" fill="url(#diagGrad)"/>
      </svg>
    `
  },

  {
    id: 'waves-abstract',
    name: 'Abstract Waves',
    thumbnail: 'waves',
    generateSVG: (accentColor: string, backgroundColor: string) => `
      <svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
        <rect width="1080" height="1350" fill="${backgroundColor}"/>
        <path d="M0,400 Q270,300 540,400 T1080,400 L1080,1350 L0,1350 Z"
              fill="${accentColor}" opacity="0.1"/>
        <path d="M0,600 Q270,500 540,600 T1080,600 L1080,1350 L0,1350 Z"
              fill="${accentColor}" opacity="0.15"/>
        <path d="M0,900 Q270,800 540,900 T1080,900 L1080,1350 L0,1350 Z"
              fill="${accentColor}" opacity="0.1"/>
      </svg>
    `
  },

  {
    id: 'dots-pattern',
    name: 'Dot Pattern',
    thumbnail: 'dots',
    generateSVG: (accentColor: string, backgroundColor: string) => {
      let dots = '';
      for (let y = 50; y < 1350; y += 100) {
        for (let x = 50; x < 1080; x += 100) {
          const opacity = Math.random() * 0.15 + 0.05;
          dots += `<circle cx="${x}" cy="${y}" r="3" fill="${accentColor}" opacity="${opacity}"/>`;
        }
      }
      return `
        <svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
          <rect width="1080" height="1350" fill="${backgroundColor}"/>
          ${dots}
        </svg>
      `;
    }
  },

  {
    id: 'blobs-vertical',
    name: 'Blobs Vertical',
    thumbnail: 'blobs',
    generateSVG: (accentColor: string, backgroundColor: string) => `
      <svg width="1080" height="1350" viewBox="0 0 1080 1350" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="blobBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="40"/>
          </filter>
          <radialGradient id="blobGrad1">
            <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.4"/>
            <stop offset="70%" stop-color="${accentColor}" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="${accentColor}" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="blobGrad2">
            <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.35"/>
            <stop offset="70%" stop-color="${accentColor}" stop-opacity="0.15"/>
            <stop offset="100%" stop-color="${accentColor}" stop-opacity="0"/>
          </radialGradient>
        </defs>

        <!-- Background -->
        <rect width="1080" height="1350" fill="${backgroundColor}"/>

        <!-- Top left blob (vertical oval) -->
        <ellipse cx="220" cy="-50" rx="140" ry="300" fill="url(#blobGrad1)" filter="url(#blobBlur)"/>

        <!-- Top right blob (vertical oval) -->
        <ellipse cx="860" cy="-50" rx="140" ry="300" fill="url(#blobGrad2)" filter="url(#blobBlur)"/>

        <!-- Bottom left blob (vertical oval) -->
        <ellipse cx="220" cy="1400" rx="140" ry="300" fill="url(#blobGrad2)" filter="url(#blobBlur)"/>

        <!-- Bottom right blob (vertical oval) -->
        <ellipse cx="860" cy="1400" rx="140" ry="300" fill="url(#blobGrad1)" filter="url(#blobBlur)"/>
      </svg>
    `
  },

  {
    id: 'none',
    name: 'None',
    thumbnail: 'none',
    generateSVG: (_accentColor: string, backgroundColor: string) => `
      <svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
        <rect width="1080" height="1350" fill="${backgroundColor}"/>
      </svg>
    `
  }
];

export function getBackgroundEffectById(id: string): BackgroundEffect | undefined {
  return BACKGROUND_EFFECTS.find(effect => effect.id === id);
}

export async function applyBackgroundEffectToCanvas(
  canvas: any,
  effectId: string,
  accentColor: string,
  backgroundColor: string
): Promise<void> {
  const effect = getBackgroundEffectById(effectId);
  if (!effect) {
    throw new Error(`Effect ${effectId} not found`);
  }

  // SVG-based effects
  const svgString = effect.generateSVG(accentColor, backgroundColor);

  // Convert SVG to data URL
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    // Dynamically import Fabric.js Image class
    const { FabricImage } = await import('fabric');

    // Load image using Fabric.js v6 API
    const fabricImage = await FabricImage.fromURL(url, {}, {
      left: 0,
      top: 0,
      selectable: false,
      evented: false,
      excludeFromExport: false,
    });

    // Find workspace and make it transparent
    const workspace = canvas.getObjects().find((obj: any) => obj.id === 'workspace');
    if (workspace) {
      workspace.set('fill', 'transparent');
    }

    // Fabric.js v6: set background via property (no setBackgroundImage method)
    canvas.backgroundImage = fabricImage;
    canvas.requestRenderAll();
    URL.revokeObjectURL(url);
  } catch (error) {
    URL.revokeObjectURL(url);
    throw new Error('Failed to load effect image: ' + error);
  }
}
