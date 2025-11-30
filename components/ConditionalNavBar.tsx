"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/components/NavBar";

export default function ConditionalNavBar() {
  const pathname = usePathname();

  // Hide NavBar on auth-related routes
  const isAuthRoute =
    pathname?.includes("/auth") ||
    pathname?.includes("/login") ||
    pathname?.includes("/signup") ||
    pathname?.includes("/signin");

  if (isAuthRoute) {
    return null;
  }

  return <NavBar />;
}
