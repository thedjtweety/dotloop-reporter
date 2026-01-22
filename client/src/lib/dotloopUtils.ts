/**
 * Dotloop Integration Utilities
 * Handles generating deep links and managing Dotloop interactions
 */

import { DotloopRecord } from './csvParser';

/**
 * Generate a Dotloop view URL for a transaction
 * Uses the loopViewUrl from the record if available
 */
export function getDotloopViewUrl(record: DotloopRecord): string | null {
  if (record.loopViewUrl) {
    return record.loopViewUrl;
  }
  
  // Fallback: construct URL from loopId if available
  if (record.loopId) {
    return `https://dotloop.com/loop/${record.loopId}`;
  }
  
  return null;
}

/**
 * Open a transaction in Dotloop
 */
export function openInDotloop(record: DotloopRecord): void {
  const url = getDotloopViewUrl(record);
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Open multiple transactions in Dotloop
 * Opens each in a new tab
 */
export function openMultipleInDotloop(records: DotloopRecord[]): void {
  records.forEach((record) => {
    const url = getDotloopViewUrl(record);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  });
}

/**
 * Check if a record has a valid Dotloop URL
 */
export function hasDotloopUrl(record: DotloopRecord): boolean {
  return !!getDotloopViewUrl(record);
}

/**
 * Get Dotloop search URL for filtering transactions
 * Useful for searching by agent, status, or other criteria
 */
export function getDotloopSearchUrl(criteria: {
  agent?: string;
  status?: string;
  dateRange?: { from: Date; to: Date };
}): string {
  const params = new URLSearchParams();
  
  if (criteria.agent) {
    params.append('agent', criteria.agent);
  }
  
  if (criteria.status) {
    params.append('status', criteria.status);
  }
  
  if (criteria.dateRange) {
    params.append('from', criteria.dateRange.from.toISOString().split('T')[0]);
    params.append('to', criteria.dateRange.to.toISOString().split('T')[0]);
  }
  
  return `https://dotloop.com/search?${params.toString()}`;
}

/**
 * Format transaction info for display with Dotloop link
 */
export function formatTransactionWithLink(record: DotloopRecord): {
  name: string;
  url: string | null;
  hasLink: boolean;
} {
  return {
    name: record.loopName || 'Unknown Transaction',
    url: getDotloopViewUrl(record),
    hasLink: hasDotloopUrl(record),
  };
}

/**
 * Get a batch of Dotloop URLs from records
 * Useful for bulk operations
 */
export function getBatchDotloopUrls(records: DotloopRecord[]): string[] {
  return records
    .map((record) => getDotloopViewUrl(record))
    .filter((url): url is string => url !== null);
}

/**
 * Create a Dotloop deep link with parameters
 */
export function createDotloopDeepLink(loopId: string, params?: Record<string, string>): string {
  let url = `https://dotloop.com/loop/${loopId}`;
  
  if (params && Object.keys(params).length > 0) {
    const queryParams = new URLSearchParams(params);
    url += `?${queryParams.toString()}`;
  }
  
  return url;
}
