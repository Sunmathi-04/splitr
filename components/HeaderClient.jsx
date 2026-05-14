"use client";

import { usePathname } from "next/navigation";
import Header from "./header";

export default function HeaderClient() {
  const pathname = usePathname();

  // Hide header on auth pages
  if (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up")
  ) {
    return null;
  }

  return <Header />;
}
