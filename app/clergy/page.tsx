"use client";

import { useEffect, useState, Suspense, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Pastor, ClergyType, MinistryGroups } from "@/types/entities";
import PastorFormDialog from "@/components/PastorFormDialog";
import PastorFilterDialog, { FilterState } from "@/components/PastorFilterDialog";
import PastorBulkUpload from "@/components/PastorBulkUpload";
import * as XLSX from "xlsx";
import { Search, LayoutGrid, List, Award, Download } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { calculateAge } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { usePageActions } from "@/contexts/PageActionsContext";

// Helper functions to serialize/deserialize filters to/from URL
function filtersToQueryParams(filters: FilterState, searchQuery: string): URLSearchParams {
  const params = new URLSearchParams();

  if (searchQuery) {
    params.set("q", searchQuery);
  }
  if (filters.clergyType.length > 0) {
    params.set("clergyType", filters.clergyType.join(","));
  }
  if (filters.maritalStatus.length > 0) {
    params.set("maritalStatus", filters.maritalStatus.join(","));
  }
  if (filters.gender !== "all") {
    params.set("gender", filters.gender);
  }
  if (filters.council.length > 0) {
    params.set("council", filters.council.join(","));
  }
  if (filters.area.length > 0) {
    params.set("area", filters.area.join(","));
  }
  if (filters.country.length > 0) {
    params.set("country", filters.country.join(","));
  }
  if (filters.occupation.length > 0) {
    params.set("occupation", filters.occupation.join(","));
  }
  if (filters.function.length > 0) {
    params.set("function", filters.function.join(","));
  }
  if (filters.ministryGroup.length > 0) {
    params.set("ministryGroup", filters.ministryGroup.join(","));
  }
  if (filters.minAge) {
    params.set("minAge", filters.minAge);
  }
  if (filters.maxAge) {
    params.set("maxAge", filters.maxAge);
  }

  return params;
}

function queryParamsToFilters(searchParams: URLSearchParams): { filters: FilterState; searchQuery: string } {
  const clergyType = searchParams.get("clergyType");
  const maritalStatus = searchParams.get("maritalStatus");
  const gender = searchParams.get("gender");
  const council = searchParams.get("council");
  const area = searchParams.get("area");
  const country = searchParams.get("country");
  const occupation = searchParams.get("occupation");
  const functionParam = searchParams.get("function");
  const ministryGroupParam = searchParams.get("ministryGroup");
  const minAge = searchParams.get("minAge");
  const maxAge = searchParams.get("maxAge");
  const searchQuery = searchParams.get("q") || "";

  return {
    filters: {
      clergyType: clergyType ? clergyType.split(",") : [],
      maritalStatus: maritalStatus ? maritalStatus.split(",") : [],
      gender: gender || "all",
      council: council ? council.split(",") : [],
      area: area ? area.split(",") : [],
      country: country ? country.split(",") : [],
      occupation: occupation ? occupation.split(",") : [],
      function: functionParam ? functionParam.split(",") : [],
      ministryGroup: ministryGroupParam ? ministryGroupParam.split(",") : [],
      minAge: minAge || "",
      maxAge: maxAge || "",
    },
    searchQuery,
  };
}

// Save scroll position and filtered pastor IDs before navigating
function saveScrollPosition(filteredPastorIds: string[]) {
  sessionStorage.setItem("clergyPageScroll", window.scrollY.toString());
  sessionStorage.setItem("clergyFilteredIds", JSON.stringify(filteredPastorIds));
}

// Export pastors to Excel
async function exportPastorsToExcel(pastors: Pastor[], filteredCount: number) {
  // Fetch churches to map IDs to names
  let churchMap = new Map<string, string>();
  try {
    const response = await fetch("/api/churches");
    const data = await response.json();
    if (data.success && Array.isArray(data.data)) {
      churchMap = new Map(data.data.map((church: any) => [church._id, church.name]));
    }
  } catch (error) {
    console.error("Failed to fetch churches:", error);
  }

  const exportData = pastors.map((pastor) => ({
    "First Name": pastor.first_name || "",
    "Middle Name": pastor.middle_name || "",
    "Last Name": pastor.last_name || "",
    "Date of Birth": pastor.date_of_birth || "",
    "Date of Appointment": pastor.date_of_appointment || "",
    "Clergy Type": Array.isArray(pastor.clergy_type) ? pastor.clergy_type.join(", ") : pastor.clergy_type || "",
    "Marital Status": pastor.marital_status || "",
    Gender: pastor.gender || "",
    Council: Array.isArray(pastor.council) ? pastor.council.join(", ") : pastor.council || "",
    Area: pastor.area || "",
    Occupation: pastor.occupation || "",
    Country: pastor.country || "",
    Email: pastor.email || "",
    "Contact Number": pastor.contact_number || "",
    "Pastor Code": pastor.personal_code || "",
    Status: pastor.status || "",
    Campus: pastor.church ? churchMap.get(pastor.church) || pastor.church : "",
    Function: Array.isArray(pastor.function) ? pastor.function.join(", ") : pastor.function || "",
    "Ministry Group": Array.isArray(pastor.ministry_group) ? pastor.ministry_group.join(", ") : "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pastors");

  // Set column widths for better readability
  worksheet["!cols"] = [
    { wch: 15 }, // First Name
    { wch: 15 }, // Middle Name
    { wch: 15 }, // Last Name
    { wch: 15 }, // Date of Birth
    { wch: 20 }, // Date of Appointment
    { wch: 20 }, // Clergy Type
    { wch: 15 }, // Marital Status
    { wch: 10 }, // Gender
    { wch: 30 }, // Council
    { wch: 18 }, // Area
    { wch: 20 }, // Occupation
    { wch: 15 }, // Country
    { wch: 25 }, // Email
    { wch: 18 }, // Contact Number
    { wch: 15 }, // Pastor Code
    { wch: 12 }, // Status
    { wch: 25 }, // Campus
    { wch: 20 }, // Function
    { wch: 25 }, // Ministry Group
  ];

  // Generate filename with date and filtered/total count info
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const countInfo =
    filteredCount < pastors.length ? `_filtered-${filteredCount}-of-${pastors.length}` : `_all-${pastors.length}`;
  const filename = `pastors_export_${dateStr}${countInfo}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

function ClergyPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
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

  // Initialize filters and search query from URL
  const [filters, setFilters] = useState<FilterState>({
    clergyType: [],
    maritalStatus: [],
    gender: "all",
    council: [],
    area: [],
    country: [],
    occupation: [],
    function: [],
    ministryGroup: [],
    minAge: "",
    maxAge: "",
  });

  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Scroll position persistence
  useEffect(() => {
    // Restore scroll position after loading completes
    if (!loading && !isFiltering) {
      const savedScrollPosition = sessionStorage.getItem("clergyPageScroll");
      if (savedScrollPosition) {
        const scrollY = parseInt(savedScrollPosition, 10);
        window.scrollTo(0, scrollY);
        sessionStorage.removeItem("clergyPageScroll");
      }
    }
  }, [loading, isFiltering]);

  // Dynamic field options from API (using string arrays to allow dynamic values)
  const [availableClergyTypes, setAvailableClergyTypes] = useState<string[]>([]);
  const [availableCouncils, setAvailableCouncils] = useState<string[]>([]);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [availablePastorFunctions, setAvailablePastorFunctions] = useState<string[]>([]);
  const [availableMinistryGroups, setAvailableMinistryGroups] = useState<string[]>([]);
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
          sortedPastors = sortedPastors.filter((pastor: Pastor) => {
            const pastorCouncils = Array.isArray(pastor.council)
              ? pastor.council
              : pastor.council
                ? [pastor.council]
                : [];
            return pastorCouncils.includes(session.user!.council as string);
          });
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
        const safeClergyTypes = (data.data.clergyTypes?.options || []).filter((value: string) => value !== "Governor");
        setAvailableClergyTypes(safeClergyTypes);
        setAvailableCouncils(data.data.councils?.options || []);
        setAvailableAreas(data.data.areas?.options || []);
        setAvailablePastorFunctions(data.data.pastorFunctions?.options || []);
        setAvailableMinistryGroups(data.data.ministryGroups?.options || []);
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

  // Hydrate filters/searchQuery from URL on client once, then mark initialized
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const parsed = queryParamsToFilters(params);
    setFilters(parsed.filters);
    if (parsed.searchQuery) {
      setSearchQuery(parsed.searchQuery);
    }
    setIsInitialized(true);
  }, [setSearchQuery]);

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
      filters.ministryGroup.length === 0 &&
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

  // Update URL parameters when filters or search query change
  useEffect(() => {
    // Skip URL update during initialization
    if (!isInitialized) {
      return;
    }

    const params = filtersToQueryParams(filters, searchQuery);
    const queryString = params.toString();
    // Always keep the URL structure, don't reset to plain /clergy
    const newUrl = `/clergy${queryString ? `?${queryString}` : ""}`;
    router.push(newUrl);
  }, [filters, searchQuery, router, isInitialized]);

  // Get unique values for filters - combine API options with actual data
  const clergyTypes = useMemo(() => {
    const fromPastors = Array.from(new Set(pastors.flatMap((p) => p.clergy_type || []))).filter(
      (type): type is NonNullable<typeof type> => type !== undefined,
    );
    // Merge with API options, prioritizing API
    const combined = [...new Set([...availableClergyTypes, ...fromPastors])];
    return combined;
  }, [pastors, availableClergyTypes]);

  const councils = useMemo(() => {
    const fromPastors = Array.from(
      new Set(
        pastors.flatMap((p) => {
          if (Array.isArray(p.council)) return p.council;
          if (p.council) return [p.council];
          return [];
        }),
      ),
    ).filter((council): council is NonNullable<typeof council> => Boolean(council));
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
    [pastors],
  );

  const occupations = useMemo(
    () =>
      Array.from(new Set(pastors.map((p) => p.occupation)))
        .filter((occupation): occupation is NonNullable<typeof occupation> => occupation !== undefined)
        .sort(),
    [pastors],
  );

  const pastorFunctions = useMemo(() => {
    const fromPastors = Array.from(
      new Set(
        pastors.flatMap((p) => {
          if (Array.isArray(p.function)) return p.function;
          if (p.function) return [p.function];
          return [];
        }),
      ),
    ).filter((fn): fn is NonNullable<typeof fn> => Boolean(fn));

    const base = availablePastorFunctions.length > 0 ? availablePastorFunctions : [];
    return [...new Set([...base, ...fromPastors])];
  }, [pastors, availablePastorFunctions]);

  const ministryGroups = useMemo(() => {
    const fromPastors = Array.from(
      new Set(
        pastors.flatMap((p) => {
          if (Array.isArray(p.ministry_group)) return p.ministry_group;
          if (p.ministry_group) return [p.ministry_group];
          return [];
        }),
      ),
    ).filter((group): group is NonNullable<typeof group> => Boolean(group));

    const base = availableMinistryGroups.length > 0 ? availableMinistryGroups : [];
    return [...new Set([...base, ...fromPastors])];
  }, [pastors, availableMinistryGroups]);

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
        pastorFunctions={pastorFunctions}
        ministryGroups={ministryGroups}
      />,
    );
  }, [setFilterButton, filters, clergyTypes, councils, areas, countries, occupations, pastorFunctions, ministryGroups]);

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
            <Button
              variant="outline"
              size="sm"
              onClick={async () => await exportPastorsToExcel(filteredPastors, filteredPastors.length)}
              className="gap-2"
              title={
                filteredPastors.length < pastors.length
                  ? "Download filtered pastors as Excel"
                  : "Download all pastors as Excel"
              }
            >
              <Download className="h-4 w-4" />
            </Button>
            <PastorBulkUpload onSuccess={fetchPastors} />
            <PastorFormDialog onSuccess={fetchPastors} />
          </>
        )}
      </>,
    );
  }, [setAddButton, viewMode, fetchPastors, session, filteredPastors, pastors]);

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
          const pastorCode = pastor.personal_code || "";
          return (
            fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            clergyTypes.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pastorCode.toLowerCase().includes(searchQuery.toLowerCase())
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
          const pastorCouncils = Array.isArray(pastor.council)
            ? pastor.council
            : pastor.council
              ? [pastor.council]
              : [];

          if (filters.council.includes("None") && pastorCouncils.includes("None")) return true;
          return pastorCouncils.some((c) => filters.council.includes(c));
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

      // Ministry Group (multiple selection)
      if (filters.ministryGroup.length > 0) {
        filtered = filtered.filter((pastor) => {
          const ministryGroupArray = Array.isArray(pastor.ministry_group)
            ? pastor.ministry_group
            : pastor.ministry_group
              ? [pastor.ministry_group]
              : [];
          return filters.ministryGroup.some((group) => ministryGroupArray.includes(group as MinistryGroups));
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
      if (filters.ministryGroup.length > 0) {
        activeFiltersList.push(...filters.ministryGroup);
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

  const filteredPastorIds = useMemo(() => filteredPastors.map((pastor) => pastor.id), [filteredPastors]);

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
            pastorFunctions={pastorFunctions}
            ministryGroups={ministryGroups}
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
              <Button
                variant="outline"
                size="sm"
                onClick={async () => await exportPastorsToExcel(filteredPastors, filteredPastors.length)}
                className="gap-2"
                title={
                  filteredPastors.length < pastors.length
                    ? "Download filtered pastors as Excel"
                    : "Download all pastors as Excel"
                }
              >
                <Download className="h-4 w-4" />
              </Button>
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
            {filteredPastors.map((pastor, index) => (
              <Link
                key={pastor.id}
                href={`/clergy/${pastor.id}`}
                onClick={() => saveScrollPosition(filteredPastorIds)}
                className="group cursor-pointer flex flex-col items-center max-w-24 mx-auto"
              >
                <div className="relative w-24 h-32 rounded-lg overflow-hidden bg-muted mb-1.5 border-2 border-border hover:border-primary transition-all duration-300 hover:scale-125">
                  {pastor.profile_image ? (
                    <Image
                      src={pastor.profile_image}
                      alt={[pastor.first_name, pastor.middle_name, pastor.last_name].filter(Boolean).join(" ")}
                      fill
                      sizes="96px"
                      quality={60}
                      priority={index < 8}
                      className="object-cover"
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
                {pastor.personal_code && (
                  <p className="text-[10px] text-muted-foreground text-center w-24 truncate">{pastor.personal_code}</p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPastors.map((pastor, index) => (
              <Link
                key={pastor.id}
                href={`/clergy/${pastor.id}`}
                onClick={() => saveScrollPosition(filteredPastorIds)}
                className="flex items-center gap-4 p-4 rounded-lg bg-card hover:bg-muted/50 transition-colors border"
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0">
                  {pastor.profile_image ? (
                    <Image
                      src={pastor.profile_image}
                      alt={[pastor.first_name, pastor.middle_name, pastor.last_name].filter(Boolean).join(" ")}
                      fill
                      sizes="48px"
                      quality={60}
                      priority={index < 12}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-purple-500 to-blue-600">
                      <span className="text-white text-sm font-bold">{pastor.first_name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex gap-4">
                  <div className="min-w-0">
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
                    {pastor.personal_code && (
                      <p className="text-xs text-muted-foreground mt-1">{pastor.personal_code}</p>
                    )}
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
