"use client";

import { useEffect } from "react";
import Dashboard from "@/components/Dashboard";
import { usePageTitle } from "@/contexts/PageTitleContext";

export default function Home() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("First Love Church");
  }, [setTitle]);

  return (
    <div className="p-6">
      <Dashboard />
    </div>
  );
}
