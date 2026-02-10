"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function goToEditor() {
      try {
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Untitled Carousel",
            width: 1080,
            height: 1350,
            canvasState: null,
            imageUrl: undefined,
            userId: undefined,
          }),
        });

        if (cancelled) return;
        if (!response.ok) throw new Error("Failed to create project");

        const project = await response.json();
        router.replace(`/editor/${project.id}`);
      } catch (e) {
        if (cancelled) return;
        console.error("Failed to create project:", e);
        setError("Failed to open editor. Please try again.");
      }
    }

    goToEditor();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        <p className="text-slate-600">Opening editor...</p>
      </div>
    </div>
  );
}
