"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface SlideData {
  id: number;
  canvasState: string | null;
}

interface CarouselSlidesContextType {
  slides: SlideData[];
  currentSlide: number;
  setCurrentSlide: (slideIndex: number) => void;
  updateSlideState: (slideIndex: number, canvasState: string) => void;
  getSlideState: (slideIndex: number) => string | null;
  addSlide: () => void;
  deleteSlide: (slideIndex: number) => void;
  totalSlides: number;
}

const CarouselSlidesContext = createContext<CarouselSlidesContextType | undefined>(undefined);

export function CarouselSlidesProvider({ children }: { children: ReactNode }) {
  // Initialize with 4 empty slides
  const [slides, setSlides] = useState<SlideData[]>([
    { id: 1, canvasState: null },
    { id: 2, canvasState: null },
    { id: 3, canvasState: null },
    { id: 4, canvasState: null },
  ]);

  const [currentSlide, setCurrentSlide] = useState(0);

  // Load slides from localStorage on mount
  useEffect(() => {
    const projectId = window.location.pathname.split('/').pop();
    if (projectId) {
      const saved = localStorage.getItem(`carousel-slides-${projectId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSlides(parsed);
          }
        } catch (e) {
          console.error('Error loading carousel slides:', e);
        }
      }
    }
  }, []);

  // Save slides to localStorage whenever they change
  useEffect(() => {
    const projectId = window.location.pathname.split('/').pop();
    if (projectId) {
      localStorage.setItem(`carousel-slides-${projectId}`, JSON.stringify(slides));
    }
  }, [slides]);

  const updateSlideState = (slideIndex: number, canvasState: string) => {
    setSlides(prev => {
      const newSlides = [...prev];
      if (newSlides[slideIndex]) {
        newSlides[slideIndex].canvasState = canvasState;
      }
      return newSlides;
    });
  };

  const getSlideState = (slideIndex: number): string | null => {
    return slides[slideIndex]?.canvasState || null;
  };

  const addSlide = () => {
    setSlides(prev => {
      const newId = Math.max(...prev.map(s => s.id)) + 1;
      return [...prev, { id: newId, canvasState: null }];
    });
  };

  const deleteSlide = (slideIndex: number) => {
    if (slides.length <= 1) {
      alert('Cannot delete the last slide');
      return;
    }
    setSlides(prev => prev.filter((_, index) => index !== slideIndex));
    if (currentSlide >= slideIndex && currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <CarouselSlidesContext.Provider
      value={{
        slides,
        currentSlide,
        setCurrentSlide,
        updateSlideState,
        getSlideState,
        addSlide,
        deleteSlide,
        totalSlides: slides.length,
      }}
    >
      {children}
    </CarouselSlidesContext.Provider>
  );
}

export function useCarouselSlides() {
  const context = useContext(CarouselSlidesContext);
  if (!context) {
    throw new Error("useCarouselSlides must be used within CarouselSlidesProvider");
  }
  return context;
}
