/**
 * Smart Data Cleaning Utilities
 * Handles normalization of messy data from various CSV sources
 */

import { parse, isValid, format } from 'date-fns';

/**
 * Clean and normalize currency/number strings
 * Handles: "$1,234.56", "1 234,56", "(500)", "-500", "1.2k"
 */
export function cleanNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  const str = String(value).trim();
  
  // Handle parentheses for negative numbers (accounting format)
  const isNegative = str.startsWith('(') && str.endsWith(')');
  
  // Remove currency symbols, commas, spaces, and non-numeric chars (except dot and minus)
  let cleanStr = str.replace(/[^0-9.-]/g, '');
  
  // Handle negative parentheses removal
  if (isNegative) {
    cleanStr = str.replace(/[^0-9.]/g, '');
  }

  const num = parseFloat(cleanStr);
  
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
}

/**
 * Clean and normalize percentage strings
 * Handles: "50%", "0.5", "50"
 */
export function cleanPercentage(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  const str = String(value).trim();
  const isPercent = str.includes('%');
  const num = cleanNumber(str);

  // If it had a % sign, it's already 0-100 scale usually (e.g. "50%")
  // If it was a small decimal (e.g. 0.5) without %, it might need scaling
  // But for safety, we usually assume the input is the raw value unless context implies otherwise
  return num;
}

/**
 * Parse various date formats into ISO string
 * Handles: "MM/DD/YYYY", "YYYY-MM-DD", "DD-MMM-YY", etc.
 */
export function cleanDate(value: any): string {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString();

  const str = String(value).trim();
  if (!str) return '';

  // Common formats to try
  const formats = [
    'M/d/yyyy',
    'MM/dd/yyyy',
    'yyyy-MM-dd',
    'd-MMM-yy',
    'dd-MMM-yyyy',
    'M/d/yy',
    'MM/dd/yy',
    'yyyy/MM/dd'
  ];

  for (const fmt of formats) {
    try {
      const date = parse(str, fmt, new Date());
      if (isValid(date)) {
        // Sanity check: year should be reasonable (e.g. between 1990 and 2100)
        const year = date.getFullYear();
        if (year > 1990 && year < 2100) {
          return date.toISOString();
        }
      }
    } catch (e) {
      // Continue to next format
    }
  }

  // Fallback: try native Date parse
  const nativeDate = new Date(str);
  if (isValid(nativeDate)) {
     const year = nativeDate.getFullYear();
     if (year > 1990 && year < 2100) {
       return nativeDate.toISOString();
     }
  }

  return '';
}

/**
 * Normalize text fields (trim, capitalize)
 */
export function cleanText(value: any): string {
  if (!value) return '';
  return String(value).trim();
}

/**
 * Infer data type of a column based on sample values
 */
export function inferColumnType(values: any[]): 'date' | 'currency' | 'number' | 'text' {
  let dateCount = 0;
  let currencyCount = 0;
  let numberCount = 0;
  const sampleSize = Math.min(values.length, 20); // Check first 20 non-empty rows

  let checked = 0;
  for (const val of values) {
    if (!val) continue;
    if (checked >= sampleSize) break;
    
    const str = String(val).trim();
    
    // Check Date
    if (cleanDate(str)) dateCount++;
    
    // Check Currency (contains $ or starts with number)
    if (str.includes('$') || (cleanNumber(str) !== 0 && !isNaN(parseFloat(str)))) {
      currencyCount++;
    }
    
    // Check Pure Number
    if (!isNaN(Number(str))) numberCount++;
    
    checked++;
  }

  if (checked === 0) return 'text';

  // Heuristics
  if (dateCount > checked * 0.8) return 'date';
  if (currencyCount > checked * 0.8) return 'currency';
  if (numberCount > checked * 0.8) return 'number';
  
  return 'text';
}
