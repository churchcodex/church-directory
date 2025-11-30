"use client";

import { useEffect, useState, Suspense, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Pastor, ClergyType } from "@/types/entities";
import PastorFormDialog from "@/components/PastorFormDialog";
import PastorFilterDialog, { FilterState } from "@/components/PastorFilterDialog";
import PastorBulkUpload from "@/components/PastorBulkUpload";
import { X } from "lucide-react";
import Link from "next/link";
import { calculateAge } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { usePageActions } from "@/contexts/PageActionsContext";

function ClergyPageContent() {
  const searchParams = useSearchParams();
  const { setTitle } = usePageTitle();
  const { searchQuery, setSearchPlaceholder, setFilterButton, setAddButton, clearActions } = usePageActions();
  const [pastors, setPastors] = useState<Pastor[]>([]);
  const [filteredPastors, setFilteredPastors] = useState<Pastor[]>([]);
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

  const fetchPastors = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    setTitle("Pastors' Directory");
    setSearchPlaceholder("Search by name or type...");
    fetchPastors();

    return () => {
      clearActions();
    };
  }, [setTitle, setSearchPlaceholder, fetchPastors, clearActions]);

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam === "inactive") {
      setFilters((prev) => ({ ...prev, status: "Inactive" }));
    }
  }, [searchParams]);

  // Get unique values for filters - memoized to prevent infinite re-renders
  const clergyTypes = useMemo(
    () =>
      Array.from(new Set(pastors.flatMap((p) => p.clergy_type || []))).filter(
        (type): type is NonNullable<typeof type> => type !== undefined
      ),
    [pastors]
  );

  const councils = useMemo(
    () =>
      Array.from(new Set(pastors.map((p) => p.council))).filter(
        (council): council is NonNullable<typeof council> => council !== undefined
      ),
    [pastors]
  );

  const areas = useMemo(
    () =>
      Array.from(new Set(pastors.map((p) => p.area)))
        .filter((area): area is NonNullable<typeof area> => area !== undefined)
        .sort(),
    [pastors]
  );

  const ministries = useMemo(
    () =>
      Array.from(new Set(pastors.map((p) => p.ministry)))
        .filter((ministry): ministry is NonNullable<typeof ministry> => ministry !== undefined)
        .sort(),
    [pastors]
  );

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
        ministries={ministries}
        countries={countries}
        occupations={occupations}
      />
    );
  }, [setFilterButton, filters, clergyTypes, councils, areas, ministries, countries, occupations]);

  useEffect(() => {
    setAddButton(
      <>
        <PastorBulkUpload onSuccess={fetchPastors} />
        <PastorFormDialog onSuccess={fetchPastors} />
      </>
    );
  }, [setAddButton, fetchPastors]);

  const applyFilters = useCallback(() => {
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

    // Ministry (multiple selection)
    if (filters.ministry.length > 0) {
      filtered = filtered.filter((pastor) => {
        if (filters.ministry.includes("None") && pastor.ministry === "None") return true;
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
  }, [searchQuery, filters, pastors]);

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

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20 py-6 px-4 sm:px-6 lg:px-8">
      {hasActiveFilters && (
        <div className="fixed top-20 right-4 z-50 max-w-xs">
          <div className="p-2 bg-background/95 backdrop-blur-sm rounded-md border shadow-lg ring-1 ring-ring">
            <p className="text-xs font-medium mb-1.5">
              {filteredPastors.length} of {pastors.length} result{pastors.length !== 1 ? "s" : ""}
            </p>

            <div className="flex flex-wrap gap-1">
              {searchQuery && (
                <Badge variant="secondary" className="text-xs py-0 px-1.5 gap-1">
                  "{searchQuery}"
                  <button onClick={() => clearActions()} className="hover:bg-background/20 rounded-full p-0.5">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              )}
              {activeFilters.map((filter, index) => (
                <Badge key={index} variant="outline" className="text-xs py-0 px-1.5 gap-1">
                  {filter.value}
                  <button
                    onClick={() => removeFilter(filter.key, filter.filterValue)}
                    className="hover:bg-background/20 rounded-full p-0.5"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className=" mx-auto">
        {filteredPastors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No pastor found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
            {filteredPastors.map((pastor) => (
              <Link
                key={pastor.id}
                href={`/clergy/${pastor.id}`}
                className="group cursor-pointer flex flex-col items-center max-w-[96px] mx-auto"
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
