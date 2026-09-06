import React from "react";
import { cn } from "../../lib/utils";
import { Sparkles } from "lucide-react";

/**
 * PageHeader Component
 * Premium, state-of-the-art header banner for module pages.
 */
export default function PageHeader({ title, subtitle, actions, icon: Icon, className }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-r from-white via-slate-50/80 to-teal-50/30 p-5 md:p-6 border border-slate-200/80 shadow-xs backdrop-blur-sm mb-6 transition-all duration-200 hover:shadow-sm",
        className
      )}
    >
      {/* Decorative subtle background ambient glow */}
      <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute left-0 top-0 w-1.5 h-full bg-gradient-to-b from-teal-500 via-teal-600 to-sky-500 rounded-l-2xl" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
        <div className="flex items-start sm:items-center gap-3.5">
          {Icon ? (
            <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-sm shadow-teal-500/20 shrink-0">
              <Icon className="w-6 h-6" />
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 shrink-0">
              <Sparkles className="w-5 h-5 text-teal-600" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2.5">
              <h1
                className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans"
                style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
              >
                {title}
              </h1>
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1 max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto pt-2 sm:pt-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
