"use client";

import { useEffect, useState } from "react";
import { Church } from "@/types/entities";
import ChurchCard from "@/components/ChurchCard";
import ChurchFormDialog from "@/components/ChurchFormDialog";
import { X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { usePageActions } from "@/contexts/PageActionsContext";

export default function ChurchesPage() {
  const { setTitle } = usePageTitle();
  const { setSearchPlaceholder, clearActions } = usePageActions();
  const [churches, setChurches] = useState<Church[]>([]);
  const [filteredChurches, setFilteredChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchChurches = async () => {
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
  };

  useEffect(() => {
    setTitle("First Love Campuses");
    setSearchPlaceholder("Search by name, location, or pastor...");
    fetchChurches();

    return () => {
      clearActions();
    };
  }, [setTitle, setSearchPlaceholder, clearActions]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = churches.filter(
        (church) =>
          church.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          church.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          church.head_pastor.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChurches(filtered);
    } else {
      setFilteredChurches(churches);
    }
  }, [searchQuery, churches]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading campuses...</div>
      </div>
    );
  }

  const hasSearch = searchQuery.trim() !== "";

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Search and Actions Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by name, location, or pastor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 w-full"
              />
            </div>
            <ChurchFormDialog onSuccess={fetchChurches} />
          </div>
        </div>

        {hasSearch && (
          <div className="mb-8 max-w-md mx-auto">
            <div className="p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">
                  Showing {filteredChurches.length} of {churches.length} campus{churches.length !== 1 ? "es" : ""}
                </p>
                <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")} className="text-xs">
                  Clear Search
                </Button>
              </div>

              <Badge variant="secondary" className="gap-1">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery("")} className="ml-1 hover:bg-background/20 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          </div>
        )}

        {filteredChurches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No churches found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChurches.map((church) => (
              <ChurchCard key={church.id} church={church} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
