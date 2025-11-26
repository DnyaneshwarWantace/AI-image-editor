"use client";

import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCanvasContext } from "@/providers/canvas-provider";

export function AttributeTextContent() {
  const { canvas } = useCanvasContext();
  const [text, setText] = useState("");

  useEffect(() => {
    if (!canvas) return;

    const updateText = () => {
      const activeObject = canvas.getActiveObject();
      if (
        activeObject &&
        (activeObject.type === "textbox" ||
          activeObject.type === "i-text" ||
          activeObject.type === "text")
      ) {
        setText(activeObject.text || "");
      }
    };

    updateText();

    canvas.on("selection:created", updateText);
    canvas.on("selection:updated", updateText);

    return () => {
      canvas.off("selection:created", updateText);
      canvas.off("selection:updated", updateText);
    };
  }, [canvas]);

  const handleTextChange = (newText: string) => {
    setText(newText);
    const activeObject = canvas?.getActiveObject();
    if (
      activeObject &&
      (activeObject.type === "textbox" ||
        activeObject.type === "i-text" ||
        activeObject.type === "text")
    ) {
      activeObject.set("text", newText);
      canvas?.requestRenderAll();
    }
  };

  const activeObject = canvas?.getActiveObject();
  if (
    !activeObject ||
    (activeObject.type !== "textbox" &&
      activeObject.type !== "i-text" &&
      activeObject.type !== "text")
  ) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900">Text Content</h4>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-gray-700">Text</Label>
        <Textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          className="min-h-[100px] bg-white text-gray-900"
          placeholder="Enter text..."
        />
      </div>
    </div>
  );
}

