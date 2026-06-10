"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { SplitSelector } from "./split-selector";
import { GroupSelector } from "./group-selector";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";

import { useUser } from "@clerk/nextjs";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { toast } from "sonner";

/* ================== Schema ================== */

const expenseSchema = z.object({
  description: z.string().min(1, "Description required"),
  amount: z.string().min(1, "Amount required"),
  category: z.string().optional(),
  date: z.date(),
  paidByUserId: z.string(),
  splitType: z.enum(["equal", "percentage", "exact"]),
});

/* ================== Component ================== */

export function ExpenseForm({ type = "individual", onSuccess }) {
  const [participants, setParticipants] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  /* ================== AUTH ================== */

  const { isLoaded, isSignedIn } = useUser();

  /* ================== USER DATA ================== */

  const { data: currentUser } = useConvexQuery(
    api.users.getCurrentUser,
    isLoaded && isSignedIn ? {} : "skip"
  );

  const { data: users, isLoading: usersLoading } = useConvexQuery(
    api.users.getAllUsers,
    isLoaded && isSignedIn ? {} : "skip"
  );

  // USER LOOKUP MAP
  const userMap = useMemo(() => {
    if (!users) return {};
    return Object.fromEntries(users.map((u) => [u._id, u]));
  }, [users]);

  const otherUsers = useMemo(() => {
    if (!users || !currentUser) return [];
    return users.filter((u) => u._id !== currentUser._id);
  }, [users, currentUser]);

  const { data: fullGroup } = useConvexQuery(
    api.groups.getById,
    selectedGroup?._id ? { groupId: selectedGroup._id } : "skip"
  );

  const createExpense = useConvexMutation(api.expenses.createExpense);

  /* ================== FORM ================== */

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      date: new Date(),
      splitType: "equal",
    },
  });

  const amountValue = Number(watch("amount")) || 0;
  const paidByUserId = watch("paidByUserId");

  /* ================== PARTICIPANTS ================== */

  useEffect(() => {
    if (!currentUser) return;

    if (type === "group" && fullGroup?.members?.length) {
      const groupParticipants = fullGroup.members.map((m) => ({
        userId: m.userId,
        name: userMap[m.userId]?.name ?? "Member",
      }));

      setParticipants(groupParticipants);

      const payer =
        groupParticipants.find((p) => p.userId === currentUser._id) ??
        groupParticipants[0];

      setValue("paidByUserId", payer.userId);
      return;
    }

    if (type === "individual" && selectedPersonId) {
      const other = userMap[selectedPersonId];
      if (!other) return;

      setParticipants([
        { userId: currentUser._id, name: "You" },
        { userId: other._id, name: other.name },
      ]);

      setValue("paidByUserId", currentUser._id);
    }
  }, [
    type,
    fullGroup,
    currentUser,
    selectedPersonId,
    userMap,
    setValue,
  ]);

  /* ================== LOADING ================== */

  if (!isLoaded || !isSignedIn || usersLoading) {
    return <div className="p-6">Loading...</div>;
  }

  /* ================== SUBMIT ================== */

  const onSubmit = async (data) => {
    if (type === "group" && !selectedGroup) {
      toast.error("Please select a group");
      return;
    }

    if (type === "individual" && !selectedPersonId) {
      toast.error("Please select a person");
      return;
    }

    if (type === "individual" && participants.length !== 2) {
      toast.error("Individual expense must have exactly 2 people");
      return;
    }

    const amount = Number(data.amount);
    const count = participants.length;

    const totalPaise = Math.round(amount * 100);
    const basePaise = Math.floor(totalPaise / count);

    let usedPaise = 0;

    const splits = participants.map((p, index) => {
      const paise =
        index === count - 1
          ? totalPaise - usedPaise
          : basePaise;

      usedPaise += paise;

      return {
        userId: p.userId,
        amount: paise / 100,
        paid: p.userId === data.paidByUserId,
      };
    });

    try {
      await createExpense.mutate({
        description: data.description,
        amount,
        category: data.category || "other",
        date: selectedDate.getTime(),
        expenseType:
          type === "group" ? "GROUP" : "INDIVIDUAL",
        paidByUserId: data.paidByUserId,
        splitType: data.splitType,
        splits,
        ...(type === "group"
          ? { groupId: selectedGroup._id }
          : {}),
      });

      toast.success("Expense created successfully");

      reset();
      setParticipants([]);
      setSelectedPersonId(null);
      setSelectedGroup(null);

    if (type === "individual") {
  onSuccess?.(selectedPersonId);
} else {
  onSuccess?.(selectedGroup?._id);
}
    } catch {
      toast.error("Failed to create expense");
    }
  };

  /* ================== UI ================== */

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <Label>Description</Label>
      <Input {...register("description")} />

      <Label>Amount</Label>
      <Input
        type="number"
        step="0.01"
        {...register("amount")}
      />

      <Label>Category</Label>

      <select
        className="w-full border p-2 rounded-md"
        onChange={(e) =>
          setValue("category", e.target.value, {
            shouldDirty: true,
          })
        }
      >
        <option value="">Select category</option>
        <option value="food">Food</option>
        <option value="travel">Travel</option>
        <option value="shopping">Shopping</option>
        <option value="entertainment">
          Entertainment
        </option>
        <option value="bills">Bills</option>
        <option value="other">Other</option>
      </select>

      <Label>Date</Label>

      <Input
        type="date"
        value={selectedDate
          .toISOString()
          .split("T")[0]}
        onChange={(e) => {
          const date = new Date(e.target.value);
          setSelectedDate(date);
          setValue("date", date);
        }}
      />

      {type === "group" && (
        <>
          <Label>Group</Label>
          <GroupSelector onChange={setSelectedGroup} />
        </>
      )}

      {type === "individual" && (
        <>
          <Label>With</Label>

          <select
            className="w-full border p-2"
            value={selectedPersonId ?? ""}
            onChange={(e) =>
              setSelectedPersonId(e.target.value)
            }
          >
            <option value="">
              Select a person
            </option>

            {otherUsers.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </>
      )}

      <Label>Paid by</Label>

      <select
        {...register("paidByUserId")}
        className="w-full border p-2"
      >
        {participants.map((p) => (
          <option key={p.userId} value={p.userId}>
            {p.userId === currentUser?._id
              ? "You"
              : p.name}
          </option>
        ))}
      </select>

      <Tabs
        defaultValue="equal"
        onValueChange={(v) =>
          setValue("splitType", v)
        }
      >
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="equal">
            Equal
          </TabsTrigger>

          <TabsTrigger value="percentage">
            Percentage
          </TabsTrigger>

          <TabsTrigger value="exact">
            Exact
          </TabsTrigger>
        </TabsList>

        {["equal", "percentage", "exact"].map((t) => (
          <TabsContent key={t} value={t}>
            <SplitSelector
              type={t}
              amount={amountValue}
              participants={participants}
              paidByUserId={paidByUserId}
              onSplitsChange={() => {}}
            />
          </TabsContent>
        ))}
      </Tabs>

      <Button
        type="submit"
        disabled={isSubmitting}
      >
        Create Expense
      </Button>
    </form>
  );
}