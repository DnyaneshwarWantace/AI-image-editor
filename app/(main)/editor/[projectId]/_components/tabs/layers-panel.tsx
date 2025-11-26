"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCanvasContext } from "@/providers/canvas-provider";
import { cn } from "@/lib/utils";

interface LayerItem {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  object: any;
}

export function LayersPanel() {
  const { canvas, editor } = useCanvasContext();
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!canvas) return;

    const updateLayers = () => {
      const objects = canvas.getObjects().filter((obj: any) => {
        // Filter out workspace and guide lines
        return obj.id !== "workspace" && !(obj.constructor.name === "GuideLine");
      });

      const layerItems: LayerItem[] = objects
        .map((obj: any, index: number) => ({
          id: obj.id || `obj-${index}`,
          name: obj.name || obj.text || obj.type || `Object ${index + 1}`,
          type: obj.type || "unknown",
          visible: obj.visible !== false,
          locked: obj.selectable === false,
          object: obj,
        }))
        .reverse(); // Show top layers first

      setLayers(layerItems);

      // Update selected
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        setSelectedId(activeObject.id || null);
      } else {
        setSelectedId(null);
      }
    };

    updateLayers();

    canvas.on("object:added", updateLayers);
    canvas.on("object:removed", updateLayers);
    canvas.on("object:modified", updateLayers);
    canvas.on("selection:created", updateLayers);
    canvas.on("selection:updated", updateLayers);
    canvas.on("selection:cleared", updateLayers);

    return () => {
      canvas.off("object:added", updateLayers);
      canvas.off("object:removed", updateLayers);
      canvas.off("object:modified", updateLayers);
      canvas.off("selection:created", updateLayers);
      canvas.off("selection:updated", updateLayers);
      canvas.off("selection:cleared", updateLayers);
    };
  }, [canvas]);

  const selectLayer = (layer: LayerItem) => {
    if (!canvas) return;
    canvas.discardActiveObject();
    canvas.setActiveObject(layer.object);
    canvas.requestRenderAll();
  };

  const toggleVisibility = (layer: LayerItem) => {
    layer.object.set("visible", !layer.visible);
    canvas?.requestRenderAll();
  };

  const toggleLock = (layer: LayerItem) => {
    const locked = !layer.locked;
    layer.object.set({
      selectable: !locked,
      evented: !locked,
    });
    canvas?.requestRenderAll();
  };

  const moveLayer = (direction: "up" | "down" | "top" | "bottom") => {
    if (!canvas || !editor) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    switch (direction) {
      case "up":
        editor.up?.();
        break;
      case "down":
        editor.down?.();
        break;
      case "top":
        editor.toFront?.();
        break;
      case "bottom":
        editor.toBack?.();
        break;
    }
    canvas.requestRenderAll();
  };

  if (!canvas) {
    return (
      <div className="p-4">
        <p className="text-gray-500 text-sm">Canvas not ready</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Layers</h4>
        <p className="text-xs text-gray-600">
          {layers.length} {layers.length === 1 ? "object" : "objects"}
        </p>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {layers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No objects on canvas</p>
          </div>
        ) : (
          layers.map((layer) => (
            <div
              key={layer.id}
              onClick={() => selectLayer(layer)}
              className={cn(
                "group p-2 rounded-md cursor-pointer transition-colors border",
                selectedId === layer.id
                  ? "bg-blue-50 border-blue-200"
                  : "bg-gray-50 border-transparent hover:bg-gray-100"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibility(layer);
                    }}
                    className="p-1 hover:bg-white rounded"
                  >
                    {layer.visible ? (
                      <Eye className="h-4 w-4 text-gray-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLock(layer);
                    }}
                    className="p-1 hover:bg-white rounded"
                  >
                    {layer.locked ? (
                      <Lock className="h-4 w-4 text-gray-600" />
                    ) : (
                      <Unlock className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  <span className="text-sm text-gray-900 truncate flex-1">
                    {layer.name}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Layer Controls */}
      {layers.length > 0 && (
        <div className="border-t pt-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => moveLayer("top")}
              className="text-xs"
            >
              <ArrowUp className="h-3 w-3 mr-1" />
              To Front
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => moveLayer("bottom")}
              className="text-xs"
            >
              <ArrowDown className="h-3 w-3 mr-1" />
              To Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => moveLayer("up")}
              className="text-xs"
            >
              <ChevronUp className="h-3 w-3 mr-1" />
              Up
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => moveLayer("down")}
              className="text-xs"
            >
              <ChevronDown className="h-3 w-3 mr-1" />
              Down
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

