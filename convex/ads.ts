import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============ SCRAPED ADS ============

export const saveScrapedAds = mutation({
  args: {
    ads: v.array(v.object({
      facebookAdId: v.optional(v.string()),
      pageId: v.string(),
      pageName: v.optional(v.string()),
      title: v.string(),
      description: v.optional(v.string()),
      imageUrl: v.string(),
      cta: v.optional(v.string()),
      link: v.optional(v.string()),
      rawData: v.optional(v.any()),
    })),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const insertedIds = [];

    for (const ad of args.ads) {
      const id = await ctx.db.insert("scrapedAds", {
        ...ad,
        userId: args.userId,
        createdAt: now,
      });
      insertedIds.push(id);
    }

    return insertedIds;
  },
});

export const getScrapedAds = query({
  args: {
    userId: v.optional(v.string()),
    pageId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("scrapedAds");

    if (args.pageId) {
      query = query.filter((q) => q.eq(q.field("pageId"), args.pageId));
    }

    if (args.userId) {
      query = query.filter((q) => q.eq(q.field("userId"), args.userId));
    }

    query = query.order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

export const getScrapedAdById = query({
  args: { id: v.id("scrapedAds") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ============ GENERATED ADS ============

export const saveGeneratedAd = mutation({
  args: {
    name: v.string(),
    json: v.any(),
    imageUrl: v.optional(v.string()),
    brandInfo: v.any(),
    referenceAdIds: v.array(v.id("scrapedAds")),
    analysis: v.optional(v.any()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const id = await ctx.db.insert("generatedAds", {
      name: args.name,
      json: args.json,
      imageUrl: args.imageUrl,
      brandInfo: args.brandInfo,
      referenceAdIds: args.referenceAdIds,
      analysis: args.analysis,
      userId: args.userId,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

export const getGeneratedAds = query({
  args: {
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("generatedAds");

    if (args.userId) {
      query = query.filter((q) => q.eq(q.field("userId"), args.userId));
    }

    query = query.order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

export const getGeneratedAdById = query({
  args: { id: v.id("generatedAds") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateGeneratedAd = mutation({
  args: {
    id: v.id("generatedAds"),
    name: v.optional(v.string()),
    json: v.optional(v.any()),
    imageUrl: v.optional(v.string()),
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

export const deleteGeneratedAd = mutation({
  args: { id: v.id("generatedAds") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
