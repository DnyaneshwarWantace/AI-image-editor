"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Upload, Loader2, Check, X } from 'lucide-react';
import { useCanvasContext } from '@/providers/canvas-provider';
import { extractLayersFromImage, DetectedText, DetectedObject } from '@/lib/ai/image-layer-extractor';
import { IText, FabricImage } from 'fabric';
import { toast } from 'sonner';

export function AIExtractLayersPanel() {
  const { canvas } = useCanvasContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [results, setResults] = useState<{
    texts: number;
    objects: number;
  } | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setCurrentStage('Starting...');
    setResults(null);

    try {
      // Extract layers using AI
      const layers = await extractLayersFromImage(file, (stage, prog) => {
        setCurrentStage(stage);
        setProgress(prog);
      });

      console.log('\n=== EXTRACTION COMPLETE ===');
      console.log(`Layers received:`, {
        texts: layers.texts.length,
        objects: layers.objects.length,
        backgroundUrl: layers.background ? 'Yes' : 'No'
      });

      // Scale so layers match canvas.
      // IMPORTANT: never upscale small images (keeps quality sharp) – only shrink if bigger than canvas.
      const fitScaleX = 1080 / layers.originalWidth;
      const fitScaleY = 1350 / layers.originalHeight;
      const fitScale = Math.min(fitScaleX, fitScaleY);
      const scale = Math.min(1, fitScale);

      // LAYER 1: Add background as bottom layer (with objects removed & filled)
      console.log('\n=== ADDING LAYERS TO CANVAS ===');
      console.log('Adding clean background layer (objects removed & filled)...');
      try {
        const backgroundImage = await FabricImage.fromURL(layers.background, {}, {
          left: 0,
          top: 0,
          selectable: true,
          evented: true,
        });
        backgroundImage.scale(scale);
        canvas.add(backgroundImage);
        canvas.sendObjectToBack(backgroundImage);
        console.log('✓ Clean background layer added (objects filled in)');
      } catch (error) {
        console.error('Error adding background:', error);
      }

      // LAYER 2: Add detected objects (with background removed, text masked out) – scaled to match canvas
      let objectCount = 0;
      console.log(`\nAdding ${layers.objects.length} object layers...`);
      for (let i = 0; i < layers.objects.length; i++) {
        const obj = layers.objects[i];
        if (obj.imageWithoutBg) {
          try {
            const fabricImage = await FabricImage.fromURL(obj.imageWithoutBg, {}, {
              left: obj.x * scale,
              top: obj.y * scale,
              selectable: true,
            });
            fabricImage.scale(scale); // Match canvas scale so size matches poster
            canvas.add(fabricImage);
            objectCount++;
            console.log(`✓ Added ${obj.type} (transparent bg) at (${obj.x * scale}, ${obj.y * scale})`);
          } catch (error) {
            console.error(`❌ Error adding ${obj.type} to canvas:`, error);
          }
        } else {
          console.warn(`⚠️  Object ${obj.type} has no imageWithoutBg data, skipping`);
        }
      }

      // LAYER 3: Add detected texts – same scale, real font size & color from image
      let textCount = 0;
      console.log(`\nAdding ${layers.texts.length} text layers...`);
      for (let i = 0; i < layers.texts.length; i++) {
        const text = layers.texts[i];
        try {
          const fontSize = Math.max(12, (text.fontSize ?? 20) * scale); // Preserve poster size
          const isLargeTitle = (text.height ?? 0) > 40;
          const fabricText = new IText(text.text, {
            left: text.x * scale,
            top: text.y * scale,
            fontSize,
            fontFamily: isLargeTitle ? 'Arial Black' : (text.fontFamily || 'Arial'),
            fontWeight: isLargeTitle ? 'bold' : undefined,
            fill: text.color || '#000000',
            selectable: true,
          });
          canvas.add(fabricText);
          canvas.bringObjectToFront(fabricText);
          textCount++;
          console.log(`✓ Added text: "${text.text}" at (${text.x * scale}, ${text.y * scale}) fontSize=${fontSize}`);
        } catch (error) {
          console.error(`❌ Error adding text "${text.text}":`, error);
        }
      }

      canvas.requestRenderAll();
      console.log(`\n✓ Complete! ${textCount} text + ${objectCount} objects + 1 background`);

      setResults({
        texts: textCount,
        objects: objectCount
      });

      if (textCount === 0 && objectCount === 0) {
        toast.warning('No text or objects detected. The image may be too complex or low quality.');
      } else {
        toast.success(`Extracted ${textCount} text elements and ${objectCount} objects!`);
      }
    } catch (error) {
      console.error('Layer extraction failed:', error);
      toast.error('Failed to extract layers. Please try again.');
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full space-y-4 p-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-900">AI Layer Extraction</h3>
        </div>
        <p className="text-xs text-gray-600">
          Upload a poster and AI extracts <strong>3 clean layers</strong>: Background (text & objects removed & filled), Objects (transparent bg), and Text (fully editable)
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload button */}
      <Button
        onClick={handleUploadClick}
        disabled={isProcessing}
        className="w-full"
        variant="default"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload Image
          </>
        )}
      </Button>

      {/* Progress indicator */}
      {isProcessing && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 text-center">{currentStage}</p>
        </div>
      )}

      {/* Results */}
      {results && !isProcessing && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-green-700">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Extraction Complete!</span>
          </div>
          <div className="text-xs text-green-600 space-y-1">
            <div>✓ {results.texts} text elements extracted</div>
            <div>✓ {results.objects} objects detected</div>
          </div>
        </div>
      )}

    </div>
  );
}
