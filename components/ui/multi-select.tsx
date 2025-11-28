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

  // Get computed colors from CSS variables
  const getComputedColor = (variable: string) => {
    if (typeof window !== "undefined") {
      const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
      return value ? `hsl(${value})` : undefined;
    }
    return undefined;
  };

  const customStyles: StylesConfig<MultiSelectOption, true> = {
    control: (base, state) => {
      const primaryColor = getComputedColor("--primary");
      const backgroundColor = getComputedColor("--background");

      return {
        ...base,
        minHeight: "2.5rem",
        borderRadius: "0.375rem",
        borderWidth: "2px",
        borderColor: state.isFocused
          ? primaryColor
          : primaryColor
          ? `${primaryColor.replace("hsl(", "hsla(").replace(")", ", 0.3)")}`
          : "#e5e7eb",
        backgroundColor: backgroundColor || "white",
        boxShadow: state.isFocused
          ? `0 0 0 3px ${
              primaryColor ? primaryColor.replace("hsl(", "hsla(").replace(")", ", 0.2)") : "rgba(139, 92, 246, 0.2)"
            }`
          : "none",
        cursor: "pointer",
        transition: "border-color 0.2s, box-shadow 0.2s",
        "&:hover": {
          borderColor: state.isFocused
            ? primaryColor
            : primaryColor
            ? `${primaryColor.replace("hsl(", "hsla(").replace(")", ", 0.5)")}`
            : "#d1d5db",
        },
      };
    },
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
