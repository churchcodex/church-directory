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
  clearActions: () => {},
});

export function PageActionsProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterButton, setFilterButton] = useState<ReactNode | null>(null);
  const [addButton, setAddButton] = useState<ReactNode | null>(null);
  const [searchPlaceholder, setSearchPlaceholder] = useState("");

  const clearActions = useCallback(() => {
    setSearchQuery("");
    setFilterButton(null);
    setAddButton(null);
    setSearchPlaceholder("");
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
