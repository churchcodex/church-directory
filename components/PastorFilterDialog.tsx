"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import SearchableSelect from "@/components/ui/searchable-select";
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
import { ClergyType, MaritalStatus, Gender, Council } from "@/types/entities";

interface PastorFilterDialogProps {
  onApplyFilters: (filters: FilterState) => void;
  initialFilters: FilterState;
  clergyTypes: ClergyType[];
  councils: Council[];
  countries: string[];
  occupations: string[];
}

export interface FilterState {
  clergyType: string;
  maritalStatus: string;
  gender: string;
  council: string;
  country: string;
  occupation: string;
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
  countries,
  occupations,
}: PastorFilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const handleApply = () => {
    onApplyFilters(filters);
    setOpen(false);
  };

  const handleReset = () => {
    const emptyFilters: FilterState = {
      clergyType: "all",
      maritalStatus: "all",
      gender: "all",
      council: "all",
      country: "all",
      occupation: "all",
      minAge: "",
      maxAge: "",
    };
    setFilters(emptyFilters);
    onApplyFilters(emptyFilters);
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => value && value !== "all" && value !== ""
  ).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 relative">
          <Filter className="h-4 w-4" />
          Filters
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
              <SearchableSelect
                options={[
                  { value: "all", label: "All Titles" },
                  ...clergyTypes.map((type) => ({ value: type, label: type })),
                ]}
                value={filters.clergyType}
                onValueChange={(value) => setFilters({ ...filters, clergyType: value })}
                placeholder="Select title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-marital-status">Marital Status</Label>
              <SearchableSelect
                options={[
                  { value: "all", label: "All Statuses" },
                  ...maritalStatuses.map((status) => ({ value: status, label: status })),
                ]}
                value={filters.maritalStatus}
                onValueChange={(value) => setFilters({ ...filters, maritalStatus: value })}
                placeholder="Select status"
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
              <SearchableSelect
                options={[
                  { value: "all", label: "All Councils" },
                  ...councils.map((council) => ({ value: council, label: council })),
                ]}
                value={filters.council}
                onValueChange={(value) => setFilters({ ...filters, council: value })}
                placeholder="Select council"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-country">Country</Label>
              <SearchableSelect
                options={[
                  { value: "all", label: "All Countries" },
                  ...countries.map((country) => ({ value: country, label: country })),
                ]}
                value={filters.country}
                onValueChange={(value) => setFilters({ ...filters, country: value })}
                placeholder="Select country"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-occupation">Occupation</Label>
              <SearchableSelect
                options={[
                  { value: "all", label: "All Occupations" },
                  ...occupations.map((occupation) => ({ value: occupation, label: occupation })),
                ]}
                value={filters.occupation}
                onValueChange={(value) => setFilters({ ...filters, occupation: value })}
                placeholder="Select occupation"
              />
            </div>
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
