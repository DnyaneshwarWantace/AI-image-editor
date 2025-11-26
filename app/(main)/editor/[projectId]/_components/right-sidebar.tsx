"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useCanvasContext } from "@/providers/canvas-provider";

// Attribute Components (will create these next)
import { AttributePosition } from "./attributes/attribute-position";
import { AttributeColor } from "./attributes/attribute-color";
import { AttributeFont } from "./attributes/attribute-font";
import { AttributeShadow } from "./attributes/attribute-shadow";
import { AttributeBorder } from "./attributes/attribute-border";
import { AttributeRounded } from "./attributes/attribute-rounded";
import { GroupControls } from "./attributes/group-controls";
import { AlignControls } from "./attributes/align-controls";
import { CenterAlignControls } from "./attributes/center-align-controls";
import { CanvasSettings } from "./attributes/canvas-settings";
import { AttributeTextContent } from "./attributes/attribute-text-content";
import { AttributeQRCode } from "./attributes/attribute-qrcode";
import { AttributeBarcode } from "./attributes/attribute-barcode";
import { AttributeTextFloat } from "./attributes/attribute-text-float";
import { AttributeId } from "./attributes/attribute-id";
import { ReplaceImage } from "./attributes/replace-image";
import { CropImage } from "./attributes/crop-image";
import { ClipImage } from "./attributes/clip-image";
import { FlipControls } from "./attributes/flip-controls";
import { FiltersPanel } from "./attributes/filters-panel";
import { ImageStrokeFull } from "./attributes/image-stroke-full";
import { QuickActions } from "./attributes/quick-actions";

export function RightSidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { canvas, selectionMode, setSelectionMode } = useCanvasContext();

  useEffect(() => {
    if (!canvas) return;

    const updateSelection = () => {
      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length === 0) {
        setSelectionMode("none");
      } else if (activeObjects.length === 1) {
        setSelectionMode("one");
      } else {
        setSelectionMode("multiple");
      }
    };

    updateSelection();

    canvas.on("selection:created", updateSelection);
    canvas.on("selection:updated", updateSelection);
    canvas.on("selection:cleared", updateSelection);

    return () => {
      canvas.off("selection:created", updateSelection);
      canvas.off("selection:updated", updateSelection);
      canvas.off("selection:cleared", updateSelection);
    };
  }, [canvas, setSelectionMode]);

  return (
    <div className="relative">
      <div
        className={cn(
          "bg-white transition-all duration-300 border-l overflow-y-auto h-full",
          isExpanded ? "w-[380px]" : "w-0"
        )}
        style={{ borderColor: "#eef2f8" }}
      >
        <div className="p-4">
          {/* No Selection - Canvas Settings */}
          {selectionMode === "none" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Canvas Settings
              </h3>
              <CanvasSettings />
            </div>
          )}

          {/* Multiple Selection */}
          {selectionMode === "multiple" && (
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-gray-900">
                Multiple Objects Selected
              </h3>
              <GroupControls />
              <AlignControls />
              <CenterAlignControls />
            </div>
          )}

              {/* Single Selection */}
              {selectionMode === "one" && (
                <div className="space-y-6">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Object Properties
                  </h3>
                  <QuickActions />
                  <GroupControls />
                  <AlignControls />
                  <CenterAlignControls />
                  <FlipControls />
                  <AttributePosition />
                  <AttributeColor />
                  <AttributeFont />
                  <AttributeTextContent />
                  <AttributeTextFloat />
                  <AttributeShadow />
                  <AttributeBorder />
                  <AttributeRounded />
                  <AttributeId />
                  <ReplaceImage />
                  <CropImage />
                  <ClipImage />
                  <FiltersPanel />
                  <ImageStrokeFull />
                  <AttributeQRCode />
                  <AttributeBarcode />
                </div>
              )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-5 h-16 bg-white border rounded-l cursor-pointer hover:bg-gray-50 transition-all z-10 flex items-center justify-center"
        style={{ borderColor: "#eef2f8" }}
      >
        <div className="text-gray-400">
          {isExpanded ? "›" : "‹"}
        </div>
      </button>
    </div>
  );
}
