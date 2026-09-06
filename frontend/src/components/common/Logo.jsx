import React from "react";
import logoImg from "../../assets/logo.png";

/**
 * PeoplePay360 Brand Logo Component using the official logo image
 */
export default function Logo({
  size = "md",
  lightText = false, // true when placed on dark backgrounds like Sidebar
  showText = true, // true to show PeoplePay360 company name text next to logo
  className = "",
}) {
  const sizeMap = {
    xs: 28,
    sm: 36,
    md: 44,
    lg: 56,
    xl: 72,
    "2xl": 96,
  };

  const pixelHeight = typeof size === "number" ? size : sizeMap[size] || 44;

  if (lightText) {
    // Rendered on dark backgrounds (Sidebar, dark banner)
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        <div
          className="inline-flex items-center justify-center rounded-xl bg-white/95 p-1.5 shadow-md shadow-black/20 shrink-0"
          style={{ height: `${pixelHeight}px` }}
        >
          <img
            src={logoImg}
            alt="PeoplePay360 Logo"
            className="h-full w-auto object-contain rounded-lg"
          />
        </div>
        {showText && (
          <span
            className="font-extrabold tracking-tight text-[#38bdf8] text-xl select-none whitespace-nowrap drop-shadow-sm"
            style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
          >
            PeoplePay360
          </span>
        )}
      </div>
    );
  }

  // Rendered on light backgrounds
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={logoImg}
        alt="PeoplePay360 Logo"
        className="w-auto object-contain shrink-0"
        style={{ height: `${pixelHeight}px` }}
      />
      {showText && (
        <span
          className="font-extrabold tracking-tight text-[#38bdf8] text-xl select-none whitespace-nowrap drop-shadow-xs"
          style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
        >
          PeoplePay360
        </span>
      )}
    </div>
  );
}
