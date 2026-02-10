"use client";

import React from 'react';
import { useCarouselSlides } from '@/providers/carousel-slides-provider';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function SlideNavigation() {
  const { slides, currentSlide, setCurrentSlide, totalSlides } = useCarouselSlides();

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 py-4 bg-white border-t border-gray-200">
      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        disabled={currentSlide === 0}
        className={`
          p-2 rounded-lg transition-all
          ${currentSlide === 0
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100'
          }
        `}
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Slide Indicators */}
      <div className="flex items-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setCurrentSlide(index)}
            className={`
              flex items-center justify-center
              w-10 h-10 rounded-lg
              font-semibold text-sm
              transition-all
              ${currentSlide === index
                ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={currentSlide === index ? 'true' : 'false'}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={currentSlide === totalSlides - 1}
        className={`
          p-2 rounded-lg transition-all
          ${currentSlide === totalSlides - 1
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100'
          }
        `}
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide Counter */}
      <div className="ml-4 text-sm text-gray-600 font-medium">
        Slide {currentSlide + 1} of {totalSlides}
      </div>
    </div>
  );
}
