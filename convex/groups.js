import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/* ============================================================================
   GET GROUP BY ID
============================================================================ */

export const getById = query({
  args: {
    groupId: v.id("groups"),
  },

  handler: async (ctx, { groupId }) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if (!currentUser) throw new Error("Not authenticated");

    const group = await ctx.db.get(groupId);

    // ✅ FIX: return null instead of error
    if (!group) return null;

    if (!group.members.some((m) => m.userId === currentUser._id)) {
      throw new Error("Access denied");
    }

    return group;
  },
});

/* ============================================================================
   GET GROUPS OR SELECTED GROUP + MEMBERS
============================================================================ */

export const getGroupOrMembers = query({
  args: {
    groupId: v.optional(v.id("groups")),
  },

  handler: async (ctx, { groupId }) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if (!currentUser) throw new Error("Not authenticated");

    const allGroups = await ctx.db.query("groups").collect();

    const userGroups = allGroups.filter((g) =>
      g.members.some((m) => m.userId === currentUser._id)
    );

    if (!groupId) {
      return {
        selectedGroup: null,
        groups: userGroups.map((g) => ({
          id: g._id,
          name: g.name,
          memberCount: g.members.length,
        })),
      };
    }

    const group = userGroups.find((g) => g._id === groupId);

    // ✅ FIX: return null instead of error
    if (!group) return null;

    const members = (
      await Promise.all(
        group.members.map(async (m) => {
          const u = await ctx.db.get(m.userId);
          if (!u) return null;

          return {
            userId: u._id,
            name: u.name,
            imageUrl: u.imageUrl,
            role: m.role,
          };
        })
      )
    ).filter(Boolean);

    return {
      selectedGroup: {
        id: group._id,
        name: group.name,
        members,
      },
      groups: userGroups.map((g) => ({
        id: g._id,
        name: g.name,
        memberCount: g.members.length,
      })),
    };
  },
});

/* ============================================================================
   GET GROUP EXPENSES + BALANCES
============================================================================ */

export const getGroupExpenses = query({
  args: {
    groupId: v.id("groups"),
  },

  handler: async (ctx, { groupId }) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if (!currentUser) throw new Error("Not authenticated");

    const group = await ctx.db.get(groupId);

    // ✅ FIX: prevent crash after delete
    if (!group) return null;

    if (!group.members.some((m) => m.userId === currentUser._id)) {
      throw new Error("You are not a member of this group");
    }

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    const settlements = await ctx.db
      .query("settlements")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    const memberDetails = (
      await Promise.all(
        group.members.map(async (m) => {
          const u = await ctx.db.get(m.userId);
          if (!u) return null;

          return {
            id: u._id,
            name: u.name,
            imageUrl: u.imageUrl,
            role: m.role,
          };
        })
      )
    ).filter(Boolean);

    const ids = memberDetails.map((m) => m.id);

    const totals = Object.fromEntries(ids.map((id) => [id, 0]));
    const ledger = {};

    ids.forEach((a) => {
      ledger[a] = {};
      ids.forEach((b) => {
        if (a !== b) ledger[a][b] = 0;
      });
    });

    for (const exp of expenses) {
      const payer = exp.paidByUserId;

      for (const split of exp.splits) {
        if (split.userId === payer || split.paid) continue;

        const debtor = split.userId;
        const amt = split.amount;

        totals[payer] += amt;
        totals[debtor] -= amt;

        ledger[debtor][payer] += amt;
      }
    }

    for (const s of settlements) {
      totals[s.paidByUserId] += s.amount;
      totals[s.receivedByUserId] -= s.amount;

      ledger[s.paidByUserId][s.receivedByUserId] -= s.amount;
    }

    ids.forEach((a) => {
      ids.forEach((b) => {
        if (a >= b) return;

        const diff = ledger[a][b] - ledger[b][a];

        if (diff > 0) {
          ledger[a][b] = diff;
          ledger[b][a] = 0;
        } else if (diff < 0) {
          ledger[b][a] = -diff;
          ledger[a][b] = 0;
        } else {
          ledger[a][b] = 0;
          ledger[b][a] = 0;
        }
      });
    });

    const balances = memberDetails.map((m) => ({
      ...m,
      totalBalance: totals[m.id],
      owes: Object.entries(ledger[m.id])
        .filter(([, amount]) => amount > 0)
        .map(([to, amount]) => ({ to, amount })),
      owedBy: ids
        .filter((other) => ledger[other][m.id] > 0)
        .map((other) => ({
          from: other,
          amount: ledger[other][m.id],
        })),
    }));

    const userLookupMap = {};
    memberDetails.forEach((m) => {
      userLookupMap[m.id] = m;
    });

    return {
      group: {
        id: group._id,
        name: group.name,
        description: group.description,
      },
      members: memberDetails,
      expenses,
      settlements,
      balances,
      userLookupMap,
    };
  },
});

/* ============================================================================
   DELETE GROUP (ADMIN ONLY)
============================================================================ */

export const deleteGroup = mutation({
  args: {
    groupId: v.id("groups"),
  },

  handler: async (ctx, { groupId }) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) throw new Error("Not authenticated");

    const group = await ctx.db.get(groupId);
    if (!group) throw new Error("Group not found");

    const isAdmin = group.members.some(
      (m) => m.userId === user._id && m.role === "admin"
    );

    if (!isAdmin) {
      throw new Error("Only admin can delete group");
    }

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    for (const e of expenses) {
      await ctx.db.delete(e._id);
    }

    const settlements = await ctx.db
      .query("settlements")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    for (const s of settlements) {
      await ctx.db.delete(s._id);
    }

    await ctx.db.delete(groupId);

    return { success: true };
  },
});