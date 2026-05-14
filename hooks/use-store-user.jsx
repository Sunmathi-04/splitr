"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useRef } from "react";

export function useStoreUser() {
  const { user, isLoaded } = useUser();
  const storeUser = useMutation(api.users.store);
  const ranOnce = useRef(false);

  const currentUser = useQuery(
    api.users.getCurrentUser,
    isLoaded ? {} : "skip"
  );

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (currentUser === undefined) return;
    if (currentUser !== null) return;
    if (ranOnce.current) return;

    ranOnce.current = true;

    storeUser({
      name:
        user.fullName ||
        `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
        user.primaryEmailAddress?.emailAddress.split("@")[0],
      email: user.primaryEmailAddress?.emailAddress ?? "",
      imageUrl: user.imageUrl,
    });
  }, [isLoaded, user, currentUser, storeUser]);
}
