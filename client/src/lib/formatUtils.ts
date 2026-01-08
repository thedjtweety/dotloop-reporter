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
