"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { api } from "@/convex/_generated/api";
import {
  useConvexQuery,
  useConvexMutation,
} from "@/hooks/use-convex-query";

import { BarLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  PlusCircle,
  ArrowLeftRight,
  ArrowLeft,
  Users,
  Trash2,
} from "lucide-react";

import { ExpenseList } from "@/components/expense-list";
import { SettlementList } from "@/components/settlements-list";
import { GroupBalances } from "@/components/group-balancer";
import { GroupMembers } from "@/components/group-member";

export default function GroupExpensesPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("expenses");

  /* ---------------- GROUP ID ---------------- */
  const groupId = typeof params.id === "string" ? params.id : null;

  /* ---------------- SAFE REDIRECT ---------------- */
  useEffect(() => {
    if (!groupId) {
      router.replace("/dashboard");
    }
  }, [groupId, router]);

  if (!groupId) return null;

  /* ---------------- DATA ---------------- */
  const { data, isLoading } = useConvexQuery(
    api.groups.getGroupExpenses,
    { groupId }
  );

  const { data: currentUser } = useConvexQuery(
    api.users.getCurrentUser
  );

  const deleteGroup = useConvexMutation(
    api.groups.deleteGroup
  );

  /* ---------------- LOADING ---------------- */
  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width="100%" color="#36d7b7" />
      </div>
    );
  }

  /* ---------------- INVALID GROUP ---------------- */
  if (!data) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p className="text-muted-foreground">
          Group not found or you don’t have access.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push("/dashboard")}
        >
          Go to dashboard
        </Button>
      </div>
    );
  }

  const {
    group,
    members,
    expenses,
    settlements,
    balances,
    userLookupMap,
  } = data;

  /* ---------------- UI ---------------- */
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-4 rounded-md">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl gradient-title">
                {group.name}
              </h1>
              <p className="text-muted-foreground">
                {group.description}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {members.length} members
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/settlements/group/${groupId}`}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Settle up
              </Link>
            </Button>

            <Button asChild>
              <Link href={`/expenses/new?groupId=${groupId}`}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add expense
              </Link>
            </Button>

            {/* DELETE GROUP (ADMIN ONLY) */}
{members.some(
  (m) => m.id === currentUser?._id && m.role === "admin"
) && (

                <Button
                  variant="destructive"
                  onClick={async () => {
                    const ok = confirm(
                      "Are you sure? This will permanently delete the group and all related expenses and settlements."
                    );
                    if (!ok) return;

                    await deleteGroup.mutate({ groupId });
                    router.push("/dashboard");
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete group
                </Button>
              )}
          </div>
        </div>
      </div>

      {/* OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">
                Group Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GroupBalances balances={balances} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">
                Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GroupMembers members={members} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* TABS */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">
            Expenses ({expenses.length})
          </TabsTrigger>
          <TabsTrigger value="settlements">
            Settlements ({settlements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <ExpenseList
            expenses={expenses}
            isGroupExpense
            userLookupMap={userLookupMap}
          />
        </TabsContent>

        <TabsContent value="settlements">
          <SettlementList
            settlements={settlements}
            isGroupSettlement
            userLookupMap={userLookupMap}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
