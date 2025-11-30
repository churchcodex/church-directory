"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import SearchableSelect from "@/components/ui/searchable-select";
import MultiSelect from "@/components/ui/multi-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Filter, X } from "lucide-react";
import { ClergyType, MaritalStatus, Gender, Council, Area, Status } from "@/types/entities";

interface PastorFilterDialogProps {
  onApplyFilters: (filters: FilterState) => void;
  initialFilters: FilterState;
  clergyTypes: ClergyType[];
  councils: Council[];
  areas: Area[];
  countries: string[];
  occupations: string[];
}

export interface FilterState {
  clergyType: string[];
  maritalStatus: string[];
  gender: string;
  council: string[];
  area: string[];
  country: string[];
  occupation: string[];
  minAge: string;
  maxAge: string;
}

const maritalStatuses: MaritalStatus[] = ["Single", "Married", "Divorced", "Widowed"];
const genders: Gender[] = ["Male", "Female"];

export default function PastorFilterDialog({
  onApplyFilters,
  initialFilters,
  clergyTypes,
  councils,
  areas,
  countries,
  occupations,
}: PastorFilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  // Sync internal state with initialFilters when dialog opens or initialFilters change
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters, open]);

  const handleApply = () => {
    onApplyFilters(filters);
    setOpen(false);
  };

  const handleReset = () => {
    const emptyFilters: FilterState = {
      clergyType: [],
      maritalStatus: [],
      gender: "all",
      council: [],
      area: [],
      country: [],
      occupation: [],
      minAge: "",
      maxAge: "",
    };
    setFilters(emptyFilters);
    onApplyFilters(emptyFilters);
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value && value !== "all" && value !== "";
  }).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 relative p-4">
          <Filter className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filter Pastors</DialogTitle>
          <DialogDescription>Apply filters to narrow down your search</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-clergy-type">Pastor Title</Label>
              <MultiSelect
                options={clergyTypes.map((type) => ({ value: type, label: type }))}
                value={filters.clergyType}
                onValueChange={(value) => setFilters({ ...filters, clergyType: value })}
                placeholder="Select title(s)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-marital-status">Marital Status</Label>
              <MultiSelect
                options={maritalStatuses.map((status) => ({ value: status, label: status }))}
                value={filters.maritalStatus}
                onValueChange={(value) => setFilters({ ...filters, maritalStatus: value })}
                placeholder="Select status(es)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-gender">Gender</Label>
              <SearchableSelect
                options={[
                  { value: "all", label: "All Genders" },
                  ...genders.map((gender) => ({ value: gender, label: gender })),
                ]}
                value={filters.gender}
                onValueChange={(value) => setFilters({ ...filters, gender: value })}
                placeholder="Select gender"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-council">Council</Label>
              <MultiSelect
                options={councils.map((council) => ({ value: council, label: council }))}
                value={filters.council}
                onValueChange={(value) => setFilters({ ...filters, council: value })}
                placeholder="Select council(s)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-area">Area</Label>
              <MultiSelect
                options={[{ value: "none", label: "No Area" }, ...areas.map((area) => ({ value: area, label: area }))]}
                value={filters.area}
                onValueChange={(value) => setFilters({ ...filters, area: value })}
                placeholder="Select area(s)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-country">Country</Label>
              <MultiSelect
                options={countries.map((country) => ({ value: country, label: country }))}
                value={filters.country}
                onValueChange={(value) => setFilters({ ...filters, country: value })}
                placeholder="Select countr(ies)"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-occupation">Occupation</Label>
            <MultiSelect
              options={occupations.map((occupation) => ({ value: occupation, label: occupation }))}
              value={filters.occupation}
              onValueChange={(value) => setFilters({ ...filters, occupation: value })}
              placeholder="Select occupation(s)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-min-age">Min Age</Label>
              <Input
                id="filter-min-age"
                type="number"
                placeholder="Min age"
                value={filters.minAge}
                onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-max-age">Max Age</Label>
              <Input
                id="filter-max-age"
                type="number"
                placeholder="Max age"
                value={filters.maxAge}
                onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
                min="0"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleReset} className="gap-2">
            <X className="h-4 w-4" />
            Clear All
          </Button>
          <Button type="button" onClick={handleApply}>
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
