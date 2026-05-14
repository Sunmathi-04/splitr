"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

export function SplitSelector({
  type,
  amount,
  participants,
  paidByUserId,
  onSplitsChange,
}) {
  const [splits, setSplits] = useState([]);
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  /* ---------------- Initialize splits safely ---------------- */
  useEffect(() => {
    if (!amount || amount <= 0 || participants.length === 0) return;
    if (splits.length === participants.length) return;

    let newSplits = [];

    /* ========= EQUAL (FIXED) ========= */
    if (type === "equal") {
      const totalPaise = Math.round(amount * 100);
      const count = participants.length;
      const basePaise = Math.floor(totalPaise / count);
      const remainderPaise = totalPaise - basePaise * count;

      newSplits = participants.map((p, index) => {
        let paise = basePaise;
        if (index === count - 1) paise += remainderPaise;

        return {
          userId: p.userId,
          name: p.name,
          email: p.email,
          imageUrl: p.imageUrl,
          amount: paise / 100,
          percentage: (paise / totalPaise) * 100,
          paid: p.userId === paidByUserId,
        };
      });
    }

    /* ========= PERCENTAGE ========= */
    /* ========= PERCENTAGE (FIXED) ========= */
if (type === "percentage") {
  const totalPaise = Math.round(amount * 100);

  let usedPaise = 0;

  newSplits = participants.map((p, index) => {
    let paise =
      index === participants.length - 1
        ? totalPaise - usedPaise
        : Math.round((totalPaise * (100 / participants.length)) / 100);

    usedPaise += paise;

    return {
      userId: p.userId,
      name: p.name,
      email: p.email,
      imageUrl: p.imageUrl,
      amount: paise / 100,
      percentage: (paise / totalPaise) * 100,
      paid: p.userId === paidByUserId,
    };
  });
}

/* ========= EXACT (FIXED) ========= */
if (type === "exact") {
  const totalPaise = Math.round(amount * 100);
  const evenPaise = Math.floor(totalPaise / participants.length);

  let usedPaise = 0;

  newSplits = participants.map((p, index) => {
    let paise =
      index === participants.length - 1
        ? totalPaise - usedPaise
        : evenPaise;

    usedPaise += paise;

    return {
      userId: p.userId,
      name: p.name,
      email: p.email,
      imageUrl: p.imageUrl,
      amount: paise / 100,
      percentage: (paise / totalPaise) * 100,
      paid: p.userId === paidByUserId,
    };
  });
}



    setSplits(newSplits);
  }, [type, participants, amount, paidByUserId, splits.length]);

  /* ---------------- Recalculate totals ---------------- */
  
 useEffect(() => {
  if (
    splits.length === 0 ||
    splits.some((s) => !s.userId)
  ) {
    return; // ✅ DO NOT emit invalid splits
  }

  const totalAmt = splits.reduce((s, x) => s + x.amount, 0);
  const totalPct = splits.reduce((s, x) => s + x.percentage, 0);

  setTotalAmount(totalAmt);
  setTotalPercentage(totalPct);

  onSplitsChange?.(splits);
}, [splits, onSplitsChange]);

  /* ---------------- Update percentage ---------------- */
  const updatePercentageSplit = (userId, pct) => {
    setSplits((prev) =>
      prev.map((s) =>
        s.userId === userId
          ? {
              ...s,
              percentage: pct,
              amount: (amount * pct) / 100,
            }
          : s
      )
    );
  };

  /* ---------------- Update exact amount ---------------- */
  const updateExactSplit = (userId, value) => {
    const amt = parseFloat(value) || 0;

    setSplits((prev) =>
      prev.map((s) =>
        s.userId === userId
          ? {
              ...s,
              amount: amt,
              percentage: amount > 0 ? (amt / amount) * 100 : 0,
            }
          : s
      )
    );
  };

  const isAmountValid = Math.abs(totalAmount - amount) < 0.01;
  const isPercentageValid = Math.abs(totalPercentage - 100) < 0.01;

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-4 mt-4">
      {splits.map((split, index) => (
        <div key={`${split.userId}-${index}`} className="flex items-center gap-4">
          <div className="flex items-center gap-2 min-w-[120px]">
            <Avatar className="h-7 w-7">
              <AvatarImage src={split.imageUrl} />
              <AvatarFallback>{split.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">
              {split.userId === paidByUserId ? "You" : split.name}
            </span>
          </div>

          {type === "equal" && (
            <div className="text-sm">
              ${split.amount.toFixed(2)} ({split.percentage.toFixed(1)}%)
            </div>
          )}

          {type === "percentage" && (
            <div className="flex items-center gap-3 flex-1">
              <Slider
                value={[split.percentage]}
                min={0}
                max={100}
                step={1}
                onValueChange={([v]) =>
                  updatePercentageSplit(split.userId, v)
                }
              />
              <Input
                type="number"
                value={split.percentage.toFixed(1)}
                onChange={(e) =>
                  updatePercentageSplit(
                    split.userId,
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-16 h-8"
              />
              <span>${split.amount.toFixed(2)}</span>
            </div>
          )}

          {type === "exact" && (
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="number"
                step="0.01"
                value={split.amount.toFixed(2)}
                onChange={(e) =>
                  updateExactSplit(split.userId, e.target.value)
                }
                className="w-24 h-8"
              />
              <span className="text-sm text-muted-foreground">
                ({split.percentage.toFixed(1)}%)
              </span>
            </div>
          )}
        </div>
      ))}

      <div className="flex justify-between border-t pt-3">
        <span>Total</span>
        <span
          className={`font-medium ${
            !isAmountValid || !isPercentageValid
              ? "text-amber-600"
              : ""
          }`}
        >
          ${totalAmount.toFixed(2)}{" "}
          {type !== "equal" && `(${totalPercentage.toFixed(1)}%)`}
        </span>
      </div>
    </div>
  );
}
