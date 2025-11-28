"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useCanvasContext } from "@/providers/canvas-provider";
import { Canvas } from "fabric";

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
  const hasGeneratedRef = useRef(false); // Track if we've already generated for this modal open

  // Mutation to clean up orphaned variations
  const cleanupOrphanedVariationsMutation = useMutation(api.textVariations.cleanupOrphanedVariations);

  // Fetch all text variations from Convex backend (single source of truth)
  const textVariationsData = useQuery(
    api.textVariations.getTextVariationsByProject,
    projectId ? { projectId } : "skip"
  );

  // Filter variations to only include text elements that exist on current canvas
  // This recalculates whenever canvas or textVariationsData changes
  const variationsData = useMemo(() => {
    if (!textVariationsData || !canvas) {
      console.log('⚠️ variationsData: Missing textVariationsData or canvas');
      return [];
    }

    // Get all text element IDs from CURRENT canvas state (fresh check)
    const canvasObjects = canvas.getObjects();
    const canvasTextIds = new Set<string>();

    canvasObjects.forEach((obj: any) => {
      const isTextObject = obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text';
      if (isTextObject && obj.id) {
        canvasTextIds.add(obj.id);
      }
    });

    console.log('🔍 [variationsData] Current canvas text IDs:', Array.from(canvasTextIds));
    console.log('🔍 [variationsData] Total variations from backend:', textVariationsData.length);

    // Filter variations to only include elements that exist on canvas
    const filtered = textVariationsData.filter(variation => {
      const exists = canvasTextIds.has(variation.elementId);
      if (!exists) {
        console.log(`⚠️ [variationsData] Variation for ${variation.elementId} (${variation.originalText}) - element not on canvas, excluding`);
      }
      return exists;
    });

    const totalCombos = filtered.reduce((acc, v) => acc * (v.variations.length + 1), 1);
    console.log(`✅ [variationsData] Filtered: ${filtered.length} of ${textVariationsData.length} match canvas. Will generate ${totalCombos} ads.`);
    
    return filtered;
  }, [textVariationsData, canvas]);

  // Reset state and cleanup when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 Modal opened - resetting state and loading fresh data...');
      // Clear old generated ads immediately when modal opens
      setGeneratedAds([]);
      setIsGenerating(false);
      hasGeneratedRef.current = false; // Reset generation flag
    } else {
      // Clear state when modal closes
      setGeneratedAds([]);
      setIsGenerating(false);
      hasGeneratedRef.current = false; // Reset generation flag
    }
  }, [isOpen]);

  // Clean up orphaned variations when modal opens
  useEffect(() => {
    if (isOpen && canvas && projectId) {
      const cleanupOrphaned = async () => {
        // Get all text element IDs from current canvas
        const canvasObjects = canvas.getObjects();
        const canvasTextIds: string[] = [];

        canvasObjects.forEach((obj: any) => {
          const isTextObject = obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text';
          if (isTextObject && obj.id) {
            canvasTextIds.push(obj.id);
          }
        });

        console.log('🧹 Cleaning up orphaned variations for canvas text IDs:', canvasTextIds);

        try {
          const result = await cleanupOrphanedVariationsMutation({
            projectId,
            canvasTextIds,
          });

          if (result.deletedCount > 0) {
            console.log(`🗑️ Cleaned up ${result.deletedCount} orphaned variations:`, result.deletedElements);
          }
        } catch (error) {
          console.error('Failed to cleanup orphaned variations:', error);
        }
      };

      cleanupOrphaned();
    }
  }, [isOpen, canvas, projectId, cleanupOrphanedVariationsMutation]);

  // Auto-generate ads when modal opens with fresh data
  // This runs AFTER cleanup and state reset
  // Only generate ONCE per modal open session
  useEffect(() => {
    // Only generate if:
    // 1. Modal is open
    // 2. We have variations data
    // 3. We haven't already generated for this modal open
    // 4. We're not currently generating
    if (!isOpen || !variationsData || variationsData.length === 0 || hasGeneratedRef.current || isGenerating) {
      return;
    }

    // Mark that we're about to generate (prevent re-triggering)
    hasGeneratedRef.current = true;

    // Small delay to ensure cleanup, state reset, and data refresh are complete
    const timer = setTimeout(() => {
      // Double-check canvas is still available and variations are still valid
      if (!canvas || !variationsData || variationsData.length === 0) {
        console.warn('⚠️ Cannot generate: canvas or variations not available');
        hasGeneratedRef.current = false; // Reset flag if generation fails
        return;
      }

      const totalCombos = variationsData.reduce((acc, v) => acc * (v.variations.length + 1), 1);
      console.log('🎬 Auto-generating ads with fresh data (ONCE)...', {
        variationsCount: variationsData.length,
        totalCombinations: totalCombos,
        variationDetails: variationsData.map(v => ({
          elementId: v.elementId,
          originalText: v.originalText,
          variationCount: v.variations.length
        }))
      });
      
      generateAllCombinations();
    }, 300); // Increased delay to ensure all state updates are complete
    
    return () => clearTimeout(timer);
  }, [isOpen, variationsData]); // Removed isGenerating and canvas from deps to prevent re-runs

  // Calculate total combinations
  const totalCombinations = variationsData
    ? variationsData.reduce((acc, variation) => {
        return acc * (variation.variations.length + 1); // +1 for original
      }, 1)
    : 0;

  // Generate all possible combinations
  // This function uses the latest variationsData from closure
  const generateAllCombinations = () => {
    // Get fresh variationsData and canvas state
    const currentVariationsData = variationsData;
    const currentCanvas = canvas;
    
    if (!currentVariationsData || !currentVariationsData.length || !currentCanvas) {
      console.error("❌ Cannot generate: missing variations or canvas", {
        hasVariations: !!currentVariationsData,
        variationsLength: currentVariationsData?.length || 0,
        hasCanvas: !!currentCanvas
      });
      setIsGenerating(false);
      hasGeneratedRef.current = false; // Reset flag so it can retry
      return;
    }

    console.log('🚀 Starting generation with:', {
      variationsCount: currentVariationsData.length,
      totalCombinations: currentVariationsData.reduce((acc, v) => acc * (v.variations.length + 1), 1),
      canvasObjectCount: currentCanvas.getObjects().length
    });

    setIsGenerating(true);

    // Use editor's getJson() which properly includes custom properties like 'id'
    // Get FRESH canvas state at generation time
    const canvasState = (editor as any)?.getJson?.() || currentCanvas.toJSON();

    console.log('🎨 Using current canvas state for generation:', {
      objectCount: canvasState.objects?.length || 0,
      textObjects: canvasState.objects?.filter((obj: any) =>
        obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text'
      ).length || 0,
      sampleTextWithId: canvasState.objects?.find((obj: any) =>
        obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text'
      )
    });
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

    // Extract text elements from saved canvasState
    const allTextElements = findAllTextObjects(canvasState.objects || []);

    // Create a map of elementId -> current text for elements WITHOUT variations
    const elementsWithoutVariations = new Map<string, string>();
    const variationElementIds = new Set(currentVariationsData.map(v => v.elementId));

    allTextElements.forEach(({ id, text }) => {
      if (id && !variationElementIds.has(id)) {
        elementsWithoutVariations.set(id, text);
      }
    });

    // Filter to only elements that have variations
    const elementsWithVariations = currentVariationsData.filter(v => v.variations.length > 0);

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
    // Pass currentVariationsData to ensure we use the latest data
    ads.forEach((ad, index) => {
      setTimeout(() => {
        generateAdImage(ad, index, currentVariationsData);
      }, index * 500); // Stagger generation
    });
  };

  const generateAdImage = async (ad: GeneratedAd, index: number, currentVariationsDataForAd: typeof variationsData) => {
    if (!canvas) {
      console.error("❌ Cannot generate image: missing canvas");
      return;
    }

    try {
      // Get CURRENT canvas state with custom properties (like 'id')
      const canvasJSON = (editor as any)?.getJson?.() || canvas.toJSON();

      // Get canvas dimensions
      const canvasWidth = canvas.getWidth() || 800;
      const canvasHeight = canvas.getHeight() || 600;

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

      // Build a map of elementId -> originalText from currentVariationsDataForAd for matching
      const elementIdToOriginalTextMap = new Map<string, string>();
      if (currentVariationsDataForAd) {
        currentVariationsDataForAd.forEach(v => {
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
            if (ctx && (ctx as any).canvas) {
              resolve();
            } else {
              requestAnimationFrame(checkContext);
            }
          } catch (e) {
            requestAnimationFrame(checkContext);
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
      try {
        await fabricCanvas.loadFromJSON(modifiedJSON);
      } catch (loadError) {
        console.error('Failed to load JSON for ad generation:', loadError);
        throw loadError;
      }

      // After loading, ensure text is updated (in case JSON modification didn't work)
      const loadedObjects = fabricCanvas.getObjects();
      
      // Store original dimensions of text objects before updating (for auto-fit)
      const originalTextDimensions = new Map<string, { width: number; height: number; fontSize: number }>();
      const storeOriginalDimensions = (obj: any) => {
        if (obj.type === "textbox" || obj.type === "i-text" || obj.type === "text") {
          if (obj.id) {
            originalTextDimensions.set(obj.id, {
              width: obj.getScaledWidth() || obj.width || 200,
              height: obj.getScaledHeight() || obj.height || 100,
              fontSize: obj.fontSize || 20
            });
          }
        }
        if (obj.type === "group" && obj.getObjects) {
          obj.getObjects().forEach((nestedObj: any) => storeOriginalDimensions(nestedObj));
        }
      };
      loadedObjects.forEach((obj: any) => storeOriginalDimensions(obj));
      
      // Build a map of elementId -> originalText from currentVariationsDataForAd for matching
      const elementIdToOriginalText = new Map<string, string>();
      if (currentVariationsDataForAd) {
        currentVariationsDataForAd.forEach(v => {
          elementIdToOriginalText.set(v.elementId, v.originalText);
        });
      }
      
      // Helper function to auto-fit text within its bounding box
      const autoFitText = (textObj: any) => {
        if (!textObj || !textObj.text) return;
        
        try {
          // Get original dimensions from stored map (before text was updated)
          const elementId = textObj.id;
          const originalDims = elementId ? originalTextDimensions.get(elementId) : null;
          
          // Use original dimensions if available, otherwise use current dimensions
          const originalFontSize = originalDims?.fontSize || textObj.fontSize || 20;
          
          // Get the original bounding box dimensions (before text change)
          // For textbox, width is the max width constraint
          // For i-text and text, we use the original dimensions as the constraint
          const isTextBox = textObj.type === 'textbox';
          const constraintWidth = originalDims 
            ? originalDims.width
            : (isTextBox 
              ? (textObj.width || textObj.getScaledWidth() || 200)
              : (textObj.getScaledWidth() || 200));
          const constraintHeight = originalDims 
            ? originalDims.height
            : (textObj.getScaledHeight() || 100);
          
          // Get current font size
          let currentFontSize = originalFontSize;
          const minFontSize = 8; // Minimum font size to prevent text from being too small
          const maxFontSize = Math.max(originalFontSize * 2, 100); // Maximum font size
          
          // Function to check if text fits with given font size
          const checkTextFits = (fontSize: number): boolean => {
            // Temporarily set font size
            const prevFontSize = textObj.fontSize;
            textObj.set('fontSize', fontSize);
            textObj.setCoords();
            
            // Get actual rendered dimensions
            const actualWidth = textObj.getScaledWidth();
            const actualHeight = textObj.getScaledHeight();
            
            // Restore font size
            textObj.set('fontSize', prevFontSize);
            textObj.setCoords();
            
            // Check if it fits (with 5% tolerance for rounding)
            const fitsWidth = actualWidth <= constraintWidth * 1.05;
            const fitsHeight = actualHeight <= constraintHeight * 1.05;
            
            return fitsWidth && fitsHeight;
          };
          
          // Check if current text fits
          const currentFits = checkTextFits(currentFontSize);
          
          if (currentFits) {
            // Text fits, try to find optimal larger size
            let optimalFontSize = currentFontSize;
            
            // Binary search for largest font size that fits
            let minSize = currentFontSize;
            let maxSize = maxFontSize;
            
            while (maxSize - minSize > 0.5) {
              const testSize = (minSize + maxSize) / 2;
              if (checkTextFits(testSize)) {
                optimalFontSize = testSize;
                minSize = testSize;
              } else {
                maxSize = testSize;
              }
            }
            
            if (Math.abs(optimalFontSize - currentFontSize) > 1) {
              textObj.set('fontSize', Math.round(optimalFontSize));
              textObj.setCoords();
              console.log(`📏 [Auto-fit] Optimized font size from ${currentFontSize} to ${Math.round(optimalFontSize)}`);
            }
          } else {
            // Text doesn't fit, need to reduce font size
            let optimalFontSize = currentFontSize;
            
            // Binary search for largest font size that fits
            let minSize = minFontSize;
            let maxSize = currentFontSize;
            
            while (maxSize - minSize > 0.5) {
              const testSize = (minSize + maxSize) / 2;
              if (checkTextFits(testSize)) {
                optimalFontSize = testSize;
                minSize = testSize;
              } else {
                maxSize = testSize;
              }
            }
            
            if (optimalFontSize < currentFontSize) {
              textObj.set('fontSize', Math.round(optimalFontSize));
              textObj.setCoords();
              console.log(`📏 [Auto-fit] Reduced font size from ${currentFontSize} to ${Math.round(optimalFontSize)} to fit within bounds`);
            } else {
              // Even minimum doesn't fit, use minimum anyway
              textObj.set('fontSize', minFontSize);
              textObj.setCoords();
              console.log(`📏 [Auto-fit] Set to minimum ${minFontSize} (text may overflow)`);
            }
          }
        } catch (error) {
          console.warn('Error in auto-fit text:', error);
        }
      };

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
              // Auto-fit the text to ensure it fits within its bounds
              autoFitText(obj);
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
                  // Auto-fit the text to ensure it fits within its bounds
                  autoFitText(obj);
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
            const ctx = fabricCanvas.getContext();
            if (ctx && (ctx as any).canvas) {
              // Force render all objects
              fabricCanvas.renderAll();

              // Wait a bit more for fonts to render and text to update
              setTimeout(() => {
                try {
                  // Update text one more time to ensure it's correct
                  const finalObjects = fabricCanvas.getObjects();
                  finalObjects.forEach((obj: any) => updateTextAfterLoad(obj));
                  fabricCanvas.renderAll();
                  resolve();
                } catch (e) {
                  console.warn("Error updating text:", e);
                  resolve();
                }
              }, 300);
            } else {
              console.warn("Canvas context not ready for render");
              resolve();
            }
          } catch (e) {
            console.warn("Error during render:", e);
            resolve();
          }
        });
      });

      // Export as image with proper options
      let dataURL;
      try {
        dataURL = fabricCanvas.toDataURL({
          format: "png",
          quality: 1.0,
          multiplier: 1, // Use 1 for proper sizing
        });
      } catch (e) {
        console.error('Failed to export canvas to data URL:', e);
        throw new Error("Failed to generate image data URL");
      }

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

    // Convert data URL to blob for better download handling
    const dataURL = ad.imageUrl;
    const blob = dataURLToBlob(dataURL);
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.download = `ad-variation-${index + 1}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Helper function to convert data URL to blob
  const dataURLToBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const downloadAllAds = async () => {
    // Filter to only ads that have images ready
    const adsToDownload = generatedAds.filter(ad => ad.imageUrl && !ad.isGenerating);
    
    if (adsToDownload.length === 0) {
      console.warn('No ads ready to download');
      return;
    }

    console.log(`📥 Starting download of ${adsToDownload.length} ads...`);

    // Download sequentially with proper delays to avoid browser blocking
    for (let i = 0; i < adsToDownload.length; i++) {
      const ad = adsToDownload[i];
      const index = generatedAds.indexOf(ad);
      
      // Wait before each download (except the first one)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 800)); // 800ms delay between downloads
      }
      
      downloadAd(ad, index);
      console.log(`✅ Downloaded variation ${index + 1}/${adsToDownload.length}`);
    }

    console.log(`🎉 Finished downloading all ${adsToDownload.length} ads`);
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
                Text Elements ({variationsData.length})
              </h3>
              <div className="space-y-2">
                {variationsData.map((variation, idx) => (
                  <div
                    key={`${variation.elementId}-${idx}`}
                    className="border rounded-lg p-3 bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {variation.originalText}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {variation.variations.length} variations
                          </Badge>
                          <span className="text-xs text-gray-500">
                            ID: {variation.elementId.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auto-generating status */}
          {isGenerating && generatedAds.length === 0 && (
            <div className="flex justify-center pt-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Generating {totalCombinations} ad variations...</span>
              </div>
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
