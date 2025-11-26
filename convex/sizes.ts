import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSizes = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("sizes")
      .order("asc")
      .collect();
  },
});

export const getSize = query({
  args: { id: v.id("sizes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const deleteSize = mutation({
  args: { id: v.id("sizes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const createSize = mutation({
  args: {
    name: v.string(),
    width: v.number(),
    height: v.number(),
    unit: v.optional(v.string()),
    sort: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sizes", {
      name: args.name,
      width: args.width,
      height: args.height,
      unit: args.unit || "px",
      sort: args.sort,
      createdAt: Date.now(),
    });
  },
});

