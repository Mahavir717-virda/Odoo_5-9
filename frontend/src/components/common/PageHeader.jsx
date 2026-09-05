import React from "react";
import { cn } from "../../lib/utils";

/**
 * PageHeader Component
 * Standard header banner for module pages with title, subtitle, and action buttons.
 *
 * @param {Object} props
 * @param {string} props.title - Main header title.
 * @param {string} [props.subtitle] - Supporting description text.
 * @param {React.ReactNode} [props.actions] - Action buttons group (e.g. Add, Export, Import).
 * @param {string} [props.className] - Additional wrapper classes.
 */
export default function PageHeader({ title, subtitle, actions, className }) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60",
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
