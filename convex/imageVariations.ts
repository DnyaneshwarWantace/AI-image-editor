import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Save or update image variations for a specific element
export const saveImageVariations = mutation({
  args: {
    projectId: v.id("projects"),
    elementId: v.string(),
    originalImageUrl: v.string(),
    variations: v.array(
      v.object({
        id: v.string(),
        storageId: v.optional(v.id("_storage")), // Optional for migration
        type: v.string(),
      })
    ),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if variations already exist for this element
    const existing = await ctx.db
      .query("imageVariations")
      .filter((q) =>
        q.and(
          q.eq(q.field("projectId"), args.projectId),
          q.eq(q.field("elementId"), args.elementId)
        )
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing variations
      await ctx.db.patch(existing._id, {
        originalImageUrl: args.originalImageUrl,
        variations: args.variations,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new variations
      const id = await ctx.db.insert("imageVariations", {
        projectId: args.projectId,
        elementId: args.elementId,
        originalImageUrl: args.originalImageUrl,
        variations: args.variations,
        userId: args.userId,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    }
  },
});

// Get all image variations for a project (deduplicated by elementId)
export const getImageVariationsByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const variations = await ctx.db
      .query("imageVariations")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();

    // Deduplicate by elementId - keep only the most recent one
    const deduped = new Map();
    variations.forEach(v => {
      const existing = deduped.get(v.elementId);
      if (!existing || v.updatedAt > existing.updatedAt) {
        deduped.set(v.elementId, v);
      }
    });

    const result = Array.from(deduped.values());

    // Convert storage IDs to URLs for all variations
    const resultWithUrls = await Promise.all(
      result.map(async (item) => {
        const variationsWithUrls = await Promise.all(
          item.variations.map(async (v: any) => {
            // Handle both old data (with imageUrl) and new data (with storageId)
            let url = v.imageUrl || ""; // Old data has imageUrl directly
            if (v.storageId) {
              // New data has storageId, fetch URL
              try {
                const storageUrl = await ctx.storage.getUrl(v.storageId);
                if (storageUrl) {
                  url = storageUrl;
                } else {
                  console.error(`❌ No storage URL for variation in element ${item.elementId}`);
                }
              } catch (error) {
                console.error(`❌ Error getting storage URL:`, error);
              }
            }
            return {
              id: v.id,
              imageUrl: url,
              storageId: v.storageId,
              type: v.type,
            };
          })
        );
        return {
          ...item,
          variations: variationsWithUrls,
        };
      })
    );

    // Log for debugging
    console.log(`📊 Image variations for project ${args.projectId}:`, {
      total: variations.length,
      unique: resultWithUrls.length,
      elementIds: resultWithUrls.map(v => ({ id: v.elementId, url: v.originalImageUrl, count: v.variations.length }))
    });

    return resultWithUrls;
  },
});

// Get image variations for a specific element
export const getImageVariationsByElement = query({
  args: {
    projectId: v.id("projects"),
    elementId: v.string(),
  },
  handler: async (ctx, args) => {
    const variations = await ctx.db
      .query("imageVariations")
      .filter((q) =>
        q.and(
          q.eq(q.field("projectId"), args.projectId),
          q.eq(q.field("elementId"), args.elementId)
        )
      )
      .first();

    if (!variations) return null;

    // Convert storage IDs to URLs
    const variationsWithUrls = await Promise.all(
      variations.variations.map(async (v: any) => {
        // Handle both old data (with imageUrl) and new data (with storageId)
        let url = v.imageUrl || ""; // Old data has imageUrl directly
        if (v.storageId) {
          // New data has storageId, fetch URL
          try {
            const storageUrl = await ctx.storage.getUrl(v.storageId);
            if (storageUrl) {
              url = storageUrl;
              console.log(`✅ Got storage URL for ${v.id}: ${storageUrl.substring(0, 50)}...`);
            } else {
              console.error(`❌ No storage URL for ${v.id}, storageId: ${v.storageId}`);
            }
          } catch (error) {
            console.error(`❌ Error getting storage URL for ${v.id}:`, error);
          }
        }
        return {
          id: v.id,
          imageUrl: url,
          storageId: v.storageId,
          type: v.type,
        };
      })
    );

    return {
      ...variations,
      variations: variationsWithUrls,
    };
  },
});

// Delete image variations for a specific element
export const deleteImageVariations = mutation({
  args: {
    projectId: v.id("projects"),
    elementId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("imageVariations")
      .filter((q) =>
        q.and(
          q.eq(q.field("projectId"), args.projectId),
          q.eq(q.field("elementId"), args.elementId)
        )
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }
    return false;
  },
});

// Clean up variations for image elements that no longer exist on canvas
export const cleanupOrphanedImageVariations = mutation({
  args: {
    projectId: v.id("projects"),
    canvasImageIds: v.array(v.string()), // Array of image element IDs currently on canvas
  },
  handler: async (ctx, args) => {
    // Get all variations for this project
    const variations = await ctx.db
      .query("imageVariations")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();

    // Find variations whose elements are not on canvas anymore
    const canvasIdsSet = new Set(args.canvasImageIds);
    const orphaned = variations.filter(v => !canvasIdsSet.has(v.elementId));

    // Delete orphaned variations
    for (const variation of orphaned) {
      await ctx.db.delete(variation._id);
    }

    return {
      success: true,
      deletedCount: orphaned.length,
      deletedElements: orphaned.map(v => ({ id: v.elementId, url: v.originalImageUrl }))
    };
  },
});

// Get variation count for all image elements in a project
export const getImageVariationCounts = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const allVariations = await ctx.db
      .query("imageVariations")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();

    // Return a map of elementId -> variation count
    const counts: Record<string, number> = {};
    for (const variation of allVariations) {
      counts[variation.elementId] = variation.variations.length;
    }
    return counts;
  },
});

// Generate upload URL for image variation
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Get storage URL from storage ID
export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
