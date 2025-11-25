"use client";

import { useEffect, useState } from "react";
import { Pastor } from "@/types/entities";
import PastorFormDialog from "@/components/PastorFormDialog";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { calculateAge } from "@/lib/utils";

export default function ClergyPage() {
  const [pastors, setPastors] = useState<Pastor[]>([]);
  const [filteredPastors, setFilteredPastors] = useState<Pastor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [clergyTypeFilter, setClergyTypeFilter] = useState<string>("all");
  const [minAge, setMinAge] = useState<string>("");
  const [maxAge, setMaxAge] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPastors();
  }, []);

  useEffect(() => {
    let filtered = pastors;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (pastor) =>
          pastor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pastor.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pastor.clergy_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by clergy type
    if (clergyTypeFilter !== "all") {
      filtered = filtered.filter((pastor) => pastor.clergy_type === clergyTypeFilter);
    }

    // Filter by age range
    if (minAge || maxAge) {
      filtered = filtered.filter((pastor) => {
        const age = calculateAge(pastor.date_of_birth);
        const min = minAge ? parseInt(minAge) : 0;
        const max = maxAge ? parseInt(maxAge) : Infinity;
        return age >= min && age <= max;
      });
    }

    setFilteredPastors(filtered);
  }, [searchQuery, clergyTypeFilter, minAge, maxAge, pastors]);

  const fetchPastors = async () => {
    try {
      const response = await fetch("/api/pastors");
      const data = await response.json();
      if (data.success) {
        setPastors(data.data);
        setFilteredPastors(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch pastors:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading clergy...</div>
      </div>
    );
  }

  console.log("filtered pastors: ", filteredPastors);

  // Get unique clergy types for filter dropdown
  const clergyTypes = Array.from(new Set(pastors.map((p) => p.clergy_type)));

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center mb-12">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-4">Pastors' Directory</h1>
            <p className="text-muted-foreground text-lg">Browse our directory of {pastors.length} pastors</p>
          </div>
          <PastorFormDialog onSuccess={fetchPastors} />
        </div>

        <div className="mb-8 max-w-4xl mx-auto space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search by name, position, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clergy-type">Pastor Title</Label>
              <Select value={clergyTypeFilter} onValueChange={setClergyTypeFilter}>
                <SelectTrigger id="clergy-type" className="w-full">
                  <SelectValue placeholder="All Titles" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="all">All Titles</SelectItem>
                  {clergyTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min-age">Min Age</Label>
              <Input
                id="min-age"
                type="number"
                placeholder="Min age"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-age">Max Age</Label>
              <Input
                id="max-age"
                type="number"
                placeholder="Max age"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                min="0"
              />
            </div>
          </div>
        </div>

        {filteredPastors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No pastor found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
            {filteredPastors.map((pastor) => (
              <Link
                key={pastor.id}
                href={`/clergy/${pastor.id}`}
                className="group cursor-pointer flex flex-col items-center"
              >
                <div className="relative w-24 h-32 rounded-lg overflow-hidden bg-muted mb-1.5 border-2 border-border hover:border-primary transition-all duration-300 hover:scale-105">
                  {pastor.profile_image ? (
                    <img src={pastor.profile_image} alt={pastor.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-purple-500 to-blue-600">
                      <span className="text-white text-2xl font-bold">{pastor.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-center text-wrap w-24 px-0.5">{pastor.name}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
