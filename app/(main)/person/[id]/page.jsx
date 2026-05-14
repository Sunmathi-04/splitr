"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { BarLoader } from "react-spinners";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, ArrowLeftRight, ArrowLeft } from "lucide-react";
import { ExpenseList } from "@/components/expense-list";
import { SettlementList } from "@/components/settlements-list";

export default function PersonExpensesPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("expenses");

  /* ================= SAFE PARAM ================= */

  const personId = useMemo(() => {
    if (!params?.id) return null;
    if (params.id === "undefined") return null; // 🔥 CRITICAL
    if (Array.isArray(params.id)) return params.id[0];
    return params.id;
  }, [params]);

  const { data: currentUser, isLoading: userLoading } =
    useConvexQuery(api.users.getCurrentUser);

  const shouldSkip =
    userLoading ||
    !currentUser ||
    !personId;

  const { data, isLoading } = useConvexQuery(
    api.expenses.getExpensesBetweenUsers,
    shouldSkip
      ? "skip"
      : {
          userId: currentUser._id,
          otherUserId: personId,
        }
  );

  /* ================= LOADING ================= */

  if (userLoading || isLoading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width="100%" color="#36d7b7" />
      </div>
    );
  }

  /* ================= INVALID URL ================= */

  if (!personId) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p className="text-muted-foreground">
          Invalid user.
        </p>
        <Button onClick={() => router.push("/contacts")}>
          Go to contacts
        </Button>
      </div>
    );
  }

  if (!data || !data.otherUser) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p className="text-muted-foreground">
          User not found or no shared expenses.
        </p>
        <Button onClick={() => router.push("/contacts")}>
          Go to contacts
        </Button>
      </div>
    );
  }

  const { otherUser, expenses = [], settlements = [], balance = 0 } = data;

  /* ================= UI ================= */

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Button
        variant="outline"
        size="sm"
        className="mb-4"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-16 w-16">
            <AvatarImage src={otherUser.imageUrl} />
            <AvatarFallback>
              {otherUser.name?.charAt(0) ?? "?"}
            </AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-4xl gradient-title">
              {otherUser.name}
            </h1>
            <p className="text-muted-foreground">
              {otherUser.email}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/settlements/user/${personId}`}>
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Settle up
            </Link>
          </Button>

          <Button asChild>
            <Link href="/expenses/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add expense
            </Link>
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Balance</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <p>
            {balance === 0
              ? "You are all settled up"
              : balance > 0
              ? `${otherUser.name} owes you`
              : `You owe ${otherUser.name}`}
          </p>
          <span
            className={`text-2xl font-bold ${
              balance > 0
                ? "text-green-600"
                : balance < 0
                ? "text-red-600"
                : ""
            }`}
          >
            ₹{Math.abs(balance).toFixed(2)}
          </span>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2">
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
            showOtherPerson={false}
            otherPersonId={personId}
            userLookupMap={{ [otherUser._id]: otherUser }}
          />
        </TabsContent>

        <TabsContent value="settlements">
          <SettlementList
            settlements={settlements}
            userLookupMap={{ [otherUser._id]: otherUser }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
