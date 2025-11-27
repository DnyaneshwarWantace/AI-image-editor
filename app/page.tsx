"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Loader2,
  Plus,
  Image as ImageIcon,
  Trash2,
  Calendar,
  Maximize
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export default function HomePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  // Fetch user's projects from Convex backend
  const projects = useQuery(api.projects.getUserProjects, {
    userId: undefined, // TODO: Add user authentication
  });

  // Convex mutations
  const createProject = useMutation(api.projects.create);
  const deleteProjectMutation = useMutation(api.projects.deleteProject);

  const handleCreateNewProject = async () => {
    setIsCreating(true);
    try {
      const projectId = await createProject({
        title: "Untitled Project",
        width: 1080,
        height: 1080,
        canvasState: null,
        imageUrl: undefined,
        userId: undefined, // TODO: Add user authentication
      });

      // Navigate to editor with the new project ID
      router.push(`/editor/${projectId}`);
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("Failed to create project. Please try again.");
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: Id<"projects">) => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteProjectMutation({ projectId });
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("Failed to delete project. Please try again.");
    }
  };

  const handleOpenProject = (projectId: Id<"projects">) => {
    router.push(`/editor/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            AI Image Editor
          </h1>
          <p className="text-xl text-gray-300">
            Create stunning designs with professional templates and tools
          </p>
        </div>

        {/* Create New Project Button */}
        <div className="max-w-6xl mx-auto mb-8">
          <button
            onClick={handleCreateNewProject}
            disabled={isCreating}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold py-6 px-8 rounded-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xl">Creating Project...</span>
              </>
            ) : (
              <>
                <Plus className="h-6 w-6" />
                <span className="text-xl">Create New Project</span>
              </>
            )}
          </button>
        </div>

        {/* Projects Section */}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">My Projects</h2>
            {projects && projects.length > 0 && (
              <span className="text-gray-400">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {/* Loading State */}
          {!projects ? (
            <div className="text-center py-20 bg-gray-800/50 rounded-xl border border-gray-700">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-400">Loading your projects...</p>
            </div>
          ) : projects.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20 bg-gray-800/50 rounded-xl border border-gray-700">
              <ImageIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No Projects Yet</h3>
              <p className="text-gray-400 mb-6">Create your first project to get started</p>
              <button
                onClick={handleCreateNewProject}
                disabled={isCreating}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Create Project
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Projects Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden group hover:border-blue-500 transition-all"
                >
                  {/* Project Preview */}
                  <div
                    className="relative aspect-square bg-gray-900 flex items-center justify-center cursor-pointer"
                    onClick={() => handleOpenProject(project._id)}
                  >
                    {project.imageUrl ? (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-6">
                        <ImageIcon className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No Preview</p>
                      </div>
                    )}

                    {/* Overlay on Hover */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProject(project._id);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                      >
                        Open Project
                      </button>
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-2 truncate">{project.title}</h3>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Maximize className="h-3 w-3" />
                        <span>{project.width} × {project.height}px</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-4 border-t border-gray-700 flex gap-2">
                      <button
                        onClick={() => handleOpenProject(project._id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project._id);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg"
                        title="Delete Project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="max-w-6xl mx-auto mt-12 text-center py-8 bg-gray-800/50 rounded-lg border border-gray-700">
          <ImageIcon className="h-10 w-10 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">
            Professional image editor with templates, shapes, text tools, and more
          </p>
          <p className="text-gray-500 text-sm">
            All your projects are automatically saved to the cloud
          </p>
        </div>
      </div>
    </div>
  );
}
