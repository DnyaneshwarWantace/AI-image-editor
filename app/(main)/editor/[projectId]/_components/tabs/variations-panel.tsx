"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Type, Plus, Sparkles, Grid3x3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCanvasContext } from "@/providers/canvas-provider";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TextVariationModal } from "../text-variation-modal";
import { VariationsManagerModal } from "../variations-manager-modal";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface TextElement {
  id: string;
  text: string;
  object: any;
  variationCount: number;
}

// Helper function to check if a string looks like a valid Convex ID
function isValidConvexId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  // Convex IDs are base32 encoded: start with letter, followed by alphanumeric
  // Typical format: j1234567890abcdefghijklmnopqrstuv
  const convexIdPattern = /^[a-z][a-z0-9]{15,}$/i;
  return convexIdPattern.test(id) && id.length >= 16;
}

export function VariationsPanel() {
  const { canvas } = useCanvasContext();
  const params = useParams();
  const projectIdParam = params.projectId as string;

  // Check if projectId is a valid Convex ID
  const isValidId = isValidConvexId(projectIdParam);
  const projectId = isValidId ? (projectIdParam as Id<"projects">) : null;

  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<TextElement | null>(null);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);

  // Convex hooks
  const variationCounts = useQuery(
    api.textVariations.getVariationCounts,
    projectId ? { projectId } : "skip"
  );
  const saveVariationsMutation = useMutation(api.textVariations.saveTextVariations);

  const extractTextElements = useCallback(() => {
    if (!canvas) return [];

    const objects = canvas.getObjects();
    const texts: TextElement[] = [];

    // Load localStorage variations as fallback
    let localVariations: Record<string, any> = {};
    try {
      const storageKey = `variations-${projectIdParam}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        localVariations = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading localStorage variations:", error);
    }

    objects.forEach((obj: any, index: number) => {
      // Skip workspace and non-text objects
      if (obj.id === "workspace" || obj.constructor.name === "GuideLine") {
        return;
      }

      // Only include text objects
      const isTextObject =
        obj.type === "textbox" ||
        obj.type === "i-text" ||
        obj.type === "text";

      if (isTextObject) {
        const textId = obj.id || `text-${index}`;
        // Prioritize Convex data, fallback to localStorage
        const count = projectId && variationCounts
          ? (variationCounts[textId] || 0)
          : (localVariations[textId]?.variations?.length || 0);

        texts.push({
          id: textId,
          text: obj.text || "Empty text",
          object: obj,
          variationCount: count,
        });
      }
    });

    return texts;
  }, [canvas, variationCounts, projectId, projectIdParam]);

  useEffect(() => {
    if (!canvas) return;

    const updateTextElements = () => {
      const texts = extractTextElements();
      setTextElements(texts);

      // Update selected
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        setSelectedId((activeObject as any).id || null);
      } else {
        setSelectedId(null);
      }
    };

    updateTextElements();

    // Listen to canvas changes
    canvas.on("object:added", updateTextElements);
    canvas.on("object:removed", updateTextElements);
    canvas.on("object:modified", updateTextElements);
    canvas.on("selection:created", updateTextElements);
    canvas.on("selection:updated", updateTextElements);
    canvas.on("selection:cleared", updateTextElements);

    return () => {
      canvas.off("object:added", updateTextElements);
      canvas.off("object:removed", updateTextElements);
      canvas.off("object:modified", updateTextElements);
      canvas.off("selection:created", updateTextElements);
      canvas.off("selection:updated", updateTextElements);
      canvas.off("selection:cleared", updateTextElements);
    };
  }, [canvas, extractTextElements]);

  const selectTextElement = (element: TextElement) => {
    if (!canvas) return;
    canvas.discardActiveObject();
    canvas.setActiveObject(element.object);
    canvas.requestRenderAll();
  };

  const handleAddVariations = (element: TextElement, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElement(element);
    setIsModalOpen(true);
  };

  const handleSaveVariations = async (variations: string[]) => {
    if (!selectedElement || !canvas) return;

    try {
      // Ensure the canvas object has an ID - assign one if missing
      const canvasObject = selectedElement.object;
      if (!canvasObject.id) {
        // Import uuid if not already imported
        const { v4: uuid } = await import('uuid');
        const newId = uuid();
        canvasObject.set('id', newId);
        // Update selectedElement to use the new ID
        selectedElement.id = newId;
        canvas.requestRenderAll();
        console.log(`✅ Assigned ID to text object: ${newId}`);
      }

      // Use the actual canvas object ID (now guaranteed to exist)
      const elementId = canvasObject.id || selectedElement.id;

      // Convert variations to the format expected by Convex
      const variationsData = variations.map((text, index) => ({
        id: `${elementId}-var-${index}-${Date.now()}`,
        text,
        type: "manual", // We can enhance this to distinguish between manual and AI
        language: undefined,
      }));

      // Always try to save to Convex if we have a valid project ID
      if (projectId) {
        try {
          await saveVariationsMutation({
            projectId,
            elementId: elementId, // Use the guaranteed ID
            originalText: selectedElement.text,
            variations: variationsData,
            userId: undefined, // TODO: Get from auth context
          });
          console.log("✅ Variations saved to Convex backend");
          
          // Also save to localStorage as backup
          const storageKey = `variations-${projectIdParam}`;
          const stored = localStorage.getItem(storageKey);
          const allVariations = stored ? JSON.parse(stored) : {};
          allVariations[elementId] = { // Use the guaranteed ID
            originalText: selectedElement.text,
            variations: variationsData,
          };
          localStorage.setItem(storageKey, JSON.stringify(allVariations));
        } catch (convexError) {
          console.error("❌ Failed to save to Convex, falling back to localStorage:", convexError);
          // Fallback to localStorage if Convex save fails
          const storageKey = `variations-${projectIdParam}`;
          const stored = localStorage.getItem(storageKey);
          const allVariations = stored ? JSON.parse(stored) : {};
          allVariations[elementId] = { // Use the guaranteed ID
            originalText: selectedElement.text,
            variations: variationsData,
          };
          localStorage.setItem(storageKey, JSON.stringify(allVariations));
          console.log("✅ Variations saved to localStorage (fallback)");
        }
      } else {
        // Store in localStorage for non-Convex projects
        const storageKey = `variations-${projectIdParam}`;
        const stored = localStorage.getItem(storageKey);
        const allVariations = stored ? JSON.parse(stored) : {};
        allVariations[elementId] = { // Use the guaranteed ID
          originalText: selectedElement.text,
          variations: variationsData,
        };
        localStorage.setItem(storageKey, JSON.stringify(allVariations));
        console.log("✅ Variations saved to localStorage (non-Convex project)");
      }

      // Update local state to show variation count immediately
      setTextElements((prev) =>
        prev.map((el) =>
          el.id === elementId // Use the guaranteed ID
            ? { ...el, variationCount: variations.length }
            : el
        )
      );
    } catch (error) {
      console.error("❌ Error saving variations:", error);
      alert("Failed to save variations. Please try again.");
    }
  };

  if (!canvas) {
    return (
      <div className="p-4">
        <p className="text-gray-500 text-sm">Canvas not ready</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Header */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900">Text Variations</h4>
        <p className="text-xs text-gray-500 mt-1">
          Create variations of your text elements to generate multiple ads
        </p>
      </div>

      {/* Text Elements List */}
      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
        {textElements.length === 0 ? (
          <div className="text-center py-8">
            <Type className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No text elements</p>
            <p className="text-gray-400 text-xs mt-1">
              Add text to your canvas to create variations
            </p>
          </div>
        ) : (
          textElements.map((element) => (
            <div
              key={element.id}
              onClick={() => selectTextElement(element)}
              className={cn(
                "border rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm",
                selectedId === element.id
                  ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
                  : "bg-white border-gray-200 hover:border-gray-300"
              )}
            >
              {/* Text Preview */}
              <div className="flex items-start gap-2 mb-2">
                <Type
                  className={cn(
                    "h-4 w-4 mt-0.5 flex-shrink-0",
                    selectedId === element.id ? "text-blue-600" : "text-purple-500"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {element.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="secondary"
                      className="text-xs font-normal"
                    >
                      {element.variationCount} variations
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Add Variations Button */}
              <Button
                onClick={(e) => handleAddVariations(element, e)}
                size="sm"
                variant="outline"
                className="w-full mt-2 text-xs h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Variations
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Info Section */}
      {textElements.length > 0 && (
        <div className="border-t pt-3 mt-3 space-y-3">
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <Sparkles className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p>
              <span className="font-medium">Total combinations:</span>{" "}
              {textElements.reduce(
                (acc, el) => acc * Math.max(el.variationCount, 1),
                1
              )}{" "}
              unique ads
            </p>
          </div>

          {/* Generate All Ads Button */}
          {textElements.some((el) => el.variationCount > 0) && (
            <Button
              onClick={() => setIsManagerModalOpen(true)}
              className="w-full"
              size="sm"
            >
              <Grid3x3 className="h-4 w-4 mr-2" />
              Generate All Ads
            </Button>
          )}
        </div>
      )}

      {/* Text Variation Modal */}
      {selectedElement && (
        <TextVariationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          originalText={selectedElement.text}
          elementId={selectedElement.id}
          onSave={handleSaveVariations}
        />
      )}

      {/* Variations Manager Modal */}
      <VariationsManagerModal
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
        projectId={projectId}
        projectIdParam={projectIdParam}
      />
    </div>
  );
}
