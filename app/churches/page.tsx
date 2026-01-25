"use client";

import { useEffect, useState, useCallback } from "react";
import { Church } from "@/types/entities";
import ChurchCard from "@/components/ChurchCard";
import ChurchFormDialog from "@/components/ChurchFormDialog";
import { X, LayoutGrid, List, MapPin, User, Search } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { usePageActions } from "@/contexts/PageActionsContext";
import { useSession } from "next-auth/react";

export default function ChurchesPage() {
  const { data: session } = useSession();
  const { setTitle } = usePageTitle();
  const {
    searchQuery,
    setSearchQuery,
    searchPlaceholder,
    setSearchPlaceholder,
    setAddButton,
    setResultsCount,
    setTotalCount,
    clearActions,
  } = usePageActions();
  const [churches, setChurches] = useState<Church[]>([]);
  const [filteredChurches, setFilteredChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const canManage = session?.user?.role === "admin";

  const fetchChurches = useCallback(async () => {
    try {
      const response = await fetch("/api/churches");
      const data = await response.json();
      if (data.success) {
        setChurches(data.data);
        setFilteredChurches(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch churches:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setTitle("First Love Campuses");
    setSearchPlaceholder("Search by name, location, or pastor...");
    fetchChurches();

    return () => {
      clearActions();
    };
  }, [setTitle, setSearchPlaceholder, clearActions, fetchChurches]);

  useEffect(() => {
    setAddButton(
      <>
        <div className="flex gap-1 border rounded-md">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="rounded-r-none"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        {canManage && <ChurchFormDialog onSuccess={fetchChurches} />}
      </>,
    );
  }, [setAddButton, viewMode, fetchChurches, canManage]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = churches.filter(
        (church) =>
          church.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          church.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          church.head_pastor.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredChurches(filtered);
      setResultsCount(filtered.length);
      setTotalCount(churches.length);
    } else {
      setFilteredChurches(churches);
      setResultsCount(churches.length);
      setTotalCount(churches.length);
    }
  }, [searchQuery, churches, setResultsCount, setTotalCount]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading campuses...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className=" mx-auto">
        {/* Mobile Actions */}
        <div className="lg:hidden mb-6 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            <div className="flex gap-1 border rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            {canManage && <ChurchFormDialog onSuccess={fetchChurches} />}
          </div>
        </div>

        {filteredChurches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No churches found matching your search.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChurches.map((church) => (
              <ChurchCard key={church.id} church={church} />
            ))}
          </div>
        ) : (
          <div className=" space-y-2">
            {filteredChurches.map((church) => (
              <Link
                key={church.id}
                href={`/churches/${church.id}`}
                className="flex items-center gap-4 p-4 rounded-lg bg-card hover:bg-muted/50 transition-colors border"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-muted shrink-0">
                  {church.images && church.images.length > 0 ? (
                    <img
                      src={church.images[0]}
                      alt={church.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement!.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-500 to-purple-600">
                            <span class="text-white text-lg font-bold">${church.name.charAt(0)}</span>
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-500 to-purple-600">
                      <span className="text-white text-lg font-bold">{church.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 flex min-w-0">
                  <h3 className="font-semibold text-base mb-1">{church.name}</h3>
                  <div className="space-y-0.5 flex ml-4 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <p className="truncate">{church.location}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <p className="truncate">{church.head_pastor}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
