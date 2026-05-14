import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/* =========================
   GET ALL CONTACTS
========================= */

export const getAllContacts = query({
  args: {
    currentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db.get(args.currentUserId);

    if (!currentUser) {
      return { users: [], groups: [] };
    }

    // rest of your existing code stays the same


    /* =========================
       Personal expenses
    ========================= */
    const expensesYouPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) =>
        q.eq("paidByUserId", currentUser._id).eq("groupId", undefined)
      )
      .collect();

    const expensesNotPaidByYou = (
      await ctx.db
        .query("expenses")
        .withIndex("by_group", (q) => q.eq("groupId", undefined))
        .collect()
    ).filter(
      (e) =>
        e.paidByUserId !== currentUser._id &&
        e.splits.some((s) => s.userId === currentUser._id)
    );

    const personalExpenses = [
      ...expensesYouPaid,
      ...expensesNotPaidByYou,
    ];

    /* =========================
       Collect contact users
    ========================= */
    const contactIds = new Set();

    personalExpenses.forEach((exp) => {
      if (exp.paidByUserId !== currentUser._id) {
        contactIds.add(exp.paidByUserId);
      }

      exp.splits.forEach((s) => {
        if (s.userId !== currentUser._id) {
          contactIds.add(s.userId);
        }
      });
    });

    const contactUsers = (
      await Promise.all(
        [...contactIds].map(async (id) => {
          const u = await ctx.db.get(id);
     return u
  ? {
      _id: u._id,          // ✅ MUST be _id
      name: u.name,
      email: u.email,
      imageUrl: u.imageUrl,
      type: "user",
    }
  : null;

        })
      )
    ).filter(Boolean);

    /* =========================
       Groups user belongs to
    ========================= */
    const userGroups = (await ctx.db.query("groups").collect())
      .filter((g) =>
        g.members.some((m) => m.userId === currentUser._id)
      )
      .map((g) => ({
        id: g._id,
        name: g.name,
        description: g.description,
        type: "group",
      }));

    /* =========================
       Sort & return
    ========================= */
    contactUsers.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    userGroups.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return {
      users: contactUsers,
      groups: userGroups,
    };
  },
});

/* =========================
   CREATE GROUP
========================= */
export const createGroup = mutation({
  args: {
    createdBy: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    members: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("groups", {
      name: args.name,
      description: args.description ?? "",
      createdBy: args.createdBy,
      members: [...new Set([...args.members, args.createdBy])].map((id) => ({
        userId: id,
        role: id === args.createdBy ? "admin" : "member",
        joinedAt: Date.now(),
      })),
    });
  },
});
