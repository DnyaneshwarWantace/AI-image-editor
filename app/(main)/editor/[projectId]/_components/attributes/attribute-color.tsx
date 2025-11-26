"use client";

import React, { useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { useCanvasContext } from "@/providers/canvas-provider";
import { cn } from "@/lib/utils";

export function AttributeColor() {
  const { canvas } = useCanvasContext();
  const [color, setColor] = useState("#000000");
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!canvas) return;

    const updateColor = () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.fill) {
        const fill = activeObject.fill;
        if (typeof fill === "string") {
          setColor(fill);
        } else if (fill && (fill as any).colorStops) {
          // Gradient - use first color
          setColor((fill as any).colorStops[0]?.color || "#000000");
        }
      }
    };

    updateColor();

    canvas.on("selection:created", updateColor);
    canvas.on("selection:updated", updateColor);

    return () => {
      canvas.off("selection:created", updateColor);
      canvas.off("selection:updated", updateColor);
    };
  }, [canvas]);

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    const activeObject = canvas?.getActiveObject();
    if (activeObject) {
      activeObject.set("fill", newColor);
      canvas?.requestRenderAll();
    }
  };

  const activeObject = canvas?.getActiveObject();
  if (!activeObject || activeObject.type === "image" || activeObject.type === "group") {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-900">Color</h4>

      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-full h-10 rounded border border-gray-300 flex items-center gap-2 px-3 hover:border-gray-400 transition-colors"
          style={{ backgroundColor: color }}
        >
          <span className="text-white text-xs font-medium drop-shadow">{color}</span>
        </button>

        {showPicker && (
          <div className="absolute z-50 mt-2 bg-white p-3 rounded-lg shadow-lg border border-gray-200">
            <HexColorPicker color={color} onChange={handleColorChange} />
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={color}
                onChange={(e) => handleColorChange(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
              />
              <button
                onClick={() => setShowPicker(false)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

