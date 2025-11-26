"use client";

import React, { useState, useEffect } from "react";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCanvasContext } from "@/providers/canvas-provider";
import { CanvasBackground } from "./canvas-background";
import { CanvasSizeModal } from "./canvas-size-modal";
import { Pencil } from "lucide-react";

export function CanvasSettings() {
  const { canvas, editor } = useCanvasContext();
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [showSizeModal, setShowSizeModal] = useState(false);

  useEffect(() => {
    if (!canvas || !editor) return;

    const updateSize = () => {
      const workspace = (editor as any).getWorkspace?.();
      if (workspace) {
        setWidth(workspace.width || 800);
        setHeight(workspace.height || 600);
      }
    };

    updateSize();
    editor.on?.("sizeChange", (w: number, h: number) => {
      setWidth(w);
      setHeight(h);
    });
  }, [canvas, editor]);

  const handleSizeChange = (w: number, h: number) => {
    if (editor) {
      editor.setSize?.(w, h);
      setWidth(w);
      setHeight(h);
    }
  };

  const handleZoomIn = () => {
    if (!editor) return;
    editor.big?.();
  };

  const handleZoomOut = () => {
    if (!editor) return;
    editor.small?.();
  };

  const handleZoomFit = () => {
    if (!editor) return;
    editor.auto?.();
  };

  const handleZoom100 = () => {
    if (!editor) return;
    editor.one?.();
  };

  return (
    <div className="space-y-6">
      {/* Canvas Size */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-gray-900">Canvas Size</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">Width</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={width}
                readOnly
                disabled
                className="bg-gray-50"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSizeModal(true)}
                title="Edit size"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">Height</Label>
            <Input
              type="number"
              value={height}
              readOnly
              disabled
              className="bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700">Zoom</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4 mr-2" />
            Zoom In
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4 mr-2" />
            Zoom Out
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomFit}>
            <Maximize className="h-4 w-4 mr-2" />
            Fit
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoom100}>
            100%
          </Button>
        </div>
      </div>

      <CanvasBackground />

      <CanvasSizeModal
        open={showSizeModal}
        onOpenChange={setShowSizeModal}
        currentWidth={width}
        currentHeight={height}
        onConfirm={handleSizeChange}
      />
    </div>
  );
}
