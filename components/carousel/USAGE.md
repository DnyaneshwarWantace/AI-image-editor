# Color Palette System - Usage Guide

## Overview

This color palette system provides a professional UI for managing colors across carousel slides with:
- Pre-defined color palettes (Dark, Light, Vibrant, Pastel, Muted)
- Custom color pickers for Background, Text, and Accent colors
- Alternate colors between slides option
- Real-time application to all slides

## Installation

The system requires `react-colorful` for color pickers:

```bash
npm install react-colorful
```

## Basic Usage

```tsx
"use client";

import { ColorPalettePicker } from '@/components/carousel/color-palette-picker';
import { useCarouselColors } from '@/hooks/useCarouselColors';
import { useState } from 'react';

export default function CarouselEditor() {
  const [canvases, setCanvases] = useState<FabricCanvas[]>([]);

  const {
    currentColors,
    alternateColors,
    applyPalette,
    updateColor,
    toggleAlternateColors
  } = useCarouselColors({
    canvases,
    onColorsChange: (colors) => {
      console.log('Colors updated:', colors);
    }
  });

  return (
    <div className="flex">
      {/* Sidebar with color palette */}
      <div className="w-80 p-4">
        <ColorPalettePicker
          customColors={currentColors}
          alternateColors={alternateColors}
          onPaletteSelect={applyPalette}
          onCustomColorChange={updateColor}
          onAlternateColorsChange={toggleAlternateColors}
        />
      </div>

      {/* Main editor area */}
      <div className="flex-1">
        {/* Your canvas/slides here */}
      </div>
    </div>
  );
}
```

## Features

### 1. Pre-defined Palettes

Users can click any palette to instantly apply it to all slides:

```tsx
// When user clicks a palette
const palette = {
  background: '#1a4d3e',
  text: '#ffffff',
  accent: '#8B5CF6'
};

applyPalette(palette);
// → All slides updated with these colors
```

### 2. Custom Color Pickers

Users can pick custom colors for each element:

```tsx
// When user picks a color
updateColor('background', '#1a4d3e');  // Background color
updateColor('text', '#ffffff');        // Text color
updateColor('accent', '#8B5CF6');      // Accent/decorative elements
```

### 3. Alternate Colors Between Slides

Create dynamic carousels by alternating colors:

```tsx
toggleAlternateColors(true);

// Result:
// Slide 1: Background=#1a4d3e, Text=#ffffff
// Slide 2: Background=#ffffff, Text=#1a4d3e (inverted!)
// Slide 3: Background=#1a4d3e, Text=#ffffff
// And so on...
```

### 4. Color Categories

The system provides 5 categories of pre-defined palettes:
- **Dark**: Professional dark backgrounds
- **Light**: Clean light backgrounds
- **Vibrant**: Bold, eye-catching colors
- **Pastel**: Soft, gentle colors
- **Muted**: Subdued, elegant colors

Each category has 8 color combinations.

## Integration with Fabric.js Canvas

### Marking Decorative Elements

To ensure accent colors apply correctly, mark decorative elements:

```tsx
// When creating decorative circles
const circle = new fabric.Circle({
  radius: 200,
  fill: currentColors.accent,
  opacity: 0.2
});

// Mark as decorative
(circle as any).isDecorative = true;

canvas.add(circle);
```

### Applying Colors to Existing Canvases

```tsx
// Update canvases array when slides change
useEffect(() => {
  const updatedCanvases = slides.map(slide => slide.canvas);
  setCanvases(updatedCanvases);
}, [slides]);

// Colors will automatically apply to all canvases
```

## Advanced Usage

### Custom Color Processing

```tsx
import { lightenColor, hexToRgb } from '@/hooks/useCarouselColors';

// Lighten a color
const lighter = lightenColor('#1a4d3e', 40);  // Adds 40 to RGB values

// Convert to RGB
const rgb = hexToRgb('#1a4d3e');  // { r: 26, g: 77, b: 62 }
```

### Creating Custom Palettes

```tsx
import { ColorPalette } from '@/lib/carousel/color-palettes';

const myPalette: ColorPalette = {
  id: 'my-brand',
  name: 'My Brand',
  category: 'vibrant',
  background: '#1a4d3e',
  text: '#ffffff',
  accent: '#8B5CF6'
};

// Add to palettes array or use directly
applyPalette(myPalette);
```

## API Reference

### `useCarouselColors()`

Hook for managing carousel colors.

**Props:**
- `canvases`: Array of Fabric.js canvas instances
- `onColorsChange`: Callback when colors update

**Returns:**
- `currentColors`: Current color state
- `alternateColors`: Whether alternating is enabled
- `applyPalette(palette)`: Apply a preset palette
- `updateColor(type, color)`: Update a specific color
- `toggleAlternateColors(enabled)`: Toggle alternating

### `<ColorPalettePicker />`

UI component for color selection.

**Props:**
- `selectedPalette`: Currently selected palette
- `customColors`: Current custom colors
- `alternateColors`: Alternating enabled state
- `onPaletteSelect`: Callback when palette selected
- `onCustomColorChange`: Callback when custom color changes
- `onAlternateColorsChange`: Callback when alternating toggles

## Styling

The component uses Tailwind CSS. Ensure your `tailwind.config.ts` includes:

```ts
content: [
  './components/**/*.{ts,tsx}',
  './lib/**/*.{ts,tsx}',
]
```

## Examples

### Example 1: Professional Carousel

```tsx
const colors = {
  background: '#1a4d3e',  // Dark green
  text: '#ffffff',        // White
  accent: '#8B5CF6'       // Purple accents
};
```

### Example 2: Vibrant Marketing

```tsx
const colors = {
  background: '#f97316',  // Orange
  text: '#ffffff',        // White
  accent: '#0ea5e9'       // Blue accents
};
```

### Example 3: Minimal Clean

```tsx
const colors = {
  background: '#ffffff',  // White
  text: '#1f2937',        // Dark gray
  accent: '#6366f1'       // Blue accents
};
```
