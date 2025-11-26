"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  RotateCw,
  Save,
  Download,
  ChevronDown,
  Grid3x3,
  Loader2,
  Clipboard,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCanvasContext } from "@/providers/canvas-provider";
import { toast } from "sonner";
import type { ExportFormat } from "@/types/editor";
import { ImportMenu } from "./top-bar-actions/import-menu";
import { PreviewButton } from "./top-bar-actions/preview-button";
import { WatermarkButton } from "./top-bar-actions/watermark-button";
import { DragModeToggle } from "./top-bar-actions/drag-mode-toggle";

const EXPORT_FORMATS: ExportFormat[] = [
  {
    format: "PNG",
    quality: 1.0,
    label: "PNG (High Quality)",
    extension: "png",
  },
  {
    format: "JPEG",
    quality: 0.9,
    label: "JPEG (90% Quality)",
    extension: "jpg",
  },
  {
    format: "WEBP",
    quality: 0.9,
    label: "WebP (90% Quality)",
    extension: "webp",
  },
  {
    format: "SVG",
    quality: 1.0,
    label: "SVG (Vector)",
    extension: "svg",
    isVector: true,
  },
  {
    format: "JSON",
    quality: 1.0,
    label: "JSON (Project File)",
    extension: "json",
    isData: true,
  },
];

interface TopBarProps {
  project: any;
  rulerEnabled: boolean;
  onRulerToggle: () => void;
}

export function TopBar({ project, rulerEnabled, onRulerToggle }: TopBarProps) {
  const router = useRouter();
  const { canvas, editor } = useCanvasContext();
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // TODO: Enable Convex once it's set up with ConvexProvider
  // const { mutate: updateProject, isLoading: isSaving } = useConvexMutation(
  //   api.projects.updateProject
  // );

  // Undo/Redo
  const handleUndo = () => {
    if (!editor) return;
    try {
      editor.undo?.();
      toast.success("Undone");
    } catch (error) {
      console.error("Error during undo:", error);
      toast.error("Failed to undo");
    }
  };

  const handleRedo = () => {
    if (!editor) return;
    try {
      editor.redo?.();
      toast.success("Redone");
    } catch (error) {
      console.error("Error during redo:", error);
      toast.error("Failed to redo");
    }
  };

  // Copy to Clipboard
  const handleCopyToClipboard = async () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    try {
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
      });

      // Convert dataURL to blob
      const response = await fetch(dataURL);
      const blob = await response.blob();

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);

      toast.success("Copied to clipboard!");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  // Copy Base64 to Clipboard
  const handleCopyBase64 = async () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    try {
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
      });

      await navigator.clipboard.writeText(dataURL);
      toast.success("Base64 string copied to clipboard!");
    } catch (error) {
      console.error("Error copying base64:", error);
      toast.error("Failed to copy base64");
    }
  };

  // Clear Canvas
  const handleClearCanvas = () => {
    if (!canvas) {
      toast.error("Canvas not ready");
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to clear the canvas? This action cannot be undone."
    );

    if (confirmed) {
      try {
        editor?.clear?.();
        toast.success("Canvas cleared");
      } catch (error) {
        console.error("Error clearing canvas:", error);
        toast.error("Failed to clear canvas");
      }
    }
  };

  // Save
  const handleSave = async () => {
    if (!canvas || !project) {
      toast.error("Canvas not ready");
      return;
    }

    try {
      setIsSaving(true);
      const canvasJSON = canvas.toJSON();
      
      // TODO: Enable Convex saving once it's set up
      // await updateProject({
      //   projectId: project._id,
      //   canvasState: canvasJSON,
      // });
      
      // For now, just save to localStorage as a fallback
      localStorage.setItem(`project-${project._id}`, JSON.stringify(canvasJSON));
      
      toast.success("Project saved to local storage!");
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("Failed to save project");
    } finally {
      setIsSaving(false);
    }
  };

  // Export
  const handleExport = async (exportConfig: ExportFormat) => {
    if (!canvas || !project) {
      toast.error("Canvas not ready");
      return;
    }

    setIsExporting(true);

    try {
      // JSON export
      if (exportConfig.isData) {
        const canvasJSON = canvas.toJSON();
        const jsonString = JSON.stringify(canvasJSON, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `${project.title}.${exportConfig.extension}`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Project exported as JSON!");
        return;
      }

      // SVG export
      if (exportConfig.isVector) {
        const svgString = canvas.toSVG();
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `${project.title}.${exportConfig.extension}`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Image exported as SVG!");
        return;
      }

      // Image export
      const dataURL = canvas.toDataURL({
        format: exportConfig.format.toLowerCase() as 'png' | 'jpeg' | 'webp',
        quality: exportConfig.quality,
        multiplier: 1,
      });

      const link = document.createElement("a");
      link.download = `${project.title}.${exportConfig.extension}`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Image exported as ${exportConfig.format}!`);
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Failed to export");
    } finally {
      setIsExporting(false);
    }
  };

  const canUndo = editor?.canUndo?.() ?? false;
  const canRedo = editor?.canRedo?.() ?? false;

  return (
    <header
      className="h-16 px-4 flex items-center justify-between border-b"
      style={{ borderColor: "#eef2f8", backgroundColor: "#fff" }}
    >
          {/* Left Section */}
          <div className="flex items-center gap-3">
            {/* New Project Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-gray-700 hover:bg-gray-100"
            >
              New
            </Button>

            <div className="h-6 w-px bg-gray-300" />

            {/* Import Menu */}
            <ImportMenu />

            <div className="h-6 w-px bg-gray-300" />

            {/* Preview */}
            <PreviewButton />

            {/* Watermark */}
            <WatermarkButton />

            <div className="h-6 w-px bg-gray-300" />

            {/* Drag Mode */}
            <DragModeToggle />

            <div className="h-6 w-px bg-gray-300" />

        {/* Ruler Toggle */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rulerEnabled}
              onChange={onRulerToggle}
              className="w-4 h-4"
            />
            <Grid3x3 className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-700">Grid</span>
          </label>
        </div>

        <div className="h-6 w-px bg-gray-300" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={!canUndo}
            className="text-gray-700 hover:bg-gray-100"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={!canRedo}
            className="text-gray-700 hover:bg-gray-100"
            title="Redo (Ctrl+Shift+Z)"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-gray-300" />

        {/* Clipboard & Clear */}
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={!canvas}
                className="text-gray-700 hover:bg-gray-100"
                title="Copy to Clipboard"
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={handleCopyToClipboard}
                className="cursor-pointer"
              >
                Copy as Image
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleCopyBase64}
                className="cursor-pointer"
              >
                Copy as Base64
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearCanvas}
            disabled={!canvas}
            className="text-gray-700 hover:bg-gray-100"
            title="Clear Canvas"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Save Button */}
        <Button
          variant="default"
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !canvas}
          className="gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save
            </>
          )}
        </Button>

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isExporting || !canvas}
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm text-gray-500">
              {project.width} × {project.height}px
            </div>
            {EXPORT_FORMATS.map((config, index) => (
              <DropdownMenuItem
                key={index}
                onClick={() => handleExport(config)}
                className="cursor-pointer"
              >
                <div className="flex-1">
                  <div className="font-medium">{config.label}</div>
                  {!config.isData && !config.isVector && (
                    <div className="text-xs text-gray-500">
                      {config.format} • {Math.round(config.quality * 100)}%
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
