
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/* ---------------- STORE USER ---------------- */
export const store = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, { name, email, imageUrl }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      userId,
      name,
      email,
      imageUrl: imageUrl ?? "",
    });
  },
});


/* =========================================================
   GET CURRENT USER
========================================================= */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) =>
        q.eq("userId", identity.subject)
      )
      .first();

    return user ?? null;
  },
});

/* =========================================================
   ✅ GET ALL USERS (REQUIRED FOR INDIVIDUAL EXPENSE)
========================================================= */
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    return await ctx.db.query("users").collect();
  },
});
/* ---------------- SEARCH USERS ---------------- */


export const searchUsers = query({
  args: {
    query: v.string(),
  },

  handler: async (ctx, args) => {
    const search = args.query.trim().toLowerCase();

    const users = await ctx.db.query("users").collect();

    return users.filter((user) => {
      return (
        user.name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search)
      );
    });
  },
});


/* ---------------- GET USER BY CLERK ID ---------------- */
export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", clerkId))
      .unique();
  },
});