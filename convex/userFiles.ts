import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

export const saveFileMetadata = mutation({
  args: {
    fileId: v.id("_storage"),
    fileName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Get the user from the database
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const fileMetadataId = await ctx.db.insert("userFiles", {
      uploadedByUserId: user._id,
      fileId: args.fileId,
      fileName: args.fileName,
    });

    return fileMetadataId;
  },
});

export const getCurrentUserFiles = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Get the user from the database
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    // Get files for this user
    const files = await ctx.db
      .query("userFiles")
      .withIndex("by_uploadedByUserId", (q) =>
        q.eq("uploadedByUserId", user._id),
      )
      .collect();

    // Get URLs for each file
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        const url = await ctx.storage.getUrl(file.fileId);
        return {
          ...file,
          url,
        };
      }),
    );

    return filesWithUrls;
  },
});

export const deleteFile = mutation({
  args: {
    fileMetadataId: v.id("userFiles"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Get the user from the database
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Get the file metadata
    const fileMetadata = await ctx.db.get(args.fileMetadataId);
    if (!fileMetadata) {
      throw new ConvexError("File not found");
    }

    // Verify the user owns this file
    if (fileMetadata.uploadedByUserId !== user._id) {
      throw new ConvexError("Unauthorized: You can only delete your own files");
    }

    // Delete the file from storage
    await ctx.storage.delete(fileMetadata.fileId);

    // Delete the metadata
    await ctx.db.delete(args.fileMetadataId);
  },
});
