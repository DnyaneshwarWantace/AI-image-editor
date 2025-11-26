"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Loader2, Monitor } from "lucide-react";
import { EditorLayout } from "./_components/editor-layout";
import { CanvasProvider } from "@/providers/canvas-provider";

export default function EditorPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  // Default project structure
  const defaultProject = {
    _id: projectId,
    title: 'Untitled Project',
    width: 800,
    height: 600,
    canvasState: null,
    imageUrl: null,
    userId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // For now, use default project until Convex is properly configured
  // TODO: Enable Convex once it's set up with ConvexProvider in the app
  const currentProject = defaultProject;
  const isLoading = false;
  const error = null;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-white/70">Loading editor...</p>
        </div>
      </div>
    );
  }

  // Error state (only show if there's an actual error)
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Project Not Found
          </h1>
          <p className="text-white/70">
            The project you're looking for doesn't exist or you don't have
            access to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <CanvasProvider>
      {/* Mobile Message - Show on screens smaller than lg (1024px) */}
      <div className="lg:hidden min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Monitor className="h-16 w-16 text-white mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">
            Desktop Required
          </h1>
          <p className="text-white/70 text-lg mb-2">
            This editor is only usable on desktop.
          </p>
          <p className="text-white/50 text-sm">
            Please use a larger screen to access the full editing experience.
          </p>
        </div>
      </div>

      {/* Desktop Editor - Show on lg screens and above */}
      <div className="hidden lg:block h-screen">
        <EditorLayout project={currentProject} />
      </div>
    </CanvasProvider>
  );
}
