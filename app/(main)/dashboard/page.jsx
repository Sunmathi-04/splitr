"use client";

import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { useUser } from "@clerk/nextjs"; // ✅ only once
import { BarLoader } from "react-spinners";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import Link from "next/link";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, ChevronRight } from "lucide-react";

import { ExpenseSummary } from "./components/expense-summary";
import { BalanceSummary } from "./components/balance-summary";
import { GroupList } from "./components/group-list";

export default function Dashboard() {
  /* ───────── AUTH ───────── */
 const { isLoaded, isSignedIn } = useUser();
const router = useRouter();

useEffect(() => {
  if (isLoaded && !isSignedIn) {
    router.replace("/sign-in");
  }
}, [isLoaded, isSignedIn, router]);


  /* ───────── CURRENT USER ───────── */
  const currentUser = useConvexQuery(api.users.getCurrentUser);
  const userId = currentUser.data?._id;

  /* ───────── DASHBOARD DATA ───────── */
  const balances = useConvexQuery(
  api.dashboard.getUserBalances,
  userId ? { currentUserId: userId } : "skip"
);


  const groups = useConvexQuery(
    api.dashboard.getUserGroups,
    userId ? { currentUserId: userId } : "skip"
  );

  const totalSpent = useConvexQuery(
    api.dashboard.getTotalSpent,
    userId ? { currentUserId: userId } : "skip"
  );

  const monthlySpending = useConvexQuery(
    api.dashboard.getMonthlySpending,
    userId ? { currentUserId: userId } : "skip"
  );

  /* ───────── LOADING ───────── */
  if (
    !isLoaded ||
    currentUser.isLoading ||
    balances.isLoading ||
    groups.isLoading ||
    totalSpent.isLoading ||
    monthlySpending.isLoading
  ) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width="100%" />
      </div>
    );
  }

  if (!currentUser.data) {
    return (
      <div className="container mx-auto py-24 text-center">
        <h2 className="text-2xl font-semibold">
          Setting up your account…
        </h2>
      </div>
    );
  }

  const {
    totalBalance = 0,
    youAreOwed = 0,
    youOwe = 0,
  } = balances.data ?? {};

  /* ───────── UI ───────── */
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-5xl gradient-title">Dashboard</h1>
        <Button asChild>
          <Link href="/expenses/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add expense
          </Link>
        </Button>
      </div>

      {/* BALANCE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalBalance.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              You are owed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${youAreOwed.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              You owe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${youOwe.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ExpenseSummary
            monthlySpending={monthlySpending.data}
            totalSpent={totalSpent.data}
          />
        </div>

        <div className="space-y-6">
          {/* BALANCE DETAILS */}
          <Card>
            <CardHeader className="pb-3 flex flex-row justify-between">
              <CardTitle>Balance Details</CardTitle>
              <Button variant="link" asChild>
                <Link href="/contacts">
                  View all <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
          <BalanceSummary balances={balances.data} />



            </CardContent>
          </Card>

          {/* GROUPS */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Your Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupList groups={groups.data} />
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/contacts?createGroup=true">
                  <Users className="mr-2 h-4 w-4" />
                  Create new group
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
