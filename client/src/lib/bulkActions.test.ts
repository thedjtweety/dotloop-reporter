import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createBulkSelectionState,
  toggleSelection,
  selectAll,
  deselectAll,
  getSelectedRecords,
  isSelected,
  getSelectionCount,
  getSelectionPercentage,
  performBulkTag,
  performBulkRemoveTags,
  getBulkActionSummary,
  validateBulkAction,
} from './bulkActions';
import { DotloopRecord } from './csvParser';

describe('Bulk Actions', () => {
  const mockRecords: DotloopRecord[] = [
    {
      loopId: '1',
      loopViewUrl: 'https://dotloop.com/loop/1',
      loopName: 'Deal 1',
      loopStatus: 'Closed',
      createdDate: '2025-01-01',
      closingDate: '2025-01-15',
      listingDate: '2024-12-01',
      offerDate: '2025-01-05',
      address: '123 Main St',
      price: 500000,
      propertyType: 'Single Family',
      bedrooms: 3,
      bathrooms: 2,
      squareFootage: 2000,
      city: 'Springfield',
      state: 'IL',
      county: 'Sangamon',
      leadSource: 'MLS',
      earnestMoney: 10000,
      salePrice: 500000,
      commissionRate: 0.06,
      commissionTotal: 30000,
      agents: 'John Doe',
      createdBy: 'John Doe',
      buySideCommission: 15000,
      sellSideCommission: 15000,
      companyDollar: 15000,
      referralSource: 'Internal',
      referralPercentage: 0,
      complianceStatus: 'Compliant',
      tags: ['urgent'],
      originalPrice: 520000,
      yearBuilt: 2000,
      lotSize: 0.5,
      subdivision: 'Oakwood',
    },
    {
      loopId: '2',
      loopViewUrl: 'https://dotloop.com/loop/2',
      loopName: 'Deal 2',
      loopStatus: 'Active',
      createdDate: '2025-01-02',
      closingDate: '2025-02-15',
      listingDate: '2024-12-02',
      offerDate: '2025-01-06',
      address: '456 Oak Ave',
      price: 600000,
      propertyType: 'Condo',
      bedrooms: 2,
      bathrooms: 1,
      squareFootage: 1500,
      city: 'Springfield',
      state: 'IL',
      county: 'Sangamon',
      leadSource: 'Referral',
      earnestMoney: 12000,
      salePrice: 600000,
      commissionRate: 0.06,
      commissionTotal: 36000,
      agents: 'Jane Smith',
      createdBy: 'Jane Smith',
      buySideCommission: 18000,
      sellSideCommission: 18000,
      companyDollar: 18000,
      referralSource: 'Client',
      referralPercentage: 0.1,
      complianceStatus: 'Compliant',
      tags: ['new'],
      originalPrice: 620000,
      yearBuilt: 2010,
      lotSize: 0.25,
      subdivision: 'Pinewood',
    },
  ];

  describe('createBulkSelectionState', () => {
    it('should create initial selection state', () => {
      const state = createBulkSelectionState(10);
      expect(state.selectedIds.size).toBe(0);
      expect(state.selectAll).toBe(false);
      expect(state.totalCount).toBe(10);
    });
  });

  describe('toggleSelection', () => {
    it('should add record to selection', () => {
      let state = createBulkSelectionState(2);
      state = toggleSelection(state, '0');
      expect(state.selectedIds.has('0')).toBe(true);
      expect(state.selectedIds.size).toBe(1);
    });

    it('should remove record from selection', () => {
      let state = createBulkSelectionState(2);
      state = toggleSelection(state, '0');
      state = toggleSelection(state, '0');
      expect(state.selectedIds.has('0')).toBe(false);
      expect(state.selectedIds.size).toBe(0);
    });

    it('should set selectAll to false when removing from selection', () => {
      let state = createBulkSelectionState(2);
      state.selectAll = true;
      state.selectedIds.add('0');
      state = toggleSelection(state, '0');
      expect(state.selectAll).toBe(false);
    });
  });

  describe('selectAll', () => {
    it('should select all records', () => {
      const state = selectAll(mockRecords);
      expect(state.selectedIds.size).toBe(2);
      expect(state.selectAll).toBe(true);
      expect(state.selectedIds.has('0')).toBe(true);
      expect(state.selectedIds.has('1')).toBe(true);
    });
  });

  describe('deselectAll', () => {
    it('should deselect all records', () => {
      const state = deselectAll();
      expect(state.selectedIds.size).toBe(0);
      expect(state.selectAll).toBe(false);
    });
  });

  describe('getSelectedRecords', () => {
    it('should return selected records', () => {
      const selectedIds = new Set(['0', '1']);
      const selected = getSelectedRecords(mockRecords, selectedIds);
      expect(selected).toHaveLength(2);
      expect(selected[0].loopId).toBe('1');
      expect(selected[1].loopId).toBe('2');
    });

    it('should return empty array if no records selected', () => {
      const selectedIds = new Set<string>();
      const selected = getSelectedRecords(mockRecords, selectedIds);
      expect(selected).toHaveLength(0);
    });
  });

  describe('isSelected', () => {
    it('should return true if record is selected', () => {
      const selectedIds = new Set(['0']);
      expect(isSelected(selectedIds, 0)).toBe(true);
    });

    it('should return false if record is not selected', () => {
      const selectedIds = new Set(['0']);
      expect(isSelected(selectedIds, 1)).toBe(false);
    });
  });

  describe('getSelectionCount', () => {
    it('should return count of selected records', () => {
      const selectedIds = new Set(['0', '1']);
      expect(getSelectionCount(selectedIds)).toBe(2);
    });
  });

  describe('getSelectionPercentage', () => {
    it('should calculate selection percentage', () => {
      const selectedIds = new Set(['0']);
      const percentage = getSelectionPercentage(selectedIds, 2);
      expect(percentage).toBe(50);
    });

    it('should return 0 if total count is 0', () => {
      const selectedIds = new Set(['0']);
      const percentage = getSelectionPercentage(selectedIds, 0);
      expect(percentage).toBe(0);
    });

    it('should return 100 if all selected', () => {
      const selectedIds = new Set(['0', '1']);
      const percentage = getSelectionPercentage(selectedIds, 2);
      expect(percentage).toBe(100);
    });
  });

  describe('performBulkTag', () => {
    it('should add tags to selected records', () => {
      const selected = [mockRecords[0]];
      const tagged = performBulkTag(selected, ['high-value']);
      expect(tagged[0].tags).toContain('high-value');
      expect(tagged[0].tags).toContain('urgent');
    });

    it('should not duplicate tags', () => {
      const selected = [mockRecords[0]];
      const tagged = performBulkTag(selected, ['urgent']);
      const urgentCount = tagged[0].tags?.filter(t => t === 'urgent').length;
      expect(urgentCount).toBe(1);
    });

    it('should return empty array if no records', () => {
      const tagged = performBulkTag([], ['test']);
      expect(tagged).toHaveLength(0);
    });
  });

  describe('performBulkRemoveTags', () => {
    it('should remove tags from selected records', () => {
      const selected = [mockRecords[0]];
      const untagged = performBulkRemoveTags(selected, ['urgent']);
      expect(untagged[0].tags).not.toContain('urgent');
    });

    it('should handle records without tags', () => {
      const record = { ...mockRecords[0], tags: undefined };
      const untagged = performBulkRemoveTags([record], ['urgent']);
      expect(untagged[0].tags).toHaveLength(0);
    });
  });

  describe('getBulkActionSummary', () => {
    it('should generate CSV export summary', () => {
      const summary = getBulkActionSummary(1, 2, 'export-csv');
      expect(summary).toContain('Export');
      expect(summary).toContain('1 of 2');
      expect(summary).toContain('50%');
    });

    it('should generate Dotloop open summary', () => {
      const summary = getBulkActionSummary(2, 2, 'open-dotloop');
      expect(summary).toContain('Open');
      expect(summary).toContain('100%');
    });

    it('should generate tag summary', () => {
      const summary = getBulkActionSummary(1, 2, 'tag');
      expect(summary).toContain('Tag');
    });
  });

  describe('validateBulkAction', () => {
    it('should reject action with no selections', () => {
      const result = validateBulkAction(0, 'export-csv');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('select at least one');
    });

    it('should accept action with selections', () => {
      const result = validateBulkAction(1, 'export-csv');
      expect(result.valid).toBe(true);
    });

    it('should warn when opening many records in Dotloop', () => {
      const result = validateBulkAction(15, 'open-dotloop');
      expect(result.valid).toBe(true);
      expect(result.message).toContain('multiple browser tabs');
    });
  });
});
