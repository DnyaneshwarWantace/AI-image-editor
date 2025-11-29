"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Shapes,
  Type,
  Image as ImageIcon,
  Layers,
  User,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Tab Components (will create these next)
import { TemplatesPanel } from "./tabs/templates-panel";
import { ElementsPanel } from "./tabs/elements-panel";
import { FontStylePanel } from "./tabs/font-style-panel";
import { MaterialsPanel } from "./tabs/materials-panel";
import { LayersPanel } from "./tabs/layers-panel";
import { MyMaterialsPanel } from "./tabs/my-materials-panel";
import { TextVariationsPanel } from "./tabs/text-variations-panel";
import { ImageVariationsPanel } from "./tabs/image-variations-panel";
import { FontVariationsPanel } from "./tabs/font-variations-panel";
import { BackgroundColorVariationsPanel } from "./tabs/background-color-variations-panel";
import { TextColorVariationsPanel } from "./tabs/text-color-variations-panel";

const LEFT_TABS = [
  {
    key: "templates",
    name: "Templates",
    icon: BookOpen,
    component: TemplatesPanel,
  },
  {
    key: "elements",
    name: "Elements",
    icon: Shapes,
    component: ElementsPanel,
  },
  {
    key: "fontStyle",
    name: "Font Style",
    icon: Type,
    component: FontStylePanel,
  },
  {
    key: "materials",
    name: "Materials",
    icon: ImageIcon,
    component: MaterialsPanel,
  },
  {
    key: "layers",
    name: "Layers",
    icon: Layers,
    component: LayersPanel,
  },
  {
    key: "textVariations",
    name: "Text Variations",
    icon: Type,
    component: TextVariationsPanel,
  },
  {
    key: "imageVariations",
    name: "Image Variations",
    icon: ImageIcon,
    component: ImageVariationsPanel,
  },
  {
    key: "fontVariations",
    name: "Font Variations",
    icon: Palette,
    component: FontVariationsPanel,
  },
  {
    key: "backgroundColorVariations",
    name: "BG Color",
    icon: Palette,
    component: BackgroundColorVariationsPanel,
  },
  {
    key: "textColorVariations",
    name: "Text Color",
    icon: Type,
    component: TextColorVariationsPanel,
  },
  {
    key: "myMaterial",
    name: "My Materials",
    icon: User,
    component: MyMaterialsPanel,
  },
];

export function LeftSidebar() {
  const [activeTab, setActiveTab] = useState("elements");
  const [isExpanded, setIsExpanded] = useState(true);

  const ActiveComponent = LEFT_TABS.find((tab) => tab.key === activeTab)?.component;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "flex relative bg-white transition-all duration-300",
          isExpanded ? "w-[310px]" : "w-[42px]"
        )}
      >
        {/* Icon Menu - 42px */}
        <div
          className="w-[42px] border-r flex flex-col"
          style={{ borderColor: "#eef2f8" }}
        >
          {LEFT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <Tooltip key={tab.key}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      setActiveTab(tab.key);
                      if (!isExpanded) setIsExpanded(true);
                    }}
                    className={cn(
                      "flex items-center justify-center p-2 transition-colors border-b",
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                    style={{ borderColor: "#eef2f8" }}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{tab.name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

      {/* Content Panel - 268px */}
      {isExpanded && (
        <div
          className="w-[268px] overflow-y-auto bg-white scrollbar-thin"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db transparent'
          }}
        >
          <div className="p-2">
            {ActiveComponent && <ActiveComponent />}
          </div>
        </div>
      )}

        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute right-[-16px] top-1/2 -translate-y-1/2 w-3.5 h-12 bg-white border rounded-r cursor-pointer hover:bg-gray-50 transition-all z-10 flex items-center justify-center"
          style={{ borderColor: "#eef2f8" }}
        >
          <div className="text-gray-400 text-xs">
            {isExpanded ? "‹" : "›"}
          </div>
        </button>
      </div>
    </TooltipProvider>
  );
}
