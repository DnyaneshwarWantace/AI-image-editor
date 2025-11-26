"use client";

import React from "react";
import { Group, Ungroup } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCanvasContext } from "@/providers/canvas-provider";
import { toast } from "sonner";

export function GroupControls() {
  const { canvas, editor } = useCanvasContext();

  const handleGroup = () => {
    if (!editor) return;

    const activeObjects = canvas?.getActiveObjects();
    if (!activeObjects || activeObjects.length < 2) {
      toast.error("Select at least 2 objects to group");
      return;
    }

    try {
      editor.group?.();
      toast.success("Objects grouped");
    } catch (error) {
      console.error("Error grouping:", error);
      toast.error("Failed to group objects");
    }
  };

  const handleUngroup = () => {
    if (!editor) return;

    const activeObject = canvas?.getActiveObject();
    if (!activeObject || activeObject.type !== "group") {
      toast.error("Select a group to ungroup");
      return;
    }

    try {
      editor.unGroup?.();
      toast.success("Group ungrouped");
    } catch (error) {
      console.error("Error ungrouping:", error);
      toast.error("Failed to ungroup");
    }
  };

  const activeObjects = canvas?.getActiveObjects() || [];
  const isGroup = activeObjects.length === 1 && activeObjects[0]?.type === "group";
  const canGroup = activeObjects.length >= 2;

  return (
    <div className="flex gap-2">
      {canGroup && (
        <Button variant="outline" size="sm" onClick={handleGroup} className="flex-1">
          <Group className="h-4 w-4 mr-2" />
          Group
        </Button>
      )}
      {isGroup && (
        <Button variant="outline" size="sm" onClick={handleUngroup} className="flex-1">
          <Ungroup className="h-4 w-4 mr-2" />
          Ungroup
        </Button>
      )}
    </div>
  );
}

