import { Label } from "../ui/label";
import { cn } from "../../lib/utils";

/**
 * FormField Component
 * Reusable field wrapper providing consistent labels, required indicators, hints, and inline validation messages.
 *
 * @param {Object} props
 * @param {string} [props.label]
 * @param {boolean} [props.required]
 * @param {string|null} [props.error]
 * @param {string} [props.htmlFor]
 * @param {React.ReactNode} props.children
 * @param {string} [props.hint]
 * @param {string} [props.className]
 */
export default function FormField({
  label,
  required = false,
  error = null,
  htmlFor,
  children,
  hint,
  className,
}) {
  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      {label && (
        <Label
          htmlFor={htmlFor}
          className="text-sm font-medium text-foreground flex items-center gap-1"
        >
          <span>{label}</span>
          {required && (
            <span className="text-rose-500 font-bold" aria-hidden="true">
              *
            </span>
          )}
        </Label>
      )}

      <div>{children}</div>

      {error ? (
        <p className="text-xs font-medium text-rose-500 animate-in fade-in-50">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
