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

export function ColorPalettePicker({
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
  const [isExpanded, setIsExpanded] = useState(true);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showTextPicker, setShowTextPicker] = useState(false);
  const [showAccentPicker, setShowAccentPicker] = useState(false);

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
      >
        <span className="font-semibold text-sm uppercase tracking-wide text-gray-700">
          Color Palette
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Category Tabs */}
          <div className="flex gap-4 border-b border-gray-200 pb-2">
            {PALETTE_CATEGORIES.map(category => (
              <button
                key={category.id}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 pb-2"
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Palette Grid */}
          <div className="space-y-3">
            {PALETTE_CATEGORIES.map(category => (
              <div key={category.id}>
                <div className="grid grid-cols-8 gap-2">
                  {getPalettesByCategory(category.id).map(palette => (
                    <button
                      key={palette.id}
                      onClick={() => onPaletteSelect?.(palette)}
                      className={`
                        h-8 rounded overflow-hidden flex border-2 transition-all
                        ${selectedPalette?.id === palette.id
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-400'
                        }
                      `}
                      title={palette.name}
                    >
                      <div
                        className="w-1/2 h-full"
                        style={{ backgroundColor: palette.background }}
                      />
                      <div
                        className="w-1/2 h-full"
                        style={{ backgroundColor: palette.accent }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="pt-2 text-center">
            <span className="text-xs text-gray-500">or pick your own colors</span>
          </div>

          {/* Custom Color Pickers */}
          <div className="space-y-3">
            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
                  className="w-full flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: customColors.background }}
                  />
                  <span className="text-sm font-mono text-gray-700">
                    {customColors.background}
                  </span>
                </button>
                {showBackgroundPicker && (
                  <div className="absolute z-10 mt-2 p-3 bg-white rounded-lg shadow-xl border border-gray-200">
                    <HexColorPicker
                      color={customColors.background}
                      onChange={(color) => onCustomColorChange?.('background', color)}
                    />
                    <button
                      onClick={() => setShowBackgroundPicker(false)}
                      className="mt-2 w-full px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Text Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Color
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowTextPicker(!showTextPicker)}
                  className="w-full flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: customColors.text }}
                  />
                  <span className="text-sm font-mono text-gray-700">
                    {customColors.text}
                  </span>
                </button>
                {showTextPicker && (
                  <div className="absolute z-10 mt-2 p-3 bg-white rounded-lg shadow-xl border border-gray-200">
                    <HexColorPicker
                      color={customColors.text}
                      onChange={(color) => onCustomColorChange?.('text', color)}
                    />
                    <button
                      onClick={() => setShowTextPicker(false)}
                      className="mt-2 w-full px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accent Color
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowAccentPicker(!showAccentPicker)}
                  className="w-full flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: customColors.accent }}
                  />
                  <span className="text-sm font-mono text-gray-700">
                    {customColors.accent}
                  </span>
                </button>
                {showAccentPicker && (
                  <div className="absolute z-10 mt-2 p-3 bg-white rounded-lg shadow-xl border border-gray-200">
                    <HexColorPicker
                      color={customColors.accent}
                      onChange={(color) => onCustomColorChange?.('accent', color)}
                    />
                    <button
                      onClick={() => setShowAccentPicker(false)}
                      className="mt-2 w-full px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Alternate Colors Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={alternateColors}
                onChange={(e) => onAlternateColorsChange?.(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Alternate Colors Between Slides
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
