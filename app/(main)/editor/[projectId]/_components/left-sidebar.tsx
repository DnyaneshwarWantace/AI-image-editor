"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Shapes,
  Type,
  Image as ImageIcon,
  Layers,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tab Components (will create these next)
import { TemplatesPanel } from "./tabs/templates-panel";
import { ElementsPanel } from "./tabs/elements-panel";
import { FontStylePanel } from "./tabs/font-style-panel";
import { MaterialsPanel } from "./tabs/materials-panel";
import { LayersPanel } from "./tabs/layers-panel";
import { MyMaterialsPanel } from "./tabs/my-materials-panel";

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
    <div
      className={cn(
        "flex relative bg-white transition-all duration-300",
        isExpanded ? "w-[380px]" : "w-[65px]"
      )}
    >
      {/* Icon Menu - 65px */}
      <div
        className="w-[65px] border-r flex flex-col"
        style={{ borderColor: "#eef2f8" }}
      >
        {LEFT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (!isExpanded) setIsExpanded(true);
              }}
              className={cn(
                "flex flex-col items-center justify-center p-2 py-3 text-xs transition-colors border-b",
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              )}
              style={{ borderColor: "#eef2f8" }}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-center leading-tight">{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Content Panel - 315px */}
      {isExpanded && (
        <div className="w-[315px] overflow-y-auto bg-white">
          <div className="p-3">
            {ActiveComponent && <ActiveComponent />}
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-5 h-16 bg-white border rounded-r cursor-pointer hover:bg-gray-50 transition-all z-10 flex items-center justify-center"
        style={{ borderColor: "#eef2f8" }}
      >
        <div className="text-gray-400">
          {isExpanded ? "‹" : "›"}
        </div>
      </button>
    </div>
  );
}
