"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Plus, Sparkles, Image as ImageIcon } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const createNewProject = async () => {
    setIsCreating(true);
    try {
      const projectId = `project-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      router.push(`/editor/${projectId}`);
    } catch (error) {
      console.error("Failed to create project:", error);
      setIsCreating(false);
    }
  };

  const goToAIAdGenerator = () => {
    router.push('/ai-ad-generator');
  };

  const goToMyAds = () => {
    router.push('/my-ads');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            AI Image Editor
          </h1>
          <p className="text-xl text-gray-300">
            Create stunning ads with AI or start from scratch
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {/* AI Ad Generator */}
          <button
            onClick={goToAIAdGenerator}
            className="group bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-8 px-6 rounded-xl transition-all transform hover:scale-105"
          >
            <Sparkles className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">AI Ad Generator</h2>
            <p className="text-purple-100 text-sm">
              Analyze Facebook ads and generate new ones with AI
            </p>
          </button>

          {/* My Generated Ads */}
          <button
            onClick={goToMyAds}
            className="group bg-gradient-to-br from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-8 px-6 rounded-xl transition-all transform hover:scale-105"
          >
            <ImageIcon className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">My Generated Ads</h2>
            <p className="text-green-100 text-sm">
              View and edit your AI-generated ads
            </p>
          </button>

          {/* Create New Project */}
          <button
            onClick={createNewProject}
            disabled={isCreating}
            className="group bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-semibold py-8 px-6 rounded-xl transition-all transform hover:scale-105"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
                <h2 className="text-2xl font-bold mb-2">Creating...</h2>
              </>
            ) : (
              <>
                <Plus className="h-12 w-12 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Blank Project</h2>
                <p className="text-gray-300 text-sm">
                  Start with an empty canvas
                </p>
              </>
            )}
          </button>
        </div>

        {/* Info Section */}
        <div className="max-w-6xl mx-auto mt-12 text-center py-8 bg-gray-800/50 rounded-lg border border-gray-700">
          <ImageIcon className="h-10 w-10 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">
            Use AI Ad Generator to analyze Facebook ads and create custom ads for your brand
          </p>
          <p className="text-gray-500 text-sm">
            View your generated ads in My Generated Ads, or start fresh with a blank project
          </p>
        </div>
      </div>
    </div>
  );
}

