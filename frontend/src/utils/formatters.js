import { getSystemSettings } from "../services/settingsService";

/**
 * Currency configuration metadata
 */
const CURRENCY_CONFIG = {
  USD: { locale: "en-US", currency: "USD", symbol: "$" },
  EUR: { locale: "de-DE", currency: "EUR", symbol: "€" },
  GBP: { locale: "en-GB", currency: "GBP", symbol: "£" },
  INR: { locale: "en-IN", currency: "INR", symbol: "₹" },
};

/**
 * Get active currency code and symbol from system settings
 */
export function getActiveCurrency() {
  try {
    const settings = getSystemSettings();
    const curr = (settings?.company?.currency || "USD").toUpperCase();
    return CURRENCY_CONFIG[curr] || { locale: "en-US", currency: curr, symbol: curr };
  } catch {
    return { locale: "en-US", currency: "USD", symbol: "$" };
  }
}

/**
 * Format a numeric amount using the active company currency
 */
export function formatCurrency(amount, maxDigits = 2) {
  if (amount == null || isNaN(amount)) return "—";
  const { locale, currency } = getActiveCurrency();
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      maximumFractionDigits: maxDigits,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toFixed(maxDigits)}`;
  }
}

/**
 * Format a date string to a readable format (e.g., 'Jan 15, 2025')
 */
export function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString).split("T")[0];
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(dateString).split("T")[0] || "—";
  }
}
