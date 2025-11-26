import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getFontBorders = query({
  args: {
    searchKeyword: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("fontBorders");

    let results = await query.order("asc").collect();

    if (args.searchKeyword) {
      const keyword = args.searchKeyword.toLowerCase();
      results = results.filter((f) =>
        f.name.toLowerCase().includes(keyword)
      );
    }

    if (args.limit) {
      results = results.slice(0, args.limit);
    }

    return results;
  },
});

export const getFontBorder = query({
  args: { id: v.id("fontBorders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const deleteFontBorder = mutation({
  args: { id: v.id("fontBorders") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const createFontBorder = mutation({
  args: {
    name: v.string(),
    json: v.any(),
    imageUrl: v.optional(v.string()),
    sort: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("fontBorders", {
      name: args.name,
      json: args.json,
      imageUrl: args.imageUrl,
      sort: args.sort,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateFontBorder = mutation({
  args: {
    id: v.id("fontBorders"),
    name: v.optional(v.string()),
    json: v.optional(v.any()),
    imageUrl: v.optional(v.string()),
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

