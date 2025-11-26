"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HexColorPicker } from "react-colorful";
import { useCanvasContext } from "@/providers/canvas-provider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { filters as fabricFilters } from 'fabric';

const NO_PARAMS_FILTERS = [
  { key: "BlackWhite", label: "Black & White" },
  { key: "Brownie", label: "Brownie" },
  { key: "Vintage", label: "Vintage" },
  { key: "Kodachrome", label: "Kodachrome" },
  { key: "technicolor", label: "Technicolor" },
  { key: "Polaroid", label: "Polaroid" },
  { key: "Invert", label: "Invert" },
  { key: "Sepia", label: "Sepia" },
];

const PARAMS_FILTERS = [
  {
    type: "Brightness",
    label: "Brightness",
    params: [{ key: "brightness", min: -1, max: 1, step: 0.01, value: 0 }],
  },
  {
    type: "Contrast",
    label: "Contrast",
    params: [{ key: "contrast", min: -1, max: 1, step: 0.01, value: 0 }],
  },
  {
    type: "Saturation",
    label: "Saturation",
    params: [{ key: "saturation", min: -1, max: 1, step: 0.01, value: 0 }],
  },
  {
    type: "Blur",
    label: "Blur",
    params: [{ key: "blur", min: 0, max: 1, step: 0.01, value: 0 }],
  },
];

export function FiltersPanel() {
  const { canvas } = useCanvasContext();
  const [noParamsFilters, setNoParamsFilters] = useState<Record<string, boolean>>({});
  const [paramsFilters, setParamsFilters] = useState(PARAMS_FILTERS);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [blur, setBlur] = useState(0);
  const [brightnessEnabled, setBrightnessEnabled] = useState(false);
  const [contrastEnabled, setContrastEnabled] = useState(false);
  const [saturationEnabled, setSaturationEnabled] = useState(false);
  const [blurEnabled, setBlurEnabled] = useState(false);

  useEffect(() => {
    if (!canvas) return;

    const updateFilters = () => {
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === "image") {
        const filters = (activeObject as any).filters || [];
        const newNoParams: Record<string, boolean> = {};
        NO_PARAMS_FILTERS.forEach((filter) => {
          newNoParams[filter.key] = filters.some(
            (f: any) => f.type === filter.key.charAt(0).toUpperCase() + filter.key.slice(1)
          );
        });
        setNoParamsFilters(newNoParams);
      }
    };

    updateFilters();
    canvas.on("selection:created", updateFilters);
    canvas.on("selection:updated", updateFilters);

    return () => {
      canvas.off("selection:created", updateFilters);
      canvas.off("selection:updated", updateFilters);
    };
  }, [canvas]);

  const toggleNoParamFilter = (filterKey: string, enabled: boolean) => {
    const activeObject = canvas?.getActiveObject();
    if (!activeObject || activeObject.type !== "image") return;

    let filters = (activeObject as any).filters || [];

    if (enabled) {
      // Create and add filter instance based on type
      let filterInstance;
      switch (filterKey) {
        case "BlackWhite":
          filterInstance = new fabricFilters.BlackWhite();
          break;
        case "Brownie":
          filterInstance = new fabricFilters.Brownie();
          break;
        case "Vintage":
          filterInstance = new fabricFilters.Vintage();
          break;
        case "Kodachrome":
          filterInstance = new fabricFilters.Kodachrome();
          break;
        case "technicolor":
          filterInstance = new fabricFilters.Technicolor();
          break;
        case "Polaroid":
          filterInstance = new fabricFilters.Polaroid();
          break;
        case "Invert":
          filterInstance = new fabricFilters.Invert();
          break;
        case "Sepia":
          filterInstance = new fabricFilters.Sepia();
          break;
      }

      if (filterInstance) {
        filters.push(filterInstance);
        (activeObject as any).filters = filters;
        setNoParamsFilters((prev) => ({ ...prev, [filterKey]: true }));
      }
    } else {
      // Remove filter by type
      const filterType = filterKey.charAt(0).toUpperCase() + filterKey.slice(1);
      filters = filters.filter((f: any) => f.type !== filterType);
      (activeObject as any).filters = filters;
      setNoParamsFilters((prev) => ({ ...prev, [filterKey]: false }));
    }

    (activeObject as any).applyFilters();
    canvas?.requestRenderAll();
  };

  const updateAdvancedFilter = (type: string, value: number, enabled: boolean) => {
    const activeObject = canvas?.getActiveObject();
    if (!activeObject || activeObject.type !== "image") return;

    let filters = (activeObject as any).filters || [];

    // Remove existing filter of this type
    filters = filters.filter((f: any) => f.type !== type);

    // Add new filter if enabled
    if (enabled && value !== 0) {
      let filterInstance;
      switch (type) {
        case "Brightness":
          filterInstance = new fabricFilters.Brightness({ brightness: value });
          break;
        case "Contrast":
          filterInstance = new fabricFilters.Contrast({ contrast: value });
          break;
        case "Saturation":
          filterInstance = new fabricFilters.Saturation({ saturation: value });
          break;
        case "Blur":
          filterInstance = new fabricFilters.Blur({ blur: value });
          break;
      }

      if (filterInstance) {
        filters.push(filterInstance);
      }
    }

    (activeObject as any).filters = filters;
    (activeObject as any).applyFilters();
    canvas?.requestRenderAll();
  };

  const activeObject = canvas?.getActiveObject();
  if (!activeObject || activeObject.type !== "image") {
    return null;
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900">Image Filters</h4>

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-gray-900">
          <span>Simple Filters</span>
          <ChevronDown className="h-4 w-4 text-gray-600" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {NO_PARAMS_FILTERS.map((filter) => (
              <div key={filter.key} className="flex items-center space-x-2">
                <Switch
                  checked={noParamsFilters[filter.key] || false}
                  onCheckedChange={(checked) => toggleNoParamFilter(filter.key, checked)}
                />
                <Label className="text-xs font-medium text-gray-900">{filter.label}</Label>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-gray-900">
          <span>Advanced Filters</span>
          <ChevronDown className="h-4 w-4 text-gray-600" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-4">
          {/* Brightness */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={brightnessEnabled}
                onCheckedChange={(checked) => {
                  setBrightnessEnabled(checked);
                  updateAdvancedFilter("Brightness", brightness, checked);
                }}
              />
              <Label className="text-xs font-medium text-gray-900">Brightness</Label>
            </div>
            {brightnessEnabled && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-xs font-medium text-gray-700">brightness</Label>
                  <span className="text-xs font-semibold text-gray-900">{brightness.toFixed(2)}</span>
                </div>
                <Slider
                  value={[brightness]}
                  onValueChange={(value) => {
                    setBrightness(value[0]);
                    updateAdvancedFilter("Brightness", value[0], brightnessEnabled);
                  }}
                  min={-1}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Contrast */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={contrastEnabled}
                onCheckedChange={(checked) => {
                  setContrastEnabled(checked);
                  updateAdvancedFilter("Contrast", contrast, checked);
                }}
              />
              <Label className="text-xs font-medium text-gray-900">Contrast</Label>
            </div>
            {contrastEnabled && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-xs font-medium text-gray-700">contrast</Label>
                  <span className="text-xs font-semibold text-gray-900">{contrast.toFixed(2)}</span>
                </div>
                <Slider
                  value={[contrast]}
                  onValueChange={(value) => {
                    setContrast(value[0]);
                    updateAdvancedFilter("Contrast", value[0], contrastEnabled);
                  }}
                  min={-1}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Saturation */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={saturationEnabled}
                onCheckedChange={(checked) => {
                  setSaturationEnabled(checked);
                  updateAdvancedFilter("Saturation", saturation, checked);
                }}
              />
              <Label className="text-xs font-medium text-gray-900">Saturation</Label>
            </div>
            {saturationEnabled && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-xs font-medium text-gray-700">saturation</Label>
                  <span className="text-xs font-semibold text-gray-900">{saturation.toFixed(2)}</span>
                </div>
                <Slider
                  value={[saturation]}
                  onValueChange={(value) => {
                    setSaturation(value[0]);
                    updateAdvancedFilter("Saturation", value[0], saturationEnabled);
                  }}
                  min={-1}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Blur */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={blurEnabled}
                onCheckedChange={(checked) => {
                  setBlurEnabled(checked);
                  updateAdvancedFilter("Blur", blur, checked);
                }}
              />
              <Label className="text-xs font-medium text-gray-900">Blur</Label>
            </div>
            {blurEnabled && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-xs font-medium text-gray-700">blur</Label>
                  <span className="text-xs font-semibold text-gray-900">{blur.toFixed(2)}</span>
                </div>
                <Slider
                  value={[blur]}
                  onValueChange={(value) => {
                    setBlur(value[0]);
                    updateAdvancedFilter("Blur", value[0], blurEnabled);
                  }}
                  min={0}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

