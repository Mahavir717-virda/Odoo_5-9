import React from "react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      {Icon && (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 text-slate-500 mb-4">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-800 mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mb-5">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-sm font-medium text-white bg-[#7743db] rounded-lg hover:bg-[#6334b8] active:bg-[#4f2795] focus:outline-none focus:ring-2 focus:ring-[#7743db] focus:ring-offset-1 transition-colors shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
