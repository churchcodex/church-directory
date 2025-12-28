"use client";

import { useEffect, useState, Suspense, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Pastor, ClergyType } from "@/types/entities";
import PastorFormDialog from "@/components/PastorFormDialog";
import PastorFilterDialog, { FilterState } from "@/components/PastorFilterDialog";
import PastorBulkUpload from "@/components/PastorBulkUpload";
import { Search, LayoutGrid, List, Award } from "lucide-react";
import Link from "next/link";
import { calculateAge } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { usePageActions } from "@/contexts/PageActionsContext";

function ClergyPageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const { setTitle } = usePageTitle();
  const {
    searchQuery,
    setSearchQuery,
    searchPlaceholder,
    setSearchPlaceholder,
    setFilterButton,
    setAddButton,
    setResultsCount,
    setTotalCount,
    setActiveFilters,
    clearActions,
  } = usePageActions();
  const [pastors, setPastors] = useState<Pastor[]>([]);
  const [filteredPastors, setFilteredPastors] = useState<Pastor[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<FilterState>({
    clergyType: [],
    maritalStatus: [],
    gender: "all",
    council: [],
    area: [],
    country: [],
    occupation: [],
    function: [],
    minAge: "",
    maxAge: "",
  });
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Dynamic field options from API (using string arrays to allow dynamic values)
  const [availableClergyTypes, setAvailableClergyTypes] = useState<string[]>([]);
  const [availableCouncils, setAvailableCouncils] = useState<string[]>([]);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const fetchPastors = useCallback(async () => {
    try {
      const response = await fetch("/api/pastors");
      const data = await response.json();
      if (data.success) {
        // Sort pastors alphabetically by first name, then last name
        let sortedPastors = data.data.sort((a: Pastor, b: Pastor) => {
          const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
          const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });

        // Filter by council if user is not admin
        if (session?.user?.role === "user" && session?.user?.council) {
          sortedPastors = sortedPastors.filter((pastor: Pastor) => pastor.council === session.user.council);
        }

        setPastors(sortedPastors);
        setFilteredPastors(sortedPastors);
      }
    } catch (error) {
      console.error("Failed to fetch pastors:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const fetchFieldOptions = useCallback(async () => {
    try {
      const response = await fetch("/api/pastor-fields");
      const data = await response.json();
      if (response.ok && data.data) {
        setAvailableClergyTypes(data.data.clergyTypes?.options || []);
        setAvailableCouncils(data.data.councils?.options || []);
        setAvailableAreas(data.data.areas?.options || []);
      }
    } catch (error) {
      console.error("Failed to fetch field options:", error);
    }
  }, []);

  useEffect(() => {
    setTitle("Directory");
    setSearchPlaceholder("Search by name or type...");
    fetchPastors();
    fetchFieldOptions();

    return () => {
      clearActions();
    };
  }, [setTitle, setSearchPlaceholder, fetchPastors, fetchFieldOptions, clearActions]);

  // Set total count when no filters are applied to show badge in navbar
  useEffect(() => {
    if (
      pastors.length > 0 &&
      !searchQuery &&
      filters.clergyType.length === 0 &&
      filters.maritalStatus.length === 0 &&
      filters.gender === "all" &&
      filters.council.length === 0 &&
      filters.area.length === 0 &&
      filters.country.length === 0 &&
      filters.occupation.length === 0 &&
      filters.function.length === 0 &&
      !filters.minAge &&
      !filters.maxAge
    ) {
      setTitle("Directory");
      setResultsCount(pastors.length);
      setTotalCount(pastors.length);
    } else {
      setTitle("Directory");
    }
  }, [pastors.length, searchQuery, filters, setTitle, setResultsCount, setTotalCount]);

  // Initialize filters from URL parameters
  useEffect(() => {
    const clergyTypeParam = searchParams.get("clergyType");
    if (clergyTypeParam) {
      setFilters((prev) => ({
        ...prev,
        clergyType: [clergyTypeParam as ClergyType],
      }));
    }
  }, [searchParams]);

  // Get unique values for filters - combine API options with actual data
  const clergyTypes = useMemo(() => {
    const fromPastors = Array.from(new Set(pastors.flatMap((p) => p.clergy_type || []))).filter(
      (type): type is NonNullable<typeof type> => type !== undefined
    );
    // Merge with API options, prioritizing API
    const combined = [...new Set([...availableClergyTypes, ...fromPastors])];
    return combined;
  }, [pastors, availableClergyTypes]);

  const councils = useMemo(() => {
    const fromPastors = Array.from(new Set(pastors.map((p) => p.council))).filter(
      (council): council is NonNullable<typeof council> => council !== undefined
    );
    // Merge with API options, prioritizing API
    const combined = [...new Set([...availableCouncils, ...fromPastors])];
    return combined;
  }, [pastors, availableCouncils]);

  const areas = useMemo(() => {
    const fromPastors = Array.from(new Set(pastors.map((p) => p.area)))
      .filter((area): area is NonNullable<typeof area> => area !== undefined)
      .sort();
    // Merge with API options, prioritizing API
    const combined = [...new Set([...availableAreas, ...fromPastors])].sort();
    return combined;
  }, [pastors, availableAreas]);

  const countries = useMemo(
    () =>
      Array.from(new Set(pastors.map((p) => p.country)))
        .filter((country): country is NonNullable<typeof country> => country !== undefined)
        .sort(),
    [pastors]
  );

  const occupations = useMemo(
    () =>
      Array.from(new Set(pastors.map((p) => p.occupation)))
        .filter((occupation): occupation is NonNullable<typeof occupation> => occupation !== undefined)
        .sort(),
    [pastors]
  );

  useEffect(() => {
    setFilterButton(
      <PastorFilterDialog
        onApplyFilters={setFilters}
        initialFilters={filters}
        clergyTypes={clergyTypes}
        councils={councils}
        areas={areas}
        countries={countries}
        occupations={occupations}
      />
    );
  }, [setFilterButton, filters, clergyTypes, councils, areas, countries, occupations]);

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
        {session?.user?.role === "admin" && (
          <>
            <PastorBulkUpload onSuccess={fetchPastors} />
            <PastorFormDialog onSuccess={fetchPastors} />
          </>
        )}
      </>
    );
  }, [setAddButton, viewMode, fetchPastors, session]);

  const applyFilters = useCallback(() => {
    setIsFiltering(true);

    // Add a small delay to show skeleton
    setTimeout(() => {
      let filtered = pastors;

      // Filter by search query
      if (searchQuery) {
        filtered = filtered.filter((pastor) => {
          const fullName = [pastor.first_name, pastor.middle_name, pastor.last_name].filter(Boolean).join(" ");
          const clergyTypes = Array.isArray(pastor.clergy_type)
            ? pastor.clergy_type.join(" ")
            : pastor.clergy_type || "";
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
        filtered = filtered.filter((pastor) => {
          if (filters.council.includes("None") && pastor.council === "None") return true;
          return filters.council.includes(pastor.council || "");
        });
      }

      // Area (multiple selection)
      if (filters.area.length > 0) {
        filtered = filtered.filter((pastor) => {
          if (filters.area.includes("None") && pastor.area === "None") return true;
          return filters.area.includes(pastor.area || "");
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

      // Function (multiple selection)
      if (filters.function.length > 0) {
        filtered = filtered.filter((pastor) => {
          const functionArray = Array.isArray(pastor.function)
            ? pastor.function
            : pastor.function
            ? [pastor.function]
            : [];
          return filters.function.some((func) => functionArray.includes(func));
        });
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
      setResultsCount(filtered.length);
      setTotalCount(pastors.length);

      // Build active filters list
      const activeFiltersList: string[] = [];
      if (filters.clergyType.length > 0) {
        activeFiltersList.push(...filters.clergyType);
      }
      if (filters.maritalStatus.length > 0) {
        activeFiltersList.push(...filters.maritalStatus);
      }
      if (filters.gender !== "all") {
        activeFiltersList.push(filters.gender);
      }
      if (filters.council.length > 0) {
        activeFiltersList.push(...filters.council);
      }
      if (filters.area.length > 0) {
        activeFiltersList.push(...filters.area.map((a) => (a === "none" ? "No Area" : a)));
      }
      if (filters.country.length > 0) {
        activeFiltersList.push(...filters.country);
      }
      if (filters.occupation.length > 0) {
        activeFiltersList.push(...filters.occupation);
      }
      if (filters.function.length > 0) {
        activeFiltersList.push(...filters.function);
      }
      if (filters.minAge || filters.maxAge) {
        const ageRange = [filters.minAge && `Min: ${filters.minAge}`, filters.maxAge && `Max: ${filters.maxAge}`]
          .filter(Boolean)
          .join(", ");
        activeFiltersList.push(ageRange);
      }
      setActiveFilters(activeFiltersList);
      setIsFiltering(false);
    }, 200); // 200ms delay
  }, [searchQuery, filters, pastors, setResultsCount, setTotalCount, setActiveFilters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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

    // Function (array)
    if (filters.function.length > 0) {
      filters.function.forEach((func) => {
        activeFilters.push({
          label: "Function",
          value: func,
          key: "function",
          filterValue: func,
        });
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

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20 py-6 px-4 sm:px-6 lg:px-8">
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
          <PastorFilterDialog
            onApplyFilters={setFilters}
            initialFilters={filters}
            clergyTypes={clergyTypes}
            councils={councils}
            areas={areas}
            countries={countries}
            occupations={occupations}
          />
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
          {session?.user?.role === "admin" && (
            <>
              <PastorBulkUpload onSuccess={fetchPastors} />
              <PastorFormDialog onSuccess={fetchPastors} />
            </>
          )}
        </div>
      </div>

      <div className="mx-auto">
        {isFiltering ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center max-w-24 mx-auto">
                  <div className="w-24 h-32 rounded-lg bg-muted animate-pulse mb-1.5" />
                  <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-card border">
                  <div className="w-12 h-12 rounded-full bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredPastors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No pastor found matching your search.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
            {filteredPastors.map((pastor) => (
              <Link
                key={pastor.id}
                href={`/clergy/${pastor.id}`}
                className="group cursor-pointer flex flex-col items-center max-w-24 mx-auto"
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
        ) : (
          <div className="space-y-2">
            {filteredPastors.map((pastor) => (
              <Link
                key={pastor.id}
                href={`/clergy/${pastor.id}`}
                className="flex items-center gap-4 p-4 rounded-lg bg-card hover:bg-muted/50 transition-colors border"
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0">
                  {pastor.profile_image ? (
                    <img
                      src={pastor.profile_image}
                      alt={[pastor.first_name, pastor.middle_name, pastor.last_name].filter(Boolean).join(" ")}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-purple-500 to-blue-600">
                      <span className="text-white text-sm font-bold">{pastor.first_name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex gap-4">
                  <h3 className="font-medium text-sm mb-1">
                    {[pastor.first_name, pastor.middle_name, pastor.last_name].filter(Boolean).join(" ")}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Award className="h-3.5 w-3.5 shrink-0" />
                    <p className="truncate">
                      {Array.isArray(pastor.clergy_type) && pastor.clergy_type.length > 0
                        ? pastor.clergy_type.join(" • ")
                        : pastor.clergy_type || "N/A"}
                    </p>
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
