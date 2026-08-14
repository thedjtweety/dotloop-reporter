/**
 * Number formatting utilities for consistent display across the application
 */

/**
 * Format a number as currency with 2 decimal places
 * @param value The number to format
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format currency for compact dashboard cards while retaining a full value for
 * tooltips, exports, and detailed reports. Examples: $477.4M, $970.5K.
 */
export function formatCompactCurrency(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(Number.isFinite(value) ? value : 0);
}

/** Format a dashboard trend consistently without long floating-point tails. */
export function formatTrendPercentage(value: number, maximumFractionDigits = 1): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue > 0 ? '+' : ''}${new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(safeValue)}%`;
}

/**
 * Format a number as a percentage with 2 decimal places
 * @param value The number to format (e.g., 10.5 for 10.5%)
 * @returns Formatted percentage string (e.g., "10.50%")
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Format a large number with commas and 2 decimal places if needed
 * @param value The number to format
 * @returns Formatted number string (e.g., "1,234.56")
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
