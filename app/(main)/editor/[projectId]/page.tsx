"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { EditorLayout } from "./_components/editor-layout";
import { CanvasProvider } from "@/providers/canvas-provider";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Helper function to check if a string looks like a valid Convex ID
// Convex IDs are base32 encoded and typically start with a letter
function isValidConvexId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  // Convex IDs are base32 encoded: start with letter, followed by alphanumeric
  // Typical format: j1234567890abcdefghijklmnopqrstuv
  const convexIdPattern = /^[a-z][a-z0-9]{15,}$/i;
  return convexIdPattern.test(id) && id.length >= 16;
}

export default function EditorPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Only try to load from Convex if projectId looks like a valid Convex ID
  const shouldQueryConvex = isValidConvexId(projectId);
  const convexProject = useQuery(
    api.projects.getProject,
    shouldQueryConvex ? { projectId: projectId } : "skip"
  );

  useEffect(() => {
    // If we have a project from Convex, use it
    if (convexProject && convexProject !== null) {
      setCurrentProject({
        _id: convexProject._id,
        title: convexProject.title,
        width: convexProject.width,
        height: convexProject.height,
        canvasState: convexProject.canvasState,
        imageUrl: convexProject.imageUrl || null,
        userId: convexProject.userId || null,
        createdAt: convexProject.createdAt,
        updatedAt: convexProject.updatedAt,
      });
      setIsLoading(false);
      return;
    }

    // If Convex query is still loading and we should query, wait
    if (shouldQueryConvex && convexProject === undefined) {
      return;
    }

    // If Convex project not found, fallback to localStorage
    try {
      const storedProject = localStorage.getItem(`project-${projectId}`);
      const storedMeta = localStorage.getItem(`project-meta-${projectId}`);

      let project = {
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

      // Load canvas state from localStorage
      if (storedProject) {
        try {
          const canvasState = JSON.parse(storedProject);
          project.canvasState = canvasState;
        } catch (e) {
          console.error('Error parsing stored project:', e);
        }
      }

      // Load project metadata (dimensions) from localStorage
      if (storedMeta) {
        try {
          const meta = JSON.parse(storedMeta);
          if (meta.width) project.width = meta.width;
          if (meta.height) project.height = meta.height;
          if (meta.title) project.title = meta.title;
        } catch (e) {
          console.error('Error parsing project metadata:', e);
        }
      }

      setCurrentProject(project);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading project:', error);
      setError('Failed to load project');
      setIsLoading(false);
    }
  }, [projectId, convexProject]);

  // Loading state
  if (isLoading || !currentProject) {
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
      <div className="h-screen">
        <EditorLayout project={currentProject} />
      </div>
    </CanvasProvider>
  );
}
