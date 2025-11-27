"use client";

import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCanvasContext } from "@/providers/canvas-provider";

export function DragModeToggle() {
  const { editor } = useCanvasContext();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const handleStartDring = () => setEnabled(true);
    const handleEndDring = () => setEnabled(false);

    (editor as any).on?.("startDring", handleStartDring);
    (editor as any).on?.("endDring", handleEndDring);

    return () => {
      (editor as any).off?.("startDring", handleStartDring);
      (editor as any).off?.("endDring", handleEndDring);
    };
  }, [editor]);

  const handleToggle = (checked: boolean) => {
    if (!editor) return;
    setEnabled(checked);
    if (checked) {
      (editor as any).startDring?.();
    } else {
      (editor as any).endDring?.();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Switch checked={enabled} onCheckedChange={handleToggle} id="drag-mode" />
      <Label htmlFor="drag-mode" className="text-sm cursor-pointer">
        Drag Mode
      </Label>
    </div>
  );
}

