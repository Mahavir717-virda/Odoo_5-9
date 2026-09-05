import { Skeleton } from "../ui/skeleton";
import { Card, CardContent } from "../ui/card";
import { cn } from "../../lib/utils";

/**
 * SmartButton Component
 * Metric card button providing one-click overview and direct tab switching.
 *
 * @param {Object} props
 * @param {string} props.label - Metric label (e.g. "Contracts", "Attendance").
 * @param {number|string} [props.count] - Metric count value.
 * @param {React.ComponentType} props.icon - Lucide icon component.
 * @param {Function} [props.onClick] - Click handler.
 * @param {boolean} [props.loading] - Whether count is loading (shows Skeleton).
 * @param {string} [props.className] - Optional extra class names.
 */
export default function SmartButton({
  label,
  count,
  icon: Icon,
  onClick,
  loading = false,
  className,
}) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer border border-border bg-card transition-all duration-200",
        "hover:border-primary/50 hover:bg-primary/5 hover:shadow-xs",
        "min-w-[130px] flex-1 select-none",
        className
      )}
    >
      <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          {Icon && (
            <div className="p-1.5 rounded-md bg-muted text-muted-foreground">
              <Icon className="w-4 h-4 text-primary" />
            </div>
          )}

          {loading ? (
            <Skeleton className="h-6 w-8 rounded" />
          ) : (
            <span className="text-xl font-bold text-foreground tracking-tight">
              {count ?? 0}
            </span>
          )}
        </div>

        <span className="text-xs font-medium text-muted-foreground truncate">
          {label}
        </span>
      </CardContent>
    </Card>
  );
}
