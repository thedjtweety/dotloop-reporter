import { describe, it, expect } from 'vitest';
import {
  filterTransactions,
  sortTransactions,
  filterAndSortTransactions,
  getUniqueValues,
  DrillDownFilters,
  SortState,
} from './filterUtils';
import { DotloopRecord } from './csvParser';

// Mock data for testing
const mockRecords: DotloopRecord[] = [
  {
    status: 'Closed',
    address: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    agentName: 'John Doe',
    listPrice: 250000,
    soldPrice: 245000,
    commission: 7350,
    commissionRate: 3,
    daysToClose: 45,
    leadSource: 'Realtor.com',
    propertyType: 'Single Family',
    transactionType: 'Sell',
    closeDate: '2026-01-13',
    notes: 'Quick sale',
    loopStatus: 'Closed',
    agents: 'John Doe',
    salePrice: 245000,
    dotloopId: '123',
    transactionId: 'TXN123',
    buySideCommission: 0,
    sellSideCommission: 7350,
    commissionType: 'Sell Side',
    county: 'Sangamon',
  },
  {
    status: 'Active',
    address: '456 Oak Ave',
    city: 'Springfield',
    state: 'IL',
    agentName: 'Jane Smith',
    listPrice: 350000,
    soldPrice: undefined,
    commission: 0,
    commissionRate: 0,
    daysToClose: 0,
    leadSource: 'Direct Mail',
    propertyType: 'Condo',
    transactionType: 'List',
    closeDate: undefined,
    notes: 'New listing',
    loopStatus: 'Active',
    agents: 'Jane Smith',
    salePrice: undefined,
    dotloopId: '456',
    transactionId: 'TXN456',
    buySideCommission: 0,
    sellSideCommission: 0,
    commissionType: 'Sell Side',
    county: 'Sangamon',
  },
  {
    status: 'Closed',
    address: '789 Pine Rd',
    city: 'Chicago',
    state: 'IL',
    agentName: 'John Doe',
    listPrice: 500000,
    soldPrice: 495000,
    commission: 14850,
    commissionRate: 3,
    daysToClose: 60,
    leadSource: 'Zillow',
    propertyType: 'Multi-Family',
    transactionType: 'Sell',
    closeDate: '2025-12-15',
    notes: 'Complex negotiation',
    loopStatus: 'Closed',
    agents: 'John Doe',
    salePrice: 495000,
    dotloopId: '789',
    transactionId: 'TXN789',
    buySideCommission: 0,
    sellSideCommission: 14850,
    commissionType: 'Sell Side',
    county: 'Cook',
  },
];

describe('Filter and Sort Utilities', () => {
  describe('filterTransactions', () => {
    it('should return all records when no filters applied', () => {
      const filters: DrillDownFilters = { searchQuery: '' };
      const result = filterTransactions(mockRecords, filters);
      expect(result).toHaveLength(3);
    });

    it('should filter by search query', () => {
      const filters: DrillDownFilters = { searchQuery: 'Main' };
      const result = filterTransactions(mockRecords, filters);
      expect(result).toHaveLength(1);
      expect(result[0].address).toBe('123 Main St');
    });

    it('should search across multiple fields', () => {
      const filters: DrillDownFilters = { searchQuery: 'John' };
      const result = filterTransactions(mockRecords, filters);
      expect(result).toHaveLength(2);
    });

    it('should filter by status', () => {
      const filters: DrillDownFilters = { searchQuery: '', status: 'Closed' };
      const result = filterTransactions(mockRecords, filters);
      expect(result).toHaveLength(2);
      expect(result.every(r => r.status === 'Closed')).toBe(true);
    });

    it('should filter by agent', () => {
      const filters: DrillDownFilters = { searchQuery: '', agent: 'Jane Smith' };
      const result = filterTransactions(mockRecords, filters);
      expect(result).toHaveLength(1);
      expect(result[0].agentName).toBe('Jane Smith');
    });

    it('should combine multiple filters', () => {
      const filters: DrillDownFilters = {
        searchQuery: '',
        status: 'Closed',
        agent: 'John Doe',
      };
      const result = filterTransactions(mockRecords, filters);
      expect(result).toHaveLength(2);
      expect(result.every(r => r.status === 'Closed' && r.agentName === 'John Doe')).toBe(true);
    });

    it('should handle case-insensitive search', () => {
      const filters: DrillDownFilters = { searchQuery: 'SPRINGFIELD' };
      const result = filterTransactions(mockRecords, filters);
      expect(result).toHaveLength(2);
    });

    it('should filter by date range', () => {
      const dateFrom = new Date('2026-01-01');
      const dateTo = new Date('2026-01-31');
      const filters: DrillDownFilters = { searchQuery: '', dateFrom, dateTo };
      const result = filterTransactions(mockRecords, filters);
      expect(result).toHaveLength(1);
      expect(result[0].closeDate).toBe('2026-01-13');
    });
  });

  describe('sortTransactions', () => {
    it('should return same order when no sort state', () => {
      const result = sortTransactions(mockRecords, null);
      expect(result).toEqual(mockRecords);
    });

    it('should sort by status ascending', () => {
      const sortState: SortState = { field: 'status', order: 'asc' };
      const result = sortTransactions(mockRecords, sortState);
      expect(result[0].status).toBe('Active');
      expect(result[1].status).toBe('Closed');
      expect(result[2].status).toBe('Closed');
    });

    it('should sort by status descending', () => {
      const sortState: SortState = { field: 'status', order: 'desc' };
      const result = sortTransactions(mockRecords, sortState);
      expect(result[0].status).toBe('Closed');
      expect(result[2].status).toBe('Active');
    });

    it('should sort by price ascending', () => {
      const sortState: SortState = { field: 'listPrice', order: 'asc' };
      const result = sortTransactions(mockRecords, sortState);
      expect(result[0].listPrice).toBe(250000);
      expect(result[1].listPrice).toBe(350000);
      expect(result[2].listPrice).toBe(500000);
    });

    it('should sort by price descending', () => {
      const sortState: SortState = { field: 'listPrice', order: 'desc' };
      const result = sortTransactions(mockRecords, sortState);
      expect(result[0].listPrice).toBe(500000);
      expect(result[2].listPrice).toBe(250000);
    });

    it('should sort by commission ascending', () => {
      const sortState: SortState = { field: 'commission', order: 'asc' };
      const result = sortTransactions(mockRecords, sortState);
      expect(result[0].commission).toBe(0);
      expect(result[1].commission).toBe(7350);
      expect(result[2].commission).toBe(14850);
    });

    it('should sort by days to close', () => {
      const sortState: SortState = { field: 'daysToClose', order: 'asc' };
      const result = sortTransactions(mockRecords, sortState);
      expect(result[0].daysToClose).toBe(0);
      expect(result[1].daysToClose).toBe(45);
      expect(result[2].daysToClose).toBe(60);
    });

    it('should sort by agent name', () => {
      const sortState: SortState = { field: 'agentName', order: 'asc' };
      const result = sortTransactions(mockRecords, sortState);
      expect(result[0].agentName).toBe('Jane Smith');
      expect(result[1].agentName).toBe('John Doe');
    });
  });

  describe('filterAndSortTransactions', () => {
    it('should apply both filters and sorting', () => {
      const filters: DrillDownFilters = { searchQuery: '', status: 'Closed' };
      const sortState: SortState = { field: 'commission', order: 'desc' };
      const result = filterAndSortTransactions(mockRecords, filters, sortState);
      
      expect(result).toHaveLength(2);
      expect(result[0].commission).toBe(14850);
      expect(result[1].commission).toBe(7350);
    });

    it('should filter then sort', () => {
      const filters: DrillDownFilters = { searchQuery: '', agent: 'John Doe' };
      const sortState: SortState = { field: 'listPrice', order: 'asc' };
      const result = filterAndSortTransactions(mockRecords, filters, sortState);
      
      expect(result).toHaveLength(2);
      expect(result[0].listPrice).toBe(250000);
      expect(result[1].listPrice).toBe(500000);
    });
  });

  describe('getUniqueValues', () => {
    it('should get unique statuses', () => {
      const result = getUniqueValues(mockRecords, 'status');
      expect(result).toContain('Active');
      expect(result).toContain('Closed');
      expect(result).toHaveLength(2);
    });

    it('should get unique agent names', () => {
      const result = getUniqueValues(mockRecords, 'agentName');
      expect(result).toContain('John Doe');
      expect(result).toContain('Jane Smith');
      expect(result).toHaveLength(2);
    });

    it('should return sorted values', () => {
      const result = getUniqueValues(mockRecords, 'agentName');
      expect(result[0]).toBe('Jane Smith');
      expect(result[1]).toBe('John Doe');
    });
  });
});
