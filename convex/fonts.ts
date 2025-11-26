import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ========== Font Style Types ==========

export const getFontStyleTypes = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("fontStyleTypes")
      .order("asc")
      .collect();
  },
});

export const createFontStyleType = mutation({
  args: {
    name: v.string(),
    sort: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("fontStyleTypes", {
      name: args.name,
      sort: args.sort,
      createdAt: Date.now(),
    });
  },
});

// ========== Font Styles ==========

export const getFontStyles = query({
  args: {
    fontStyleTypeId: v.optional(v.id("fontStyleTypes")),
    searchKeyword: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("fontStyles");

    if (args.fontStyleTypeId) {
      query = query.filter((q) => 
        q.eq(q.field("fontStyleTypeId"), args.fontStyleTypeId)
      );
    }

    let results = await query.order("desc").collect();

    if (args.searchKeyword) {
      const keyword = args.searchKeyword.toLowerCase();
      results = results.filter(
        (f) =>
          f.name.toLowerCase().includes(keyword) ||
          (f.desc && f.desc.toLowerCase().includes(keyword))
      );
    }

    if (args.limit) {
      results = results.slice(0, args.limit);
    }

    return results;
  },
});

export const getFontStyle = query({
  args: { id: v.id("fontStyles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createFontStyle = mutation({
  args: {
    name: v.string(),
    desc: v.optional(v.any()),
    json: v.any(),
    imageUrl: v.optional(v.string()),
    fontStyleTypeId: v.optional(v.id("fontStyleTypes")),
    sort: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("fontStyles", {
      name: args.name,
      desc: args.desc,
      json: args.json,
      imageUrl: args.imageUrl,
      fontStyleTypeId: args.fontStyleTypeId,
      sort: args.sort,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateFontStyle = mutation({
  args: {
    id: v.id("fontStyles"),
    name: v.optional(v.string()),
    desc: v.optional(v.any()),
    json: v.optional(v.any()),
    imageUrl: v.optional(v.string()),
    fontStyleTypeId: v.optional(v.id("fontStyleTypes")),
    sort: v.optional(v.number()),
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

// ========== Fonts ==========

export const getFonts = query({
  args: {
    type: v.optional(v.string()),
    searchKeyword: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("fonts");

    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }

    let results = await query.order("asc").collect();

    if (args.searchKeyword) {
      const keyword = args.searchKeyword.toLowerCase();
      results = results.filter((f) =>
        f.name.toLowerCase().includes(keyword) ||
        f.fontFamily.toLowerCase().includes(keyword)
      );
    }

    if (args.limit) {
      results = results.slice(0, args.limit);
    }

    return results;
  },
});

export const getFont = query({
  args: { id: v.id("fonts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const deleteFont = mutation({
  args: { id: v.id("fonts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const deleteFontStyle = mutation({
  args: { id: v.id("fontStyles") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const deleteFontStyleType = mutation({
  args: { id: v.id("fontStyleTypes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const createFont = mutation({
  args: {
    name: v.string(),
    fontFamily: v.string(),
    type: v.optional(v.string()),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    sort: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("fonts", {
      name: args.name,
      fontFamily: args.fontFamily,
      type: args.type,
      url: args.url,
      imageUrl: args.imageUrl,
      sort: args.sort,
      createdAt: Date.now(),
    });
  },
});

export const updateFont = mutation({
  args: {
    id: v.id("fonts"),
    name: v.optional(v.string()),
    fontFamily: v.optional(v.string()),
    type: v.optional(v.string()),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    sort: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

