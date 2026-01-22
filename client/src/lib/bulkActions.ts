/**
 * Bulk Actions Utility Module
 * Handles bulk operations on multiple transactions
 */

import { DotloopRecord } from './csvParser';
import { exportAsCSV, exportAsExcel } from './exportUtils';
import { openMultipleInDotloop } from './dotloopUtils';

/**
 * Bulk action types
 */
export type BulkActionType = 'export-csv' | 'export-excel' | 'open-dotloop' | 'tag' | 'print';

/**
 * Bulk selection state
 */
export interface BulkSelectionState {
  selectedIds: Set<string>;
  selectAll: boolean;
  totalCount: number;
}

/**
 * Create initial bulk selection state
 */
export function createBulkSelectionState(totalCount: number): BulkSelectionState {
  return {
    selectedIds: new Set(),
    selectAll: false,
    totalCount,
  };
}

/**
 * Toggle selection for a single transaction
 */
export function toggleSelection(
  state: BulkSelectionState,
  recordId: string
): BulkSelectionState {
  const newState = { ...state, selectedIds: new Set(state.selectedIds) };
  
  if (newState.selectedIds.has(recordId)) {
    newState.selectedIds.delete(recordId);
    newState.selectAll = false;
  } else {
    newState.selectedIds.add(recordId);
  }
  
  return newState;
}

/**
 * Select all transactions
 */
export function selectAll(records: DotloopRecord[]): BulkSelectionState {
  const ids = new Set(records.map((_, idx) => idx.toString()));
  return {
    selectedIds: ids,
    selectAll: true,
    totalCount: records.length,
  };
}

/**
 * Deselect all transactions
 */
export function deselectAll(): BulkSelectionState {
  return {
    selectedIds: new Set(),
    selectAll: false,
    totalCount: 0,
  };
}

/**
 * Get selected records from a list
 */
export function getSelectedRecords(
  records: DotloopRecord[],
  selectedIds: Set<string>
): DotloopRecord[] {
  return records.filter((_, idx) => selectedIds.has(idx.toString()));
}

/**
 * Check if a record is selected
 */
export function isSelected(selectedIds: Set<string>, recordIndex: number): boolean {
  return selectedIds.has(recordIndex.toString());
}

/**
 * Get selection count
 */
export function getSelectionCount(selectedIds: Set<string>): number {
  return selectedIds.size;
}

/**
 * Get selection percentage
 */
export function getSelectionPercentage(
  selectedIds: Set<string>,
  totalCount: number
): number {
  if (totalCount === 0) return 0;
  return Math.round((selectedIds.size / totalCount) * 100);
}

/**
 * Perform bulk export as CSV
 */
export function performBulkExportCSV(
  records: DotloopRecord[],
  selectedRecords: DotloopRecord[],
  title: string
): void {
  if (selectedRecords.length === 0) {
    console.warn('No records selected for export');
    return;
  }
  
  exportAsCSV({
    title: `${title} - Bulk Export (${selectedRecords.length} records)`,
    records: selectedRecords,
  });
}

/**
 * Perform bulk export as Excel
 */
export function performBulkExportExcel(
  records: DotloopRecord[],
  selectedRecords: DotloopRecord[],
  title: string
): void {
  if (selectedRecords.length === 0) {
    console.warn('No records selected for export');
    return;
  }
  
  exportAsExcel({
    title: `${title} - Bulk Export (${selectedRecords.length} records)`,
    records: selectedRecords,
  });
}

/**
 * Perform bulk open in Dotloop
 */
export function performBulkOpenDotloop(selectedRecords: DotloopRecord[]): void {
  if (selectedRecords.length === 0) {
    console.warn('No records selected to open in Dotloop');
    return;
  }
  
  openMultipleInDotloop(selectedRecords);
}

/**
 * Perform bulk tag operation
 */
export function performBulkTag(
  selectedRecords: DotloopRecord[],
  tags: string[]
): DotloopRecord[] {
  if (selectedRecords.length === 0) {
    console.warn('No records selected for tagging');
    return selectedRecords;
  }
  
  return selectedRecords.map(record => {
    const existingTags = record.tags || [];
    const allTags = [...existingTags, ...tags];
    const uniqueTags = Array.from(new Set(allTags));
    return {
      ...record,
      tags: uniqueTags,
    };
  })
}

/**
 * Perform bulk remove tags operation
 */
export function performBulkRemoveTags(
  selectedRecords: DotloopRecord[],
  tagsToRemove: string[]
): DotloopRecord[] {
  if (selectedRecords.length === 0) {
    console.warn('No records selected for tag removal');
    return selectedRecords;
  }
  
  return selectedRecords.map(record => ({
    ...record,
    tags: (record.tags || []).filter(tag => !tagsToRemove.includes(tag)),
  }));
}

/**
 * Get bulk action summary
 */
export function getBulkActionSummary(
  selectedCount: number,
  totalCount: number,
  action: BulkActionType
): string {
  const percentage = Math.round((selectedCount / totalCount) * 100);
  
  switch (action) {
    case 'export-csv':
      return `Export ${selectedCount} of ${totalCount} records (${percentage}%) as CSV`;
    case 'export-excel':
      return `Export ${selectedCount} of ${totalCount} records (${percentage}%) as Excel`;
    case 'open-dotloop':
      return `Open ${selectedCount} of ${totalCount} records (${percentage}%) in Dotloop`;
    case 'tag':
      return `Tag ${selectedCount} of ${totalCount} records (${percentage}%)`;
    case 'print':
      return `Print ${selectedCount} of ${totalCount} records (${percentage}%)`;
    default:
      return `${selectedCount} of ${totalCount} records selected (${percentage}%)`;
  }
}

/**
 * Validate bulk action
 */
export function validateBulkAction(
  selectedCount: number,
  action: BulkActionType
): { valid: boolean; message?: string } {
  if (selectedCount === 0) {
    return {
      valid: false,
      message: 'Please select at least one record to perform this action',
    };
  }
  
  if (action === 'open-dotloop' && selectedCount > 10) {
    return {
      valid: true,
      message: `Opening ${selectedCount} records in Dotloop. This will open multiple browser tabs.`,
    };
  }
  
  return { valid: true };
}
