"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Canvas } from "fabric";
import { useCanvasContext } from "@/providers/canvas-provider";
import { useCarouselSlides } from "@/providers/carousel-slides-provider";

interface MultiCanvasCarouselProps {
  project: any;
  rulerEnabled: boolean;
}

export function MultiCanvasCarousel({ project, rulerEnabled }: MultiCanvasCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<HTMLCanvasElement[]>([]);
  const fabricCanvasesRef = useRef<Canvas[]>([]);
  const { setCanvas } = useCanvasContext();
  const { slides, currentSlide, setCurrentSlide } = useCarouselSlides();
  const [activeSlide, setActiveSlide] = useState(0);
  const [zoom, setZoom] = useState(0.5); // Start at 50% to fit 2-3 slides

  const SLIDE_WIDTH = 1080;
  const SLIDE_HEIGHT = 1350;
  const SLIDE_GAP = 20;

  // Initialize all canvases
  useEffect(() => {
    slides.forEach((slide, index) => {
      if (canvasRefs.current[index] && !fabricCanvasesRef.current[index]) {
        const fabricCanvas = new Canvas(canvasRefs.current[index], {
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          backgroundColor: '#ffffff',
        });

        fabricCanvasesRef.current[index] = fabricCanvas;

        // Load slide state if exists
        if (slide.canvasState) {
          try {
            const parsed = JSON.parse(slide.canvasState);
            fabricCanvas.loadFromJSON(parsed);
          } catch (error) {
            console.error('Error loading slide state:', error);
          }
        }

        // Set first canvas as active
        if (index === 0) {
          setCanvas(fabricCanvas);
        }
      }
    });

    return () => {
      fabricCanvasesRef.current.forEach(canvas => {
        canvas?.dispose();
      });
      fabricCanvasesRef.current = [];
    };
  }, [slides, setCanvas]);

  // Apply zoom to all canvases
  useEffect(() => {
    fabricCanvasesRef.current.forEach(canvas => {
      if (canvas) {
        canvas.setZoom(zoom);
        canvas.requestRenderAll();
      }
    });
  }, [zoom]);

  const scrollToSlide = (index: number) => {
    if (!scrollContainerRef.current) return;

    const scaledWidth = SLIDE_WIDTH * zoom;
    const scrollLeft = index * (scaledWidth + SLIDE_GAP);
    scrollContainerRef.current.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    });

    setCurrentSlide(index);
    setActiveSlide(index);

    // Set active canvas
    if (fabricCanvasesRef.current[index]) {
      setCanvas(fabricCanvasesRef.current[index]);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.1));
  };

  const handleZoomFit = () => {
    setZoom(0.5);
  };

  const handlePrevious = () => {
    if (activeSlide > 0) {
      scrollToSlide(activeSlide - 1);
    }
  };

  const handleNext = () => {
    if (activeSlide < slides.length - 1) {
      scrollToSlide(activeSlide + 1);
    }
  };

  const scaledWidth = SLIDE_WIDTH * zoom;
  const scaledHeight = SLIDE_HEIGHT * zoom;

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-100">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-50 flex gap-2 bg-white rounded-lg shadow-lg p-2">
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-100 rounded"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="px-3 py-2 text-sm font-medium">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-100 rounded"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomFit}
          className="p-2 hover:bg-gray-100 rounded"
          aria-label="Fit to screen"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Previous Arrow */}
      <button
        onClick={handlePrevious}
        disabled={activeSlide === 0}
        className={`
          absolute left-4 top-1/2 -translate-y-1/2 z-50
          w-10 h-10 rounded-full bg-white shadow-xl
          flex items-center justify-center
          transition-all
          ${activeSlide === 0
            ? 'opacity-0 pointer-events-none'
            : 'opacity-90 hover:opacity-100 hover:scale-110'
          }
        `}
      >
        <ChevronLeft className="w-5 h-5 text-gray-700" />
      </button>

      {/* Horizontal Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="w-full h-full overflow-x-auto overflow-y-auto"
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          className="flex items-center h-full"
          style={{
            paddingLeft: '80px',
            paddingRight: '80px',
            gap: `${SLIDE_GAP}px`,
            minHeight: `${scaledHeight + 100}px`,
          }}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              onClick={() => scrollToSlide(index)}
              className="flex-shrink-0 cursor-pointer"
              style={{
                width: `${scaledWidth}px`,
                height: `${scaledHeight}px`,
              }}
            >
              <canvas
                ref={(el) => {
                  if (el) canvasRefs.current[index] = el;
                }}
                width={SLIDE_WIDTH}
                height={SLIDE_HEIGHT}
                className="shadow-lg"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Next Arrow */}
      <button
        onClick={handleNext}
        disabled={activeSlide === slides.length - 1}
        className={`
          absolute right-4 top-1/2 -translate-y-1/2 z-50
          w-10 h-10 rounded-full bg-white shadow-xl
          flex items-center justify-center
          transition-all
          ${activeSlide === slides.length - 1
            ? 'opacity-0 pointer-events-none'
            : 'opacity-90 hover:opacity-100 hover:scale-110'
          }
        `}
      >
        <ChevronRight className="w-5 h-5 text-gray-700" />
      </button>

      {/* Slide Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => scrollToSlide(index)}
              className={`
                transition-all
                ${activeSlide === index
                  ? 'w-6 h-2 bg-blue-500 rounded-full'
                  : 'w-2 h-2 bg-gray-400 rounded-full hover:bg-gray-300'
                }
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
