import React from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Search, X } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * FilterBar Component
 * Fully generic, modular filter row supporting search, dynamic select dropdowns, and clear action.
 *
 * @param {Object} props
 * @param {string} [props.searchValue]
 * @param {Function} [props.onSearchChange]
 * @param {string} [props.searchPlaceholder]
 * @param {Array<{ key: string, label: string, options: Array<{ value: string, label: string }>, value: string, onChange: Function }>} [props.filters]
 * @param {Function} [props.onClearAll]
 * @param {string} [props.className]
 */
export default function FilterBar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  onClearAll,
  className,
}) {
  // Determine if any filter or search is active
  const hasActiveFilters = Boolean(
    (searchValue && searchValue.trim().length > 0) ||
      filters.some((f) => f.value && f.value !== "all" && f.value !== "")
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 w-full bg-card p-3 rounded-lg border border-border shadow-sm",
        className
      )}
    >
      {/* Search Input */}
      {onSearchChange && (
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 h-9 text-sm bg-background border-border/80 focus-visible:ring-1"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Dynamic Select Filters */}
      {filters.map((filter) => {
        const currentValue = filter.value || "all";
        const allOptionLabel = `All ${filter.label}s`;

        return (
          <div key={filter.key} className="w-[160px] sm:w-[175px]">
            <Select
              value={currentValue}
              onValueChange={(val) => filter.onChange && filter.onChange(val)}
            >
              <SelectTrigger className="h-9 text-xs bg-background border-border/80 capitalize">
                <SelectValue placeholder={`All ${filter.label}s`} />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all" className="text-xs font-medium">
                  {allOptionLabel}
                </SelectItem>
                {filter.options.map((opt) => (
                  <SelectItem
                    key={`${filter.key}-${opt.value}`}
                    value={opt.value}
                    className="text-xs"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}

      {/* Clear Filters Button */}
      {hasActiveFilters && onClearAll && (
        <div className="ml-auto flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive transition-colors gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

