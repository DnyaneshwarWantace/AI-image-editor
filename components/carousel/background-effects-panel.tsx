"use client";

import React, { useState } from 'react';
import { useCanvasContext } from '@/providers/canvas-provider';
import {
  BACKGROUND_EFFECTS,
  applyBackgroundEffectToCanvas,
  BackgroundEffect
} from '@/lib/carousel/background-effects';
import { toast } from 'sonner';

interface BackgroundEffectsPanelProps {
  currentAccentColor?: string;
  currentBackgroundColor?: string;
}

export function BackgroundEffectsPanel({
  currentAccentColor = '#8B5CF6',
  currentBackgroundColor = '#1a4d3e'
}: BackgroundEffectsPanelProps) {
  const { canvas } = useCanvasContext();
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleEffectClick = async (effect: BackgroundEffect) => {
    if (!canvas) {
      toast.error('Canvas not ready');
      return;
    }

    setIsApplying(true);
    setSelectedEffect(effect.id);

    try {
      await applyBackgroundEffectToCanvas(
        canvas,
        effect.id,
        currentAccentColor,
        currentBackgroundColor
      );
      toast.success(`Applied: ${effect.name}`);
    } catch (error) {
      console.error('Error applying background effect:', error);
      toast.error('Failed to apply effect');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Background Effects
        </h3>
        {isApplying && (
          <span className="text-xs text-blue-600">Applying...</span>
        )}
      </div>

      <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
        <span className="font-medium">Tip:</span> Effects use your accent color from the Color Palette
      </div>

      {/* Effect Grid */}
      <div className="grid grid-cols-2 gap-3">
        {BACKGROUND_EFFECTS.map((effect) => (
          <button
            key={effect.id}
            onClick={() => handleEffectClick(effect)}
            disabled={isApplying}
            className={`
              relative group overflow-hidden rounded-lg border-2 transition-all
              ${selectedEffect === effect.id
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-400'
              }
              ${isApplying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {/* Thumbnail Preview */}
            <div className="aspect-[4/5] bg-gray-100 relative">
              <div
                className="absolute inset-0"
                style={{
                  background: effect.id === 'none'
                    ? currentBackgroundColor
                    : `linear-gradient(135deg, ${currentBackgroundColor} 0%, ${currentAccentColor}40 100%)`
                }}
              />

              {/* Visual indicator based on effect type */}
              {effect.thumbnail === 'circles' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-20 h-20 rounded-full opacity-30"
                    style={{ backgroundColor: currentAccentColor }}
                  />
                  <div
                    className="absolute top-2 right-2 w-16 h-16 rounded-full opacity-20"
                    style={{ backgroundColor: currentAccentColor }}
                  />
                </div>
              )}

              {effect.thumbnail === 'circles-minimal' && (
                <div className="absolute inset-0">
                  <div
                    className="absolute top-3 right-3 w-12 h-12 rounded-full opacity-20"
                    style={{ backgroundColor: currentAccentColor }}
                  />
                  <div
                    className="absolute bottom-3 left-3 w-14 h-14 rounded-full opacity-15"
                    style={{ backgroundColor: currentAccentColor }}
                  />
                </div>
              )}

              {effect.thumbnail === 'circles-bold' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-24 h-24 rounded-full opacity-40"
                    style={{ backgroundColor: currentAccentColor }}
                  />
                  <div
                    className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-35"
                    style={{ backgroundColor: currentAccentColor }}
                  />
                  <div
                    className="absolute bottom-0 left-0 w-18 h-18 rounded-full opacity-30"
                    style={{ backgroundColor: currentAccentColor }}
                  />
                </div>
              )}

              {effect.thumbnail === 'blobs' && (
                <div className="absolute inset-0">
                  <div
                    className="absolute top-4 left-4 w-16 h-12 rounded-[40%] opacity-25 blur-sm"
                    style={{ backgroundColor: currentAccentColor }}
                  />
                  <div
                    className="absolute bottom-4 right-4 w-14 h-16 rounded-[45%] opacity-20 blur-sm"
                    style={{ backgroundColor: currentAccentColor }}
                  />
                </div>
              )}

              {effect.thumbnail === 'gradient' && (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, transparent 0%, ${currentAccentColor}50 50%, transparent 100%)`
                  }}
                />
              )}

              {effect.thumbnail === 'waves' && (
                <div className="absolute inset-0">
                  <svg className="absolute bottom-0 w-full h-1/2" preserveAspectRatio="none" viewBox="0 0 100 50">
                    <path d="M0,30 Q25,20 50,30 T100,30 L100,50 L0,50 Z"
                          fill={currentAccentColor} opacity="0.2"/>
                  </svg>
                </div>
              )}

              {effect.thumbnail === 'dots' && (
                <div className="absolute inset-0">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: '3px',
                        height: '3px',
                        backgroundColor: currentAccentColor,
                        opacity: 0.2,
                        left: `${(i % 5) * 20 + 10}%`,
                        top: `${Math.floor(i / 5) * 20 + 10}%`
                      }}
                    />
                  ))}
                </div>
              )}

              {effect.thumbnail === 'none' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl text-gray-400">∅</span>
                </div>
              )}
            </div>

            {/* Effect Name */}
            <div className="p-2 bg-white border-t border-gray-200">
              <p className="text-xs font-medium text-gray-700 text-center truncate">
                {effect.name}
              </p>
            </div>

            {/* Selected Indicator */}
            {selectedEffect === effect.id && (
              <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                ✓
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Color Info */}
      <div className="text-xs text-gray-600 space-y-1 pt-2 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <span>Background:</span>
          <div
            className="w-4 h-4 rounded border border-gray-300"
            style={{ backgroundColor: currentBackgroundColor }}
          />
          <span className="font-mono">{currentBackgroundColor}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Accent:</span>
          <div
            className="w-4 h-4 rounded border border-gray-300"
            style={{ backgroundColor: currentAccentColor }}
          />
          <span className="font-mono">{currentAccentColor}</span>
        </div>
      </div>
    </div>
  );
}
