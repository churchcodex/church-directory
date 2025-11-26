"use client";

import { useEffect, useState } from "react";
import { Pastor } from "@/types/entities";
import PastorFormDialog from "@/components/PastorFormDialog";
import PastorFilterDialog, { FilterState } from "@/components/PastorFilterDialog";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { calculateAge } from "@/lib/utils";

export default function ClergyPage() {
  const [pastors, setPastors] = useState<Pastor[]>([]);
  const [filteredPastors, setFilteredPastors] = useState<Pastor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    clergyType: "all",
    maritalStatus: "all",
    gender: "all",
    council: "all",
    country: "all",
    occupation: "all",
    minAge: "",
    maxAge: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPastors();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters, pastors]);

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

  const applyFilters = () => {
    let filtered = pastors;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((pastor) => {
        const fullName = [pastor.first_name, pastor.middle_name, pastor.last_name].filter(Boolean).join(" ");
        return (
          fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pastor.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pastor.clergy_type?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Apply filters
    if (filters.clergyType !== "all") {
      filtered = filtered.filter((pastor) => pastor.clergy_type === filters.clergyType);
    }

    if (filters.maritalStatus !== "all") {
      filtered = filtered.filter((pastor) => pastor.marital_status === filters.maritalStatus);
    }

    if (filters.gender !== "all") {
      filtered = filtered.filter((pastor) => pastor.gender === filters.gender);
    }

    if (filters.council !== "all") {
      filtered = filtered.filter((pastor) => pastor.council === filters.council);
    }

    if (filters.country !== "all") {
      filtered = filtered.filter((pastor) => pastor.country === filters.country);
    }

    if (filters.occupation !== "all") {
      filtered = filtered.filter((pastor) => pastor.occupation === filters.occupation);
    }

    // Filter by age range
    if (filters.minAge || filters.maxAge) {
      filtered = filtered.filter((pastor) => {
        const age = calculateAge(pastor.date_of_birth || "");
        const min = filters.minAge ? parseInt(filters.minAge) : 0;
        const max = filters.maxAge ? parseInt(filters.maxAge) : Infinity;
        return age >= min && age <= max;
      });
    }

    setFilteredPastors(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Fetching Pastors...</div>
      </div>
    );
  }

  // Get unique values for filters
  const clergyTypes = Array.from(new Set(pastors.map((p) => p.clergy_type))).filter(
    (type): type is NonNullable<typeof type> => type !== undefined
  );
  const councils = Array.from(new Set(pastors.map((p) => p.council))).filter(
    (council): council is NonNullable<typeof council> => council !== undefined
  );
  const countries = Array.from(new Set(pastors.map((p) => p.country)))
    .filter((country): country is NonNullable<typeof country> => country !== undefined)
    .sort();
  const occupations = Array.from(new Set(pastors.map((p) => p.occupation)))
    .filter((occupation): occupation is NonNullable<typeof occupation> => occupation !== undefined)
    .sort();

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center mb-2">
          <div className="text-center mb-2">
            <h1 className="text-4xl lg:text-6xl font-bold mb-4">Pastors' Directory</h1>
          </div>
        </div>

        <div className="mb-8 max-w-4xl mx-auto">
          <div className="flex gap-2 flex-col md:flex-row items-stretch">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search by name, position, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <PastorFilterDialog
              onApplyFilters={setFilters}
              initialFilters={filters}
              clergyTypes={clergyTypes}
              councils={councils}
              countries={countries}
              occupations={occupations}
            />
            <PastorFormDialog onSuccess={fetchPastors} />
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
                    <img
                      src={pastor.profile_image}
                      alt={[pastor.first_name, pastor.middle_name, pastor.last_name].filter(Boolean).join(" ")}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-purple-500 to-blue-600">
                      <span className="text-white text-2xl font-bold">{pastor.first_name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-center text-wrap w-24 px-0.5">
                  {[pastor.first_name, pastor.middle_name, pastor.last_name].filter(Boolean).join(" ")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
