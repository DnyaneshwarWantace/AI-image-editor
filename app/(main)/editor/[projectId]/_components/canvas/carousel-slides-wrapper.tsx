"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCarouselSlides } from "@/providers/carousel-slides-provider";
import { CanvasArea } from "../canvas-area";

interface CarouselSlidesWrapperProps {
  project: any;
  rulerEnabled: boolean;
}

export function CarouselSlidesWrapper({ project, rulerEnabled }: CarouselSlidesWrapperProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { slides, currentSlide, setCurrentSlide } = useCarouselSlides();
  const [activeSlide, setActiveSlide] = useState(0);

  // Slide dimensions - smaller to fit 2-3 on screen
  const SLIDE_WIDTH = 540; // Half of 1080 (50% zoom)
  const SLIDE_HEIGHT = 675; // Half of 1350
  const SLIDE_GAP = 20;

  // Scroll to specific slide
  const scrollToSlide = (index: number) => {
    if (!scrollContainerRef.current) return;

    const scrollLeft = index * (SLIDE_WIDTH + SLIDE_GAP);
    scrollContainerRef.current.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    });

    setCurrentSlide(index);
    setActiveSlide(index);
  };

  // Handle scroll position to update active slide
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const slideWithGap = SLIDE_WIDTH + SLIDE_GAP;
      const currentIndex = Math.round(scrollLeft / slideWithGap);

      if (currentIndex !== activeSlide && currentIndex >= 0 && currentIndex < slides.length) {
        setActiveSlide(currentIndex);
        setCurrentSlide(currentIndex);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeSlide, setCurrentSlide, slides.length, SLIDE_WIDTH, SLIDE_GAP]);

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

  return (
    <div className="relative w-full h-full overflow-hidden">
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
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 text-gray-700" />
      </button>

      {/* Horizontal Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="w-full h-full overflow-x-auto overflow-y-hidden"
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Hide scrollbar */}
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        <div
          className="flex items-center h-full"
          style={{
            paddingLeft: '80px',
            paddingRight: '80px',
            gap: `${SLIDE_GAP}px`,
          }}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              onClick={() => scrollToSlide(index)}
              className="flex-shrink-0 cursor-pointer"
              style={{
                width: `${SLIDE_WIDTH}px`,
                height: `${SLIDE_HEIGHT}px`,
              }}
            >
              {/* Canvas wrapped in scaled container */}
              <div
                style={{
                  width: '1080px',
                  height: '1350px',
                  transform: 'scale(0.5)',
                  transformOrigin: 'top left',
                }}
              >
                <CanvasArea
                  project={{
                    ...project,
                    canvasState: slide.canvasState,
                  }}
                  rulerEnabled={false}
                />
              </div>
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
        aria-label="Next slide"
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
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
