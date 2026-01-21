import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateCommissionVariance,
  filterVarianceByAgent,
  filterVarianceByCategory,
  sortVarianceByAmount,
  sortVarianceByPercentage,
  getVarianceByAgent,
  exportVarianceAsCSV,
} from './commissionVariance';
import { DotloopRecord } from './csvParser';

// Mock localStorage for Node environment
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Setup global localStorage
if (typeof global !== 'undefined' && !global.localStorage) {
  (global as any).localStorage = mockLocalStorage;
}

// Mock commission data
const mockRecords: DotloopRecord[] = [
  {
    loopId: '1',
    loopName: '123 Main St',
    closingDate: '2025-01-15',
    agents: 'John Smith',
    commissionTotal: 5000,
    companyDollar: 2500,
    buySideCommission: 2500,
    sellSideCommission: 0,
    salePrice: 250000,
    commissionRate: 2,
    price: 250000,
    propertyType: 'Single Family',
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 2000,
    city: 'Boston',
    state: 'MA',
    county: 'Suffolk',
    leadSource: 'Direct',
    earnestMoney: 5000,
    referralSource: '',
    referralPercentage: 0,
    complianceStatus: 'Compliant',
    tags: [],
    originalPrice: 250000,
    yearBuilt: 2000,
    lotSize: 5000,
    subdivision: '',
    createdDate: '2025-01-01',
    listingDate: '2025-01-01',
    offerDate: '2025-01-10',
    loopViewUrl: '',
    createdBy: 'System',
  },
  {
    loopId: '2',
    loopName: '456 Oak Ave',
    closingDate: '2025-01-20',
    agents: 'Jane Doe',
    commissionTotal: 6000,
    companyDollar: 3000,
    buySideCommission: 3000,
    sellSideCommission: 0,
    salePrice: 300000,
    commissionRate: 2,
    price: 300000,
    propertyType: 'Single Family',
    bedrooms: 4,
    bathrooms: 3,
    squareFootage: 2500,
    city: 'Boston',
    state: 'MA',
    county: 'Suffolk',
    leadSource: 'Direct',
    earnestMoney: 6000,
    referralSource: '',
    referralPercentage: 0,
    complianceStatus: 'Compliant',
    tags: [],
    originalPrice: 300000,
    yearBuilt: 2005,
    lotSize: 6000,
    subdivision: '',
    createdDate: '2025-01-01',
    listingDate: '2025-01-01',
    offerDate: '2025-01-15',
    loopViewUrl: '',
    createdBy: 'System',
  },
];

describe('Commission Variance Analysis', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    const defaultPlans = [
      {
        id: '1',
        name: 'Standard Plan',
        splitPercentage: 50,
        capAmount: 10000,
        postCapSplit: 100,
        deductions: [],
      },
    ];
    mockLocalStorage.setItem('dotloop_commission_plans', JSON.stringify(defaultPlans));
    mockLocalStorage.setItem(
      'dotloop_agent_assignments',
      JSON.stringify([
        {
          id: '1',
          agentName: 'John Smith',
          planId: '1',
          teamId: '',
          startDate: '2025-01-01',
          anniversaryDate: '01-01',
        },
        {
          id: '2',
          agentName: 'Jane Doe',
          planId: '1',
          teamId: '',
          startDate: '2025-01-01',
          anniversaryDate: '01-01',
        },
      ])
    );
  });

  describe('calculateCommissionVariance', () => {
    it('should calculate variance for transactions', () => {
      const { items, summary } = calculateCommissionVariance(mockRecords);

      expect(items).toBeDefined();
      expect(summary).toBeDefined();
      expect(summary.totalItems).toBeGreaterThan(0);
    });

    it('should categorize variance correctly', () => {
      const { items } = calculateCommissionVariance(mockRecords);

      const hasExact = items.some((v) => v.varianceCategory === 'exact');
      const hasMinor = items.some((v) => v.varianceCategory === 'minor');
      const hasMajor = items.some((v) => v.varianceCategory === 'major');

      expect(hasExact || hasMinor || hasMajor).toBe(true);
    });

    it('should calculate summary statistics', () => {
      const { summary } = calculateCommissionVariance(mockRecords);

      expect(summary.totalItems).toBeGreaterThan(0);
      expect(summary.exactMatches).toBeGreaterThanOrEqual(0);
      expect(summary.minorVariances).toBeGreaterThanOrEqual(0);
      expect(summary.majorVariances).toBeGreaterThanOrEqual(0);
      expect(summary.totalVarianceAmount).toBeGreaterThanOrEqual(0);
      expect(summary.averageVariancePercentage).toBeGreaterThanOrEqual(0);
      expect(summary.overallVariancePercentage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('filterVarianceByAgent', () => {
    it('should filter variance items by agent name', () => {
      const { items } = calculateCommissionVariance(mockRecords);
      const filtered = filterVarianceByAgent(items, 'John Smith');

      expect(filtered.every((v) => v.agentName === 'John Smith')).toBe(true);
    });

    it('should return empty array for non-existent agent', () => {
      const { items } = calculateCommissionVariance(mockRecords);
      const filtered = filterVarianceByAgent(items, 'Non Existent');

      expect(filtered).toHaveLength(0);
    });
  });

  describe('filterVarianceByCategory', () => {
    it('should filter variance items by category', () => {
      const { items } = calculateCommissionVariance(mockRecords);
      const filtered = filterVarianceByCategory(items, 'exact');

      expect(filtered.every((v) => v.varianceCategory === 'exact')).toBe(true);
    });
  });

  describe('sortVarianceByAmount', () => {
    it('should sort variance items by amount in descending order', () => {
      const { items } = calculateCommissionVariance(mockRecords);
      const sorted = sortVarianceByAmount(items);

      for (let i = 0; i < sorted.length - 1; i++) {
        expect(Math.abs(sorted[i].varianceAmount)).toBeGreaterThanOrEqual(
          Math.abs(sorted[i + 1].varianceAmount)
        );
      }
    });
  });

  describe('sortVarianceByPercentage', () => {
    it('should sort variance items by percentage in descending order', () => {
      const { items } = calculateCommissionVariance(mockRecords);
      const sorted = sortVarianceByPercentage(items);

      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].variancePercentage).toBeGreaterThanOrEqual(sorted[i + 1].variancePercentage);
      }
    });
  });

  describe('getVarianceByAgent', () => {
    it('should aggregate variance statistics by agent', () => {
      const { items } = calculateCommissionVariance(mockRecords);
      const agentStats = getVarianceByAgent(items);

      expect(agentStats.length).toBeGreaterThan(0);
      expect(agentStats[0]).toHaveProperty('agentName');
      expect(agentStats[0]).toHaveProperty('totalVariance');
      expect(agentStats[0]).toHaveProperty('averageVariancePercentage');
      expect(agentStats[0]).toHaveProperty('itemCount');
      expect(agentStats[0]).toHaveProperty('majorVarianceCount');
    });
  });

  describe('exportVarianceAsCSV', () => {
    it('should export variance data as CSV string', () => {
      const { items, summary } = calculateCommissionVariance(mockRecords);
      const csv = exportVarianceAsCSV(items, summary);

      expect(csv).toBeDefined();
      expect(typeof csv).toBe('string');
      expect(csv.length).toBeGreaterThan(0);
      expect(csv).toContain('Loop Name');
      expect(csv).toContain('Agent Name');
      expect(csv).toContain('SUMMARY STATISTICS');
    });

    it('should include headers in CSV export', () => {
      const { items, summary } = calculateCommissionVariance(mockRecords);
      const csv = exportVarianceAsCSV(items, summary);

      const headers = [
        'Loop Name',
        'Closing Date',
        'Agent Name',
        'Plan Name',
        'CSV Company Dollar',
        'Calculated Company Dollar',
        'Variance Amount',
        'Variance Percentage',
        'Variance Category',
      ];

      headers.forEach((header) => {
        expect(csv).toContain(header);
      });
    });

    it('should include summary statistics in CSV export', () => {
      const { items, summary } = calculateCommissionVariance(mockRecords);
      const csv = exportVarianceAsCSV(items, summary);

      expect(csv).toContain('Total Items');
      expect(csv).toContain('Exact Matches');
      expect(csv).toContain('Minor Variances');
      expect(csv).toContain('Major Variances');
    });
  });

  describe('Variance calculation accuracy', () => {
    it('should calculate variance amount correctly', () => {
      const { items } = calculateCommissionVariance(mockRecords);

      items.forEach((item) => {
        const expectedVariance = item.calculatedCompanyDollar - item.csvCompanyDollar;
        expect(Math.abs(item.varianceAmount - expectedVariance)).toBeLessThan(0.01);
      });
    });

    it('should calculate variance percentage correctly', () => {
      const { items } = calculateCommissionVariance(mockRecords);

      items.forEach((item) => {
        if (item.csvCompanyDollar !== 0) {
          const expectedPercentage = Math.abs(
            ((item.varianceAmount / item.csvCompanyDollar) * 100)
          );
          expect(Math.abs(item.variancePercentage - expectedPercentage)).toBeLessThan(0.01);
        }
      });
    });
  });
});
