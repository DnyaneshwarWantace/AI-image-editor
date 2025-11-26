import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all material types/categories
export const getMaterialTypes = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("materialTypes")
      .order("asc")
      .collect();
  },
});

// Get materials with filters
export const getMaterials = query({
  args: {
    materialTypeId: v.optional(v.id("materialTypes")),
    searchKeyword: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("materials");

    // Filter by public/private
    if (args.isPublic !== undefined) {
      query = query.filter((q) => q.eq(q.field("isPublic"), args.isPublic));
    }

    // Filter by user
    if (args.userId) {
      query = query.filter((q) => q.eq(q.field("userId"), args.userId));
    }

    // Filter by type
    if (args.materialTypeId) {
      query = query.filter((q) => 
        q.eq(q.field("materialTypeId"), args.materialTypeId)
      );
    }

    let results = await query.order("desc").collect();

    // Filter by search keyword
    if (args.searchKeyword) {
      const keyword = args.searchKeyword.toLowerCase();
      results = results.filter(
        (m) =>
          m.name.toLowerCase().includes(keyword) ||
          (m.desc && m.desc.toLowerCase().includes(keyword))
      );
    }

    // Apply limit
    if (args.limit) {
      results = results.slice(0, args.limit);
    }

    return results;
  },
});

// Get a single material
export const getMaterial = query({
  args: { id: v.id("materials") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new material
export const createMaterial = mutation({
  args: {
    name: v.string(),
    desc: v.optional(v.any()),
    imageUrl: v.string(),
    smallUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    materialTypeId: v.optional(v.id("materialTypes")),
    isPublic: v.optional(v.boolean()),
    userId: v.optional(v.string()),
    sort: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("materials", {
      name: args.name,
      desc: args.desc,
      imageUrl: args.imageUrl,
      smallUrl: args.smallUrl,
      thumbnailUrl: args.thumbnailUrl,
      materialTypeId: args.materialTypeId,
      isPublic: args.isPublic ?? false,
      userId: args.userId,
      sort: args.sort,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a material
export const updateMaterial = mutation({
  args: {
    id: v.id("materials"),
    name: v.optional(v.string()),
    desc: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    smallUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    materialTypeId: v.optional(v.id("materialTypes")),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

// Delete a material
export const deleteMaterial = mutation({
  args: { id: v.id("materials") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Delete a material type
export const deleteMaterialType = mutation({
  args: { id: v.id("materialTypes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Create a material type
export const createMaterialType = mutation({
  args: {
    name: v.string(),
    sort: v.optional(v.number()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("materialTypes", {
      name: args.name,
      sort: args.sort,
      type: args.type,
      createdAt: Date.now(),
    });
  },
});

// Update a material type
export const updateMaterialType = mutation({
  args: {
    id: v.id("materialTypes"),
    name: v.optional(v.string()),
    sort: v.optional(v.number()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

