"use client";

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FileUp, ChevronDown, Image as ImageIcon, FileCode, FileJson } from "lucide-react";
import { useCanvasContext } from "@/providers/canvas-provider";
import { toast } from "sonner";

export function ImportMenu() {
  const { canvas, editor } = useCanvasContext();
  const [isImporting, setIsImporting] = useState(false);

  const handleImportImage = async (files: File[]) => {
    if (!editor || !canvas || files.length === 0) return;

    setIsImporting(true);
    try {
      for (const file of files) {
        // Convert file to base64 data URL
        const reader = new FileReader();
        const imageUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') {
              resolve(result);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Create img element and load it (Vue editor pattern)
        const imgEl = document.createElement('img');
        imgEl.src = imageUrl;
        document.body.appendChild(imgEl);

        await new Promise((resolve, reject) => {
          imgEl.onload = async () => {
            try {
              const imgItem = await editor.createImgByElement?.(imgEl);
              if (imgItem) {
                editor.addBaseType?.(imgItem, { scale: true });
              }
              imgEl.remove();
              resolve(true);
            } catch (err) {
              imgEl.remove();
              reject(err);
            }
          };
          imgEl.onerror = () => {
            imgEl.remove();
            reject(new Error('Failed to load image'));
          };
        });
      }
      toast.success(`Imported ${files.length} image(s)`);
    } catch (error) {
      console.error("Error importing images:", error);
      toast.error("Failed to import images");
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportSVG = async (files: File[]) => {
    if (!editor || files.length === 0) return;

    setIsImporting(true);
    try {
      // Import fabric dynamically
      const { loadSVGFromURL, util } = await import('fabric');

      for (const file of files) {
        const reader = new FileReader();
        const svgUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') {
              resolve(result);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Use loadSVGFromURL with data URL (Vue editor pattern)
        const { objects, options } = await loadSVGFromURL(svgUrl);
        const filteredObjects = objects.filter((obj): obj is any => obj !== null);
        const item = util.groupSVGElements(filteredObjects, options);
        if (item) {
          // Set name property after creation
          (item as any).name = 'defaultSVG';
          editor.addBaseType?.(item, { scale: true });
        }
      }
      toast.success(`Imported ${files.length} SVG(s)`);
    } catch (error) {
      console.error("Error importing SVG:", error);
      toast.error("Failed to import SVG");
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportJSON = async () => {
    if (!editor) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
        const text = await file.text();
        // Use loadJSON method (Vue editor pattern)
        editor.loadJSON?.(text, () => {
          toast.success("Project imported");
          setIsImporting(false);
        });
      } catch (error) {
        console.error("Error importing JSON:", error);
        toast.error("Failed to import project");
        setIsImporting(false);
      }
    };
    input.click();
  };

  const handleImportPSD = async () => {
    if (!editor) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".psd";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
        await editor.insertPSD?.(file);
        toast.success("PSD imported");
      } catch (error) {
        console.error("Error importing PSD:", error);
        toast.error("Failed to import PSD");
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  };

  const handleImageClick = () => {
    if (!editor) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/jpg,image/webp,image/gif";
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        await handleImportImage(files);
      }
    };
    input.click();
  };

  const handleSVGClick = () => {
    if (!editor) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/svg+xml,.svg";
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        await handleImportSVG(files);
      }
    };
    input.click();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isImporting}>
          <FileUp className="h-4 w-4 mr-2" />
          Import
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={handleImageClick}>
          <ImageIcon className="h-4 w-4 mr-2" />
          Import Image
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSVGClick}>
          <FileCode className="h-4 w-4 mr-2" />
          Import SVG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleImportJSON}>
          <FileJson className="h-4 w-4 mr-2" />
          Import JSON Project
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleImportPSD}>
          <FileCode className="h-4 w-4 mr-2" />
          Import PSD
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

