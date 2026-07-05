"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ALL_REGIONS, RegionFilter } from "@/lib/region";
import { REGIONS } from "@/types/entities";

const STORAGE_KEY = "church-directory-region-filter";
const DEFAULT_REGION: RegionFilter = "Accra";

interface RegionContextValue {
  region: RegionFilter;
  setRegion: (region: RegionFilter) => void;
}

const RegionContext = createContext<RegionContextValue>({
  region: DEFAULT_REGION,
  setRegion: () => {},
});

export function RegionProvider({ children }: { children: ReactNode }) {
  // Start from the default on both server and client to avoid a hydration
  // mismatch; the persisted choice is applied after mount.
  const [region, setRegionState] = useState<RegionFilter>(DEFAULT_REGION);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && ([...REGIONS, ALL_REGIONS] as string[]).includes(stored)) {
      setRegionState(stored);
    }
  }, []);

  const setRegion = (next: RegionFilter) => {
    setRegionState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Persistence is best-effort; the in-memory value still applies.
    }
  };

  return <RegionContext.Provider value={{ region, setRegion }}>{children}</RegionContext.Provider>;
}

export function useRegion() {
  return useContext(RegionContext);
}
