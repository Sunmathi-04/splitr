/*"use client";

import { useStoreUser } from "@/hooks/use-store-user";

export default function StoreUserGate({ children }) {
  useStoreUser();
  return <>{children}</>;
}
*/
"use client";

import { useStoreUser } from "@/hooks/use-store-user";

export default function StoreUserGate({ children }) {
  console.log("🟢 StoreUserGate mounted");
  useStoreUser();
  return <>{children}</>;
}
