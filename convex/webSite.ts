import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getWebSite = query({
  handler: async (ctx) => {
    const site = await ctx.db
      .query("webSite")
      .first();
    return site;
  },
});

export const createWebSite = mutation({
  args: {
    name: v.string(),
    url: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    locale: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("webSite", {
      name: args.name,
      url: args.url,
      logoUrl: args.logoUrl,
      locale: args.locale,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteWebSite = mutation({
  args: { id: v.id("webSite") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const updateWebSite = mutation({
  args: {
    id: v.id("webSite"),
    name: v.optional(v.string()),
    url: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    locale: v.optional(v.string()),
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

