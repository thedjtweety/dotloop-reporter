import { describe, it, expect } from 'vitest';
import { calculatePlanBasedCommission, hasSignificantCommissionDifference } from './commissionRecalculator';
import { CommissionPlan } from './commission';

describe('Commission Recalculator', () => {
  const mockPlan: CommissionPlan = {
    id: 'plan-1',
    name: 'Standard 80/20',
    splitPercentage: 80,
    capAmount: 20000,
    postCapSplit: 100,
  };

  const mockPlanWithCap: CommissionPlan = {
    id: 'plan-2',
    name: 'Capped 70/30',
    splitPercentage: 70,
    capAmount: 15000,
    postCapSplit: 90,
  };

  describe('calculatePlanBasedCommission', () => {
    it('should calculate commission without a plan', () => {
      const mockTransactions = [
        {
          loopId: '1',
          loopName: 'Test 1',
          closingDate: '2024-01-01',
          commissionTotal: 10000,
          companyDollar: 2000,
          agents: 'Agent A',
        },
      ] as any;

      const result = calculatePlanBasedCommission(mockTransactions, undefined);
      expect(result.agentCommission).toBe(10000);
      expect(result.companyDollar).toBe(2000);
    });

    it('should apply split percentage correctly', () => {
      const mockTransactions = [
        {
          loopId: '1',
          loopName: 'Test 1',
          closingDate: '2024-01-01',
          commissionTotal: 10000,
          agents: 'Agent A',
        },
      ] as any;

      const result = calculatePlanBasedCommission(mockTransactions, mockPlan);
      // 80% agent, 20% company
      expect(result.agentCommission).toBe(8000);
      expect(result.companyDollar).toBe(2000);
    });

    it('should respect cap amount', () => {
      const mockTransactions = [
        {
          loopId: '1',
          loopName: 'Test 1',
          closingDate: '2024-01-01',
          commissionTotal: 50000,
          agents: 'Agent A',
        },
      ] as any;

      const result = calculatePlanBasedCommission(mockTransactions, mockPlanWithCap);
      // 70% agent split: agent gets 35000, company gets 15000
      // But cap is 15000, so company is capped at 15000
      // Excess after cap: 0 (we hit exactly the cap)
      // Total company: 15000
      expect(result.companyDollar).toBe(15000);
      expect(result.agentCommission).toBe(50000 - 15000);
    });

    it('should handle multiple transactions', () => {
      const mockTransactions = [
        {
          loopId: '1',
          loopName: 'Test 1',
          closingDate: '2024-01-01',
          commissionTotal: 10000,
          agents: 'Agent A',
        },
        {
          loopId: '2',
          loopName: 'Test 2',
          closingDate: '2024-01-02',
          commissionTotal: 15000,
          agents: 'Agent A',
        },
      ] as any;

      const result = calculatePlanBasedCommission(mockTransactions, mockPlan);
      const totalCommission = 25000;
      // 80% agent, 20% company (no cap hit)
      expect(result.agentCommission).toBe(20000);
      expect(result.companyDollar).toBe(5000);
    });

    it('should handle zero commission', () => {
      const mockTransactions = [
        {
          loopId: '1',
          loopName: 'Test 1',
          closingDate: '2024-01-01',
          commissionTotal: 0,
          agents: 'Agent A',
        },
      ] as any;

      const result = calculatePlanBasedCommission(mockTransactions, mockPlan);
      expect(result.agentCommission).toBe(0);
      expect(result.companyDollar).toBe(0);
    });
  });

  describe('hasSignificantCommissionDifference', () => {
    it('should detect significant differences above threshold', () => {
      const original = 10000;
      const recalculated = 11000; // 10% difference
      expect(hasSignificantCommissionDifference(original, recalculated, 5)).toBe(true);
    });

    it('should not flag small differences', () => {
      const original = 10000;
      const recalculated = 10200; // 2% difference
      expect(hasSignificantCommissionDifference(original, recalculated, 5)).toBe(false);
    });

    it('should handle zero original value', () => {
      const original = 0;
      const recalculated = 100;
      expect(hasSignificantCommissionDifference(original, recalculated)).toBe(true);
    });

    it('should handle negative differences', () => {
      const original = 10000;
      const recalculated = 8500; // -15% difference
      expect(hasSignificantCommissionDifference(original, recalculated, 10)).toBe(true);
    });
  });
});
