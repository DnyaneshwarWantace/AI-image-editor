import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Save text color variations for a text element
export const saveTextColorVariations = mutation({
  args: {
    projectId: v.id("projects"),
    elementId: v.string(),
    originalColor: v.string(),
    variations: v.array(v.object({
      id: v.string(),
      color: v.string(),
      name: v.optional(v.string()),
    })),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("textColorVariations")
      .withIndex("by_project_element", (q) =>
        q.eq("projectId", args.projectId).eq("elementId", args.elementId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        originalColor: args.originalColor,
        variations: args.variations,
        updatedAt: now,
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("textColorVariations", {
        projectId: args.projectId,
        elementId: args.elementId,
        originalColor: args.originalColor,
        variations: args.variations,
        userId: args.userId,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    }
  },
});

// Get all text color variations for a project
export const getTextColorVariationsByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const variations = await ctx.db
      .query("textColorVariations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return variations.map((v) => ({
      elementId: v.elementId,
      originalColor: v.originalColor,
      variations: v.variations,
    }));
  },
});

// Get text color variation counts per element
export const getTextColorVariationCounts = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const variations = await ctx.db
      .query("textColorVariations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const counts: Record<string, number> = {};
    variations.forEach((v) => {
      counts[v.elementId] = v.variations.length;
    });

    return counts;
  },
});

// Delete text color variations for a specific element
export const deleteTextColorVariations = mutation({
  args: {
    projectId: v.id("projects"),
    elementId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("textColorVariations")
      .withIndex("by_project_element", (q) =>
        q.eq("projectId", args.projectId).eq("elementId", args.elementId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
