import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { ConvexError } from "convex/values";

export async function getCurrentUserOrNull(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  // Null when authenticated but the user row isn't provisioned yet
  // (first-login race) - this is a normal transient state, not a bug.
  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

export async function getCurrentUserOrCrash(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUserOrNull(ctx);

  if (!user) {
    throw new ConvexError("Not authenticated");
  }

  return user;
}

export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existingUser) {
      const clerkName = identity.name ?? undefined;
      if (existingUser.name !== clerkName) {
        await ctx.db.patch(existingUser._id, { name: clerkName });
        return await ctx.db.get(existingUser._id);
      }
      return existingUser;
    }

    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      name: identity.name ?? undefined,
    });

    return await ctx.db.get(userId);
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUserOrNull(ctx);
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await getCurrentUserOrCrash(ctx);

    const users = await ctx.db.query("users").collect();
    return users;
  },
});
