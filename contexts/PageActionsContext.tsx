"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface PageActionsContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterButton: ReactNode | null;
  setFilterButton: (button: ReactNode | null) => void;
  addButton: ReactNode | null;
  setAddButton: (button: ReactNode | null) => void;
  searchPlaceholder: string;
  setSearchPlaceholder: (placeholder: string) => void;
  resultsCount: number | null;
  setResultsCount: (count: number | null) => void;
  totalCount: number | null;
  setTotalCount: (count: number | null) => void;
  activeFilters: string[];
  setActiveFilters: (filters: string[]) => void;
  clearActions: () => void;
}

const PageActionsContext = createContext<PageActionsContextType>({
  searchQuery: "",
  setSearchQuery: () => {},
  filterButton: null,
  setFilterButton: () => {},
  addButton: null,
  setAddButton: () => {},
  searchPlaceholder: "",
  setSearchPlaceholder: () => {},
  resultsCount: null,
  setResultsCount: () => {},
  totalCount: null,
  setTotalCount: () => {},
  activeFilters: [],
  setActiveFilters: () => {},
  clearActions: () => {},
});

export function PageActionsProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterButton, setFilterButton] = useState<ReactNode | null>(null);
  const [addButton, setAddButton] = useState<ReactNode | null>(null);
  const [searchPlaceholder, setSearchPlaceholder] = useState("");
  const [resultsCount, setResultsCount] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const clearActions = useCallback(() => {
    setSearchQuery("");
    setFilterButton(null);
    setAddButton(null);
    setSearchPlaceholder("");
    setResultsCount(null);
    setTotalCount(null);
    setActiveFilters([]);
  }, []);

  return (
    <PageActionsContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        filterButton,
        setFilterButton,
        addButton,
        setAddButton,
        searchPlaceholder,
        setSearchPlaceholder,
        resultsCount,
        setResultsCount,
        totalCount,
        setTotalCount,
        activeFilters,
        setActiveFilters,
        clearActions,
      }}
    >
      {children}
    </PageActionsContext.Provider>
  );
}

export function usePageActions() {
  return useContext(PageActionsContext);
}
