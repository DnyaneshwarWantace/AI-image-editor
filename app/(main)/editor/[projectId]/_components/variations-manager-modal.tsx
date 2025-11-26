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
  const { canvas } = useCanvasContext();
  const [generatedAds, setGeneratedAds] = useState<GeneratedAd[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [localVariationsData, setLocalVariationsData] = useState<any[]>([]);

  // Fetch all text variations from database
  const textVariationsData = useQuery(
    api.textVariations.getTextVariationsByProject,
    projectId ? { projectId } : "skip"
  );

  // Load from localStorage if no Convex project
  useEffect(() => {
    if (!projectId && projectIdParam) {
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
        }
      } catch (error) {
        console.error("Error loading localStorage variations:", error);
      }
    }
  }, [projectId, projectIdParam]);

  // Use either Convex or localStorage data
  const variationsData = projectId ? textVariationsData : localVariationsData;

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

    const combinations: Array<Record<string, string>> = [];

    // Build combinations recursively
    const buildCombinations = (
      index: number,
      current: Record<string, string>
    ) => {
      if (index === variationsData.length) {
        combinations.push({ ...current });
        return;
      }

      const variation = variationsData[index];

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
      // Clone canvas
      const canvasJSON = canvas.toJSON();

      // Replace text content with variations
      const modifiedJSON = {
        ...canvasJSON,
        objects: canvasJSON.objects.map((obj: any) => {
          if (
            (obj.type === "textbox" ||
              obj.type === "i-text" ||
              obj.type === "text") &&
            ad.combination[obj.id]
          ) {
            return {
              ...obj,
              text: ad.combination[obj.id],
            };
          }
          return obj;
        }),
      };

      // Create a temporary canvas to render the variation
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width || 800;
      tempCanvas.height = canvas.height || 600;

      // Load fabric dynamically
      const { Canvas: FabricCanvas } = await import("fabric");
      const fabricCanvas = new FabricCanvas(tempCanvas);

      // Load the modified JSON
      await new Promise((resolve) => {
        fabricCanvas.loadFromJSON(modifiedJSON, () => {
          fabricCanvas.renderAll();
          resolve(null);
        });
      });

      // Export as image
      const dataURL = fabricCanvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 2, // Higher resolution
      });

      // Update the generated ad
      setGeneratedAds((prev) =>
        prev.map((a) =>
          a.id === ad.id
            ? { ...a, imageUrl: dataURL, isGenerating: false }
            : a
        )
      );

      // Cleanup
      fabricCanvas.dispose();
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
