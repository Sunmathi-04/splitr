"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function ExpenseSummary({ monthlySpending, totalSpent }) {
  const monthNames = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];

  // ✅ FIX 1: Ensure array
  const safeMonthlySpending = Array.isArray(monthlySpending)
    ? monthlySpending
    : [];

  // Format monthly data for chart
  const chartData = safeMonthlySpending.map((item) => ({
  name: item.month,     // ✅ already correct
  amount: item.total,   // ✅ already correct
}));

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // ✅ FIX 2: Safe current month total
  const currentMonthTotal =
    safeMonthlySpending[currentMonth]?.total ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Summary</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Total this month
            </p>
            <h3 className="text-2xl font-bold mt-1">
              ${currentMonthTotal.toFixed(2)}
            </h3>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Total this year
            </p>
            <h3 className="text-2xl font-bold mt-1">
             ${Number(totalSpent?.total ?? totalSpent ?? 0).toFixed(2)}

            </h3>
          </div>
        </div>
<div className="w-full min-h-[300px] mt-6">
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={chartData}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      
     <XAxis dataKey="name" />     // ✅ FIX

      <YAxis />
      
      <Tooltip
        formatter={(value) => [`$${value.toFixed(2)}`, "Amount"]}
        labelFormatter={() => "Spending"}
      />

      <Bar dataKey="amount" fill="#36d7b7" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
</div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Monthly spending for {currentYear}
        </p>
      </CardContent>
    </Card>
  );
}
