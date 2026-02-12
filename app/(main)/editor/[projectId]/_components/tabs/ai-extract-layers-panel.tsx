"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Upload, Loader2, Check, X } from 'lucide-react';
import { useCanvasContext } from '@/providers/canvas-provider';
import {
  analyzeImageForLayerExtraction,
  buildLayersFromAnalysis,
  ExtractionAnalysis,
} from '@/lib/ai/image-layer-extractor';
import { IText, FabricImage, Rect } from 'fabric';
import { toast } from 'sonner';

export function AIExtractLayersPanel() {
  const { canvas } = useCanvasContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [analysis, setAnalysis] = useState<ExtractionAnalysis | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<Record<number, boolean>>({});
  const [selectedTexts, setSelectedTexts] = useState<Record<number, boolean>>({});
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
    setAnalysis(null);

    try {
      const a = await analyzeImageForLayerExtraction(file, (stage, prog) => {
        setCurrentStage(stage);
        setProgress(prog);
      });

      setAnalysis(a);
      setSelectedObjects(Object.fromEntries(a.objects.map((_, i) => [i, true])));
      setSelectedTexts(Object.fromEntries(a.texts.map((_, i) => [i, true])));
      toast.success(`Detected ${a.texts.length} text + ${a.objects.length} objects. Choose what to extract.`);
      return;
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Failed to analyze image. Please try again.');
      return;
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBuildLayers = async () => {
    if (!analysis || !canvas) return;

    const removeObjectIndexes = Object.entries(selectedObjects)
      .filter(([, v]) => v)
      .map(([k]) => Number(k));
    const removeTextIndexes = Object.entries(selectedTexts)
      .filter(([, v]) => v)
      .map(([k]) => Number(k));

    // Same selection drives extraction: only selected items become editable layers.
    const extractObjectIndexes = removeObjectIndexes;
    const extractTextIndexes = removeTextIndexes;

    setIsProcessing(true);
    setProgress(0);
    setCurrentStage('Building layers...');
    setResults(null);

    try {
      const layers = await buildLayersFromAnalysis(
        analysis,
        {
          removeObjectIndexes,
          removeTextIndexes,
          extractObjectIndexes,
          extractTextIndexes,
        },
        (stage, prog) => {
          setCurrentStage(stage);
          setProgress(prog);
        }
      );

      // IMPORTANT: Resize canvas to EXACT image dimensions
      console.log(`\n=== CANVAS SETUP ===`);
      console.log(`Target dimensions: ${layers.originalWidth} x ${layers.originalHeight}`);
      console.log(`Current canvas: ${canvas.getWidth()} x ${canvas.getHeight()}`);

      // Remove all objects from canvas
      const allObjects = canvas.getObjects();
      console.log(`Removing ${allObjects.length} existing objects...`);
      allObjects.forEach(obj => canvas.remove(obj));
      canvas.clear();

      // Dispatch event to update canvas size in canvas-area component
      const canvasSizeEvent = new CustomEvent('canvasSizeChange', {
        detail: {
          width: layers.originalWidth,
          height: layers.originalHeight
        }
      });
      window.dispatchEvent(canvasSizeEvent);
      console.log(`✓ Dispatched canvasSizeChange event: ${layers.originalWidth}x${layers.originalHeight}`);

      // Wait for canvas to resize (give it a moment to process the event)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify canvas size
      console.log(`Canvas after resize: ${canvas.getWidth()} x ${canvas.getHeight()}`);

      // Recreate workspace at new size
      const workspace = new Rect({
        width: layers.originalWidth,
        height: layers.originalHeight,
        fill: '#ffffff',
        selectable: false,
        evented: false,
        id: 'workspace',
      });
      canvas.add(workspace);
      canvas.sendObjectToBack(workspace);

      canvas.requestRenderAll();
      console.log(`✓ Canvas setup complete`);

      // No scaling - 1:1 exact positioning
      const scale = 1;

      // LAYER 1: Add clean background as bottom layer (Gemini removed all objects/text and filled)
      console.log('\n=== ADDING LAYERS TO CANVAS ===');
      console.log('Adding clean background layer (Gemini Nano Banana)...');
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
        console.log('✓ Clean background layer added (all objects/text removed by Gemini)');
      } catch (error) {
        console.error('Error adding background:', error);
      }

      // LAYER 2: Add selected objects as transparent PNG layers (full-size images from Nano Banana)
      let objectCount = 0;
      console.log(`\n=== OBJECT LAYERS ===`);
      console.log(`Adding ${layers.objects.length} transparent object layers...`);

      for (let i = 0; i < layers.objects.length; i++) {
        const obj = layers.objects[i];
        if (!obj.imageWithoutBg) {
          console.log(`⚠️  Object ${i + 1} (${obj.type}) has no transparent image, skipping`);
          continue;
        }
        try {
          // Nano Banana returns full-size transparent PNG (same dimensions as original image)
          // So place at (0, 0), not at object bbox position
          console.log(`Adding object ${i + 1}/${layers.objects.length}: ${obj.type}`);
          const fabricImage = await FabricImage.fromURL(obj.imageWithoutBg, {}, {
            left: 0,   // Full-size transparent PNG, position at origin
            top: 0,    // Full-size transparent PNG, position at origin
            selectable: true,
            objectCaching: false,
          });
          canvas.add(fabricImage);
          objectCount++;
          console.log(`  ✓ Added ${obj.type} layer successfully`);
        } catch (error) {
          console.error(`❌ Error adding ${obj.type} layer:`, error);
        }
      }

      // LAYER 3: Add detected texts at EXACT positions (fully editable)
      let textCount = 0;
      console.log(`\n=== ADDING ${layers.texts.length} TEXT LAYERS ===`);

      for (let i = 0; i < layers.texts.length; i++) {
        const text = layers.texts[i];
        try {
          // Use exact font size from detection (no scaling since scale = 1)
          const fontSize = Math.max(12, text.fontSize ?? text.height ?? 20);
          const isLargeTitle = fontSize > 40; // Consider large if > 40px

          console.log(`Text ${i + 1}: "${text.text}" at (${text.x}, ${text.y}) fontSize=${fontSize}px`);

          const fabricText = new IText(text.text, {
            left: text.x,  // EXACT position, no scaling
            top: text.y,   // EXACT position, no scaling
            fontSize,
            fontFamily: isLargeTitle ? 'Arial Black' : (text.fontFamily || 'Arial'),
            fontWeight: isLargeTitle ? 'bold' : 'normal',
            fill: text.color || '#000000',
            selectable: true,
          });
          canvas.add(fabricText);
          canvas.bringObjectToFront(fabricText); // Always on top
          textCount++;
          console.log(`  ✓ Added text "${text.text}" successfully`);
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
          Upload an image and AI extracts <strong>3 clean layers</strong>: Clean Background (objects/text removed & filled with Gemini), Objects (transparent PNG), and Text (fully editable)
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

      {/* Selection UI (after analysis) */}
      {analysis && !isProcessing && (
        <div className="space-y-3">
          <div className="rounded-lg border border-gray-200 p-3 space-y-1">
            <div className="text-xs font-semibold text-gray-900">Choose what to extract/remove</div>
            <div className="text-[11px] text-gray-600">
              Checked items will be <strong>removed from the background</strong> and added as{' '}
              <strong>editable layers</strong>. Unchecked items stay baked into the background.
            </div>
          </div>

          {analysis.objects.length > 0 && (
            <div className="rounded-lg border border-gray-200 p-3 space-y-2">
              <div className="text-xs font-semibold text-gray-900">
                Objects ({analysis.objects.length})
              </div>
              <div className="space-y-1">
                {analysis.objects.map((o, i) => (
                  <label key={i} className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={!!selectedObjects[i]}
                      onChange={(e) =>
                        setSelectedObjects((prev) => ({ ...prev, [i]: e.target.checked }))
                      }
                    />
                    <span>
                      {o.type} ({Math.round((o.confidence || 0) * 100)}%) at [{o.x},{o.y},{o.width}×
                      {o.height}]
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {analysis.texts.length > 0 && (
            <div className="rounded-lg border border-gray-200 p-3 space-y-2">
              <div className="text-xs font-semibold text-gray-900">
                Text ({analysis.texts.length})
              </div>
              <div className="space-y-1 max-h-[180px] overflow-auto pr-1">
                {analysis.texts.map((t, i) => (
                  <label key={i} className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={!!selectedTexts[i]}
                      onChange={(e) =>
                        setSelectedTexts((prev) => ({ ...prev, [i]: e.target.checked }))
                      }
                    />
                    <span className="truncate">
                      “{t.text}” at [{Math.round(t.x)},{Math.round(t.y)}]
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleBuildLayers} className="w-full" disabled={isProcessing}>
            Build layers with AI
          </Button>
        </div>
      )}

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
