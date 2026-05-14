import { query } from "./_generated/server";
import { v } from "convex/values";

/* =========================
   GET USER BALANCES
========================= */
export const getUserBalances = query({
  args: {
    currentUserId: v.id("users"),
  },
  handler: async (ctx, { currentUserId }) => {
    const user = await ctx.db.get(currentUserId);
    if (!user) {
      return {
        youOwe: 0,
        youAreOwed: 0,
        totalBalance: 0,
        oweDetails: {
          youOwe: [],
          youAreOwedBy: [],
        },
      };
    }

    const expenses = (await ctx.db.query("expenses").collect()).filter(
      (e) =>
        !e.groupId &&
        (e.paidByUserId === user._id ||
          e.splits.some((s) => s.userId === user._id))
    );

    let youOwe = 0;
    let youAreOwed = 0;
    const balanceByUser = {};

    for (const e of expenses) {
      const isPayer = e.paidByUserId === user._id;
      const mySplit = e.splits.find((s) => s.userId === user._id);

      if (isPayer) {
        for (const s of e.splits) {
          if (s.userId === user._id || s.paid) continue;
          youAreOwed += s.amount;
          (balanceByUser[s.userId] ??= { owed: 0, owing: 0 }).owed += s.amount;
        }
      } else if (mySplit && !mySplit.paid) {
        youOwe += mySplit.amount;
        (balanceByUser[e.paidByUserId] ??= { owed: 0, owing: 0 }).owing +=
          mySplit.amount;
      }
    }

    const settlements = (await ctx.db.query("settlements").collect()).filter(
      (s) =>
        !s.groupId &&
        (s.paidByUserId === user._id ||
          s.receivedByUserId === user._id)
    );

    for (const s of settlements) {
      if (s.paidByUserId === user._id) {
        youOwe -= s.amount;
        (balanceByUser[s.receivedByUserId] ??= { owed: 0, owing: 0 }).owing -=
          s.amount;
      } else {
        youAreOwed -= s.amount;
        (balanceByUser[s.paidByUserId] ??= { owed: 0, owing: 0 }).owed -=
          s.amount;
      }
    }

    const youOweList = [];
    const youAreOwedByList = [];

    for (const [uid, { owed, owing }] of Object.entries(balanceByUser)) {
      const net = owed - owing;
      if (net === 0) continue;

      const counterpart = await ctx.db.get(uid);
      const base = {
        userId: uid,
        name: counterpart?.name ?? "Unknown",
        imageUrl: counterpart?.imageUrl,
        amount: Math.abs(net),
      };

      net > 0
        ? youAreOwedByList.push(base)
        : youOweList.push(base);
    }

    return {
      youOwe: Math.max(0, youOwe),
      youAreOwed: Math.max(0, youAreOwed),
      totalBalance: youAreOwed - youOwe,
      oweDetails: {
        youOwe: youOweList,
        youAreOwedBy: youAreOwedByList,
      },
    };
  },
});



/* =========================
   TOTAL SPENT (YEAR)
========================= */
export const getTotalSpent = query({
  args: { currentUserId: v.id("users") },
  handler: async (ctx, { currentUserId }) => {
    const user = await ctx.db.get(currentUserId);
    if (!user) return 0;

    const year = new Date().getFullYear();
    const start = new Date(year, 0, 1).getTime();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) => q.gte("date", start))
      .collect();

    let total = 0;
    for (const e of expenses) {
      const split = e.splits.find((s) => s.userId === user._id);
      if (split) total += split.amount;
    }

    return total;
  },
});

/* =========================
   MONTHLY SPENDING (GRAPH)
========================= */
export const getMonthlySpending = query({
  args: { currentUserId: v.id("users") },
  handler: async (ctx, { currentUserId }) => {
    const user = await ctx.db.get(currentUserId);
    if (!user) return [];

    const year = new Date().getFullYear();
  const monthNames = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

const months = Array.from({ length: 12 }, (_, i) => ({
  month: monthNames[i], // ✅ FIX
  total: 0,
}));

    const start = new Date(year, 0, 1).getTime();
    const end = new Date(year + 1, 0, 1).getTime();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) => q.gte("date", start).lt("date", end))
      .collect();

    for (const e of expenses) {
      const split = e.splits.find((s) => s.userId === user._id);
      if (!split) continue;
      const month = new Date(e.date).getMonth();
      months[month].total += split.amount;
    }

    return months;
  },
});

/* =========================
   USER GROUPS + BALANCE
========================= */
export const getUserGroups = query({
  args: { currentUserId: v.id("users") },
  handler: async (ctx, { currentUserId }) => {
    const user = await ctx.db.get(currentUserId);
    if (!user) return [];

    const groups = (await ctx.db.query("groups").collect()).filter((g) =>
      g.members.some((m) => m.userId === user._id)
    );

    const result = [];

    for (const g of groups) {
      const expenses = await ctx.db
        .query("expenses")
        .withIndex("by_group", (q) => q.eq("groupId", g._id))
        .collect();

      let balance = 0;

      for (const e of expenses) {
        if (e.paidByUserId === user._id) {
          for (const s of e.splits) {
            if (s.userId !== user._id && !s.paid) {
              balance += s.amount;
            }
          }
        } else {
          const mySplit = e.splits.find(
            (s) => s.userId === user._id && !s.paid
          );
          if (mySplit) balance -= mySplit.amount;
        }
      }

      result.push({
        id: g._id,
        name: g.name,
        description: g.description,
        balance,
      });
    }

    return result;
  },
});
