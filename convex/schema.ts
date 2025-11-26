import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    createdAt: v.number(),
  }),

  projects: defineTable({
    title: v.string(),
    width: v.number(),
    height: v.number(),
    canvasState: v.any(),
    imageUrl: v.optional(v.string()),
    userId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  folders: defineTable({
    name: v.string(),
    userId: v.optional(v.string()),
    parentId: v.optional(v.string()),
    createdAt: v.number(),
  }),

  // Template categories/types
  templateTypes: defineTable({
    name: v.string(),
    sort: v.optional(v.number()),
    createdAt: v.number(),
  }),

  // Templates (pre-designed templates with Fabric.js JSON)
  templates: defineTable({
    name: v.string(),
    desc: v.optional(v.any()), // Can be object or string
    json: v.any(), // Fabric.js JSON canvas state
    imageUrl: v.optional(v.string()), // Preview image URL
    templateTypeId: v.optional(v.id("templateTypes")), // Category
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    price: v.optional(v.any()), // Price info (object)
    proInfo: v.optional(v.any()), // Pro info (object)
    proImages: v.optional(v.any()), // Pro images (object)
    isPublic: v.optional(v.boolean()), // Public templates vs user templates
    userId: v.optional(v.string()), // If user-created
    sort: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Material categories/types
  materialTypes: defineTable({
    name: v.string(),
    sort: v.optional(v.number()),
    type: v.optional(v.string()), // e.g., "img_only"
    createdAt: v.number(),
  }),

  // Materials (images, icons, assets)
  materials: defineTable({
    name: v.string(),
    desc: v.optional(v.any()), // Can be object or string
    imageUrl: v.string(), // Material image URL (full size)
    smallUrl: v.optional(v.string()), // Small size URL
    thumbnailUrl: v.optional(v.string()), // Thumbnail URL
    materialTypeId: v.optional(v.id("materialTypes")), // Category
    isPublic: v.optional(v.boolean()),
    userId: v.optional(v.string()),
    sort: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Font Style Types (categories for font styles)
  fontStyleTypes: defineTable({
    name: v.string(),
    sort: v.optional(v.number()),
    createdAt: v.number(),
  }),

  // Font Styles (pre-configured text style presets)
  fontStyles: defineTable({
    name: v.string(),
    desc: v.optional(v.any()), // Can be object or string
    json: v.any(), // Fabric.js textbox JSON with styling
    imageUrl: v.optional(v.string()), // Preview image
    fontStyleTypeId: v.optional(v.id("fontStyleTypes")), // Category
    sort: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Fonts (available font families)
  fonts: defineTable({
    name: v.string(),
    fontFamily: v.string(), // CSS font-family name
    type: v.optional(v.string()), // e.g., "cn" for Chinese
    url: v.optional(v.string()), // Font file URL
    imageUrl: v.optional(v.string()), // Preview image
    sort: v.optional(v.number()),
    createdAt: v.number(),
  }),

  // Canvas Sizes (predefined canvas dimensions)
  sizes: defineTable({
    name: v.string(),
    width: v.number(),
    height: v.number(),
    unit: v.optional(v.string()), // e.g., "px"
    sort: v.optional(v.number()),
    createdAt: v.number(),
  }),

  // Banners (promotional content)
  banners: defineTable({
    title: v.string(),
    url: v.optional(v.any()), // Can be object or string
    imageUrl: v.optional(v.string()),
    locale: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Web Site (website configuration)
  webSite: defineTable({
    name: v.string(),
    url: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    locale: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Font Borders (font border styles)
  fontBorders: defineTable({
    name: v.string(),
    json: v.any(), // Font border JSON
    imageUrl: v.optional(v.string()),
    sort: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Scraped Facebook Ads (reference ads from competitors)
  scrapedAds: defineTable({
    facebookAdId: v.optional(v.string()), // Original Facebook ad ID
    pageId: v.string(), // Facebook Page ID
    pageName: v.optional(v.string()), // Page name
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.string(), // Ad image URL
    cta: v.optional(v.string()), // Call to action
    link: v.optional(v.string()), // Ad link
    rawData: v.optional(v.any()), // Full raw data from API
    userId: v.optional(v.string()), // User who fetched it
    createdAt: v.number(),
  }),

  // AI-Generated Ads (ads created by AI based on scraped ads)
  generatedAds: defineTable({
    name: v.string(), // Ad name
    json: v.any(), // Fabric.js JSON template
    imageUrl: v.optional(v.string()), // Preview/thumbnail
    brandInfo: v.any(), // Brand information used for generation
    referenceAdIds: v.array(v.id("scrapedAds")), // Reference scraped ads used
    analysis: v.optional(v.any()), // AI analysis results
    userId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Text Variations (for A/B testing and multi-ad generation)
  textVariations: defineTable({
    projectId: v.id("projects"), // Which project these variations belong to
    elementId: v.string(), // Canvas element ID
    originalText: v.string(), // Original text content
    variations: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
        type: v.string(), // "manual" or "ai"
        language: v.optional(v.string()), // Language if AI-generated
      })
    ),
    userId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
});

