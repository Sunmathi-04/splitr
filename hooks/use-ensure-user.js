"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useEnsureUser(currentUserDoc) {
  const { isLoaded, user } = useUser();
  const createUser = useMutation(api.users.store);
  const ranOnce = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) return;
    if (currentUserDoc) return; // already exists
    if (ranOnce.current) return;

    ranOnce.current = true;
    createUser(); // ✅ creates user ONCE
  }, [isLoaded, user, currentUserDoc, createUser]);
}
