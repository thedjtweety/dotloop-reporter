import { describe, it, expect } from 'vitest';
import {
  calculatePlanEarnings,
  comparePlans,
  COMMISSION_PLAN_TEMPLATES,
  formatCommissionPlan,
} from './commissionSimulationUtils';
import type { ForecastedDeal, CommissionPlan } from './commissionSimulationUtils';

describe('Commission Simulation Utils', () => {
  // Sample deal data for testing
  const sampleDeals: ForecastedDeal[] = [
    {
      id: '1',
      loopName: 'Deal 1',
      agent: 'John Smith',
      price: 500000,
      probability: 80,
      riskLevel: 'low',
      confidence: 85,
    },
    {
      id: '2',
      loopName: 'Deal 2',
      agent: 'Jane Doe',
      price: 750000,
      probability: 60,
      riskLevel: 'medium',
      confidence: 70,
    },
    {
      id: '3',
      loopName: 'Deal 3',
      agent: 'John Smith',
      price: 300000,
      probability: 90,
      riskLevel: 'low',
      confidence: 90,
    },
  ];

  const currentPlan: CommissionPlan = {
    id: 'current',
    name: 'Current Plan',
    agentSplit: 60,
    companySplit: 40,
    transactionFee: 0,
    deskFee: 0,
    brokerageFee: 0,
  };

  describe('calculatePlanEarnings', () => {
    it('should calculate correct earnings for 60/40 split', () => {
      const result = calculatePlanEarnings(sampleDeals, currentPlan);

      expect(result).toHaveProperty('agentTotal');
      expect(result).toHaveProperty('companyTotal');
      expect(result).toHaveProperty('byAgent');
      expect(result).toHaveProperty('byDeal');

      // Verify totals add up correctly
      const totalByDeal = result.byDeal.reduce(
        (sum, deal) => sum + deal.agentEarnings + deal.companyEarnings,
        0
      );
      const totalFromTotals = result.agentTotal + result.companyTotal;
      expect(totalByDeal).toBeCloseTo(totalFromTotals, 0);
    });

    it('should calculate correct agent and company split', () => {
      const result = calculatePlanEarnings(sampleDeals, currentPlan);

      // Agent should get 60% and company 40%
      const ratio = result.agentTotal / (result.agentTotal + result.companyTotal);
      expect(ratio).toBeCloseTo(0.6, 1);
    });

    it('should apply transaction fees correctly', () => {
      const planWithFees: CommissionPlan = {
        id: 'with-fees',
        name: 'Plan with Fees',
        agentSplit: 60,
        companySplit: 40,
        transactionFee: 100,
        deskFee: 0,
        brokerageFee: 0,
      };

      const resultWithoutFees = calculatePlanEarnings(sampleDeals, currentPlan);
      const resultWithFees = calculatePlanEarnings(sampleDeals, planWithFees);

      // Agent earnings should be lower by total transaction fees
      const totalTransactionFees = 100 * sampleDeals.length;
      expect(resultWithoutFees.agentTotal - resultWithFees.agentTotal).toBeCloseTo(
        totalTransactionFees,
        0
      );

      // Company earnings should be higher by total transaction fees
      expect(resultWithFees.companyTotal - resultWithoutFees.companyTotal).toBeCloseTo(
        totalTransactionFees,
        0
      );
    });

    it('should apply brokerage fees correctly', () => {
      const planWithBrokerageFee: CommissionPlan = {
        id: 'brokerage-fee',
        name: 'Plan with Brokerage Fee',
        agentSplit: 60,
        companySplit: 40,
        transactionFee: 0,
        deskFee: 0,
        brokerageFee: 10, // 10% of company dollar
      };

      const resultWithoutFee = calculatePlanEarnings(sampleDeals, currentPlan);
      const resultWithFee = calculatePlanEarnings(sampleDeals, planWithBrokerageFee);

      // Company earnings should be lower due to brokerage fee
      expect(resultWithoutFee.companyTotal).toBeGreaterThan(resultWithFee.companyTotal);

      // The difference should be approximately 10% of the company earnings
      const expectedFeeCut = resultWithoutFee.companyTotal * 0.1;
      expect(resultWithoutFee.companyTotal - resultWithFee.companyTotal).toBeCloseTo(
        expectedFeeCut,
        0
      );
    });

    it('should handle empty deals array', () => {
      const result = calculatePlanEarnings([], currentPlan);

      expect(result.agentTotal).toBe(0);
      expect(result.companyTotal).toBe(0);
      expect(result.byAgent).toEqual({});
      expect(result.byDeal).toEqual([]);
    });

    it('should group earnings by agent correctly', () => {
      const result = calculatePlanEarnings(sampleDeals, currentPlan);

      // John Smith has 2 deals, Jane Doe has 1
      expect(result.byAgent).toHaveProperty('John Smith');
      expect(result.byAgent).toHaveProperty('Jane Doe');

      // John Smith should have more total earnings (2 deals)
      expect(result.byAgent['John Smith']).toBeGreaterThan(result.byAgent['Jane Doe']);
    });

    it('should calculate deal-level details correctly', () => {
      const result = calculatePlanEarnings(sampleDeals, currentPlan);

      result.byDeal.forEach((deal) => {
        expect(deal).toHaveProperty('dealId');
        expect(deal).toHaveProperty('dealName');
        expect(deal).toHaveProperty('agent');
        expect(deal).toHaveProperty('baseCommission');
        expect(deal).toHaveProperty('agentEarnings');
        expect(deal).toHaveProperty('companyEarnings');

        // Agent earnings should be 60% of base commission
        expect(deal.agentEarnings).toBeCloseTo(deal.baseCommission * 0.6, 0);

        // Company earnings should be 40% of base commission
        expect(deal.companyEarnings).toBeCloseTo(deal.baseCommission * 0.4, 0);
      });
    });
  });

  describe('comparePlans', () => {
    it('should compare two plans correctly', () => {
      const simulatedPlan: CommissionPlan = {
        id: 'simulated',
        name: 'Simulated Plan',
        agentSplit: 70,
        companySplit: 30,
        transactionFee: 0,
        deskFee: 0,
        brokerageFee: 0,
      };

      const result = comparePlans(sampleDeals, currentPlan, simulatedPlan);

      expect(result).toHaveProperty('currentPlan');
      expect(result).toHaveProperty('simulatedPlan');
      expect(result).toHaveProperty('currentEarnings');
      expect(result).toHaveProperty('simulatedEarnings');
      expect(result).toHaveProperty('impact');
    });

    it('should show positive agent impact when split increases', () => {
      const simulatedPlan: CommissionPlan = {
        id: 'simulated',
        name: 'Simulated Plan',
        agentSplit: 70,
        companySplit: 30,
        transactionFee: 0,
        deskFee: 0,
        brokerageFee: 0,
      };

      const result = comparePlans(sampleDeals, currentPlan, simulatedPlan);

      // Agent earnings should increase
      expect(result.impact.agentDifference).toBeGreaterThan(0);
      expect(result.impact.agentPercentChange).toBeGreaterThan(0);

      // Company earnings should decrease
      expect(result.impact.companyDifference).toBeLessThan(0);
      expect(result.impact.companyPercentChange).toBeLessThan(0);
    });

    it('should show negative agent impact when split decreases', () => {
      const simulatedPlan: CommissionPlan = {
        id: 'simulated',
        name: 'Simulated Plan',
        agentSplit: 50,
        companySplit: 50,
        transactionFee: 0,
        deskFee: 0,
        brokerageFee: 0,
      };

      const result = comparePlans(sampleDeals, currentPlan, simulatedPlan);

      // Agent earnings should decrease
      expect(result.impact.agentDifference).toBeLessThan(0);
      expect(result.impact.agentPercentChange).toBeLessThan(0);

      // Company earnings should increase
      expect(result.impact.companyDifference).toBeGreaterThan(0);
      expect(result.impact.companyPercentChange).toBeGreaterThan(0);
    });

    it('should calculate agent-by-agent impact correctly', () => {
      const simulatedPlan: CommissionPlan = {
        id: 'simulated',
        name: 'Simulated Plan',
        agentSplit: 70,
        companySplit: 30,
        transactionFee: 0,
        deskFee: 0,
        brokerageFee: 0,
      };

      const result = comparePlans(sampleDeals, currentPlan, simulatedPlan);

      // Should have impact for each agent
      expect(result.impact.agentsByImpact.length).toBeGreaterThan(0);

      result.impact.agentsByImpact.forEach((agent) => {
        expect(agent).toHaveProperty('agent');
        expect(agent).toHaveProperty('currentEarnings');
        expect(agent).toHaveProperty('simulatedEarnings');
        expect(agent).toHaveProperty('difference');
        expect(agent).toHaveProperty('percentChange');

        // All agents should have positive impact (higher split)
        expect(agent.difference).toBeGreaterThan(0);
      });
    });

    it('should support different timeframes', () => {
      const simulatedPlan: CommissionPlan = {
        id: 'simulated',
        name: 'Simulated Plan',
        agentSplit: 70,
        companySplit: 30,
        transactionFee: 0,
        deskFee: 0,
        brokerageFee: 0,
      };

      const result30 = comparePlans(sampleDeals, currentPlan, simulatedPlan, '30');
      const result60 = comparePlans(sampleDeals, currentPlan, simulatedPlan, '60');
      const result90 = comparePlans(sampleDeals, currentPlan, simulatedPlan, '90');

      expect(result30.timeframe).toBe('30');
      expect(result60.timeframe).toBe('60');
      expect(result90.timeframe).toBe('90');
    });
  });

  describe('COMMISSION_PLAN_TEMPLATES', () => {
    it('should have all four standard templates', () => {
      expect(COMMISSION_PLAN_TEMPLATES).toHaveProperty('standard60_40');
      expect(COMMISSION_PLAN_TEMPLATES).toHaveProperty('aggressive70_30');
      expect(COMMISSION_PLAN_TEMPLATES).toHaveProperty('conservative50_50');
      expect(COMMISSION_PLAN_TEMPLATES).toHaveProperty('premium80_20');
    });

    it('should have correct splits for each template', () => {
      expect(COMMISSION_PLAN_TEMPLATES.standard60_40.agentSplit).toBe(60);
      expect(COMMISSION_PLAN_TEMPLATES.aggressive70_30.agentSplit).toBe(70);
      expect(COMMISSION_PLAN_TEMPLATES.conservative50_50.agentSplit).toBe(50);
      expect(COMMISSION_PLAN_TEMPLATES.premium80_20.agentSplit).toBe(80);
    });

    it('should have company splits that sum to 100', () => {
      Object.values(COMMISSION_PLAN_TEMPLATES).forEach((template) => {
        expect(template.agentSplit + template.companySplit).toBe(100);
      });
    });
  });

  describe('formatCommissionPlan', () => {
    it('should format basic plan correctly', () => {
      const formatted = formatCommissionPlan(currentPlan);

      expect(formatted).toContain('60/40');
    });

    it('should include transaction fee in format', () => {
      const planWithFee: CommissionPlan = {
        id: 'with-fee',
        name: 'Plan with Fee',
        agentSplit: 60,
        companySplit: 40,
        transactionFee: 100,
        deskFee: 0,
        brokerageFee: 0,
      };

      const formatted = formatCommissionPlan(planWithFee);

      expect(formatted).toContain('60/40');
      expect(formatted).toContain('$100');
      expect(formatted).toContain('transaction');
    });

    it('should include desk fee in format', () => {
      const planWithDeskFee: CommissionPlan = {
        id: 'with-desk-fee',
        name: 'Plan with Desk Fee',
        agentSplit: 60,
        companySplit: 40,
        transactionFee: 0,
        deskFee: 500,
        brokerageFee: 0,
      };

      const formatted = formatCommissionPlan(planWithDeskFee);

      expect(formatted).toContain('60/40');
      expect(formatted).toContain('$500');
      expect(formatted).toContain('desk');
    });

    it('should include brokerage fee in format', () => {
      const planWithBrokerageFee: CommissionPlan = {
        id: 'with-brokerage',
        name: 'Plan with Brokerage',
        agentSplit: 60,
        companySplit: 40,
        transactionFee: 0,
        deskFee: 0,
        brokerageFee: 10,
      };

      const formatted = formatCommissionPlan(planWithBrokerageFee);

      expect(formatted).toContain('60/40');
      expect(formatted).toContain('10%');
      expect(formatted).toContain('brokerage');
    });

    it('should handle multiple fees', () => {
      const planWithAllFees: CommissionPlan = {
        id: 'all-fees',
        name: 'Plan with All Fees',
        agentSplit: 60,
        companySplit: 40,
        transactionFee: 100,
        deskFee: 500,
        brokerageFee: 10,
      };

      const formatted = formatCommissionPlan(planWithAllFees);

      expect(formatted).toContain('60/40');
      expect(formatted).toContain('$100');
      expect(formatted).toContain('$500');
      expect(formatted).toContain('10%');
    });
  });

  describe('Edge Cases', () => {
    it('should handle deals with zero probability', () => {
      const dealsWithZeroProbability: ForecastedDeal[] = [
        {
          id: '1',
          loopName: 'Deal 1',
          agent: 'John Smith',
          price: 500000,
          probability: 0,
          riskLevel: 'high',
          confidence: 10,
        },
      ];

      const result = calculatePlanEarnings(dealsWithZeroProbability, currentPlan);

      expect(result.agentTotal).toBe(0);
      expect(result.companyTotal).toBe(0);
    });

    it('should handle deals with very high prices', () => {
      const highPriceDeals: ForecastedDeal[] = [
        {
          id: '1',
          loopName: 'Luxury Deal',
          agent: 'John Smith',
          price: 10000000,
          probability: 100,
          riskLevel: 'low',
          confidence: 95,
        },
      ];

      const result = calculatePlanEarnings(highPriceDeals, currentPlan);

      // 10000000 * 0.03 * 1.0 = 300000
      expect(result.agentTotal).toBeCloseTo(300000 * 0.6, 0);
      expect(result.companyTotal).toBeCloseTo(300000 * 0.4, 0);
    });

    it('should handle deals with very low prices', () => {
      const lowPriceDeals: ForecastedDeal[] = [
        {
          id: '1',
          loopName: 'Small Deal',
          agent: 'John Smith',
          price: 10000,
          probability: 50,
          riskLevel: 'low',
          confidence: 80,
        },
      ];

      const result = calculatePlanEarnings(lowPriceDeals, currentPlan);

      // 10000 * 0.03 * 0.5 = 150
      expect(result.agentTotal).toBeCloseTo(150 * 0.6, 0);
      expect(result.companyTotal).toBeCloseTo(150 * 0.4, 0);
    });

    it('should handle deals with missing agent names', () => {
      const dealsWithMissingAgent: ForecastedDeal[] = [
        {
          id: '1',
          loopName: 'Deal 1',
          agent: undefined,
          price: 500000,
          probability: 80,
          riskLevel: 'low',
          confidence: 85,
        },
      ];

      const result = calculatePlanEarnings(dealsWithMissingAgent, currentPlan);

      // Should use 'Unknown' as agent name
      expect(result.byAgent).toHaveProperty('Unknown');
    });

    it('should handle multiple agents with same name', () => {
      const duplicateAgentDeals: ForecastedDeal[] = [
        {
          id: '1',
          loopName: 'Deal 1',
          agent: 'John Smith',
          price: 500000,
          probability: 80,
          riskLevel: 'low',
          confidence: 85,
        },
        {
          id: '2',
          loopName: 'Deal 2',
          agent: 'John Smith',
          price: 300000,
          probability: 90,
          riskLevel: 'low',
          confidence: 90,
        },
      ];

      const result = calculatePlanEarnings(duplicateAgentDeals, currentPlan);

      // Should combine earnings for John Smith
      expect(result.byAgent['John Smith']).toBeGreaterThan(0);
      expect(result.byDeal.length).toBe(2);
    });
  });
});
