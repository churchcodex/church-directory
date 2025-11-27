"use client";

import React from "react";
import ReactSelect, { Props as SelectProps, StylesConfig } from "react-select";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps
  extends Omit<SelectProps<SearchableSelectOption, false>, "options" | "value" | "onChange"> {
  options: SearchableSelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "default";
}

export default function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  className,
  size = "default",
  ...props
}: SearchableSelectProps) {
  const selectedOption = options.find((option) => option.value === value) || null;

  const customStyles: StylesConfig<SearchableSelectOption, false> = {
    control: (base, state) => ({
      ...base,
      minHeight: size === "sm" ? "2rem" : "2.25rem",
      height: size === "sm" ? "2rem" : "2.25rem",
      borderRadius: "0.375rem",
      borderColor: state.isFocused
        ? "hsl(var(--ring))"
        : state.selectProps["aria-invalid"]
        ? "hsl(var(--destructive))"
        : "hsl(var(--input))",
      backgroundColor: "hsl(var(--background))",
      boxShadow: state.isFocused ? "0 0 0 3px hsl(var(--ring) / 0.5)" : "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      fontSize: "0.875rem",
      transition: "color 0.2s, box-shadow 0.2s",
      cursor: "pointer",
      "&:hover": {
        borderColor: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--input))",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      height: size === "sm" ? "2rem" : "2.25rem",
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
      height: size === "sm" ? "2rem" : "2.25rem",
      backgroundColor: "hsl(var(--background))",
    }),
    dropdownIndicator: (base) => ({
      ...base,
      padding: "0 0.5rem",
      color: "hsl(var(--muted-foreground))",
      backgroundColor: "transparent",
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
      cursor: state.isDisabled ? "not-allowed" : "default",
      padding: "0.375rem 2rem 0.375rem 0.5rem",
      fontSize: "0.875rem",
      borderRadius: "0.125rem",
      position: "relative",
      "&:active": {
        backgroundColor: "hsl(var(--accent))",
      },
    }),
    placeholder: (base) => ({
      ...base,
      color: "hsl(var(--muted-foreground))",
    }),
    singleValue: (base) => ({
      ...base,
      color: "hsl(var(--foreground))",
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
      options={options}
      value={selectedOption}
      onChange={(option) => {
        if (option && onValueChange) {
          onValueChange(option.value);
        }
      }}
      placeholder={placeholder}
      className={cn("react-select-container", className)}
      classNamePrefix="react-select"
      styles={customStyles}
      isSearchable
      isClearable={false}
    />
  );
}
