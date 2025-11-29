import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Save background color variations
export const saveBackgroundColorVariations = mutation({
  args: {
    projectId: v.id("projects"),
    variations: v.array(v.object({
      id: v.string(),
      color: v.string(),
      name: v.optional(v.string()),
    })),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if variations already exist for this project
    const existing = await ctx.db
      .query("backgroundColorVariations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing variations
      await ctx.db.patch(existing._id, {
        variations: args.variations,
        updatedAt: now,
      });
      console.log(`✅ Updated background color variations for project ${args.projectId}`);
      return existing._id;
    } else {
      // Create new variations entry
      const id = await ctx.db.insert("backgroundColorVariations", {
        projectId: args.projectId,
        variations: args.variations,
        userId: args.userId,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`✅ Created new background color variations for project ${args.projectId}`);
      return id;
    }
  },
});

// Get background color variations for a project
export const getBackgroundColorVariations = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const variations = await ctx.db
      .query("backgroundColorVariations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();

    return variations?.variations || [];
  },
});

// Get background color variation count
export const getBackgroundColorVariationCount = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const variations = await ctx.db
      .query("backgroundColorVariations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();

    return variations?.variations.length || 0;
  },
});

// Delete background color variations
export const deleteBackgroundColorVariations = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("backgroundColorVariations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      console.log(`✅ Deleted background color variations for project ${args.projectId}`);
    }
  },
});
