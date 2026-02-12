"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { useCanvasContext } from "@/providers/canvas-provider";
import { FabricImage } from "fabric";

type StylePreset = "auto" | "photo" | "product" | "illustration" | "icon" | "3d" | "background";
type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export function AIGenerateImagePanel() {
  const { canvas } = useCanvasContext();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<StylePreset>("auto");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [boostedPrompt, setBoostedPrompt] = useState<string | null>(null);
  const [showBoosted, setShowBoosted] = useState(false);

  const canGenerate = useMemo(() => !isGenerating, [isGenerating]);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setResultImage(null);
    setBoostedPrompt(null);

    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          style,
          aspectRatio,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.error || "Failed to generate image";
        toast.error(msg);
        return;
      }

      if (!json?.image) {
        toast.error("Gemini returned no image.");
        return;
      }

      setResultImage(json.image);
      setBoostedPrompt(json.boostedPrompt || null);
      toast.success("Image generated!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToCanvas = async () => {
    if (!canvas || !resultImage) {
      toast.error("Canvas not ready");
      return;
    }

    try {
      const img = await FabricImage.fromURL(resultImage, {}, { selectable: true, objectCaching: false });

      const canvasW = canvas.getWidth();
      const canvasH = canvas.getHeight();
      const imgW = img.width || 1;
      const imgH = img.height || 1;

      const scale = Math.min((canvasW * 0.9) / imgW, (canvasH * 0.9) / imgH, 1);
      img.scale(scale);
      img.set({
        left: (canvasW - imgW * scale) / 2,
        top: (canvasH - imgH * scale) / 2,
      });

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
      toast.success("Added to canvas");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add image to canvas");
    }
  };

  return (
    <div className="w-full space-y-3 p-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-600" />
        <h3 className="text-sm font-semibold text-gray-900">AI Generate (Nano Banana)</h3>
      </div>

      <p className="text-xs text-gray-600">
        Type something simple. We automatically boost the prompt so you get the best result from{" "}
        <strong>Gemini Nano Banana</strong> (<code className="text-[11px]">gemini-2.5-flash-image</code>).
      </p>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-700">Your idea</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='e.g. "a neon cyberpunk street at night" or "minimal logo of a cat"'
          className="w-full min-h-[90px] rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Style</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as StylePreset)}
            className="w-full rounded-md border border-gray-200 px-2 py-2 text-sm"
          >
            <option value="auto">Auto</option>
            <option value="photo">Photo</option>
            <option value="product">Product</option>
            <option value="illustration">Illustration</option>
            <option value="icon">Icon</option>
            <option value="3d">3D</option>
            <option value="background">Background</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Aspect ratio</label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="w-full rounded-md border border-gray-200 px-2 py-2 text-sm"
          >
            <option value="1:1">1:1</option>
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="4:3">4:3</option>
            <option value="3:4">3:4</option>
          </select>
        </div>
      </div>

      <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate image
          </>
        )}
      </Button>

      {boostedPrompt && (
        <div className="rounded-md border border-gray-200 p-2">
          <button
            type="button"
            onClick={() => setShowBoosted((v) => !v)}
            className="text-xs text-gray-700 hover:text-gray-900 font-medium"
          >
            {showBoosted ? "Hide" : "Show"} boosted prompt
          </button>
          {showBoosted && (
            <pre className="mt-2 whitespace-pre-wrap text-[11px] text-gray-600">{boostedPrompt}</pre>
          )}
        </div>
      )}

      {resultImage && (
        <div className="space-y-2">
          <div className="rounded-md border border-gray-200 overflow-hidden bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resultImage} alt="Generated result" className="w-full h-auto" />
          </div>

          <Button onClick={handleAddToCanvas} variant="secondary" className="w-full">
            <ImagePlus className="h-4 w-4 mr-2" />
            Add to canvas
          </Button>
        </div>
      )}
    </div>
  );
}

