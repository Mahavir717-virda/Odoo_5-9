/**
 * DataTable Component
 * Fully generic, reusable data table built on shadcn/ui primitives.
 *
 * PROP API:
 * - columns: Array<{
 *     key: string,
 *     header: string | ReactNode,
 *     sortable?: boolean,
 *     render?: (row: Object) => ReactNode,
 *     width?: string
 *   }>
 * - data: Array<Object> (each item must have a unique `id`)
 * - loading: boolean (renders 5 shimmer skeleton rows)
 * - error: string | null (renders inline error state with optional retry button)
 * - onRetry: () => void (retry callback when error state is active)
 * - emptyState: { icon, title, description, actionLabel, onAction } (passed to EmptyState)
 * - onRowClick: (row: Object) => void (callback when row is clicked, ignores actions)
 * - pageSize: number (default 10)
 * - searchable: boolean (renders search input above table)
 * - searchPlaceholder: string
 * - searchValue: string (controlled from parent)
 * - onSearchChange: (value: string) => void
 * - className: string
 */

import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/table";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import EmptyState from "./EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
  RefreshCw,
  MoreVertical,
} from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Reusable RowActionsMenu sub-component for generic action menus
 */
export function RowActionsMenu({ items = [], align = "end", className }) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn("flex items-center justify-end", className)}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-36">
          {items.map((item, idx) => {
            if (item.hidden) return null;
            const ItemIcon = item.icon;
            return (
              <DropdownMenuItem
                key={idx}
                onClick={item.onClick}
                className={cn("text-xs cursor-pointer gap-2", item.className)}
              >
                {ItemIcon && <ItemIcon className="h-3.5 w-3.5" />}
                {item.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  error = null,
  onRetry,
  emptyState,
  onRowClick,
  pageSize = 10,
  searchable = false,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  className,
}) {
  // Client-side sort state: { key: string, direction: "asc" | "desc" | null }
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Handle header click for sorting
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) {
        return { key, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      return { key: null, direction: null };
    });
  };

  // Sort data internally
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];

      if (valA == null && valB == null) return 0;
      if (valA == null) return sortConfig.direction === "asc" ? -1 : 1;
      if (valB == null) return sortConfig.direction === "asc" ? 1 : -1;

      if (typeof valA === "number" && typeof valB === "number") {
        return sortConfig.direction === "asc" ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      return sortConfig.direction === "asc"
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  }, [data, sortConfig]);

  // Reset to page 1 if data or pageSize changes
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Sliced data for current page
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const startRecord = sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, sortedData.length);

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Optional Search Bar */}
      {searchable && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-auto max-h-[650px] relative">
          <Table className="w-full">
            <TableHeader className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                {columns.map((col) => {
                  const isSortable = Boolean(col.sortable);
                  const isSorted = sortConfig.key === col.key;

                  return (
                    <TableHead
                      key={col.key}
                      style={{ width: col.width }}
                      className={cn(
                        "font-semibold text-[11px] uppercase tracking-wider text-slate-700 select-none py-3 px-4 bg-[#f7efe5]/70 border-b border-[#eae0d5]",
                        isSortable && "cursor-pointer hover:text-[#7743db] transition-colors"
                      )}
                      onClick={() => isSortable && handleSort(col.key)}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.header}</span>
                        {isSortable && (
                          <span className="inline-flex shrink-0">
                            {isSorted && sortConfig.direction === "asc" ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[#7743db]" />
                            ) : isSorted && sortConfig.direction === "desc" ? (
                              <ArrowDown className="w-3.5 h-3.5 text-[#7743db]" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100 transition-opacity" />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* Loading State: 5 skeleton rows */}
              {loading &&
                Array.from({ length: 5 }).map((_, rIndex) => (
                  <TableRow key={`skeleton-row-${rIndex}`}>
                    {columns.map((col, cIndex) => (
                      <TableCell key={`skeleton-cell-${rIndex}-${cIndex}`} className="py-3.5 px-4">
                        <Skeleton className="h-5 w-full max-w-[80%]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {/* Error State */}
              {!loading && error && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center p-6 space-y-3">
                      <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-sm text-foreground">
                          Failed to load data
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
                          {error}
                        </p>
                      </div>
                      {onRetry && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onRetry}
                          className="mt-2 text-xs flex items-center gap-1.5 border-[#eae0d5] hover:bg-[#f7efe5]"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {/* Empty State */}
              {!loading && !error && paginatedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-72 text-center p-6">
                    {emptyState ? (
                      <EmptyState
                        icon={emptyState.icon}
                        title={emptyState.title}
                        description={emptyState.description}
                        actionLabel={emptyState.actionLabel}
                        onAction={emptyState.onAction}
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground py-12">
                        No records found
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}

              {/* Data Rows */}
              {!loading &&
                !error &&
                paginatedData.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={cn(
                      "transition-colors border-b border-[#eae0d5]/60 last:border-0",
                      onRowClick && "cursor-pointer hover:bg-[#f7efe5]/50"
                    )}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={`${row.id}-${col.key}`}
                        className="py-3 px-4 text-sm text-[#1e1b24] align-middle"
                      >
                        {col.render ? col.render(row) : row[col.key] ?? "—"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {!loading && !error && sortedData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#eae0d5] bg-[#f7efe5]/50 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-[#1e1b24]">{startRecord}</span> to{" "}
              <span className="font-semibold text-[#1e1b24]">{endRecord}</span> of{" "}
              <span className="font-semibold text-[#1e1b24]">{sortedData.length}</span> records
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs border-[#eae0d5] bg-white hover:bg-[#f7efe5]"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>

              <span className="px-2 text-xs font-medium text-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs border-[#eae0d5] bg-white hover:bg-[#f7efe5]"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
