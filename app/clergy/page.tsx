"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Pastor, ClergyType } from "@/types/entities";
import PastorFormDialog from "@/components/PastorFormDialog";
import PastorFilterDialog, { FilterState } from "@/components/PastorFilterDialog";
import PastorBulkUpload from "@/components/PastorBulkUpload";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { calculateAge } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function ClergyPageContent() {
  const searchParams = useSearchParams();
  const [pastors, setPastors] = useState<Pastor[]>([]);
  const [filteredPastors, setFilteredPastors] = useState<Pastor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    clergyType: [],
    maritalStatus: [],
    gender: "all",
    council: [],
    area: [],
    ministry: [],
    country: [],
    occupation: [],
    status: "Active",
    minAge: "",
    maxAge: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPastors();
  }, []);

  useEffect(() => {
    // Check for status filter in URL params
    const statusParam = searchParams.get("status");
    if (statusParam === "inactive") {
      setFilters((prev) => ({ ...prev, status: "Inactive" }));
    }
  }, [searchParams]);

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
        const clergyTypes = Array.isArray(pastor.clergy_type) ? pastor.clergy_type.join(" ") : pastor.clergy_type || "";
        return (
          fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          clergyTypes.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Apply filters - clergy type (multiple selection)
    if (filters.clergyType.length > 0) {
      filtered = filtered.filter((pastor) => {
        const clergyTypeArray = Array.isArray(pastor.clergy_type)
          ? pastor.clergy_type
          : pastor.clergy_type
          ? [pastor.clergy_type]
          : [];
        return filters.clergyType.some((type) => clergyTypeArray.includes(type as ClergyType));
      });
    }

    // Marital status (multiple selection)
    if (filters.maritalStatus.length > 0) {
      filtered = filtered.filter((pastor) => filters.maritalStatus.includes(pastor.marital_status || ""));
    }

    // Gender (single selection)
    if (filters.gender !== "all") {
      filtered = filtered.filter((pastor) => pastor.gender === filters.gender);
    }

    // Council (multiple selection)
    if (filters.council.length > 0) {
      filtered = filtered.filter((pastor) => filters.council.includes(pastor.council || ""));
    }

    // Area (multiple selection)
    if (filters.area.length > 0) {
      filtered = filtered.filter((pastor) => {
        if (filters.area.includes("none") && !pastor.area) return true;
        return filters.area.includes(pastor.area || "");
      });
    }

    // Ministry (multiple selection)
    if (filters.ministry.length > 0) {
      filtered = filtered.filter((pastor) => {
        if (filters.ministry.includes("none") && !pastor.ministry) return true;
        return filters.ministry.includes(pastor.ministry || "");
      });
    }

    // Country (multiple selection)
    if (filters.country.length > 0) {
      filtered = filtered.filter((pastor) => filters.country.includes(pastor.country || ""));
    }

    // Occupation (multiple selection)
    if (filters.occupation.length > 0) {
      filtered = filtered.filter((pastor) => filters.occupation.includes(pastor.occupation || ""));
    }

    // Filter by status - treat undefined/missing status as "Active"
    if (filters.status === "Active") {
      filtered = filtered.filter((pastor) => !pastor.status || pastor.status === "Active");
    } else if (filters.status === "Inactive") {
      filtered = filtered.filter((pastor) => pastor.status === "Inactive");
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

  // Get active filter labels
  const getActiveFilters = () => {
    const activeFilters: { label: string; value: string; key: keyof FilterState; filterValue?: string }[] = [];

    // Clergy type (array)
    if (filters.clergyType.length > 0) {
      filters.clergyType.forEach((type) => {
        activeFilters.push({
          label: "Title",
          value: type,
          key: "clergyType",
          filterValue: type,
        });
      });
    }

    // Marital status (array)
    if (filters.maritalStatus.length > 0) {
      filters.maritalStatus.forEach((status) => {
        activeFilters.push({
          label: "Marital Status",
          value: status,
          key: "maritalStatus",
          filterValue: status,
        });
      });
    }

    // Gender (single)
    if (filters.gender !== "all") {
      activeFilters.push({
        label: "Gender",
        value: filters.gender,
        key: "gender",
      });
    }

    // Council (array)
    if (filters.council.length > 0) {
      filters.council.forEach((council) => {
        activeFilters.push({
          label: "Council",
          value: council,
          key: "council",
          filterValue: council,
        });
      });
    }

    // Area (array)
    if (filters.area.length > 0) {
      filters.area.forEach((area) => {
        activeFilters.push({
          label: "Area",
          value: area === "none" ? "No Area" : area,
          key: "area",
          filterValue: area,
        });
      });
    }

    // Ministry (array)
    if (filters.ministry.length > 0) {
      filters.ministry.forEach((ministry) => {
        activeFilters.push({
          label: "Ministry",
          value: ministry === "none" ? "No Ministry" : ministry,
          key: "ministry",
          filterValue: ministry,
        });
      });
    }

    // Country (array)
    if (filters.country.length > 0) {
      filters.country.forEach((country) => {
        activeFilters.push({
          label: "Country",
          value: country,
          key: "country",
          filterValue: country,
        });
      });
    }

    // Occupation (array)
    if (filters.occupation.length > 0) {
      filters.occupation.forEach((occupation) => {
        activeFilters.push({
          label: "Occupation",
          value: occupation,
          key: "occupation",
          filterValue: occupation,
        });
      });
    }

    // Status (single)
    if (filters.status !== "all") {
      activeFilters.push({
        label: "Status",
        value: filters.status,
        key: "status",
      });
    }

    // Age range
    if (filters.minAge || filters.maxAge) {
      activeFilters.push({
        label: "Age Range",
        value: [filters.minAge && `Min: ${filters.minAge}`, filters.maxAge && `Max: ${filters.maxAge}`]
          .filter(Boolean)
          .join(", "),
        key: "minAge",
      });
    }

    return activeFilters;
  };

  const activeFilters = getActiveFilters();
  const hasActiveFilters = activeFilters.length > 0 || searchQuery;

  // Remove individual filter
  const removeFilter = (key: keyof FilterState, filterValue?: string) => {
    const updatedFilters = { ...filters };

    if (Array.isArray(updatedFilters[key]) && filterValue) {
      // Remove specific item from array filters
      (updatedFilters[key] as string[]) = (updatedFilters[key] as string[]).filter((item) => item !== filterValue);
    } else if (key === "minAge" || key === "maxAge") {
      // Clear age range
      updatedFilters.minAge = "";
      updatedFilters.maxAge = "";
    } else {
      // Reset single select filters to "all"
      updatedFilters[key] = "all" as any;
    }

    setFilters(updatedFilters);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Fetching Pastors...</div>
      </div>
    );
  }

  // Get unique values for filters
  const clergyTypes = Array.from(new Set(pastors.flatMap((p) => p.clergy_type || []))).filter(
    (type): type is NonNullable<typeof type> => type !== undefined
  );
  const councils = Array.from(new Set(pastors.map((p) => p.council))).filter(
    (council): council is NonNullable<typeof council> => council !== undefined
  );
  const areas = Array.from(new Set(pastors.map((p) => p.area)))
    .filter((area): area is NonNullable<typeof area> => area !== undefined)
    .sort();
  const ministries = Array.from(new Set(pastors.map((p) => p.ministry)))
    .filter((ministry): ministry is NonNullable<typeof ministry> => ministry !== undefined)
    .sort();
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
          <div className="flex gap-2 flex-col md:flex-row md:items-center items-stretch">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search by name or type..."
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
              areas={areas}
              ministries={ministries}
              countries={countries}
              occupations={occupations}
            />
            <PastorBulkUpload onSuccess={fetchPastors} />
            <PastorFormDialog onSuccess={fetchPastors} />
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">
                  Showing {filteredPastors.length} of {pastors.length} pastor{pastors.length !== 1 ? "s" : ""}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    const resetFilters: FilterState = {
                      clergyType: [],
                      maritalStatus: [],
                      gender: "all",
                      council: [],
                      area: [],
                      ministry: [],
                      country: [],
                      occupation: [],
                      status: "Active",
                      minAge: "",
                      maxAge: "",
                    };
                    setFilters(resetFilters);
                  }}
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>

              {searchQuery && (
                <div className="mb-2">
                  <Badge variant="secondary" className="mr-2 gap-1">
                    Search: "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery("")}
                      className="ml-1 hover:bg-background/20 rounded-full p-0.5 cursor-pointer"
                    >
                      <X className="h-3 w-3 cursor-pointer" />
                    </button>
                  </Badge>
                </div>
              )}

              {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((filter, index) => (
                    <Badge key={index} variant="outline" className="gap-1">
                      {filter.label}: {filter.value}
                      <button
                        onClick={() => removeFilter(filter.key, filter.filterValue)}
                        className="ml-1 hover:bg-background/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {filteredPastors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No pastor found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-3">
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

export default function ClergyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </div>
      }
    >
      <ClergyPageContent />
    </Suspense>
  );
}
