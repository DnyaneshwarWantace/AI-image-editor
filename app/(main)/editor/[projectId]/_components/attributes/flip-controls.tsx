"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FlipHorizontal, FlipVertical } from "lucide-react";
import { useCanvasContext } from "@/providers/canvas-provider";
import { toast } from "sonner";

export function FlipControls() {
  const { canvas } = useCanvasContext();

  const handleFlip = (type: "X" | "Y") => {
    const activeObject = canvas?.getActiveObject();
    if (!activeObject) {
      toast.error("Please select an object");
      return;
    }

    try {
      const flipKey = `flip${type}` as "flipX" | "flipY";
      const currentValue = (activeObject as any)[flipKey] || false;
      activeObject.set(flipKey, !currentValue).setCoords();
      canvas?.requestRenderAll();
      toast.success(`Flipped ${type === "X" ? "horizontally" : "vertically"}`);
    } catch (error) {
      console.error("Error flipping:", error);
      toast.error("Failed to flip");
    }
  };

  const activeObject = canvas?.getActiveObject();
  if (!activeObject) return null;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900">Flip</h4>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFlip("X")}
          className="flex-1"
          title="Flip Horizontal"
        >
          <FlipHorizontal className="h-4 w-4 mr-2" />
          Horizontal
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFlip("Y")}
          className="flex-1"
          title="Flip Vertical"
        >
          <FlipVertical className="h-4 w-4 mr-2" />
          Vertical
        </Button>
      </div>
    </div>
  );
}

