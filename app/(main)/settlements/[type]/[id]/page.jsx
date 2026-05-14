"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { ArrowLeft, Users } from "lucide-react";
import SettlementForm from "./components/settlement-form";

export default function SettlementPage() {
  const params = useParams();
  const router = useRouter();

  /* ================= SAFE PARAMS ================= */

  const type = useMemo(() => {
    if (!params?.type) return null;
    if (params.type === "user") return "person"; // 🔥 FIX
    if (params.type === "person" || params.type === "group") {
      return params.type;
    }
    return null;
  }, [params]);

  const id = useMemo(() => {
    if (!params?.id) return null;
    if (params.id === "undefined") return null;
    if (Array.isArray(params.id)) return params.id[0];
    return params.id;
  }, [params]);

  /* ================= QUERY ================= */

  const shouldSkip = !type || !id;

  const { data, isLoading } = useConvexQuery(
    api.settlements.getSettlementData,
    shouldSkip ? "skip" : { type, id }
  );

  /* ================= LOADING ================= */

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width="100%" color="#36d7b7" />
      </div>
    );
  }

  /* ================= INVALID ================= */

  if (!type || !id) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p className="text-muted-foreground">
          Invalid settlement link.
        </p>
        <Button className="mt-4" onClick={() => router.push("/contacts")}>
          Go to contacts
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p className="text-muted-foreground">
          Settlement data not found or access denied.
        </p>
        <Button className="mt-4" onClick={() => router.push("/contacts")}>
          Go to contacts
        </Button>
      </div>
    );
  }

  /* ================= HANDLER ================= */

  const handleSuccess = () => {
    if (type === "person") {
      router.push(`/person/${id}`);
    } else {
      router.push(`/groups/${id}`);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="container mx-auto py-6 max-w-lg">
      <Button
        variant="outline"
        size="sm"
        className="mb-4"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="mb-6">
        <h1 className="text-5xl gradient-title">Record a settlement</h1>
        <p className="text-muted-foreground mt-1">
          {type === "person"
            ? `Settling up with ${data.user?.name}`
            : `Settling up in ${data.group?.name}`}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {type === "person" ? (
              <Avatar className="h-10 w-10">
                <AvatarImage src={data.user?.imageUrl} />
                <AvatarFallback>
                  {data.user?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="bg-primary/10 p-2 rounded-md">
                <Users className="h-6 w-6 text-primary" />
              </div>
            )}
            <CardTitle>
              {type === "person" ? data.user?.name : data.group?.name}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          <SettlementForm
            entityType={type}
            entityData={data}
            onSuccess={handleSuccess}
          />
        </CardContent>
      </Card>
    </div>
  );
}
