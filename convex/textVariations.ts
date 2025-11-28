import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Save or update text variations for a specific element
export const saveTextVariations = mutation({
  args: {
    projectId: v.id("projects"),
    elementId: v.string(),
    originalText: v.string(),
    variations: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
        type: v.string(),
        language: v.optional(v.string()),
      })
    ),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if variations already exist for this element
    const existing = await ctx.db
      .query("textVariations")
      .filter((q) =>
        q.and(
          q.eq(q.field("projectId"), args.projectId),
          q.eq(q.field("elementId"), args.elementId)
        )
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing variations
      await ctx.db.patch(existing._id, {
        originalText: args.originalText,
        variations: args.variations,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new variations
      const id = await ctx.db.insert("textVariations", {
        projectId: args.projectId,
        elementId: args.elementId,
        originalText: args.originalText,
        variations: args.variations,
        userId: args.userId,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    }
  },
});

// Get all text variations for a project (deduplicated by elementId)
export const getTextVariationsByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const variations = await ctx.db
      .query("textVariations")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();

    // Deduplicate by elementId - keep only the most recent one
    const deduped = new Map();
    variations.forEach(v => {
      const existing = deduped.get(v.elementId);
      if (!existing || v.updatedAt > existing.updatedAt) {
        deduped.set(v.elementId, v);
      }
    });

    const result = Array.from(deduped.values());

    // Log for debugging
    console.log(`📊 Variations for project ${args.projectId}:`, {
      total: variations.length,
      unique: result.length,
      elementIds: result.map(v => ({ id: v.elementId, text: v.originalText, count: v.variations.length }))
    });

    return result;
  },
});

// Get text variations for a specific element
export const getTextVariationsByElement = query({
  args: {
    projectId: v.id("projects"),
    elementId: v.string(),
  },
  handler: async (ctx, args) => {
    const variations = await ctx.db
      .query("textVariations")
      .filter((q) =>
        q.and(
          q.eq(q.field("projectId"), args.projectId),
          q.eq(q.field("elementId"), args.elementId)
        )
      )
      .first();

    return variations;
  },
});

// Delete text variations for a specific element
export const deleteTextVariations = mutation({
  args: {
    projectId: v.id("projects"),
    elementId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("textVariations")
      .filter((q) =>
        q.and(
          q.eq(q.field("projectId"), args.projectId),
          q.eq(q.field("elementId"), args.elementId)
        )
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }
    return false;
  },
});

// Clean up variations for text elements that no longer exist on canvas
export const cleanupOrphanedVariations = mutation({
  args: {
    projectId: v.id("projects"),
    canvasTextIds: v.array(v.string()), // Array of text element IDs currently on canvas
  },
  handler: async (ctx, args) => {
    // Get all variations for this project
    const variations = await ctx.db
      .query("textVariations")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();

    // Find variations whose elements are not on canvas anymore
    const canvasIdsSet = new Set(args.canvasTextIds);
    const orphaned = variations.filter(v => !canvasIdsSet.has(v.elementId));

    // Delete orphaned variations
    for (const variation of orphaned) {
      await ctx.db.delete(variation._id);
    }

    return {
      success: true,
      deletedCount: orphaned.length,
      deletedElements: orphaned.map(v => ({ id: v.elementId, text: v.originalText }))
    };
  },
});

// Get variation count for all elements in a project
export const getVariationCounts = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const allVariations = await ctx.db
      .query("textVariations")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();

    // Return a map of elementId -> variation count
    const counts: Record<string, number> = {};
    for (const variation of allVariations) {
      counts[variation.elementId] = variation.variations.length;
    }
    return counts;
  },
});
