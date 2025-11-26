import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getBanners = query({
  args: {
    locale: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("banners");

    if (args.locale) {
      query = query.filter((q) => q.eq(q.field("locale"), args.locale));
    }

    return await query.order("asc").collect();
  },
});

export const deleteBanner = mutation({
  args: { id: v.id("banners") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const createBanner = mutation({
  args: {
    title: v.string(),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    locale: v.optional(v.string()),
    sort: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("banners", {
      title: args.title,
      url: args.url,
      imageUrl: args.imageUrl,
      locale: args.locale,
      sort: args.sort,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateBanner = mutation({
  args: {
    id: v.id("banners"),
    title: v.optional(v.string()),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    locale: v.optional(v.string()),
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

