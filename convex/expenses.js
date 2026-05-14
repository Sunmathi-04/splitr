import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/* =====================================================
   CREATE EXPENSE
===================================================== */

export const createExpense = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    category: v.string(),
    date: v.number(),
    expenseType: v.union(
      v.literal("GROUP"),
      v.literal("INDIVIDUAL")
    ),
    paidByUserId: v.id("users"),
    splitType: v.string(),
    splits: v.array(
      v.object({
        userId: v.id("users"),
        amount: v.number(),
        paid: v.boolean(),
      })
    ),
    groupId: v.optional(v.id("groups")),
  },

  handler: async (ctx, args) => {
    const user = await ctx.runQuery("users:getCurrentUser");
    if (!user) throw new Error("Not authenticated");

    /* -------------------------------
       Build expense document
    -------------------------------- */
    const expense = {
      description: args.description,
      amount: args.amount,
      category: args.category,
      date: args.date,
      expenseType: args.expenseType,
      paidByUserId: args.paidByUserId,
      splitType: args.splitType,
      splits: args.splits,          // ✅ REQUIRED FIELD
      createdBy: user._id,
    };

    // ✅ Enforce correct rule
    if (args.expenseType === "GROUP") {
      if (!args.groupId) {
        throw new Error("groupId is required for group expenses");
      }
      expense.groupId = args.groupId;
    }

    // ❌ INDIVIDUAL → no groupId added

    const expenseId = await ctx.db.insert("expenses", expense);

    return expenseId;
  },
});

/* =====================================================
   GET EXPENSES BETWEEN USERS (INDIVIDUAL ONLY)
===================================================== */

export const getExpensesBetweenUsers = query({
  args: {
    userId: v.id("users"),
    otherUserId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const currentUser = await ctx.runQuery("users:getCurrentUser");
    if (!currentUser) return null;
    if (args.userId !== currentUser._id) return null;

    const otherUser = await ctx.db.get(args.otherUserId);
    if (!otherUser) return null;

    const expenses = await ctx.db
      .query("expenses")
      .filter((q) =>
        q.and(
          q.eq(q.field("expenseType"), "INDIVIDUAL"),
          q.or(
            q.eq(q.field("createdBy"), args.userId),
            q.eq(q.field("createdBy"), args.otherUserId)
          )
        )
      )
      .collect();

    let balance = 0;

    for (const expense of expenses) {
      for (const split of expense.splits) {
        if (split.userId === args.otherUserId && !split.paid) {
          balance += split.amount;
        }
        if (split.userId === args.userId && !split.paid) {
          balance -= split.amount;
        }
      }
    }


    
    return {
      otherUser,
      expenses,
      settlements: [],
      balance,
    };
  },
});
/* =====================================================
   DELETE EXPENSE
===================================================== */

export const deleteExpense = mutation({
  args: {
    id: v.id("expenses"),
  },

  handler: async (ctx, args) => {
    const user = await ctx.runQuery("users:getCurrentUser");
    if (!user) throw new Error("Not authenticated");

    const expense = await ctx.db.get(args.id);
    if (!expense) throw new Error("Expense not found");

    // Optional: Only creator can delete
    if (expense.createdBy !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});
