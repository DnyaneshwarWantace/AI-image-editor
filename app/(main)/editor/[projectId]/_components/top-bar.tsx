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
  Sparkles,
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
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ImportMenu } from "./top-bar-actions/import-menu";
import { PreviewButton } from "./top-bar-actions/preview-button";
import { WatermarkButton } from "./top-bar-actions/watermark-button";
import { DragModeToggle } from "./top-bar-actions/drag-mode-toggle";
import { VariationsManagerModal } from "./variations-manager-modal";
import { useParams } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";

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
  const params = useParams();
  const { canvas, editor } = useCanvasContext();
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isVariationsModalOpen, setIsVariationsModalOpen] = useState(false);

  // Convex mutation for saving projects
  const updateProjectMutation = useMutation(api.projects.updateProject);

  // Helper to check if ID is valid Convex ID
  const isValidConvexId = (id: string): boolean => {
    if (!id || typeof id !== 'string') return false;
    const convexIdPattern = /^[a-z][a-z0-9]{15,}$/i;
    return convexIdPattern.test(id) && id.length >= 16;
  };

  // Check if projectId is valid Convex ID
  const projectIdParam = params.projectId as string;
  const isValidId = isValidConvexId(projectIdParam);
  const projectId = isValidId ? (projectIdParam as Id<"projects">) : null;

  // Query variation counts
  const textVariationCounts = useQuery(
    api.textVariations.getVariationCounts,
    projectId ? { projectId } : "skip"
  );
  const imageVariationCounts = useQuery(
    api.imageVariations.getImageVariationCounts,
    projectId ? { projectId } : "skip"
  );

  // Calculate total variations
  const totalTextVariations = textVariationCounts
    ? Object.values(textVariationCounts).reduce((sum, count) => sum + count, 0)
    : 0;
  const totalImageVariations = imageVariationCounts
    ? Object.values(imageVariationCounts).reduce((sum, count) => sum + count, 0)
    : 0;
  const totalVariations = totalTextVariations + totalImageVariations;

  // Listen to history updates
  React.useEffect(() => {
    if (!editor) return;

    const handleHistoryUpdate = (undoCount: number, redoCount: number) => {
      setCanUndo(undoCount > 0);
      setCanRedo(redoCount > 0);
    };

    editor.on?.('historyUpdate', handleHistoryUpdate);

    // Initial check
    if (editor.canUndo && editor.canRedo) {
      setCanUndo(editor.canUndo());
      setCanRedo(editor.canRedo());
    }

    return () => {
      editor.off?.('historyUpdate', handleHistoryUpdate);
    };
  }, [editor]);

  // Undo/Redo
  const handleUndo = () => {
    if (!editor) return;
    try {
      editor.undo?.();
    } catch (error) {
      console.error("Error during undo:", error);
      toast.error("Failed to undo");
    }
  };

  const handleRedo = () => {
    if (!editor) return;
    try {
      editor.redo?.();
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
  const handleClearCanvas = async () => {
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

        // Save cleared state
        const canvasJSON = canvas.toJSON();

        // Generate thumbnail (will be empty/white after clear)
        const thumbnail = canvas.toDataURL({
          format: 'png',
          quality: 0.8,
          multiplier: 0.3,
        });

        // Always save to localStorage as backup
        localStorage.setItem(`project-${project._id}`, JSON.stringify(canvasJSON));
        const meta = {
          width: canvas.getWidth(),
          height: canvas.getHeight(),
          title: project.title || 'Untitled Project',
          updatedAt: Date.now(),
        };
        localStorage.setItem(`project-meta-${project._id}`, JSON.stringify(meta));

        // Save to Convex backend only if project ID is a valid Convex ID
        if (project._id && typeof project._id === 'string' && isValidConvexId(project._id)) {
          try {
            await updateProjectMutation({
              projectId: project._id as any,
              canvasState: canvasJSON,
              width: canvas.getWidth(),
              height: canvas.getHeight(),
              imageUrl: thumbnail,
            });
          } catch (saveError) {
            console.warn('Could not save to Convex, saved to localStorage:', saveError);
          }
        }

        toast.success("Canvas cleared and saved");
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
      // Use editor's getJson() which properly includes custom properties
      const canvasJSON = (editor as any)?.getJson?.() || canvas.toJSON();

      // Detailed logging of what's being saved
      console.log('💾 MANUAL SAVE - Full canvas data:', {
        totalObjects: canvasJSON.objects?.length || 0,
        canvasWidth: canvas.getWidth(),
        canvasHeight: canvas.getHeight(),
        backgroundColor: canvasJSON.backgroundColor,
        backgroundImage: canvasJSON.backgroundImage,
        objects: canvasJSON.objects?.map((obj: any, idx: number) => ({
          index: idx,
          type: obj.type,
          id: obj.id,
          // Text properties
          text: obj.text?.substring(0, 30),
          fontFamily: obj.fontFamily,
          fontSize: obj.fontSize,
          fontWeight: obj.fontWeight,
          fontStyle: obj.fontStyle,
          textAlign: obj.textAlign,
          lineHeight: obj.lineHeight,
          charSpacing: obj.charSpacing,
          // Image properties
          src: obj.src?.substring(0, 50),
          // Style properties
          fill: obj.fill,
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth,
          opacity: obj.opacity,
          // Transform properties
          left: obj.left,
          top: obj.top,
          width: obj.width,
          height: obj.height,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          angle: obj.angle,
          // Shadow & effects
          shadow: obj.shadow,
          // Total properties
          totalProperties: Object.keys(obj).length
        }))
      });

      console.log('📝 First object full details:', canvasJSON.objects?.[0]);

      // Generate thumbnail for preview (smaller size for better performance)
      const thumbnail = canvas.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 0.3, // 30% of original size for thumbnail
      });

      // Always save to localStorage as backup
      localStorage.setItem(`project-${project._id}`, JSON.stringify(canvasJSON));
      const meta = {
        width: canvas.getWidth(),
        height: canvas.getHeight(),
        title: project.title || 'Untitled Project',
        updatedAt: Date.now(),
      };
      localStorage.setItem(`project-meta-${project._id}`, JSON.stringify(meta));

      // Save to Convex backend only if project ID is a valid Convex ID
      if (project._id && typeof project._id === 'string' && isValidConvexId(project._id)) {
        try {
          await updateProjectMutation({
            projectId: project._id as any,
            canvasState: canvasJSON,
            width: canvas.getWidth(),
            height: canvas.getHeight(),
            imageUrl: thumbnail, // Save thumbnail for preview
          });
          toast.success("Project saved!");
        } catch (convexError) {
          console.warn('Could not save to Convex, saved to localStorage:', convexError);
          toast.success("Project saved to local storage (backend unavailable)");
        }
      } else {
        // Not a valid Convex ID, just save to localStorage
        toast.success("Project saved to local storage!");
      }
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
        try {
          // Get workspace for proper dimensions
          const workspace = canvas.getObjects().find((item: any) => item.id === 'workspace');
          
          // Get all text objects to find fonts used
          const textObjects = canvas.getObjects().filter((item: any) => 
            item.type === 'textbox' || item.type === 'i-text' || item.type === 'text'
          );
          
          // Collect unique font families
          const fontFamilies = Array.from(new Set(
            textObjects
              .map((item: any) => item.fontFamily)
              .filter((font: any) => font && font !== 'Arial' && font !== 'arial')
          ));
          
          // Get font plugin to access font URLs
          const fontPlugin = (editor as any)?.getPlugin?.('FontPlugin');
          const fontList = fontPlugin?.cacheList || [];
          
          // Build font entry map
          const fontEntry: Record<string, string> = {};
          for (const fontFamily of fontFamilies) {
            const fontItem = fontList.find((item: any) => item.name === fontFamily);
            if (fontItem?.file) {
              fontEntry[fontFamily] = fontItem.file;
            }
          }
          
          // Set font paths if available (for Fabric.js v6)
          if (Object.keys(fontEntry).length > 0 && typeof (canvas as any).fontPaths !== 'undefined') {
            (canvas as any).fontPaths = fontEntry;
          }
          
          // Build SVG options
          let svgOptions: any = {};
          
          if (workspace && workspace.width && workspace.height) {
            svgOptions = {
              width: String(workspace.width),
              height: String(workspace.height),
              viewBox: {
                x: workspace.left || 0,
                y: workspace.top || 0,
                width: workspace.width,
                height: workspace.height,
              },
            };
          } else {
            // Fallback to canvas dimensions
            svgOptions = {
              width: String(canvas.getWidth()),
              height: String(canvas.getHeight()),
            };
          }
          
          // Generate SVG with proper options
          const svgString = canvas.toSVG(svgOptions);
          
          if (!svgString || svgString.trim().length === 0) {
            throw new Error('SVG generation returned empty string');
          }
          
          // Create blob and download
          const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = `${project.title || 'export'}.${exportConfig.extension}`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast.success("Image exported as SVG!");
        } catch (svgError) {
          console.error("SVG export error:", svgError);
          // Fallback: try simple SVG export
          try {
            const svgString = canvas.toSVG();
            if (svgString && svgString.trim().length > 0) {
              const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.download = `${project.title || 'export'}.${exportConfig.extension}`;
              link.href = url;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              toast.success("Image exported as SVG!");
            } else {
              throw new Error('SVG generation failed');
            }
          } catch (fallbackError) {
            console.error("SVG export fallback error:", fallbackError);
            toast.error("Failed to export SVG. Please try again.");
          }
        }
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

            {/* Variations Manager */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVariationsModalOpen(true)}
              className="text-gray-700 hover:bg-gray-100 gap-2"
              title="Manage Variations"
            >
              <Sparkles className="h-4 w-4" />
              <span>Variations</span>
              {totalVariations > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                  {totalVariations}
                </span>
              )}
            </Button>

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

      {/* Variations Manager Modal */}
      <VariationsManagerModal
        isOpen={isVariationsModalOpen}
        onClose={() => setIsVariationsModalOpen(false)}
        projectId={project?._id as Id<"projects"> | null}
        projectIdParam={params.projectId as string}
      />
    </header>
  );
}
