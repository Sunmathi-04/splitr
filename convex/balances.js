import { query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const getGroupBalances = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) throw new Error("Not authenticated");

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    const settlements = await ctx.db
      .query("settlements")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

      
    const balances = {};

    // Initialize balances
    for (const exp of expenses) {
      for (const split of exp.splits) {
        balances[split.userId] ??= 0;
      }
      balances[exp.paidByUserId] ??= 0;
    }

    // Apply expenses
    for (const exp of expenses) {
      for (const split of exp.splits) {
        if (split.userId !== exp.paidByUserId) {
          balances[split.userId] -= split.amount;
          balances[exp.paidByUserId] += split.amount;
        }
      }
    }

    // Apply settlements
    for (const s of settlements) {
      balances[s.paidByUserId] -= s.amount;
      balances[s.receivedByUserId] += s.amount;
    }

    return balances;
  },
});
