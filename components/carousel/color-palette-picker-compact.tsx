"use client";

import React, { useState } from 'react';
import {
  COLOR_PALETTES,
  PALETTE_CATEGORIES,
  getPalettesByCategory,
  ColorPalette
} from '@/lib/carousel/color-palettes';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';

interface ColorPalettePickerProps {
  selectedPalette?: ColorPalette;
  customColors?: {
    background: string;
    text: string;
    accent: string;
  };
  alternateColors?: boolean;
  onPaletteSelect?: (palette: ColorPalette) => void;
  onCustomColorChange?: (type: 'background' | 'text' | 'accent', color: string) => void;
  onAlternateColorsChange?: (enabled: boolean) => void;
}

export function ColorPalettePickerCompact({
  selectedPalette,
  customColors = {
    background: '#e9f7f2',
    text: '#2c3e50',
    accent: '#ffb43f'
  },
  alternateColors = false,
  onPaletteSelect,
  onCustomColorChange,
  onAlternateColorsChange
}: ColorPalettePickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('dark');
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showTextPicker, setShowTextPicker] = useState(false);
  const [showAccentPicker, setShowAccentPicker] = useState(false);

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-xs uppercase tracking-wide text-gray-700">
          Color Palette
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="p-3 pt-0 space-y-3">
          {/* Category Tabs - Vertical */}
          <div className="flex flex-col gap-1">
            {PALETTE_CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`
                  text-xs font-medium px-2 py-1.5 rounded transition-colors text-left
                  ${activeCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Palette Grid - 4 columns for compact sidebar */}
          <div className="grid grid-cols-4 gap-1.5">
            {getPalettesByCategory(activeCategory).map(palette => (
              <button
                key={palette.id}
                onClick={() => onPaletteSelect?.(palette)}
                className={`
                  h-10 rounded overflow-hidden flex flex-col border-2 transition-all
                  ${selectedPalette?.id === palette.id
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-400'
                  }
                `}
                title={palette.name}
              >
                <div
                  className="w-full h-1/2"
                  style={{ backgroundColor: palette.background }}
                />
                <div
                  className="w-full h-1/2"
                  style={{ backgroundColor: palette.accent }}
                />
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 pt-3">
            <span className="text-xs text-gray-500">Custom Colors</span>
          </div>

          {/* Custom Color Pickers - Compact */}
          <div className="space-y-2">
            {/* Background Color */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Background
              </label>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowBackgroundPicker(!showBackgroundPicker);
                    setShowTextPicker(false);
                    setShowAccentPicker(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 border border-gray-300 rounded hover:border-gray-400 transition-colors"
                >
                  <div
                    className="w-6 h-6 rounded border border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: customColors.background }}
                  />
                  <span className="text-xs font-mono text-gray-700 truncate">
                    {customColors.background}
                  </span>
                </button>
                {showBackgroundPicker && (
                  <div className="absolute z-20 mt-1 p-2 bg-white rounded-lg shadow-xl border border-gray-200 left-0 right-0">
                    <HexColorPicker
                      color={customColors.background}
                      onChange={(color) => onCustomColorChange?.('background', color)}
                      style={{ width: '100%', height: '150px' }}
                    />
                    <button
                      onClick={() => setShowBackgroundPicker(false)}
                      className="mt-2 w-full px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Text Color */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Text
              </label>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowTextPicker(!showTextPicker);
                    setShowBackgroundPicker(false);
                    setShowAccentPicker(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 border border-gray-300 rounded hover:border-gray-400 transition-colors"
                >
                  <div
                    className="w-6 h-6 rounded border border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: customColors.text }}
                  />
                  <span className="text-xs font-mono text-gray-700 truncate">
                    {customColors.text}
                  </span>
                </button>
                {showTextPicker && (
                  <div className="absolute z-20 mt-1 p-2 bg-white rounded-lg shadow-xl border border-gray-200 left-0 right-0">
                    <HexColorPicker
                      color={customColors.text}
                      onChange={(color) => onCustomColorChange?.('text', color)}
                      style={{ width: '100%', height: '150px' }}
                    />
                    <button
                      onClick={() => setShowTextPicker(false)}
                      className="mt-2 w-full px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Accent
              </label>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowAccentPicker(!showAccentPicker);
                    setShowBackgroundPicker(false);
                    setShowTextPicker(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 border border-gray-300 rounded hover:border-gray-400 transition-colors"
                >
                  <div
                    className="w-6 h-6 rounded border border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: customColors.accent }}
                  />
                  <span className="text-xs font-mono text-gray-700 truncate">
                    {customColors.accent}
                  </span>
                </button>
                {showAccentPicker && (
                  <div className="absolute z-20 mt-1 p-2 bg-white rounded-lg shadow-xl border border-gray-200 left-0 right-0">
                    <HexColorPicker
                      color={customColors.accent}
                      onChange={(color) => onCustomColorChange?.('accent', color)}
                      style={{ width: '100%', height: '150px' }}
                    />
                    <button
                      onClick={() => setShowAccentPicker(false)}
                      className="mt-2 w-full px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Alternate Colors Checkbox */}
          <div className="pt-2 border-t border-gray-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={alternateColors}
                onChange={(e) => onAlternateColorsChange?.(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-700">
                Alternate Between Slides
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
