"use client";

import React, { useState, useMemo } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCanvasContext } from "@/providers/canvas-provider";
import { toast } from "sonner";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function MaterialsPanel() {
  const { canvas, editor } = useCanvasContext();
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch material types from Convex
  const materialTypes = useQuery(api.materials.getMaterialTypes);

  // Fetch materials from Convex
  const allMaterials = useQuery(api.materials.getMaterials, {
    isPublic: true,
    limit: 10000,
  });

  // Filter materials based on search and type
  const materials = useMemo(() => {
    if (!allMaterials) return [];

    let filtered = allMaterials;

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((m) => m.materialTypeId === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Format for display
    return filtered.map((item) => ({
      id: item._id,
      name: item.name,
      src: item.imageUrl,
      preview: item.thumbnailUrl || item.smallUrl || item.imageUrl,
    }));
  }, [allMaterials, selectedType, searchQuery]);

  const types = useMemo(() => {
    if (!materialTypes) return [];
    return materialTypes.map((type) => ({
      id: type._id,
      name: type.name,
    }));
  }, [materialTypes]);

  const isLoading = materialTypes === undefined || allMaterials === undefined;

  const addMaterial = async (material: any) => {
    if (!canvas || !editor || !material.src) {
      toast.error("Material not available");
      return;
    }

    try {
      editor.addImage?.(material.src);
      toast.success("Material added");
    } catch (error) {
      console.error("Error adding material:", error);
      toast.error("Failed to add material");
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Search and Filter */}
      <div className="space-y-3">
        <Select value={selectedType} onValueChange={(value) => {
          setSelectedType(value);
        }}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {types.map((type) => (
              <SelectItem key={type.id} value={type.id.toString()}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search materials..."
            className="pl-10 bg-white"
          />
        </div>
      </div>

      {/* Materials Grid */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No materials found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {materials.map((material) => (
              <div
                key={material.id}
                className="group cursor-pointer"
                onClick={() => addMaterial(material)}
              >
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors">
                  {material.preview ? (
                    <img
                      src={material.preview}
                      alt={material.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-xs text-gray-400">{material.name}</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1 truncate">{material.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

