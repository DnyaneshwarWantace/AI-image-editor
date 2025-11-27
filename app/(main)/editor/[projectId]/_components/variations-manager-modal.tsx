"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useCanvasContext } from "@/providers/canvas-provider";

interface VariationsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: Id<"projects"> | null;
  projectIdParam: string;
}

interface TextVariation {
  elementId: string;
  originalText: string;
  variations: Array<{
    id: string;
    text: string;
    type: string;
    language?: string;
  }>;
}

interface GeneratedAd {
  id: string;
  combination: Record<string, string>; // elementId -> variation text
  imageUrl: string | null;
  isGenerating: boolean;
}

export function VariationsManagerModal({
  isOpen,
  onClose,
  projectId,
  projectIdParam,
}: VariationsManagerModalProps) {
  const { canvas, editor } = useCanvasContext();
  const [generatedAds, setGeneratedAds] = useState<GeneratedAd[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [localVariationsData, setLocalVariationsData] = useState<any[]>([]);

  // Fetch all text variations from database (always try Convex first)
  const textVariationsData = useQuery(
    api.textVariations.getTextVariationsByProject,
    projectId ? { projectId } : "skip"
  );

  // Load from localStorage as fallback or for non-Convex projects
  useEffect(() => {
    // Only load from localStorage if:
    // 1. No Convex project ID, OR
    // 2. Convex query returned undefined/null (still loading or error)
    if (!projectId) {
      try {
        const storageKey = `variations-${projectIdParam}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Convert localStorage format to match Convex format
          const converted = Object.entries(parsed).map(([elementId, data]: [string, any]) => ({
            elementId,
            originalText: data.originalText,
            variations: data.variations,
          }));
          setLocalVariationsData(converted);
        } else {
          setLocalVariationsData([]);
        }
      } catch (error) {
        console.error("Error loading localStorage variations:", error);
        setLocalVariationsData([]);
      }
    } else if (textVariationsData === null || (textVariationsData && textVariationsData.length === 0)) {
      // If Convex returned empty/null, try localStorage as fallback
      try {
        const storageKey = `variations-${projectIdParam}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          const converted = Object.entries(parsed).map(([elementId, data]: [string, any]) => ({
            elementId,
            originalText: data.originalText,
            variations: data.variations,
          }));
          setLocalVariationsData(converted);
        } else {
          setLocalVariationsData([]);
        }
      } catch (error) {
        console.error("Error loading localStorage variations:", error);
        setLocalVariationsData([]);
      }
    } else {
      // Clear localStorage data if we have Convex data
      setLocalVariationsData([]);
    }
  }, [projectId, projectIdParam, textVariationsData]);

  // Use Convex data if available, otherwise use localStorage
  const variationsData = projectId && textVariationsData && textVariationsData.length > 0 
    ? textVariationsData 
    : localVariationsData;

  // Calculate total combinations
  const totalCombinations = variationsData
    ? variationsData.reduce((acc, variation) => {
        return acc * (variation.variations.length + 1); // +1 for original
      }, 1)
    : 0;

  // Generate all possible combinations
  const generateAllCombinations = () => {
    if (!variationsData || !canvas) return;

    setIsGenerating(true);

    // Get all text elements from canvas to get their current text
    const canvasJSON = canvas.toJSON();
    const findAllTextObjects = (objects: any[]): Array<{id: string | undefined, text: string}> => {
      const textObjects: Array<{id: string | undefined, text: string}> = [];
      const traverse = (obj: any) => {
        if (obj.type === "textbox" || obj.type === "i-text" || obj.type === "text") {
          textObjects.push({ id: obj.id, text: obj.text || "" });
        }
        if (obj.type === "group" && obj.objects && Array.isArray(obj.objects)) {
          obj.objects.forEach((nestedObj: any) => traverse(nestedObj));
        }
        if (obj.type === "activeSelection" && obj.objects && Array.isArray(obj.objects)) {
          obj.objects.forEach((nestedObj: any) => traverse(nestedObj));
        }
      };
      objects.forEach((obj: any) => traverse(obj));
      return textObjects;
    };
    
    const allTextElements = findAllTextObjects(canvasJSON.objects || []);
    
    // Create a map of elementId -> current text for elements WITHOUT variations
    const elementsWithoutVariations = new Map<string, string>();
    const variationElementIds = new Set(variationsData.map(v => v.elementId));
    
    allTextElements.forEach(({ id, text }) => {
      if (id && !variationElementIds.has(id)) {
        elementsWithoutVariations.set(id, text);
      }
    });

    // Filter to only elements that have variations
    const elementsWithVariations = variationsData.filter(v => v.variations.length > 0);

    console.log("📊 Generating combinations:", {
      elementsWithVariations: elementsWithVariations.length,
      elementsWithoutVariations: elementsWithoutVariations.size,
      totalTextElements: allTextElements.length,
    });

    const combinations: Array<Record<string, string>> = [];

    // Build combinations recursively - only for elements WITH variations
    const buildCombinations = (
      index: number,
      current: Record<string, string>
    ) => {
      if (index === elementsWithVariations.length) {
        // Add all elements without variations (keep their original text)
        elementsWithoutVariations.forEach((text, elementId) => {
          current[elementId] = text;
        });
        combinations.push({ ...current });
        return;
      }

      const variation = elementsWithVariations[index];

      // Add original text
      current[variation.elementId] = variation.originalText;
      buildCombinations(index + 1, current);

      // Add each variation
      for (const v of variation.variations) {
        current[variation.elementId] = v.text;
        buildCombinations(index + 1, current);
      }
    };

    buildCombinations(0, {});

    console.log(`✅ Generated ${combinations.length} combinations`);

    // Create ad objects for each combination
    const ads: GeneratedAd[] = combinations.map((combo, index) => ({
      id: `ad-${index}-${Date.now()}`,
      combination: combo,
      imageUrl: null,
      isGenerating: true,
    }));

    setGeneratedAds(ads);

    // Generate images for each combination asynchronously
    ads.forEach((ad, index) => {
      setTimeout(() => {
        generateAdImage(ad, index);
      }, index * 500); // Stagger generation
    });
  };

  const generateAdImage = async (ad: GeneratedAd, index: number) => {
    if (!canvas) return;

    try {
      // Get canvas dimensions properly
      const canvasWidth = canvas.getWidth() || 800;
      const canvasHeight = canvas.getHeight() || 600;

      // Clone canvas
      const canvasJSON = canvas.toJSON();

      // Helper to recursively find all text objects
      const findAllTextObjects = (objects: any[]): any[] => {
        const textObjects: any[] = [];
        
        const traverse = (obj: any) => {
          if (obj.type === "textbox" || obj.type === "i-text" || obj.type === "text") {
            textObjects.push(obj);
          }
          // Handle groups
          if (obj.type === "group" && obj.objects && Array.isArray(obj.objects)) {
            obj.objects.forEach((nestedObj: any) => traverse(nestedObj));
          }
          // Handle activeSelection
          if (obj.type === "activeSelection" && obj.objects && Array.isArray(obj.objects)) {
            obj.objects.forEach((nestedObj: any) => traverse(nestedObj));
          }
        };
        
        objects.forEach((obj: any) => traverse(obj));
        return textObjects;
      };

      // Find all text objects (including nested ones)
      const allTextObjects = findAllTextObjects(canvasJSON.objects || []);

      // Debug: Log combination and available text IDs
      console.log("🔍 Generating ad image:", {
        combination: ad.combination,
        availableTextIds: allTextObjects.map((obj: any) => ({ 
          id: obj.id, 
          text: obj.text,
          type: obj.type 
        })),
        totalObjects: canvasJSON.objects?.length || 0,
      });

      // Build a map of elementId -> originalText from variationsData for matching
      const elementIdToOriginalTextMap = new Map<string, string>();
      if (variationsData) {
        variationsData.forEach(v => {
          elementIdToOriginalTextMap.set(v.elementId, v.originalText);
        });
      }

      // Helper function to recursively update text in objects (including nested groups)
      const updateTextInObject = (obj: any): any => {
        // Check if this is a text object
        const isTextObject =
          obj.type === "textbox" ||
          obj.type === "i-text" ||
          obj.type === "text";

        if (isTextObject) {
          const elementId = obj.id;
          let updated = false;
          let newText = obj.text;
          
          // Try exact ID match first
          if (elementId && ad.combination[elementId]) {
            newText = ad.combination[elementId];
            console.log(`✅ [JSON] Updating text for element ${elementId}: "${obj.text}" -> "${newText}"`);
            updated = true;
          } else if (elementIdToOriginalTextMap.size > 0) {
            // Try to match by original text content
            for (const [varElementId, originalText] of elementIdToOriginalTextMap.entries()) {
              if (obj.text === originalText && ad.combination[varElementId]) {
                newText = ad.combination[varElementId];
                console.log(`✅ [JSON Content Match] Updating text (matched ${varElementId}): "${obj.text}" -> "${newText}"`);
                updated = true;
                break;
              }
            }
          }
          
          if (updated) {
            return {
              ...obj,
              text: newText,
            };
          } else if (elementId) {
            console.log(`⚠️ [JSON] No variation found for element ${elementId}, keeping original: "${obj.text}"`);
          }
        }

        // Handle groups - recursively update nested objects
        if (obj.type === "group" && obj.objects && Array.isArray(obj.objects)) {
          return {
            ...obj,
            objects: obj.objects.map((nestedObj: any) => updateTextInObject(nestedObj)),
          };
        }

        // Handle activeSelection (multi-select)
        if (obj.type === "activeSelection" && obj.objects && Array.isArray(obj.objects)) {
          return {
            ...obj,
            objects: obj.objects.map((nestedObj: any) => updateTextInObject(nestedObj)),
          };
        }

        return obj;
      };

      // Replace text content with variations
      const modifiedJSON = {
        ...canvasJSON,
        objects: canvasJSON.objects.map((obj: any) => updateTextInObject(obj)),
      };

      // Create a temporary canvas element
      const tempCanvasEl = document.createElement("canvas");
      tempCanvasEl.width = canvasWidth;
      tempCanvasEl.height = canvasHeight;

      // Load fabric dynamically
      const { Canvas: FabricCanvas } = await import("fabric");
      const fabricCanvas = new FabricCanvas(tempCanvasEl, {
        width: canvasWidth,
        height: canvasHeight,
      });

      // Wait for canvas context to be ready
      await new Promise<void>((resolve) => {
        const checkContext = () => {
          try {
            const ctx = fabricCanvas.getContext();
            if (ctx) {
              resolve();
            } else {
              setTimeout(checkContext, 50);
            }
          } catch (e) {
            setTimeout(checkContext, 50);
          }
        };
        checkContext();
      });

      // Load fonts before loading JSON (if editor has font plugin)
      if (editor && (editor as any).hooksEntity?.hookImportBefore) {
        const jsonString = JSON.stringify(modifiedJSON);
        await new Promise<void>((resolve) => {
          (editor as any).hooksEntity.hookImportBefore.callAsync(jsonString, () => {
            resolve();
          });
        });
      }

      // Load the modified JSON (Fabric.js v6 returns a Promise)
      await fabricCanvas.loadFromJSON(modifiedJSON);

      // After loading, ensure text is updated (in case JSON modification didn't work)
      const loadedObjects = fabricCanvas.getObjects();
      
      // Build a map of elementId -> originalText from variationsData for matching
      const elementIdToOriginalText = new Map<string, string>();
      if (variationsData) {
        variationsData.forEach(v => {
          elementIdToOriginalText.set(v.elementId, v.originalText);
        });
      }
      
      // Helper to recursively find and update all text objects
      const updateTextAfterLoad = (obj: any) => {
        const isTextObject =
          obj.type === "textbox" ||
          obj.type === "i-text" ||
          obj.type === "text";

        if (isTextObject) {
          const elementId = obj.id;
          
          // Check if this element is in the combination (either has variation or should keep original)
          if (elementId && ad.combination[elementId] !== undefined) {
            const newText = ad.combination[elementId];
            if (obj.text !== newText) {
              console.log(`🔄 [Exact ID] Updating text for ${elementId}: "${obj.text}" -> "${newText}"`);
              obj.set("text", newText);
              obj.setCoords();
            }
          } else if (elementId) {
            // Try to find by matching original text content (for elements without IDs)
            let matched = false;
            if (elementIdToOriginalText.size > 0) {
              for (const [varElementId, originalText] of elementIdToOriginalText.entries()) {
                // Check if this object's current text matches the original text for this variation
                if (obj.text === originalText && ad.combination[varElementId] !== undefined) {
                  const newText = ad.combination[varElementId];
                  console.log(`🔄 [Content Match] Updating text for element (ID: ${elementId || 'none'}, matched to var: ${varElementId}): "${obj.text}" -> "${newText}"`);
                  obj.set("text", newText);
                  obj.setCoords();
                  matched = true;
                  break;
                }
              }
            }
            
            if (!matched) {
              // This element doesn't have variations, keep it as is (it should already be in combination)
              console.log(`ℹ️ Keeping text unchanged for ${elementId}: "${obj.text}"`);
            }
          }
        }

        // Handle groups - recursively update nested objects
        if (obj.type === "group" && obj.getObjects) {
          obj.getObjects().forEach((nestedObj: any) => updateTextAfterLoad(nestedObj));
        }
        
        // Handle activeSelection
        if (obj.type === "activeSelection" && obj.getObjects) {
          obj.getObjects().forEach((nestedObj: any) => updateTextAfterLoad(nestedObj));
        }
      };

      // Update all objects
      loadedObjects.forEach((obj: any) => updateTextAfterLoad(obj));
      
      // Collect all objects for logging
      const allCanvasObjects: any[] = [];
      const collectAllObjects = (objs: any[]) => {
        objs.forEach(obj => {
          allCanvasObjects.push(obj);
          if (obj.type === "group" && obj.getObjects) {
            collectAllObjects(obj.getObjects());
          }
        });
      };
      collectAllObjects(loadedObjects);
      
      // Log all text objects found
      const foundTextObjects = allCanvasObjects.filter(obj => 
        obj.type === "textbox" || obj.type === "i-text" || obj.type === "text"
      );
      console.log(`📝 Found ${foundTextObjects.length} text objects after load:`, 
        foundTextObjects.map(obj => ({ id: obj.id, text: obj.text }))
      );

      // Wait for all objects to be loaded and rendered
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          try {
            // Force render all objects
            fabricCanvas.renderAll();

            // Wait a bit more for fonts to render and text to update
            setTimeout(() => {
              // Update text one more time to ensure it's correct
              const finalObjects = fabricCanvas.getObjects();
              finalObjects.forEach((obj: any) => updateTextAfterLoad(obj));
              fabricCanvas.renderAll();
              resolve();
            }, 300);
          } catch (e) {
            console.warn("Error during render:", e);
            resolve();
          }
        });
      });

      // Export as image with proper options
      const dataURL = fabricCanvas.toDataURL({
        format: "png",
        quality: 1.0,
        multiplier: 1, // Use 1 for proper sizing
      });

      if (!dataURL || dataURL === "data:,") {
        throw new Error("Failed to generate image data URL");
      }

      // Update the generated ad
      setGeneratedAds((prev) =>
        prev.map((a) =>
          a.id === ad.id
            ? { ...a, imageUrl: dataURL, isGenerating: false }
            : a
        )
      );

      // Cleanup
      try {
        fabricCanvas.dispose();
      } catch (e) {
        console.warn("Error disposing canvas:", e);
      }
    } catch (error) {
      console.error("Error generating ad image:", error);
      setGeneratedAds((prev) =>
        prev.map((a) =>
          a.id === ad.id ? { ...a, isGenerating: false } : a
        )
      );
    } finally {
      // Check if all ads are done generating
      setGeneratedAds((prev) => {
        const allDone = prev.every((a) => !a.isGenerating);
        if (allDone) {
          setIsGenerating(false);
        }
        return prev;
      });
    }
  };

  const downloadAd = (ad: GeneratedAd, index: number) => {
    if (!ad.imageUrl) return;

    const link = document.createElement("a");
    link.download = `ad-variation-${index + 1}.png`;
    link.href = ad.imageUrl;
    link.click();
  };

  const downloadAllAds = () => {
    generatedAds.forEach((ad, index) => {
      setTimeout(() => {
        downloadAd(ad, index);
      }, index * 100);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Variations Manager
          </DialogTitle>
          <DialogDescription>
            Generate and download all possible combinations of your ad variations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Text Elements</p>
                <p className="text-2xl font-bold text-gray-900">
                  {variationsData?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Variations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {variationsData?.reduce(
                    (sum, v) => sum + v.variations.length,
                    0
                  ) || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Unique Ads</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalCombinations}
                </p>
              </div>
            </div>
          </div>

          {/* Text Elements with Variations */}
          {variationsData && variationsData.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Text Elements
              </h3>
              <div className="space-y-2">
                {variationsData.map((variation) => (
                  <div
                    key={variation.elementId}
                    className="border rounded-lg p-3 bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {variation.originalText}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            Original + {variation.variations.length} variations
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generate Button */}
          {!generatedAds.length && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={generateAllCombinations}
                disabled={isGenerating || !variationsData?.length}
                size="lg"
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generate All {totalCombinations} Ads
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Generated Ads Grid */}
          {generatedAds.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Generated Ads ({generatedAds.length})
                </h3>
                <Button
                  onClick={downloadAllAds}
                  disabled={isGenerating}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {generatedAds.map((ad, index) => (
                  <div
                    key={ad.id}
                    className="border rounded-lg overflow-hidden bg-white"
                  >
                    {/* Preview */}
                    <div className="aspect-[4/3] bg-gray-100 relative">
                      {ad.isGenerating ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                      ) : ad.imageUrl ? (
                        <img
                          src={ad.imageUrl}
                          alt={`Ad variation ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-600">
                          Variation {index + 1}
                        </p>
                        <Button
                          onClick={() => downloadAd(ad, index)}
                          disabled={!ad.imageUrl || ad.isGenerating}
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Show which texts are used */}
                      <div className="mt-2 space-y-1">
                        {Object.entries(ad.combination).map(
                          ([elementId, text]) => (
                            <p
                              key={elementId}
                              className="text-xs text-gray-500 truncate"
                              title={text}
                            >
                              {text}
                            </p>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
