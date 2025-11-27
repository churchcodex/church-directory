"use client";

import React from "react";
import ReactSelect, { Props as SelectProps, StylesConfig, MultiValue } from "react-select";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps extends Omit<SelectProps<MultiSelectOption, true>, "options" | "value" | "onChange"> {
  options: MultiSelectOption[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function MultiSelect({
  options,
  value = [],
  onValueChange,
  placeholder = "Select...",
  className,
  ...props
}: MultiSelectProps) {
  const selectedOptions = options.filter((option) => value.includes(option.value));

  const customStyles: StylesConfig<MultiSelectOption, true> = {
    control: (base, state) => ({
      ...base,
      minHeight: "2.5rem",
      borderRadius: "0.375rem",
      borderColor: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--input))",
      backgroundColor: "hsl(var(--background))",
      boxShadow: state.isFocused ? "0 0 0 3px hsl(var(--ring) / 0.5)" : "none",
      cursor: "pointer",
      "&:hover": {
        borderColor: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--input))",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "0 0.75rem",
      backgroundColor: "hsl(var(--background))",
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
      color: "hsl(var(--foreground))",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    indicatorsContainer: (base) => ({
      ...base,
      backgroundColor: "hsl(var(--background))",
    }),
    dropdownIndicator: (base) => ({
      ...base,
      padding: "0 0.5rem",
      color: "hsl(var(--muted-foreground))",
      cursor: "pointer",
      "&:hover": {
        color: "hsl(var(--muted-foreground))",
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--popover)",
      border: "1px solid hsl(var(--border))",
      borderRadius: "0.375rem",
      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      zIndex: 50,
      overflow: "hidden",
    }),
    menuList: (base) => ({
      ...base,
      padding: "0.25rem",
      maxHeight: "200px",
      backgroundColor: "var(--popover)",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused
        ? "hsl(var(--accent))"
        : state.isSelected
        ? "hsl(var(--accent))"
        : "hsl(var(--popover))",
      color: state.isFocused || state.isSelected ? "hsl(var(--accent-foreground))" : "hsl(var(--popover-foreground))",
      cursor: state.isDisabled ? "not-allowed" : "pointer",
      padding: "0.375rem 2rem 0.375rem 0.5rem",
      fontSize: "0.875rem",
      borderRadius: "0.125rem",
      position: "relative",
      "&:active": {
        backgroundColor: "hsl(var(--accent))",
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "hsl(var(--accent))",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "hsl(var(--accent-foreground))",
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "hsl(var(--accent-foreground))",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: "hsl(var(--destructive))",
        color: "hsl(var(--destructive-foreground))",
      },
    }),
    placeholder: (base) => ({
      ...base,
      color: "hsl(var(--muted-foreground))",
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color: "hsl(var(--muted-foreground))",
      fontSize: "0.875rem",
    }),
  };

  return (
    <ReactSelect
      {...props}
      isMulti
      options={options}
      value={selectedOptions}
      onChange={(selected: MultiValue<MultiSelectOption>) => {
        if (onValueChange) {
          onValueChange(selected ? selected.map((option) => option.value) : []);
        }
      }}
      placeholder={placeholder}
      className={cn("react-select-container", className)}
      classNamePrefix="react-select"
      styles={customStyles}
      isSearchable
      isClearable
    />
  );
}
