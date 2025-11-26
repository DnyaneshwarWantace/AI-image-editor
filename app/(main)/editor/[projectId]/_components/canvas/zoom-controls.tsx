"use client";

import React, { useState } from "react";
import { ZoomIn, ZoomOut, Maximize, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCanvasContext } from "@/providers/canvas-provider";
import { toast } from "sonner";

export function ZoomControls() {
  const { editor } = useCanvasContext();
  const [showHelp, setShowHelp] = useState(false);

  const handleZoomIn = () => {
    if (!editor) return;
    try {
      editor.big?.();
    } catch (error) {
      console.error("Error zooming in:", error);
    }
  };

  const handleZoomOut = () => {
    if (!editor) return;
    try {
      editor.small?.();
    } catch (error) {
      console.error("Error zooming out:", error);
    }
  };

  const handleZoomFit = () => {
    if (!editor) return;
    try {
      editor.auto?.();
    } catch (error) {
      console.error("Error fitting:", error);
    }
  };

  const handleZoom100 = () => {
    if (!editor) return;
    try {
      editor.one?.();
    } catch (error) {
      console.error("Error setting 100%:", error);
    }
  };

  return (
    <>
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
        <Button
          variant="default"
          size="sm"
          onClick={handleZoomIn}
          className="shadow-lg"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleZoomOut}
          className="shadow-lg"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleZoomFit}
          className="shadow-lg"
          title="Fit to Screen"
        >
          <Maximize className="h-4 w-4" />
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleZoom100}
          className="shadow-lg"
          title="100%"
        >
          100%
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => setShowHelp(!showHelp)}
          className="shadow-lg mt-2"
          title="Canvas Controls Help"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>

      {/* Help Tooltip */}
      {showHelp && (
        <div className="absolute bottom-4 right-20 bg-gray-900 text-white text-xs p-4 rounded-lg shadow-xl z-20 max-w-xs">
          <div className="font-semibold mb-2">Canvas Navigation:</div>
          <ul className="space-y-1">
            <li><span className="font-medium">Space + Drag</span> - Pan canvas</li>
            <li><span className="font-medium">Alt + Drag</span> - Pan canvas</li>
            <li><span className="font-medium">Middle Mouse + Drag</span> - Pan canvas</li>
            <li><span className="font-medium">Right Click</span> - Context menu</li>
            <li><span className="font-medium">Mouse Wheel</span> - Zoom in/out</li>
          </ul>
          <button
            onClick={() => setShowHelp(false)}
            className="mt-3 text-blue-400 hover:text-blue-300 text-xs"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}

