"use client";

import React, { useState, useRef } from 'react';
import { useCanvasContext } from '@/providers/canvas-provider';
import { extractColors, recolorImage } from '@/lib/carousel/image-color-replace';
import { toast } from 'sonner';
import { Upload, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomBackgroundUploadProps {
  currentAccentColor?: string;
  currentBackgroundColor?: string;
}

export function CustomBackgroundUpload({
  currentAccentColor = '#8B5CF6',
  currentBackgroundColor = '#1a4d3e'
}: CustomBackgroundUploadProps) {
  const { canvas } = useCanvasContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [colorMappings, setColorMappings] = useState<{ [key: string]: string }>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setIsProcessing(true);
    toast.info('Analyzing image colors...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageUrl = event.target?.result as string;
      setUploadedImage(imageUrl);

      try {
        // Extract colors from image
        const colors = await extractColors(imageUrl, 5);
        setExtractedColors(colors);

        // Auto-map first 2 colors
        const initialMappings: { [key: string]: string } = {};
        if (colors[0]) initialMappings[colors[0]] = currentBackgroundColor;
        if (colors[1]) initialMappings[colors[1]] = currentAccentColor;

        setColorMappings(initialMappings);
        toast.success(`Found ${colors.length} colors in image!`);
      } catch (error) {
        console.error('Error extracting colors:', error);
        toast.error('Failed to analyze image');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleApplyToCanvas = async () => {
    if (!uploadedImage || !canvas) {
      toast.error('No image or canvas available');
      return;
    }

    setIsProcessing(true);
    toast.info('Recoloring image...');

    try {
      // Create color replacement list
      const replacements = Object.entries(colorMappings).map(([from, to]) => ({
        from,
        to
      }));

      // Recolor image
      const recoloredImageUrl = await recolorImage(uploadedImage, replacements);

      // Load to Fabric.js
      const { FabricImage } = await import('fabric');
      const fabricImage = await FabricImage.fromURL(recoloredImageUrl, {}, {
        left: 0,
        top: 0,
        scaleX: 1080 / 1080,  // Scale to canvas width
        scaleY: 1350 / 1350,  // Scale to canvas height
        selectable: false,
        evented: false,
      });

      // Apply to canvas background
      canvas.backgroundImage = fabricImage;
      canvas.requestRenderAll();

      toast.success('Background applied!');
    } catch (error) {
      console.error('Error applying background:', error);
      toast.error('Failed to apply background');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleColorMappingChange = (originalColor: string, newColor: string) => {
    setColorMappings(prev => ({
      ...prev,
      [originalColor]: newColor
    }));
  };

  const handleQuickMap = (type: 'accent' | 'background') => {
    if (extractedColors.length === 0) return;

    const newMappings = { ...colorMappings };

    if (type === 'background') {
      // Map first color to background
      newMappings[extractedColors[0]] = currentBackgroundColor;
    } else {
      // Map remaining colors to accent
      extractedColors.slice(1).forEach(color => {
        newMappings[color] = currentAccentColor;
      });
    }

    setColorMappings(newMappings);
    toast.success(`Mapped colors to ${type}`);
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Custom Background
        </h3>
      </div>

      {/* Upload Button */}
      {!uploadedImage && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full"
            disabled={isProcessing}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Background Image
          </Button>
          <p className="text-xs text-gray-600 mt-2">
            Upload a PNG/JPG and we'll recolor it to match your theme!
          </p>
        </div>
      )}

      {/* Image Preview & Color Mapping */}
      {uploadedImage && (
        <div className="space-y-3">
          {/* Preview */}
          <div className="relative aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300">
            <img
              src={uploadedImage}
              alt="Uploaded background"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Extracted Colors */}
          {extractedColors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">
                  Found Colors:
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleQuickMap('background')}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Map to BG
                  </button>
                  <button
                    onClick={() => handleQuickMap('accent')}
                    className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-700"
                  >
                    Map to Accent
                  </button>
                </div>
              </div>

              {/* Color Mapping List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {extractedColors.map((color, index) => (
                  <div
                    key={color}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200"
                  >
                    {/* Original Color */}
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="w-6 h-6 rounded border border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-mono text-gray-600">
                        {color}
                      </span>
                    </div>

                    <span className="text-gray-400">→</span>

                    {/* New Color */}
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colorMappings[color] || color}
                        onChange={(e) => handleColorMappingChange(color, e.target.value)}
                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                      />
                      <span className="text-xs font-mono text-gray-600">
                        {colorMappings[color] || color}
                      </span>
                    </div>

                    {/* Quick set buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleColorMappingChange(color, currentBackgroundColor)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Use background color"
                      >
                        <div className="w-4 h-4 rounded border" style={{ backgroundColor: currentBackgroundColor }} />
                      </button>
                      <button
                        onClick={() => handleColorMappingChange(color, currentAccentColor)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Use accent color"
                      >
                        <div className="w-4 h-4 rounded border" style={{ backgroundColor: currentAccentColor }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleApplyToCanvas}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Apply to Canvas
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                setUploadedImage(null);
                setExtractedColors([]);
                setColorMappings({});
              }}
              variant="outline"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200 space-y-1">
        <p className="font-medium">How it works:</p>
        <ol className="list-decimal ml-4 space-y-1">
          <li>Upload your background PNG/JPG</li>
          <li>We detect colors in the image</li>
          <li>Map those colors to your theme colors</li>
          <li>Apply the recolored background!</li>
        </ol>
      </div>
    </div>
  );
}
