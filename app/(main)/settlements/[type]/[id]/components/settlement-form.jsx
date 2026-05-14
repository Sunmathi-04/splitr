"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

/* ---------------- Schema ---------------- */

const settlementSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(val) && Number(val) > 0, {
      message: "Amount must be greater than 0",
    }),
  note: z.string().optional(),
  paymentType: z.enum(["youPaid", "theyPaid"]),
});

/* ---------------- Component ---------------- */

export default function SettlementForm({ entityType, entityData, onSuccess }) {
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const createSettlement = useConvexMutation(
    api.settlements.createSettlement
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      amount: "",
      note: "",
      paymentType: "youPaid",
    },
  });

  const paymentType = watch("paymentType");
  const [selectedGroupMemberId, setSelectedGroupMemberId] = useState(null);

  if (!currentUser || !entityData) return null;

  /* ---------------- USER SETTLEMENT ---------------- */

  const handleUserSettlement = async (formData) => {
    const otherUser = entityData.user || entityData.counterpart;
    if (!otherUser) {
      toast.error("Invalid settlement target");
      return;
    }

    const amount = Number(formData.amount);

    const paidByUserId =
      formData.paymentType === "youPaid"
        ? currentUser._id
        : otherUser._id;

    const receivedByUserId =
      formData.paymentType === "youPaid"
        ? otherUser._id
        : currentUser._id;

    await createSettlement.mutate({
      amount,
      note: formData.note,
      paidByUserId,
      receivedByUserId,
    });

    toast.success("Settlement recorded");
    onSuccess?.();
  };

  /* ---------------- GROUP SETTLEMENT ---------------- */

  const handleGroupSettlement = async (formData) => {
    if (!selectedGroupMemberId) {
      toast.error("Please select a group member");
      return;
    }

    const amount = Number(formData.amount);

    const paidByUserId =
      formData.paymentType === "youPaid"
        ? currentUser._id
        : selectedGroupMemberId;

    const receivedByUserId =
      formData.paymentType === "youPaid"
        ? selectedGroupMemberId
        : currentUser._id;

    await createSettlement.mutate({
      amount,
      note: formData.note,
      paidByUserId,
      receivedByUserId,
      groupId: entityData.group._id,
    });

    toast.success("Settlement recorded");
    onSuccess?.();
  };

  /* ---------------- SUBMIT ---------------- */

  const onSubmit = async (formData) => {
    try {
      if (entityType === "group") {
        await handleGroupSettlement(formData);
      } else {
        await handleUserSettlement(formData);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to record settlement");
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* GROUP MEMBER SELECT */}
      {entityType === "group" && (
        <>
          <Label>Select a member</Label>

          {(entityData.balances ?? []).length === 0 ? (
            <div className="text-muted-foreground text-sm">
              No balances found
            </div>
          ) : (
            (entityData.balances ?? [])
              .filter((m) => (m.id || m.userId) !== currentUser._id)
              .map((member) => {
                const memberId = member.id || member.userId;

                return (
                  <div
                    key={memberId}
                    onClick={() => setSelectedGroupMemberId(memberId)}
                    className={`border p-3 rounded-md cursor-pointer ${
                      selectedGroupMemberId === memberId
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{member.name}</span>

                      {member.totalBalance > 0 && (
                        <span className="text-green-600">
                          They owe you ${member.totalBalance.toFixed(2)}
                        </span>
                      )}

                      {member.totalBalance < 0 && (
                        <span className="text-red-600">
                          You owe ${Math.abs(member.totalBalance).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </>
      )}

      {/* WHO PAID */}
      <Label>Who paid?</Label>
      <RadioGroup
        value={paymentType}
        onValueChange={(v) => setValue("paymentType", v)}
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="youPaid" />
          <span>You paid</span>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="theyPaid" />
          <span>They paid</span>
        </div>
      </RadioGroup>

      {/* AMOUNT */}
      <Input
        type="number"
        step="0.01"
        placeholder="Amount"
        {...register("amount")}
      />

      {/* NOTE */}
      <Textarea placeholder="Optional note" {...register("note")} />

      {/* BUTTON */}
      <Button
        type="submit"
        className="w-full"
        disabled={
          isSubmitting ||
          (entityType === "group" && !selectedGroupMemberId)
        }
      >
        {isSubmitting ? "Recording..." : "Record settlement"}
      </Button>
    </form>
  );
}