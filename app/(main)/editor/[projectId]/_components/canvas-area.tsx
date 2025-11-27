"use client";

import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "fabric";
import { useCanvasContext } from "@/providers/canvas-provider";
import { ZoomControls } from "./canvas/zoom-controls";
import Editor from "@/lib/editor/Editor";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Import all plugins (removed WorkspacePlugin, ResizePlugin, MaskPlugin)
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
import LockPlugin from "@/lib/editor/plugin/LockPlugin";
import AddBaseTypePlugin from "@/lib/editor/plugin/AddBaseTypePlugin";
import RulerPlugin from "@/lib/editor/plugin/RulerPlugin";
import { ContextMenu } from "./context-menu";

interface CanvasAreaProps {
  project: any;
  rulerEnabled: boolean;
}

export function CanvasArea({ project, rulerEnabled }: CanvasAreaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setCanvas, setEditor, canvas } = useCanvasContext();
  const [zoom, setZoom] = useState(1);
  const [canvasSize, setCanvasSize] = useState({
    width: project.width || 800,
    height: project.height || 600,
  });

  // Fetch fonts from Convex
  const convexFonts = useQuery(api.fonts.getFonts, {
    limit: 10000,
  });


  // Calculate zoom to fit canvas in container
  const calculateZoom = () => {
    if (!containerRef.current || !canvasSize.width || !canvasSize.height) return 1;

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;

    // Add padding
    const paddingFactor = 0.85;
    const scaleX = (containerWidth * paddingFactor) / canvasSize.width;
    const scaleY = (containerHeight * paddingFactor) / canvasSize.height;

    return Math.min(scaleX, scaleY, 1); // Don't zoom beyond 100%
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2)); // Max 200%
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.1)); // Min 10%
  };

  const handleZoomFit = () => {
    const fitZoom = calculateZoom();
    setZoom(fitZoom);
  };

  const handleZoom100 = () => {
    setZoom(1); // 100%
  };

  // Update zoom when container or canvas size changes
  useEffect(() => {
    const newZoom = calculateZoom();
    setZoom(newZoom);
  }, [canvasSize.width, canvasSize.height]);

  // Update canvas size when project changes
  useEffect(() => {
    setCanvasSize({
      width: project.width || 800,
      height: project.height || 600,
    });
  }, [project.width, project.height]);

  // Listen for custom canvas size change events (from templates)
  useEffect(() => {
    const handleCanvasSizeChange = (event: CustomEvent) => {
      const { width, height } = event.detail;
      setCanvasSize({ width, height });
    };

    window.addEventListener('canvasSizeChange' as any, handleCanvasSizeChange);
    return () => {
      window.removeEventListener('canvasSizeChange' as any, handleCanvasSizeChange);
    };
  }, []);

  // Update canvas dimensions when canvasSize changes (without recreating canvas)
  useEffect(() => {
    const fabricCanvas = (canvasRef.current as any)?.__fabricCanvas;
    if (!fabricCanvas || !fabricCanvas.getContext()) return;

    // Only update dimensions if they actually changed
    const currentWidth = fabricCanvas.getWidth();
    const currentHeight = fabricCanvas.getHeight();
    
    if (currentWidth !== canvasSize.width || currentHeight !== canvasSize.height) {
      fabricCanvas.setDimensions({
        width: canvasSize.width,
        height: canvasSize.height,
      });
      fabricCanvas.requestRenderAll();
    }
  }, [canvasSize.width, canvasSize.height]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Check if canvas is already initialized
    const existingCanvas = (canvasRef.current as any).__fabricCanvas;
    if (existingCanvas) {
      // Don't recreate canvas, just update size
      return;
    }

    let fabricCanvas: Canvas | null = null;
    try {
      // Initialize Fabric Canvas with exact project dimensions
      fabricCanvas = new Canvas(canvasRef.current, {
        fireRightClick: true,
        stopContextMenu: true,
        controlsAboveOverlay: true,
        preserveObjectStacking: true,
        width: canvasSize.width,
        height: canvasSize.height,
        // Enable multi-select with Shift+Click
        selection: true,
        // Allow selection of multiple objects
        allowTouchScrolling: false,
      });

      // Mark canvas as initialized
      (canvasRef.current as any).__fabricCanvas = fabricCanvas;

      // Initialize Editor
      const canvasEditor = new Editor();
      canvasEditor.init(fabricCanvas);

      // Add custom methods for size management
      (canvasEditor as any).setCanvasSize = (width: number, height: number) => {
        setCanvasSize({ width, height });
        fabricCanvas?.setDimensions({ width, height });
        fabricCanvas?.requestRenderAll();
      };

      (canvasEditor as any).getCanvasSize = () => canvasSize;

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

      // Load all plugins (removed WorkspacePlugin, ResizePlugin, MaskPlugin)
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
        { name: 'LockPlugin', plugin: LockPlugin, options: undefined },
        { name: 'AddBaseTypePlugin', plugin: AddBaseTypePlugin, options: undefined },
        { name: 'RulerPlugin', plugin: RulerPlugin, options: undefined },
      ];

      for (const { name, plugin, options } of plugins) {
        try {
          canvasEditor.use(plugin, options);
        } catch (pluginError) {
          console.error(`Error loading plugin ${name}:`, pluginError);
        }
      }

      // Load canvas state if exists
      if (project.canvasState && fabricCanvas) {
        // Extract workspace dimensions from canvas state before loading
        let loadedWidth = canvasSize.width;
        let loadedHeight = canvasSize.height;
        
        try {
          const canvasState = typeof project.canvasState === 'string' 
            ? JSON.parse(project.canvasState) 
            : project.canvasState;
          
          // Check if canvas state has width/height
          if (canvasState.width && canvasState.height) {
            loadedWidth = canvasState.width;
            loadedHeight = canvasState.height;
          }
          
          // Check for workspace object in canvas state
          if (canvasState.objects) {
            const workspace = canvasState.objects.find((obj: any) => obj.id === 'workspace');
            if (workspace && workspace.width && workspace.height) {
              loadedWidth = workspace.width;
              loadedHeight = workspace.height;
            }
          }
        } catch (e) {
          console.warn('Could not parse canvas state for dimensions:', e);
        }
        
        // Update canvas size state with loaded dimensions
        setCanvasSize({ width: loadedWidth, height: loadedHeight });
        
        // Update canvas dimensions to match loaded state
        fabricCanvas.setDimensions({ width: loadedWidth, height: loadedHeight });
        
        // Load fonts BEFORE loading canvas state to prevent FOUT (Flash of Unstyled Text)
        const canvasStateString = typeof project.canvasState === 'string' 
          ? project.canvasState 
          : JSON.stringify(project.canvasState);
        
        // Use FontPlugin's hookImportBefore to load all fonts used in the canvas state
        const loadFontsPromise = canvasEditor.hooksEntity?.hookImportBefore
          ? new Promise<void>((resolve) => {
              canvasEditor.hooksEntity.hookImportBefore.callAsync(canvasStateString, () => {
                resolve();
              });
            })
          : Promise.resolve();
        
        // Wait for fonts to load, then load canvas state
        // Also ensure canvas is fully initialized before loading
        Promise.all([
          loadFontsPromise,
          // Wait for canvas to be fully ready with retry logic
          new Promise<void>((resolve) => {
            const checkCanvasReady = (attempts = 0) => {
              if (fabricCanvas) {
                try {
                  const context = fabricCanvas.getContext();
                  if (context && fabricCanvas.width && fabricCanvas.height) {
                    resolve();
                    return;
                  }
                } catch (e) {
                  // Context not ready yet
                }
              }
              
              if (attempts < 10) {
                // Retry up to 10 times (500ms total)
                setTimeout(() => checkCanvasReady(attempts + 1), 50);
              } else {
                // Give up after 10 attempts
                console.warn('Canvas not ready after retries, proceeding anyway');
                resolve();
              }
            };
            checkCanvasReady();
          })
        ])
          .then(async () => {
            // Fonts are loaded and canvas is ready, safe to load canvas state
            if (!fabricCanvas) {
              console.warn('Canvas not available for loading state');
              return;
            }
            
            // Double-check context before loading
            try {
              const context = fabricCanvas.getContext();
              if (!context) {
                console.warn('Canvas context not ready, waiting...');
                await new Promise<void>((resolve) => {
                  setTimeout(() => {
                    try {
                      const ctx = fabricCanvas?.getContext();
                      if (ctx && fabricCanvas) {
                        fabricCanvas.loadFromJSON(project.canvasState).then(() => resolve()).catch(() => resolve());
                      } else {
                        resolve();
                      }
                    } catch (e) {
                      console.error('Failed to load canvas state after retry:', e);
                      resolve();
                    }
                  }, 100);
                });
                return;
              }
            } catch (e) {
              console.error('Error checking canvas context:', e);
              return;
            }
            
            // Load canvas state
            try {
              await fabricCanvas.loadFromJSON(project.canvasState);
            } catch (loadError) {
              console.error('Error loading canvas state:', loadError);
            }
          })
          .then(() => {
            if (fabricCanvas && fabricCanvas.getContext()) {
              // Ensure canvas dimensions match workspace after load
              const objects = fabricCanvas.getObjects();
              const workspace = objects.find((obj: any) => (obj as any).id === 'workspace');
              if (workspace) {
                // Ensure workspace doesn't interfere with selection
                workspace.set({
                  selectable: false,
                  hasControls: false,
                  evented: false,
                  excludeFromExport: false,
                });
                
                if (workspace.width && workspace.height) {
                  const wsWidth = workspace.width;
                  const wsHeight = workspace.height;
                  
                  // Update canvas size if workspace dimensions differ
                  if (wsWidth !== loadedWidth || wsHeight !== loadedHeight) {
                    setCanvasSize({ width: wsWidth, height: wsHeight });
                    fabricCanvas.setDimensions({ width: wsWidth, height: wsHeight });
                  }
                }
              }
              
              // Ensure all objects are selectable (except workspace)
              objects.forEach((obj: any) => {
                if ((obj as any).id !== 'workspace') {
                  if (obj.selectable === false && !obj.lockMovementX) {
                    obj.set('selectable', true);
                  }
                }
              });
              
              // Force re-render all text objects to ensure fonts are applied
              const textObjects = objects.filter((obj: any) => 
                obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox'
              );
              
              // Update each text object to trigger font re-render
              textObjects.forEach((obj: any) => {
                const fontFamily = obj.fontFamily;
                if (fontFamily && fontFamily !== 'Arial') {
                  // Force font reload by temporarily changing and restoring
                  obj.set('fontFamily', fontFamily);
                }
              });
              
              // Use requestAnimationFrame to ensure canvas context is ready
              requestAnimationFrame(() => {
                if (fabricCanvas && fabricCanvas.getContext()) {
                  fabricCanvas.requestRenderAll();
                }
              });
            }
          })
          .catch((error: any) => {
            console.error('Error loading canvas state:', error);
            // Fallback: try loading without font preloading after a delay
            if (fabricCanvas && project.canvasState) {
              setTimeout(() => {
                if (fabricCanvas && fabricCanvas.getContext()) {
                  fabricCanvas.loadFromJSON(project.canvasState).then(() => {
                    fabricCanvas?.requestRenderAll();
                  }).catch((fallbackError: any) => {
                    console.error('Fallback loading also failed:', fallbackError);
                  });
                }
              }, 100);
            }
          });
      } else if (fabricCanvas) {
        fabricCanvas.requestRenderAll();
      }

      // Ensure workspace doesn't interfere with selection
      const ensureWorkspaceConfig = () => {
        if (!fabricCanvas) return;
        const objects = fabricCanvas.getObjects();
        const workspace = objects.find((obj: any) => (obj as any).id === 'workspace');
        if (workspace) {
          workspace.set({
            selectable: false,
            hasControls: false,
            evented: false,
            excludeFromExport: false,
          });
        }
      };

      // Configure workspace immediately
      ensureWorkspaceConfig();

      // Center and scale objects when added to canvas
      fabricCanvas.on('object:added', (e) => {
        const obj = e.target;
        if (!obj || !fabricCanvas) return;

        // Ensure workspace is configured correctly
        ensureWorkspaceConfig();

        // Skip if we're loading from JSON
        if ((fabricCanvas as any)._isLoadingFromJSON) return;

        // Ensure workspace is not selectable
        if ((obj as any).id === 'workspace') {
          obj.set({
            selectable: false,
            hasControls: false,
            evented: false,
          });
          return;
        }

        // Ensure all other objects are selectable
        if (obj.selectable === false && !obj.lockMovementX) {
          obj.set('selectable', true);
        }

        // Skip if object already has proper position (not at 0,0 or already centered)
        if (obj.left !== undefined && obj.left > 10 && obj.top !== undefined && obj.top > 10) {
          return;
        }

        const canvasWidth = canvasSize.width || fabricCanvas.getWidth();
        const canvasHeight = canvasSize.height || fabricCanvas.getHeight();

        // Scale images to fit canvas if they're too large
        if (obj.type === 'image') {
          const objWidth = (obj.width || 0) * (obj.scaleX || 1);
          const objHeight = (obj.height || 0) * (obj.scaleY || 1);

          // If image is larger than canvas, scale it down to fit (with padding)
          const maxWidth = canvasWidth * 0.9; // 90% of canvas width
          const maxHeight = canvasHeight * 0.9; // 90% of canvas height

          if (objWidth > maxWidth || objHeight > maxHeight) {
            const scaleX = maxWidth / objWidth;
            const scaleY = maxHeight / objHeight;
            const scale = Math.min(scaleX, scaleY);

            obj.scale(scale);
          }
        }

        // Center the object on the canvas
        const canvasCenter = {
          x: canvasWidth / 2,
          y: canvasHeight / 2,
        };

        obj.set({
          left: canvasCenter.x,
          top: canvasCenter.y,
          originX: 'center',
          originY: 'center',
        });

        obj.setCoords();
        fabricCanvas.requestRenderAll();
      });

      // Override loadFromJSON to prevent auto-centering during load
      const originalLoadFromJSON = fabricCanvas.loadFromJSON.bind(fabricCanvas);
      (fabricCanvas as any).loadFromJSON = function(json: any, reviver?: any) {
        // Mark that we're loading from JSON
        (fabricCanvas as any)._isLoadingFromJSON = true;

        return originalLoadFromJSON(json, reviver).then((result: any) => {
          // Clean up the flag after loading
          setTimeout(() => {
            if (fabricCanvas) {
              delete (fabricCanvas as any)._isLoadingFromJSON;
            }
          }, 100);
          return result;
        });
      };

      // Auto-save to localStorage when canvas changes (backend save happens on manual save)
      let autoSaveTimeout: NodeJS.Timeout;
      const autoSave = () => {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
          if (!fabricCanvas || !project._id) return;
          
          // Skip auto-save if we're loading from JSON
          if ((fabricCanvas as any)._isLoadingFromJSON) return;
          
          // Ensure canvas context is ready before accessing canvas methods
          try {
            const context = fabricCanvas.getContext();
            if (!context) {
              console.warn('Canvas context not ready for auto-save');
              return;
            }
            
            const canvasJSON = fabricCanvas.toJSON();
            
            // Save to localStorage as backup
            localStorage.setItem(`project-${project._id}`, JSON.stringify(canvasJSON));
            
            // Safely get dimensions
            let width = 800;
            let height = 600;
            try {
              width = fabricCanvas.getWidth();
              height = fabricCanvas.getHeight();
            } catch (dimError) {
              console.warn('Could not get canvas dimensions:', dimError);
              // Use canvasSize state as fallback
              width = canvasSize.width;
              height = canvasSize.height;
            }
            
            const meta = {
              width,
              height,
              title: project.title || 'Untitled Project',
              updatedAt: Date.now(),
            };
            localStorage.setItem(`project-meta-${project._id}`, JSON.stringify(meta));
          } catch (error) {
            console.warn('Auto-save to localStorage failed:', error);
          }
        }, 1000); // 1 second debounce
      };

      // Listen to canvas changes for auto-save
      fabricCanvas.on('object:added', autoSave);
      fabricCanvas.on('object:modified', autoSave);
      fabricCanvas.on('object:removed', autoSave);
      fabricCanvas.on('path:created', autoSave);

      // Ensure workspace is always configured correctly on selection events
      fabricCanvas.on('selection:created', () => {
        ensureWorkspaceConfig();
      });
      fabricCanvas.on('selection:updated', () => {
        ensureWorkspaceConfig();
      });
      fabricCanvas.on('selection:cleared', () => {
        ensureWorkspaceConfig();
      });

      // Store in context
      setCanvas(fabricCanvas);
      setEditor(canvasEditor as any);
    } catch (error) {
      console.error('Error initializing canvas:', error);
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
      const canvas = (canvasRef.current as any)?.__fabricCanvas;
      if (canvas) {
        try {
          canvas.dispose();
        } catch (error) {
          console.error('Error disposing canvas:', error);
        }
      }
      if (canvasRef.current) {
        delete (canvasRef.current as any).__fabricCanvas;
      }
    };
  }, [convexFonts, setCanvas, setEditor]); // Removed canvasSize dependencies to prevent canvas recreation

  // Re-render canvas when fonts are loaded to ensure text displays correctly
  useEffect(() => {
    if (!convexFonts || convexFonts.length === 0) return;
    
    const canvas = (canvasRef.current as any)?.__fabricCanvas;
    if (!canvas) return;
    
    // Check if canvas context is ready
    const context = canvas.getContext();
    if (!context) return;

    // Wait a bit for fonts to be fully loaded into the DOM
    const timeout = setTimeout(() => {
      // Check context again before rendering
      const ctx = canvas.getContext();
      if (!ctx) return;
      
      // Force re-render all text objects to apply fonts
      const objects = canvas.getObjects();
      const textObjects = objects.filter((obj: any) => 
        obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox'
      );
      
      if (textObjects.length > 0) {
        // Update each text object to trigger font re-render
        textObjects.forEach((obj: any) => {
          const fontFamily = obj.fontFamily;
          if (fontFamily) {
            // Force re-application of font
            obj.set('fontFamily', fontFamily);
          }
        });
        
        // Use requestAnimationFrame to ensure context is ready
        requestAnimationFrame(() => {
          const ctx = canvas.getContext();
          if (ctx) {
            canvas.requestRenderAll();
          }
        });
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [convexFonts]);

  // Separate effect to handle canvas size changes without recreating canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const existingCanvas = (canvasRef.current as any).__fabricCanvas;
    if (!existingCanvas) return;

    // Update canvas dimensions while preserving all objects
    existingCanvas.setDimensions({
      width: canvasSize.width,
      height: canvasSize.height,
    });

    existingCanvas.requestRenderAll();
  }, [canvasSize.width, canvasSize.height]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden relative"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5",
      }}
    >
      {/* Canvas preview area - scales with CSS transform */}
      <div
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          transform: `scale(${zoom})`,
          position: "relative",
          background: "#ffffff",
          boxShadow: "0 0 0 5000px rgba(0, 0, 0, 0.1), 0 4px 20px rgba(0, 0, 0, 0.15)",
        }}
      >
        <canvas
          ref={canvasRef}
          id="canvas"
          className={rulerEnabled ? "design-stage-grid" : ""}
        />
      </div>

      <ZoomControls
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomFit={handleZoomFit}
        onZoom100={handleZoom100}
      />
      <ContextMenu />

      <style jsx global>{`
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
