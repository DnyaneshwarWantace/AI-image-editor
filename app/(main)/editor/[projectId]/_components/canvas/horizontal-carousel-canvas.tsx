"use client";

import React, { useEffect, useRef, useState } from "react";
import { Canvas, FabricObject, Rect } from "fabric";
import { useCanvasContext } from "@/providers/canvas-provider";
import { useCarouselSlides } from "@/providers/carousel-slides-provider";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Editor from "@/lib/editor/Editor";

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
import { ContextMenu } from "../context-menu";

interface HorizontalCarouselCanvasProps {
  project: any;
  rulerEnabled: boolean;
}

export function HorizontalCarouselCanvas({ project, rulerEnabled }: HorizontalCarouselCanvasProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<HTMLCanvasElement[]>([]);
  const fabricCanvasesRef = useRef<Canvas[]>([]);
  const editorsRef = useRef<Editor[]>([]);
  const { setCanvas, setEditor } = useCanvasContext();
  const { slides, currentSlide, setCurrentSlide, addSlide } = useCarouselSlides();
  const [activeCanvas, setActiveCanvas] = useState(0);
  const [zoom, setZoom] = useState(0.5); // 50% zoom to fit 2-3 slides on screen

  const handleAddSlide = () => {
    const newSlideIndex = slides.length;
    addSlide();
    // Wait for the new slide to be added and initialized, then scroll to it
    setTimeout(() => {
      if (fabricCanvasesRef.current[newSlideIndex]) {
        scrollToSlide(newSlideIndex);
      }
    }, 200);
  };

  // Scroll to specific slide
  const scrollToSlide = (index: number) => {
    if (!scrollContainerRef.current) return;

    const scaledWidth = 1080 * zoom;
    const gap = 20;
    const slideWidth = scaledWidth + gap;
    scrollContainerRef.current.scrollTo({
      left: slideWidth * index,
      behavior: 'smooth'
    });

    setCurrentSlide(index);
    setActiveCanvas(index);

    // Set the active canvas and editor in context
    if (fabricCanvasesRef.current[index]) {
      setCanvas(fabricCanvasesRef.current[index]);
    }
    if (editorsRef.current[index]) {
      setEditor(editorsRef.current[index]);
    }
  };


  // Handle scroll with arrow keys
  const handlePrevious = () => {
    if (activeCanvas > 0) {
      scrollToSlide(activeCanvas - 1);
    }
  };

  const handleNext = () => {
    if (activeCanvas < slides.length - 1) {
      scrollToSlide(activeCanvas + 1);
    }
  };

  // Initialize canvases with full Editor
  useEffect(() => {
    slides.forEach((slide, index) => {
      if (canvasRefs.current[index] && !fabricCanvasesRef.current[index]) {
        const fabricCanvas = new Canvas(canvasRefs.current[index], {
          fireRightClick: true,
          stopContextMenu: true,
          controlsAboveOverlay: true,
          preserveObjectStacking: true,
          width: 1080,
          height: 1350,
          selection: true,
          allowTouchScrolling: false,
          selectionColor: 'rgba(37, 99, 235, 0.15)',
          selectionBorderColor: '#2563eb',
          selectionLineWidth: 2,
        });

        // Customize selection colors
        FabricObject.ownDefaults.borderColor = '#2563eb';
        FabricObject.ownDefaults.borderScaleFactor = 2.5;
        FabricObject.ownDefaults.cornerColor = '#2563eb';
        FabricObject.ownDefaults.cornerStrokeColor = '#1e40af';
        FabricObject.ownDefaults.cornerStyle = 'circle';
        FabricObject.ownDefaults.cornerSize = 12;
        FabricObject.ownDefaults.transparentCorners = false;
        FabricObject.ownDefaults.borderDashArray = null;

        fabricCanvasesRef.current[index] = fabricCanvas;

        // Register custom properties for serialization (Fabric.js v6)
        const customProps = [
          'id',
          'selectable',
          'hasControls',
          'linkData',
          'editable',
          'extensionType',
          'extension',
          'verticalAlign',
          'gradientAngle',
          'roundValue'
        ];

        // Override toObject for all object types to include custom properties
        if (!(FabricObject.prototype.toObject as any)._customPropsAdded) {
          const originalToObject = FabricObject.prototype.toObject;
          FabricObject.prototype.toObject = function(propertiesToInclude?: string[]) {
            return originalToObject.call(this, [...customProps, ...(propertiesToInclude || [])]);
          };
          (FabricObject.prototype.toObject as any)._customPropsAdded = true;
        }

        // Initialize Editor with all plugins
        const canvasEditor = new Editor();
        canvasEditor.init(fabricCanvas);

        // Load all plugins
        const plugins = [
          { plugin: DringPlugin },
          { plugin: PolygonModifyPlugin },
          { plugin: AlignGuidLinePlugin },
          { plugin: ControlsPlugin },
          { plugin: CenterAlignPlugin },
          { plugin: LayerPlugin },
          { plugin: CopyPlugin },
          { plugin: MoveHotKeyPlugin },
          { plugin: DeleteHotKeyPlugin },
          { plugin: GroupPlugin },
          { plugin: DrawLinePlugin },
          { plugin: GroupTextEditorPlugin },
          { plugin: GroupAlignPlugin },
          { plugin: HistoryPlugin },
          { plugin: FlipPlugin },
          { plugin: DrawPolygonPlugin },
          { plugin: FreeDrawPlugin },
          { plugin: PathTextPlugin },
          { plugin: SimpleClipImagePlugin },
          { plugin: BarCodePlugin },
          { plugin: QrCodePlugin },
          { plugin: FontPlugin, options: { fontList: [] } },
          { plugin: MaterialPlugin, options: { repoSrc: process.env.NEXT_PUBLIC_MATERIAL_API || 'http://localhost:1337' } },
          { plugin: WaterMarkPlugin },
          { plugin: PsdPlugin },
          { plugin: ImageStroke },
          { plugin: LockPlugin },
          { plugin: AddBaseTypePlugin },
          { plugin: RulerPlugin },
        ];

        plugins.forEach(({ plugin, options }) => {
          try {
            canvasEditor.use(plugin, options);
          } catch (error) {
            console.error('Error loading plugin:', error);
          }
        });

        editorsRef.current[index] = canvasEditor;

        // Create workspace background object (white rectangle)
        const workspace = new Rect({
          fill: 'rgba(255,255,255,1)',
          width: 1080,
          height: 1350,
          id: 'workspace',
          strokeWidth: 0,
        } as any);
        workspace.set('selectable', false);
        workspace.set('hasControls', false);
        workspace.hoverCursor = 'default';
        fabricCanvas.add(workspace);
        fabricCanvas.sendObjectToBack(workspace);
        fabricCanvas.requestRenderAll();

        // Auto-center new objects when added
        fabricCanvas.on('object:added', (e: any) => {
          const obj = e.target;
          if (!obj) return;

          // Skip if we're loading from JSON
          if ((fabricCanvas as any)._isLoadingFromJSON) return;

          // Skip workspace object
          if ((obj as any).id === 'workspace') return;

          // Skip if object already has proper position
          if (obj.left !== undefined && obj.left > 10 && obj.top !== undefined && obj.top > 10) {
            return;
          }

          const canvasWidth = 1080;
          const canvasHeight = 1350;

          // Scale images to fit canvas if they're too large
          if (obj.type === 'image') {
            const objWidth = (obj.width || 0) * (obj.scaleX || 1);
            const objHeight = (obj.height || 0) * (obj.scaleY || 1);

            const maxWidth = canvasWidth * 0.9;
            const maxHeight = canvasHeight * 0.9;

            if (objWidth > maxWidth || objHeight > maxHeight) {
              const scaleX = maxWidth / objWidth;
              const scaleY = maxHeight / objHeight;
              const scale = Math.min(scaleX, scaleY);
              obj.scale(scale);
            }
          }

          // Center the object
          obj.set({
            left: canvasWidth / 2,
            top: canvasHeight / 2,
            originX: 'center',
            originY: 'center',
          });

          obj.setCoords();
          fabricCanvas.requestRenderAll();
        });

        // Override loadFromJSON to prevent auto-centering during load
        const originalLoadFromJSON = fabricCanvas.loadFromJSON.bind(fabricCanvas);
        (fabricCanvas as any).loadFromJSON = function(json: any, reviver?: any) {
          (fabricCanvas as any)._isLoadingFromJSON = true;
          return originalLoadFromJSON(json, reviver).then((result: any) => {
            setTimeout(() => {
              delete (fabricCanvas as any)._isLoadingFromJSON;
            }, 100);
            return result;
          });
        };

        // Load slide state if exists
        if (slide.canvasState) {
          try {
            const parsed = JSON.parse(slide.canvasState);
            fabricCanvas.loadFromJSON(parsed, () => {
              fabricCanvas.renderAll();
            });
          } catch (error) {
            console.error('Error loading slide state:', error);
          }
        }

        // Set first canvas as active
        if (index === 0) {
          setCanvas(fabricCanvas);
          setEditor(canvasEditor);
          setActiveCanvas(0);
        }
      }
    });
  }, [slides, setCanvas, setEditor]);


  // Cleanup only on unmount
  useEffect(() => {
    return () => {
      fabricCanvasesRef.current.forEach(canvas => {
        canvas?.dispose();
      });
      fabricCanvasesRef.current = [];
      editorsRef.current = [];
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-gray-100 overflow-hidden">
      {/* Previous Arrow */}
      <button
        onClick={handlePrevious}
        disabled={activeCanvas === 0}
        className={`
          absolute left-4 top-1/2 -translate-y-1/2 z-10
          w-12 h-12 rounded-full bg-white shadow-lg
          flex items-center justify-center
          transition-all
          ${activeCanvas === 0
            ? 'opacity-30 cursor-not-allowed'
            : 'opacity-90 hover:opacity-100 hover:scale-110'
          }
        `}
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-gray-700" />
      </button>

      {/* Horizontal Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="w-full h-full overflow-x-auto overflow-y-hidden scroll-smooth"
        style={{
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          className="flex h-full items-center"
          style={{
            paddingLeft: '40px',
            paddingRight: '40px',
          }}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`
                relative flex-shrink-0 cursor-pointer
                transition-all rounded-lg overflow-hidden
                ${activeCanvas === index
                  ? 'ring-4 ring-blue-400 shadow-2xl'
                  : 'ring-2 ring-transparent hover:ring-gray-300 shadow-lg'
                }
              `}
              style={{
                width: `${1080 * zoom}px`,
                height: `${1350 * zoom}px`,
                marginRight: '20px',
              }}
              onClick={() => scrollToSlide(index)}
            >
              {/* Slide Number Badge */}
              <div
                className={`
                  absolute top-2 left-2 z-10
                  w-8 h-8 rounded-full
                  flex items-center justify-center
                  font-bold text-sm
                  ${activeCanvas === index
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700'
                  }
                  shadow-lg
                `}
              >
                {index + 1}
              </div>

              {/* Canvas with CSS scale */}
              <div
                style={{
                  width: '1080px',
                  height: '1350px',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                }}
              >
                <canvas
                  ref={(el) => {
                    if (el) canvasRefs.current[index] = el;
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToSlide(index);
                  }}
                />
              </div>
            </div>
          ))}

          {/* Add Slide Button */}
          <div
            className="relative flex-shrink-0 cursor-pointer"
            style={{
              width: `${1080 * zoom}px`,
              height: `${1350 * zoom}px`,
            }}
            onClick={handleAddSlide}
          >
            <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-all shadow-lg bg-white">
              <Plus className="w-16 h-16 text-gray-400 mb-2" />
              <span className="text-gray-500 font-medium">Add Slide</span>
            </div>
          </div>
        </div>
      </div>

      {/* Next Arrow */}
      <button
        onClick={handleNext}
        disabled={activeCanvas === slides.length - 1}
        className={`
          absolute right-4 top-1/2 -translate-y-1/2 z-10
          w-12 h-12 rounded-full bg-white shadow-lg
          flex items-center justify-center
          transition-all
          ${activeCanvas === slides.length - 1
            ? 'opacity-30 cursor-not-allowed'
            : 'opacity-90 hover:opacity-100 hover:scale-110'
          }
        `}
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-gray-700" />
      </button>

      {/* Slide Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => scrollToSlide(index)}
              className={`
                transition-all
                ${activeCanvas === index
                  ? 'w-6 h-2 bg-blue-500 rounded-full'
                  : 'w-2 h-2 bg-gray-400 rounded-full hover:bg-gray-300'
                }
              `}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Context Menu */}
      <ContextMenu />
    </div>
  );
}
