import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Save font variations for a text element
export const saveFontVariations = mutation({
  args: {
    projectId: v.id("projects"),
    elementId: v.string(),
    originalFont: v.string(),
    variations: v.array(v.object({
      id: v.string(),
      fontFamily: v.string(),
      fontWeight: v.optional(v.union(v.string(), v.number())),
      fontStyle: v.optional(v.string()),
    })),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if variations already exist for this element
    const existing = await ctx.db
      .query("fontVariations")
      .withIndex("by_project_element", (q) =>
        q.eq("projectId", args.projectId).eq("elementId", args.elementId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing variations
      await ctx.db.patch(existing._id, {
        originalFont: args.originalFont,
        variations: args.variations,
        updatedAt: now,
      });
      console.log(`✅ Updated font variations for element ${args.elementId}`);
      return existing._id;
    } else {
      // Create new variations entry
      const id = await ctx.db.insert("fontVariations", {
        projectId: args.projectId,
        elementId: args.elementId,
        originalFont: args.originalFont,
        variations: args.variations,
        userId: args.userId,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`✅ Created new font variations for element ${args.elementId}`);
      return id;
    }
  },
});

// Get all font variations for a project
export const getFontVariationsByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const variations = await ctx.db
      .query("fontVariations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return variations.map((v) => ({
      elementId: v.elementId,
      originalFont: v.originalFont,
      variations: v.variations,
    }));
  },
});

// Get font variation counts per element
export const getFontVariationCounts = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const variations = await ctx.db
      .query("fontVariations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const counts: Record<string, number> = {};
    variations.forEach((v) => {
      counts[v.elementId] = v.variations.length;
    });

    return counts;
  },
});

// Delete font variations for a specific element
export const deleteFontVariations = mutation({
  args: {
    projectId: v.id("projects"),
    elementId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("fontVariations")
      .withIndex("by_project_element", (q) =>
        q.eq("projectId", args.projectId).eq("elementId", args.elementId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      console.log(`✅ Deleted font variations for element ${args.elementId}`);
    }
  },
});

// Cleanup orphaned font variations (elements no longer on canvas)
export const cleanupOrphanedFontVariations = mutation({
  args: {
    projectId: v.id("projects"),
    canvasTextIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const allVariations = await ctx.db
      .query("fontVariations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const canvasIdSet = new Set(args.canvasTextIds);
    const toDelete: string[] = [];

    for (const variation of allVariations) {
      if (!canvasIdSet.has(variation.elementId)) {
        await ctx.db.delete(variation._id);
        toDelete.push(variation.elementId);
      }
    }

    return {
      deletedCount: toDelete.length,
      deletedElements: toDelete,
    };
  },
});
