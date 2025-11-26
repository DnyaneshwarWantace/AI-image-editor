import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all template types/categories
export const getTemplateTypes = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("templateTypes")
      .order("asc")
      .collect();
  },
});

// Get templates with filters
export const getTemplates = query({
  args: {
    templateTypeId: v.optional(v.id("templateTypes")),
    searchKeyword: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("templates");

    // Filter by public/private
    if (args.isPublic !== undefined) {
      query = query.filter((q) => q.eq(q.field("isPublic"), args.isPublic));
    }

    // Filter by user
    if (args.userId) {
      query = query.filter((q) => q.eq(q.field("userId"), args.userId));
    }

    // Filter by type
    if (args.templateTypeId) {
      query = query.filter((q) => 
        q.eq(q.field("templateTypeId"), args.templateTypeId)
      );
    }

    let results = await query.order("desc").collect();

    // Filter by search keyword (client-side for simplicity)
    if (args.searchKeyword) {
      const keyword = args.searchKeyword.toLowerCase();
      results = results.filter(
        (t) =>
          t.name.toLowerCase().includes(keyword) ||
          (t.desc && t.desc.toLowerCase().includes(keyword))
      );
    }

    // Apply limit
    if (args.limit) {
      results = results.slice(0, args.limit);
    }

    return results;
  },
});

// Get a single template
export const getTemplate = query({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new template
export const createTemplate = mutation({
  args: {
    name: v.string(),
    desc: v.optional(v.any()),
    json: v.any(),
    imageUrl: v.optional(v.string()),
    templateTypeId: v.optional(v.id("templateTypes")),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    price: v.optional(v.any()),
    proInfo: v.optional(v.any()),
    proImages: v.optional(v.any()),
    isPublic: v.optional(v.boolean()),
    userId: v.optional(v.string()),
    sort: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("templates", {
      name: args.name,
      desc: args.desc,
      json: args.json,
      imageUrl: args.imageUrl,
      templateTypeId: args.templateTypeId,
      width: args.width,
      height: args.height,
      price: args.price,
      proInfo: args.proInfo,
      proImages: args.proImages,
      isPublic: args.isPublic ?? false,
      userId: args.userId,
      sort: args.sort,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a template
export const updateTemplate = mutation({
  args: {
    id: v.id("templates"),
    name: v.optional(v.string()),
    desc: v.optional(v.string()),
    json: v.optional(v.any()),
    imageUrl: v.optional(v.string()),
    templateTypeId: v.optional(v.id("templateTypes")),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
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

// Delete a template
export const deleteTemplate = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Delete a template type
export const deleteTemplateType = mutation({
  args: { id: v.id("templateTypes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Create a template type
export const createTemplateType = mutation({
  args: {
    name: v.string(),
    sort: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("templateTypes", {
      name: args.name,
      sort: args.sort,
      createdAt: Date.now(),
    });
  },
});

// Update a template type
export const updateTemplateType = mutation({
  args: {
    id: v.id("templateTypes"),
    name: v.optional(v.string()),
    sort: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

