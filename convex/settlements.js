import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

/* ============================================================
   CREATE SETTLEMENT
============================================================ */
export const createSettlement = mutation({
  args: {
    amount: v.number(),
    note: v.optional(v.string()),
    paidByUserId: v.id("users"),
    receivedByUserId: v.id("users"),
    groupId: v.optional(v.id("groups")),
  },

  handler: async (ctx, args) => {
    const me = await ctx.runQuery(internal.users.getCurrentUser);
    if (!me) throw new Error("Not authenticated");

    if (args.amount <= 0) throw new Error("Amount must be positive");
    if (args.paidByUserId === args.receivedByUserId) {
      throw new Error("Cannot settle with yourself");
    }

    if (![args.paidByUserId, args.receivedByUserId].includes(me._id)) {
      throw new Error("You must be involved in the settlement");
    }

    if (args.groupId) {
      const group = await ctx.db.get(args.groupId);
      if (!group) throw new Error("Group not found");

      const members = group.members.map(m => m.userId);
      if (
        !members.includes(args.paidByUserId) ||
        !members.includes(args.receivedByUserId)
      ) {
        throw new Error("Both users must be group members");
      }
    }

    return ctx.db.insert("settlements", {
      amount: args.amount,
      note: args.note,
      date: Date.now(),
      paidByUserId: args.paidByUserId,
      receivedByUserId: args.receivedByUserId,
      groupId: args.groupId,
      createdBy: me._id,
    });
  },
});

/* ============================================================
   GROUP BALANCES (SINGLE SOURCE OF TRUTH)
============================================================ */
export const getGroupBalances = query({
  args: { groupId: v.id("groups") },

  handler: async (ctx, { groupId }) => {
    const me = await ctx.runQuery(internal.users.getCurrentUser);
    if (!me) throw new Error("Not authenticated");

    const group = await ctx.db.get(groupId);
    if (!group) throw new Error("Group not found");

    if (!group.members.some(m => m.userId === me._id)) {
      throw new Error("Access denied");
    }

    const memberIds = group.members.map(m => m.userId);

    // 1️⃣ init net balances
    const net = {};
    memberIds.forEach(id => (net[id] = 0));

    // 2️⃣ expenses
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", q => q.eq("groupId", groupId))
      .collect();

    for (const exp of expenses) {
      for (const split of exp.splits) {
        if (split.userId === exp.paidByUserId) continue;

        net[split.userId] -= split.amount;
        net[exp.paidByUserId] += split.amount;
      }
    }

    // 3️⃣ settlements
    const settlements = await ctx.db
      .query("settlements")
      .withIndex("by_group", q => q.eq("groupId", groupId))
      .collect();

    for (const s of settlements) {
      net[s.paidByUserId] -= s.amount;
      net[s.receivedByUserId] += s.amount;
    }

    // 4️⃣ attach user info
    const users = await Promise.all(memberIds.map(id => ctx.db.get(id)));

    return users.map(u => ({
      userId: u._id,
      name: u.name,
      imageUrl: u.imageUrl,
      totalBalance: net[u._id],
    }));
  },
});

/* ============================================================
   GET SETTLEMENT DATA (USED BY SETTLEMENT PAGE)
============================================================ */
export const getSettlementData = query({
  args: {
    id: v.union(v.id("groups"), v.id("users")),
    type: v.union(v.literal("group"), v.literal("person")),
  },

  handler: async (ctx, { id, type }) => {
    const me = await ctx.runQuery(internal.users.getCurrentUser);
    if (!me) throw new Error("Not authenticated");

    /* ================= GROUP ================= */
    if (type === "group") {
      const group = await ctx.db.get(id);
      if (!group) throw new Error("Group not found");

      if (!group.members.some(m => m.userId === me._id)) {
        throw new Error("Access denied");
      }

      const balances = await ctx.runQuery(
        api.settlements.getGroupBalances,
        { groupId: id }
      );

      const settlements = await ctx.db
        .query("settlements")
        .withIndex("by_group", q => q.eq("groupId", id))
        .collect();

      return {
        type: "group",
        group,
        balances,
        settlements,
      };
    }

    /* ================= PERSON ================= */
    const otherUser = await ctx.db.get(id);
    if (!otherUser) throw new Error("User not found");

    const settlements = await ctx.db.query("settlements").collect();

    const relevant = settlements.filter(
      s =>
        (s.paidByUserId === me._id && s.receivedByUserId === id) ||
        (s.paidByUserId === id && s.receivedByUserId === me._id)
    );

    return {
      type: "person",
      balances: [],
      settlements: relevant,
      user: otherUser,
    };
  },
});
