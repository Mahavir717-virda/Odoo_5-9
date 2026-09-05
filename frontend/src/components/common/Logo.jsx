import React from "react";
import logoImg from "../../assets/logo.png";

/**
 * PeoplePay360 Brand Logo Component using the official logo image
 */
export default function Logo({
  size = "md",
  lightText = false, // true when placed on dark backgrounds like Sidebar
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
      <div
        className={`inline-flex items-center justify-center rounded-xl bg-white/95 p-1.5 shadow-md shadow-black/20 ${className}`}
        style={{ height: `${pixelHeight}px` }}
      >
        <img
          src={logoImg}
          alt="PeoplePay360 Logo"
          className="h-full w-auto object-contain rounded-lg"
        />
      </div>
    );
  }

  // Rendered on light backgrounds
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img
        src={logoImg}
        alt="PeoplePay360 Logo"
        className="w-auto object-contain"
        style={{ height: `${pixelHeight}px` }}
      />
    </div>
  );
}
