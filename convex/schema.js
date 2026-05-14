import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /* ================= USERS ================= */
  users: defineTable({
    userId: v.string(), // Clerk / Auth ID
    name: v.string(),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_name", ["name"]),

  /* ================= GROUPS ================= */
  groups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),

    members: v.array(
      v.object({
        userId: v.id("users"),
        role: v.union(v.literal("admin"), v.literal("member")),
        joinedAt: v.number(),
      })
    ),
  }),

  /* ================= EXPENSES ================= */
  expenses: defineTable({
    description: v.string(),
    amount: v.number(),
    category: v.string(),
    date: v.number(),

    paidByUserId: v.id("users"),
    splitType: v.string(),

    splits: v.array(
      v.object({
        userId: v.id("users"),
        amount: v.number(),
        paid: v.boolean(),
      })
    ),

    // null → individual, defined → group
    groupId: v.optional(v.id("groups")),

    // TEMP optional for backward compatibility
    expenseType: v.optional(
      v.union(v.literal("GROUP"), v.literal("INDIVIDUAL"))
    ),

    createdBy: v.id("users"),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["paidByUserId"])
    .index("by_date", ["date"])
    .index("by_user_and_group", ["paidByUserId", "groupId"]),

  /* ================= SETTLEMENTS ================= */
  settlements: defineTable({
    amount: v.number(),
    note: v.optional(v.string()),
    date: v.number(),

    paidByUserId: v.id("users"),
    receivedByUserId: v.id("users"),

    groupId: v.optional(v.id("groups")),

    relatedExpenseIds: v.optional(
      v.array(v.id("expenses"))
    ),

    createdBy: v.id("users"),
  })
    .index("by_group", ["groupId"])
    .index("by_user_and_group", ["paidByUserId", "groupId"])
    .index("by_receiver_and_group", ["receivedByUserId", "groupId"])
    .index("by_date", ["date"]),
});
