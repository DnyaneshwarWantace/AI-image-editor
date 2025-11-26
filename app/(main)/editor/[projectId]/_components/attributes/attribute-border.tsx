"use client";

import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCanvasContext } from "@/providers/canvas-provider";

export function AttributeBorder() {
  const { canvas } = useCanvasContext();
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [strokeColor, setStrokeColor] = useState("#000000");

  useEffect(() => {
    if (!canvas) return;

    const updateBorder = () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        setStrokeWidth(activeObject.strokeWidth || 0);
        setStrokeColor(activeObject.stroke || "#000000");
      }
    };

    updateBorder();

    canvas.on("selection:created", updateBorder);
    canvas.on("selection:updated", updateBorder);

    return () => {
      canvas.off("selection:created", updateBorder);
      canvas.off("selection:updated", updateBorder);
    };
  }, [canvas]);

  const updateBorder = () => {
    const activeObject = canvas?.getActiveObject();
    if (!activeObject) return;

    activeObject.set({
      strokeWidth,
      stroke: strokeWidth > 0 ? strokeColor : undefined,
    });
    canvas?.requestRenderAll();
  };

  useEffect(() => {
    if (canvas) updateBorder();
  }, [strokeWidth, strokeColor, canvas]);

  const activeObject = canvas?.getActiveObject();
  if (!activeObject) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-900">Border</h4>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs font-medium text-gray-700">Width</Label>
          <span className="text-xs font-semibold text-gray-900">{strokeWidth}px</span>
        </div>
        <Slider
          value={[strokeWidth]}
          onValueChange={(value) => setStrokeWidth(value[0])}
          min={0}
          max={20}
          step={1}
        />
      </div>

      {strokeWidth > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">Color</Label>
          <div className="flex gap-2">
            <div
              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              style={{ backgroundColor: strokeColor }}
            />
            <Input
              type="text"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="flex-1 bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}

