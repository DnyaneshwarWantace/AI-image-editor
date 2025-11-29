import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const saveElementColorVariations = mutation({
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
      .query("elementColorVariations")
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
      return await ctx.db.insert("elementColorVariations", {
        projectId: args.projectId,
        elementId: args.elementId,
        originalColor: args.originalColor,
        variations: args.variations,
        userId: args.userId,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const getElementColorVariationsByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const variations = await ctx.db
      .query("elementColorVariations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return variations.map((v) => ({
      elementId: v.elementId,
      originalColor: v.originalColor,
      variations: v.variations,
    }));
  },
});

export const getElementColorVariationCounts = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const variations = await ctx.db
      .query("elementColorVariations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const counts: Record<string, number> = {};
    variations.forEach((v) => {
      counts[v.elementId] = v.variations.length;
    });

    return counts;
  },
});
