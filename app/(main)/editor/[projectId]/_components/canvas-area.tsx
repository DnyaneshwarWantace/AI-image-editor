"use client";

import React, { useEffect, useRef } from "react";
import { Canvas } from "fabric";
import { useCanvasContext } from "@/providers/canvas-provider";
import { ZoomControls } from "./canvas/zoom-controls";
import Editor from "@/lib/editor/Editor";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Import all plugins
import DringPlugin from "@/lib/editor/plugin/DringPlugin";
import AlignGuidLinePlugin from "@/lib/editor/plugin/AlignGuidLinePlugin";
import ControlsPlugin from "@/lib/editor/plugin/ControlsPlugin";
import CenterAlignPlugin from "@/lib/editor/plugin/CenterAlignPlugin";
import LayerPlugin from "@/lib/editor/plugin/LayerPlugin";
import CopyPlugin from "@/lib/editor/plugin/CopyPlugin";
import MoveHotKeyPlugin from "@/lib/editor/plugin/MoveHotKeyPlugin";
import DeleteHotKeyPlugin from "@/lib/editor/plugin/DeleteHotKeyPlugin";
import GroupPlugin from "@/lib/editor/plugin/GroupPlugin";
import DrawLinePlugin from "@/lib/editor/plugin/DrawLinePlugin";
import GroupTextEditorPlugin from "@/lib/editor/plugin/GroupTextEditorPlugin";
import GroupAlignPlugin from "@/lib/editor/plugin/GroupAlignPlugin";
import WorkspacePlugin from "@/lib/editor/plugin/WorkspacePlugin";
import HistoryPlugin from "@/lib/editor/plugin/HistoryPlugin";
import FlipPlugin from "@/lib/editor/plugin/FlipPlugin";
import MaterialPlugin from "@/lib/editor/plugin/MaterialPlugin";
import WaterMarkPlugin from "@/lib/editor/plugin/WaterMarkPlugin";
import FontPlugin from "@/lib/editor/plugin/FontPlugin";
import PolygonModifyPlugin from "@/lib/editor/plugin/PolygonModifyPlugin";
import DrawPolygonPlugin from "@/lib/editor/plugin/DrawPolygonPlugin";
import FreeDrawPlugin from "@/lib/editor/plugin/FreeDrawPlugin";
import PathTextPlugin from "@/lib/editor/plugin/PathTextPlugin";
import PsdPlugin from "@/lib/editor/plugin/PsdPlugin";
import SimpleClipImagePlugin from "@/lib/editor/plugin/SimpleClipImagePlugin";
import BarCodePlugin from "@/lib/editor/plugin/BarCodePlugin";
import QrCodePlugin from "@/lib/editor/plugin/QrCodePlugin";
import ImageStroke from "@/lib/editor/plugin/ImageStroke";
import ResizePlugin from "@/lib/editor/plugin/ResizePlugin";
import LockPlugin from "@/lib/editor/plugin/LockPlugin";
import AddBaseTypePlugin from "@/lib/editor/plugin/AddBaseTypePlugin";
import MaskPlugin from "@/lib/editor/plugin/MaskPlugin";
import RulerPlugin from "@/lib/editor/plugin/RulerPlugin";
import { ContextMenu } from "./context-menu";

interface CanvasAreaProps {
  project: any;
  rulerEnabled: boolean;
}

export function CanvasArea({ project, rulerEnabled }: CanvasAreaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const { setCanvas, setEditor } = useCanvasContext();

  // Fetch fonts from Convex
  const convexFonts = useQuery(api.fonts.getFonts, {
    limit: 10000,
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    // Check if canvas is already initialized (React Strict Mode double mount)
    const existingCanvas = (canvasRef.current as any).__fabricCanvas;
    if (existingCanvas) {
      // Canvas already initialized, just update context
      setCanvas(existingCanvas);
      return;
    }

    let fabricCanvas: Canvas | null = null;
    try {
      // Initialize Fabric Canvas
      fabricCanvas = new Canvas(canvasRef.current, {
        fireRightClick: true,
        stopContextMenu: true,
        controlsAboveOverlay: true,
        preserveObjectStacking: true,
      });

      // Mark canvas as initialized
      (canvasRef.current as any).__fabricCanvas = fabricCanvas;

      // Initialize Editor
      const canvasEditor = new Editor();
      canvasEditor.init(fabricCanvas);

      // Transform Convex fonts to FontPlugin format (if loaded)
      const fontList = convexFonts
        ? convexFonts
            .filter((f) => f.url && f.imageUrl) // Only include fonts with both font file and preview
            .map((font) => ({
              name: font.name,
              type: font.type || 'cn',
              file: font.url!,
              img: font.imageUrl!,
            }))
        : [];

      // Load all plugins with error handling
      const plugins = [
        { name: 'DringPlugin', plugin: DringPlugin, options: undefined },
        { name: 'PolygonModifyPlugin', plugin: PolygonModifyPlugin, options: undefined },
        { name: 'AlignGuidLinePlugin', plugin: AlignGuidLinePlugin, options: undefined },
        { name: 'ControlsPlugin', plugin: ControlsPlugin, options: undefined },
        { name: 'CenterAlignPlugin', plugin: CenterAlignPlugin, options: undefined },
        { name: 'LayerPlugin', plugin: LayerPlugin, options: undefined },
        { name: 'CopyPlugin', plugin: CopyPlugin, options: undefined },
        { name: 'MoveHotKeyPlugin', plugin: MoveHotKeyPlugin, options: undefined },
        { name: 'DeleteHotKeyPlugin', plugin: DeleteHotKeyPlugin, options: undefined },
        { name: 'GroupPlugin', plugin: GroupPlugin, options: undefined },
        { name: 'DrawLinePlugin', plugin: DrawLinePlugin, options: undefined },
        { name: 'GroupTextEditorPlugin', plugin: GroupTextEditorPlugin, options: undefined },
        { name: 'GroupAlignPlugin', plugin: GroupAlignPlugin, options: undefined },
        { name: 'WorkspacePlugin', plugin: WorkspacePlugin, options: undefined },
        { name: 'HistoryPlugin', plugin: HistoryPlugin, options: undefined },
        { name: 'FlipPlugin', plugin: FlipPlugin, options: undefined },
        { name: 'DrawPolygonPlugin', plugin: DrawPolygonPlugin, options: undefined },
        { name: 'FreeDrawPlugin', plugin: FreeDrawPlugin, options: undefined },
        { name: 'PathTextPlugin', plugin: PathTextPlugin, options: undefined },
        { name: 'SimpleClipImagePlugin', plugin: SimpleClipImagePlugin, options: undefined },
        { name: 'BarCodePlugin', plugin: BarCodePlugin, options: undefined },
        { name: 'QrCodePlugin', plugin: QrCodePlugin, options: undefined },
        { name: 'FontPlugin', plugin: FontPlugin, options: { fontList } },
        { name: 'MaterialPlugin', plugin: MaterialPlugin, options: { repoSrc: process.env.NEXT_PUBLIC_MATERIAL_API || 'http://localhost:1337' } },
        { name: 'WaterMarkPlugin', plugin: WaterMarkPlugin, options: undefined },
        { name: 'PsdPlugin', plugin: PsdPlugin, options: undefined },
        { name: 'ImageStroke', plugin: ImageStroke, options: undefined },
        { name: 'ResizePlugin', plugin: ResizePlugin, options: undefined },
        { name: 'LockPlugin', plugin: LockPlugin, options: undefined },
        { name: 'AddBaseTypePlugin', plugin: AddBaseTypePlugin, options: undefined },
        { name: 'MaskPlugin', plugin: MaskPlugin, options: undefined },
        { name: 'RulerPlugin', plugin: RulerPlugin, options: undefined },
      ];

      for (const { name, plugin, options } of plugins) {
        try {
          canvasEditor.use(plugin, options);
        } catch (pluginError) {
          console.error(`Error loading plugin ${name}:`, pluginError);
          // Continue loading other plugins even if one fails
        }
      }

      // Set canvas size (setSize is provided by WorkspacePlugin)
      if (project.width && project.height && (canvasEditor as any).setSize) {
        (canvasEditor as any).setSize(project.width, project.height);
      }

      // Load canvas state if exists (Fabric.js v6 - Promise-based)
      if (project.canvasState && fabricCanvas) {
        fabricCanvas.loadFromJSON(project.canvasState).then(() => {
          if (fabricCanvas) {
            fabricCanvas.requestRenderAll();
            // Auto-zoom to fit workspace after loading - increased delay
            setTimeout(() => {
              (canvasEditor as any)?.auto?.();
              if (fabricCanvas) {
                fabricCanvas.requestRenderAll();
              }
            }, 300);
          }
        }).catch((error) => {
          console.error('Error loading canvas state:', error);
        });
      } else if (fabricCanvas) {
        // If no canvas state, still auto-zoom to fit the workspace
        setTimeout(() => {
          (canvasEditor as any)?.auto?.();
          if (fabricCanvas) {
            fabricCanvas.requestRenderAll();
          }
        }, 300);
      }

      // Store in context
      if (fabricCanvas) {
        setCanvas(fabricCanvas);
        setEditor(canvasEditor as any);
      }
    } catch (error) {
      console.error('Error initializing canvas:', error);
      // Clean up on error
      if (fabricCanvas) {
        try {
          fabricCanvas.dispose();
        } catch (disposeError) {
          console.error('Error disposing canvas on error:', disposeError);
        }
      }
      if (canvasRef.current) {
        delete (canvasRef.current as any).__fabricCanvas;
      }
    }

    // Cleanup
    return () => {
      const fabricCanvas = (canvasRef.current as any)?.__fabricCanvas;
      if (fabricCanvas) {
        try {
          fabricCanvas.dispose();
        } catch (error) {
          console.error('Error disposing canvas:', error);
        }
      }
      if (canvasRef.current) {
        delete (canvasRef.current as any).__fabricCanvas;
      }
    };
  }, [project, setCanvas, setEditor]);

  // Toggle grid
  useEffect(() => {
    if (!canvasRef.current) return;

    if (rulerEnabled) {
      canvasRef.current.classList.add("design-stage-grid");
    } else {
      canvasRef.current.classList.remove("design-stage-grid");
    }
  }, [rulerEnabled]);

  return (
    <div
      ref={workspaceRef}
      id="workspace"
      className="flex-1 overflow-hidden relative"
      style={{ background: "#ffffff" }}
    >
      <div className="canvas-box flex items-center justify-center h-full">
        <div className="inside-shadow"></div>
        <canvas ref={canvasRef} id="canvas"></canvas>
        <ZoomControls />
        <ContextMenu />
      </div>

      <style jsx global>{`
        .canvas-box {
          position: relative;
          background: #ffffff;
        }

        .inside-shadow {
          position: absolute;
          width: 100%;
          height: 100%;
          box-shadow: inset 0 0 9px 2px rgba(0, 0, 0, 0.12);
          z-index: 2;
          pointer-events: none;
        }

        #canvas {
          width: 300px;
          height: 300px;
          margin: 0 auto;
          background: #ffffff;
        }

        /* Remove any checkerboard background from fabric.js canvas layers */
        .canvas-container {
          background: #ffffff !important;
        }

        .lower-canvas,
        .upper-canvas {
          background: transparent !important;
        }

        .design-stage-grid {
          --offsetX: 0px;
          --offsetY: 0px;
          --size: 16px;
          --color: #dedcdc;
          background-image: linear-gradient(
              45deg,
              var(--color) 25%,
              transparent 0,
              transparent 75%,
              var(--color) 0
            ),
            linear-gradient(
              45deg,
              var(--color) 25%,
              transparent 0,
              transparent 75%,
              var(--color) 0
            );
          background-position: var(--offsetX) var(--offsetY),
            calc(var(--size) + var(--offsetX)) calc(var(--size) + var(--offsetY));
          background-size: calc(var(--size) * 2) calc(var(--size) * 2);
        }
      `}</style>
    </div>
  );
}
