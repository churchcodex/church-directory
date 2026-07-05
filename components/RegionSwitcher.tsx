"use client";

import { Button } from "@/components/ui/button";
import { useRegion } from "@/contexts/RegionContext";
import { REGION_FILTERS } from "@/lib/region";

export default function RegionSwitcher({ className = "" }: { className?: string }) {
  const { region, setRegion } = useRegion();

  return (
    <div className={`inline-flex gap-1 border rounded-md p-1 ${className}`}>
      {REGION_FILTERS.map((option) => (
        <Button
          key={option}
          variant={region === option ? "default" : "ghost"}
          size="sm"
          onClick={() => setRegion(option)}
        >
          {option}
        </Button>
      ))}
    </div>
  );
}
