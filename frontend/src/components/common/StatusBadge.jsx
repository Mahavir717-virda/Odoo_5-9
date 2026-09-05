import React from "react";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";

/**
 * Default status mappings per specification.
 */
const DEFAULT_STATUS_MAP = {
  // Success (Green)
  active: "success",
  approved: "success",
  paid: "success",
  present: "success",
  validated: "success",

  // Warning (Amber)
  pending: "warning",
  late: "warning",
  expiring: "warning",
  "on leave": "warning",

  // Danger (Red)
  refused: "danger",
  absent: "danger",
  error: "danger",
  duplicate: "danger",
  missing: "danger",
  inactive: "danger",

  // Neutral (Gray)
  draft: "neutral",
  cancelled: "neutral",
};

const VARIANT_STYLES = {
  success:
    "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  warning:
    "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  danger:
    "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  neutral:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

/**
 * StatusBadge Component
 * Semantic pill badge with standardized colors for system states.
 *
 * @param {Object} props
 * @param {string} props.status - The status label (e.g. "Active", "Pending", "Inactive").
 * @param {Object} [props.mapOverride] - Optional custom status->variant overrides.
 * @param {string} [props.className] - Additional classes.
 */
export default function StatusBadge({ status, mapOverride, customMap, className }) {
  if (!status) return null;

  const overrides = mapOverride || customMap || {};
  const normalized = String(status).trim().toLowerCase();
  const variant = overrides[normalized] || DEFAULT_STATUS_MAP[normalized] || "neutral";
  const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.neutral;

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium border inline-flex items-center gap-1.5 transition-colors",
        variantClass,
        className
      )}
    >
      <span
        className={cn("w-1.5 h-1.5 rounded-full shrink-0", {
          "bg-emerald-500": variant === "success",
          "bg-amber-500": variant === "warning",
          "bg-rose-500": variant === "danger",
          "bg-slate-400": variant === "neutral",
        })}
      />
      {status}
    </Badge>
  );
}
