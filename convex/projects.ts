import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// Get a single project by ID
export const getProject = query({
  args: { projectId: v.union(v.id("projects"), v.string()) },
  handler: async (ctx, args) => {
    // Convert string ID to Convex ID if needed
    const id = typeof args.projectId === "string" 
      ? (args.projectId as any as Id<"projects">)
      : args.projectId;
    return await ctx.db.get(id);
  },
});

// Get all projects for a user (or all projects if no userId)
export const getUserProjects = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.userId) {
      return await ctx.db
        .query("projects")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .collect();
    }
    return await ctx.db.query("projects").collect();
  },
});

// Create a new project
export const create = mutation({
  args: {
    title: v.string(),
    width: v.number(),
    height: v.number(),
    canvasState: v.any(),
    imageUrl: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("projects", {
      title: args.title,
      width: args.width,
      height: args.height,
      canvasState: args.canvasState,
      imageUrl: args.imageUrl,
      userId: args.userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update an existing project
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    canvasState: v.optional(v.any()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { projectId, ...updates } = args;
    await ctx.db.patch(projectId, {
      ...updates,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(projectId);
  },
});

// Delete a project
export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.projectId);
  },
});

