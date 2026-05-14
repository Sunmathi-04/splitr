"use client";

import { useStoreUser } from "@/hooks/use-store-user";

export default function StoreUserGate({ children }) {
  useStoreUser();
  return <>{children}</>;
}
