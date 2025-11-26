"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PRESET_SIZES = [
  { label: "Instagram Post", width: 1080, height: 1080 },
  { label: "Instagram Story", width: 1080, height: 1920 },
  { label: "Facebook Post", width: 1200, height: 630 },
  { label: "Twitter Post", width: 1200, height: 675 },
  { label: "LinkedIn Post", width: 1200, height: 627 },
  { label: "YouTube Thumbnail", width: 1280, height: 720 },
  { label: "A4", width: 2480, height: 3508 },
  { label: "Letter", width: 2550, height: 3300 },
];

interface CanvasSizeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWidth: number;
  currentHeight: number;
  onConfirm: (width: number, height: number) => void;
}

export function CanvasSizeModal({
  open,
  onOpenChange,
  currentWidth,
  currentHeight,
  onConfirm,
}: CanvasSizeModalProps) {
  const [width, setWidth] = useState(currentWidth);
  const [height, setHeight] = useState(currentHeight);
  const [preset, setPreset] = useState("");

  React.useEffect(() => {
    setWidth(currentWidth);
    setHeight(currentHeight);
  }, [currentWidth, currentHeight, open]);

  const handlePresetChange = (value: string) => {
    if (value === "custom") {
      setPreset("");
      return;
    }
    const selected = PRESET_SIZES.find((s) => s.label === value);
    if (selected) {
      setWidth(selected.width);
      setHeight(selected.height);
      setPreset(value);
    }
  };

  const handleConfirm = () => {
    if (width > 0 && height > 0) {
      onConfirm(width, height);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Canvas Size</DialogTitle>
          <DialogDescription>Set the canvas dimensions</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Preset Size</Label>
            <Select value={preset} onValueChange={handlePresetChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select preset or use custom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom</SelectItem>
                {PRESET_SIZES.map((size) => (
                  <SelectItem key={size.label} value={size.label}>
                    {size.label} ({size.width} × {size.height}px)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Width (px)</Label>
              <Input
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Height (px)</Label>
              <Input
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                min={1}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

