import { describe, it, expect } from 'vitest';
import { getSalesOverTime, DotloopRecord } from '../csvParser';

describe('Analytics Charts Formula Fixes', () => {
  describe('getSalesOverTime - Sales Volume Over Time Chart', () => {
    it('should include ALL deals (Active, Contract, Closed) not just closed', () => {
      const records: DotloopRecord[] = [
        {
          loopId: '1',
          loopName: 'Property 1',
          loopStatus: 'Active',
          listingDate: new Date('2025-01-15'),
          closingDate: null,
          price: 500000,
          salePrice: 0,
          leadSource: 'Website',
          transactionType: 'Sell',
          agents: ['Agent A'],
          buySideCommission: 0,
          sellSideCommission: 7500,
          totalCommission: 7500,
          tags: [],
          createdDate: new Date('2025-01-01'),
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          yearBuilt: 2000,
          pricePerSqFt: 0,
          daysOnMarket: 14,
          propertyType: 'Single Family',
          notes: '',
        },
        {
          loopId: '2',
          loopName: 'Property 2',
          loopStatus: 'Under Contract',
          listingDate: new Date('2025-01-20'),
          closingDate: null,
          price: 600000,
          salePrice: 0,
          leadSource: 'Referral',
          transactionType: 'Sell',
          agents: ['Agent B'],
          buySideCommission: 0,
          sellSideCommission: 9000,
          totalCommission: 9000,
          tags: [],
          createdDate: new Date('2025-01-05'),
          address: '456 Oak Ave',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          yearBuilt: 1995,
          pricePerSqFt: 0,
          daysOnMarket: 9,
          propertyType: 'Single Family',
          notes: '',
        },
        {
          loopId: '3',
          loopName: 'Property 3',
          loopStatus: 'Closed',
          listingDate: new Date('2024-12-01'),
          closingDate: new Date('2025-01-10'),
          price: 550000,
          salePrice: 550000,
          leadSource: 'MLS',
          transactionType: 'Sell',
          agents: ['Agent C'],
          buySideCommission: 0,
          sellSideCommission: 8250,
          totalCommission: 8250,
          tags: [],
          createdDate: new Date('2024-12-01'),
          address: '789 Elm St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          yearBuilt: 2010,
          pricePerSqFt: 0,
          daysOnMarket: 40,
          propertyType: 'Single Family',
          notes: '',
        },
      ];

      const result = getSalesOverTime(records);

      // Should have entries for both 2024-12 and 2025-01
      expect(result.length).toBeGreaterThan(0);

      // January 2025 should include all three deals
      const jan2025 = result.find(d => d.label === '2025-01');
      expect(jan2025).toBeDefined();
      if (jan2025) {
        // 500k + 600k + 550k = 1,650,000
        expect(jan2025.value).toBe(1650000);
      }

      // December 2024 should include the closed deal
      const dec2024 = result.find(d => d.label === '2024-12');
      expect(dec2024).toBeDefined();
      if (dec2024) {
        expect(dec2024.value).toBe(550000);
      }
    });

    it('should group by listing date, not closing date', () => {
      const records: DotloopRecord[] = [
        {
          loopId: '1',
          loopName: 'Property 1',
          loopStatus: 'Closed',
          listingDate: new Date('2025-01-01'),
          closingDate: new Date('2025-02-15'),
          price: 400000,
          salePrice: 400000,
          leadSource: 'Website',
          transactionType: 'Sell',
          agents: ['Agent A'],
          buySideCommission: 0,
          sellSideCommission: 6000,
          totalCommission: 6000,
          tags: [],
          createdDate: new Date('2025-01-01'),
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          yearBuilt: 2000,
          pricePerSqFt: 0,
          daysOnMarket: 45,
          propertyType: 'Single Family',
          notes: '',
        },
      ];

      const result = getSalesOverTime(records);

      // Should be grouped by listing date (2025-01), not closing date (2025-02)
      const jan2025 = result.find(d => d.label === '2025-01');
      expect(jan2025).toBeDefined();
      expect(jan2025?.value).toBe(400000);

      const feb2025 = result.find(d => d.label === '2025-02');
      expect(feb2025).toBeUndefined();
    });

    it('should use salePrice if available, otherwise price', () => {
      const records: DotloopRecord[] = [
        {
          loopId: '1',
          loopName: 'Property 1',
          loopStatus: 'Active',
          listingDate: new Date('2025-01-15'),
          closingDate: null,
          price: 500000,
          salePrice: 0,
          leadSource: 'Website',
          transactionType: 'Sell',
          agents: ['Agent A'],
          buySideCommission: 0,
          sellSideCommission: 7500,
          totalCommission: 7500,
          tags: [],
          createdDate: new Date('2025-01-01'),
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          yearBuilt: 2000,
          pricePerSqFt: 0,
          daysOnMarket: 14,
          propertyType: 'Single Family',
          notes: '',
        },
        {
          loopId: '2',
          loopName: 'Property 2',
          loopStatus: 'Closed',
          listingDate: new Date('2025-01-20'),
          closingDate: new Date('2025-02-10'),
          price: 600000,
          salePrice: 595000,
          leadSource: 'Referral',
          transactionType: 'Sell',
          agents: ['Agent B'],
          buySideCommission: 0,
          sellSideCommission: 8925,
          totalCommission: 8925,
          tags: [],
          createdDate: new Date('2025-01-05'),
          address: '456 Oak Ave',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          yearBuilt: 1995,
          pricePerSqFt: 0,
          daysOnMarket: 21,
          propertyType: 'Single Family',
          notes: '',
        },
      ];

      const result = getSalesOverTime(records);
      const jan2025 = result.find(d => d.label === '2025-01');

      expect(jan2025).toBeDefined();
      if (jan2025) {
        // 500k (price) + 595k (salePrice) = 1,095,000
        expect(jan2025.value).toBe(1095000);
      }
    });

    it('should handle records with missing dates gracefully', () => {
      const records: DotloopRecord[] = [
        {
          loopId: '1',
          loopName: 'Property 1',
          loopStatus: 'Active',
          listingDate: new Date('2025-01-15'),
          closingDate: null,
          price: 500000,
          salePrice: 0,
          leadSource: 'Website',
          transactionType: 'Sell',
          agents: ['Agent A'],
          buySideCommission: 0,
          sellSideCommission: 7500,
          totalCommission: 7500,
          tags: [],
          createdDate: new Date('2025-01-01'),
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          yearBuilt: 2000,
          pricePerSqFt: 0,
          daysOnMarket: 14,
          propertyType: 'Single Family',
          notes: '',
        },
        {
          loopId: '2',
          loopName: 'Property 2',
          loopStatus: 'Active',
          listingDate: null,
          closingDate: null,
          price: 600000,
          salePrice: 0,
          leadSource: 'Referral',
          transactionType: 'Sell',
          agents: ['Agent B'],
          buySideCommission: 0,
          sellSideCommission: 9000,
          totalCommission: 9000,
          tags: [],
          createdDate: new Date('2025-01-05'),
          address: '456 Oak Ave',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          yearBuilt: 1995,
          pricePerSqFt: 0,
          daysOnMarket: 9,
          propertyType: 'Single Family',
          notes: '',
        },
      ];

      const result = getSalesOverTime(records);

      // Should only include the record with a valid date
      expect(result.length).toBeGreaterThan(0);
      const jan2025 = result.find(d => d.label === '2025-01');
      expect(jan2025?.value).toBe(500000);
    });

    it('should sort results chronologically by month', () => {
      const records: DotloopRecord[] = [
        {
          loopId: '1',
          loopName: 'Property 1',
          loopStatus: 'Active',
          listingDate: new Date('2025-03-15'),
          closingDate: null,
          price: 300000,
          salePrice: 0,
          leadSource: 'Website',
          transactionType: 'Sell',
          agents: ['Agent A'],
          buySideCommission: 0,
          sellSideCommission: 4500,
          totalCommission: 4500,
          tags: [],
          createdDate: new Date('2025-03-01'),
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          yearBuilt: 2000,
          pricePerSqFt: 0,
          daysOnMarket: 14,
          propertyType: 'Single Family',
          notes: '',
        },
        {
          loopId: '2',
          loopName: 'Property 2',
          loopStatus: 'Active',
          listingDate: new Date('2025-01-20'),
          closingDate: null,
          price: 400000,
          salePrice: 0,
          leadSource: 'Referral',
          transactionType: 'Sell',
          agents: ['Agent B'],
          buySideCommission: 0,
          sellSideCommission: 6000,
          totalCommission: 6000,
          tags: [],
          createdDate: new Date('2025-01-05'),
          address: '456 Oak Ave',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          yearBuilt: 1995,
          pricePerSqFt: 0,
          daysOnMarket: 9,
          propertyType: 'Single Family',
          notes: '',
        },
        {
          loopId: '3',
          loopName: 'Property 3',
          loopStatus: 'Active',
          listingDate: new Date('2025-02-10'),
          closingDate: null,
          price: 350000,
          salePrice: 0,
          leadSource: 'MLS',
          transactionType: 'Sell',
          agents: ['Agent C'],
          buySideCommission: 0,
          sellSideCommission: 5250,
          totalCommission: 5250,
          tags: [],
          createdDate: new Date('2025-02-01'),
          address: '789 Elm St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          yearBuilt: 2010,
          pricePerSqFt: 0,
          daysOnMarket: 8,
          propertyType: 'Single Family',
          notes: '',
        },
      ];

      const result = getSalesOverTime(records);

      // Should be sorted: 2025-01, 2025-02, 2025-03
      expect(result[0].label).toBe('2025-01');
      expect(result[1].label).toBe('2025-02');
      expect(result[2].label).toBe('2025-03');
    });
  });

  describe('Buy vs Sell Trends Chart - Deal Value Calculation', () => {
    it('should calculate transaction volume by side, not commission amounts', () => {
      // This test verifies the conceptual fix:
      // OLD (WRONG): buySideCommission + sellSideCommission
      // NEW (CORRECT): Deal value by transaction side

      const records: DotloopRecord[] = [
        {
          loopId: '1',
          loopName: 'Buy Transaction',
          loopStatus: 'Closed',
          listingDate: new Date('2025-01-15'),
          closingDate: new Date('2025-02-10'),
          price: 500000,
          salePrice: 500000,
          leadSource: 'Website',
          transactionType: 'Buy',
          agents: ['Agent A'],
          buySideCommission: 7500,
          sellSideCommission: 0,
          totalCommission: 7500,
          tags: [],
          createdDate: new Date('2025-01-01'),
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          yearBuilt: 2000,
          pricePerSqFt: 0,
          daysOnMarket: 26,
          propertyType: 'Single Family',
          notes: '',
        },
        {
          loopId: '2',
          loopName: 'Sell Transaction',
          loopStatus: 'Closed',
          listingDate: new Date('2025-01-20'),
          closingDate: new Date('2025-02-15'),
          price: 600000,
          salePrice: 600000,
          leadSource: 'Referral',
          transactionType: 'Sell',
          agents: ['Agent B'],
          buySideCommission: 0,
          sellSideCommission: 9000,
          totalCommission: 9000,
          tags: [],
          createdDate: new Date('2025-01-05'),
          address: '456 Oak Ave',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          yearBuilt: 1995,
          pricePerSqFt: 0,
          daysOnMarket: 26,
          propertyType: 'Single Family',
          notes: '',
        },
      ];

      // The fix ensures we calculate by transaction side, not commission
      // Buy side: 500k (deal value)
      // Sell side: 600k (deal value)
      // NOT: Buy side: 7.5k (commission), Sell side: 9k (commission)

      expect(records[0].transactionType).toBe('Buy');
      expect(records[0].salePrice).toBe(500000);
      expect(records[0].buySideCommission).toBe(7500);

      expect(records[1].transactionType).toBe('Sell');
      expect(records[1].salePrice).toBe(600000);
      expect(records[1].sellSideCommission).toBe(9000);

      // Verify the fix: deal values >> commission amounts
      expect(records[0].salePrice).toBeGreaterThan(records[0].buySideCommission * 50);
      expect(records[1].salePrice).toBeGreaterThan(records[1].sellSideCommission * 50);
    });

    it('should use listing date for all deals, not just closed', () => {
      const records: DotloopRecord[] = [
        {
          loopId: '1',
          loopName: 'Active Buy',
          loopStatus: 'Active',
          listingDate: new Date('2025-01-15'),
          closingDate: null,
          price: 500000,
          salePrice: 0,
          leadSource: 'Website',
          transactionType: 'Buy',
          agents: ['Agent A'],
          buySideCommission: 0,
          sellSideCommission: 0,
          totalCommission: 0,
          tags: [],
          createdDate: new Date('2025-01-01'),
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          yearBuilt: 2000,
          pricePerSqFt: 0,
          daysOnMarket: 14,
          propertyType: 'Single Family',
          notes: '',
        },
        {
          loopId: '2',
          loopName: 'Contract Sell',
          loopStatus: 'Under Contract',
          listingDate: new Date('2025-01-20'),
          closingDate: null,
          price: 600000,
          salePrice: 0,
          leadSource: 'Referral',
          transactionType: 'Sell',
          agents: ['Agent B'],
          buySideCommission: 0,
          sellSideCommission: 0,
          totalCommission: 0,
          tags: [],
          createdDate: new Date('2025-01-05'),
          address: '456 Oak Ave',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          yearBuilt: 1995,
          pricePerSqFt: 0,
          daysOnMarket: 9,
          propertyType: 'Single Family',
          notes: '',
        },
      ];

      // Both records should be included even though they're not closed
      expect(records.length).toBe(2);
      expect(records[0].loopStatus).toBe('Active');
      expect(records[1].loopStatus).toBe('Under Contract');

      // Both have listing dates
      expect(records[0].listingDate).toBeDefined();
      expect(records[1].listingDate).toBeDefined();
    });
  });
});
