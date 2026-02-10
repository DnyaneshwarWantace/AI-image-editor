import { useState, useCallback } from 'react';
import { ColorPalette } from '@/lib/carousel/color-palettes';
import type { Canvas as FabricCanvas } from 'fabric';

export interface CarouselColorState {
  background: string;
  text: string;
  accent: string;
}

export interface UseCarouselColorsProps {
  canvases?: FabricCanvas[];
  onColorsChange?: (colors: CarouselColorState) => void;
}

export function useCarouselColors({ canvases = [], onColorsChange }: UseCarouselColorsProps = {}) {
  const [currentColors, setCurrentColors] = useState<CarouselColorState>({
    background: '#e9f7f2',
    text: '#2c3e50',
    accent: '#ffb43f'
  });

  const [alternateColors, setAlternateColors] = useState(false);

  // Apply palette to all slides
  const applyPalette = useCallback((palette: ColorPalette) => {
    const newColors: CarouselColorState = {
      background: palette.background,
      text: palette.text,
      accent: palette.accent
    };

    setCurrentColors(newColors);
    applyColorsToCanvases(newColors, canvases, alternateColors);
    onColorsChange?.(newColors);
  }, [canvases, alternateColors, onColorsChange]);

  // Apply custom color change
  const updateColor = useCallback((type: 'background' | 'text' | 'accent', color: string) => {
    const newColors = { ...currentColors, [type]: color };
    setCurrentColors(newColors);
    applyColorsToCanvases(newColors, canvases, alternateColors);
    onColorsChange?.(newColors);
  }, [currentColors, canvases, alternateColors, onColorsChange]);

  // Toggle alternate colors
  const toggleAlternateColors = useCallback((enabled: boolean) => {
    setAlternateColors(enabled);
    applyColorsToCanvases(currentColors, canvases, enabled);
  }, [currentColors, canvases]);

  return {
    currentColors,
    alternateColors,
    applyPalette,
    updateColor,
    toggleAlternateColors
  };
}

// Helper function to apply colors to canvases
function applyColorsToCanvases(
  colors: CarouselColorState,
  canvases: FabricCanvas[],
  alternate: boolean
) {
  if (!canvases || canvases.length === 0) return;

  canvases.forEach((canvas, index) => {
    if (!canvas) return;

    // Determine colors for this slide
    const slideColors = alternate && index % 2 === 1
      ? invertColors(colors)
      : colors;

    // Apply background color to workspace
    const workspace = canvas.getObjects().find((obj: any) => (obj as any).id === 'workspace');
    if (workspace) {
      workspace.set('fill', slideColors.background);
      // Clear any background image/effect when applying solid color
      canvas.backgroundImage = null;
    } else {
      // Fallback to canvas backgroundColor if no workspace
      canvas.backgroundColor = slideColors.background;
    }

    // Update all text objects
    const textObjects = canvas.getObjects().filter(obj =>
      obj.type === 'textbox' || obj.type === 'text' || obj.type === 'i-text'
    );

    textObjects.forEach(text => {
      text.set({ fill: slideColors.text });
    });

    // Update accent color elements (circles, decorative shapes)
    const decorativeObjects = canvas.getObjects().filter(obj =>
      (obj as any).isDecorative === true || obj.type === 'circle'
    );

    decorativeObjects.forEach(shape => {
      shape.set({
        fill: slideColors.accent,
        opacity: 0.2
      });
    });

    canvas.renderAll();
  });
}

// Helper to invert/alternate colors
function invertColors(colors: CarouselColorState): CarouselColorState {
  // Swap background and text for alternating effect
  return {
    background: colors.text,
    text: colors.background,
    accent: colors.accent
  };
}

// Helper to lighten color (for accent variations)
export function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Helper to convert hex to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}
