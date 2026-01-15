import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateTransactionCommissionNew,
  recalculateAgentCommission,
  applyPlanToAgentMetrics,
  applyPlansToAllAgents,
  getCommissionComparison,
  CommissionBreakdownDisplay,
} from './commissionCalculator';
import { DotloopRecord, AgentMetrics } from './csvParser';
import { CommissionPlan } from './commission';

// Mock the commission library functions
vi.mock('./commission', () => ({
  getPlanForAgent: vi.fn((agentName: string) => {
    if (agentName === 'Agent With Plan') {
      return {
        id: 'standard-80-20',
        name: 'Standard Capped (80/20)',
        splitPercentage: 80,
        capAmount: 18000,
        postCapSplit: 100,
      };
    }
    return undefined;
  }),
  getAgentAssignments: vi.fn(() => []),
  getCommissionPlans: vi.fn(() => []),
  getTeams: vi.fn(() => []),
  getTransactionAdjustments: vi.fn(() => []),
}));

describe('Commission Calculator', () => {
  describe('calculateTransactionCommissionNew', () => {
    it('should return CSV values when no plan is assigned', () => {
      const record: DotloopRecord = {
        loopId: '1',
        loopViewUrl: '',
        loopName: 'Test Deal',
        loopStatus: 'Closed',
        createdDate: '2024-01-01',
        closingDate: '2024-01-15',
        listingDate: '',
        offerDate: '',
        address: '123 Main St',
        price: 500000,
        propertyType: 'Single Family',
        bedrooms: 3,
        bathrooms: 2,
        squareFootage: 2000,
        city: 'Austin',
        state: 'TX',
        county: 'Travis',
        leadSource: 'Direct',
        earnestMoney: 0,
        salePrice: 500000,
        commissionRate: 0.06,
        commissionTotal: 30000,
        agents: 'Test Agent',
        createdBy: 'Test Agent',
        buySideCommission: 15000,
        sellSideCommission: 15000,
        companyDollar: 10000,
        referralSource: '',
        referralPercentage: 0,
        complianceStatus: 'OK',
        tags: [],
        originalPrice: 500000,
        yearBuilt: 2020,
        lotSize: 0,
        subdivision: '',
      };

      const breakdown = calculateTransactionCommissionNew(record, undefined);

      expect(breakdown.totalGCI).toBe(30000);
      expect(breakdown.agentShare).toBe(15000);
      expect(breakdown.companyShare).toBe(10000);
      expect(breakdown.cappedAgentShare).toBe(15000);
      expect(breakdown.cappedCompanyShare).toBe(10000);
    });

    it('should calculate commission based on plan split percentage', () => {
      const record: DotloopRecord = {
        loopId: '1',
        loopViewUrl: '',
        loopName: 'Test Deal',
        loopStatus: 'Closed',
        createdDate: '2024-01-01',
        closingDate: '2024-01-15',
        listingDate: '',
        offerDate: '',
        address: '123 Main St',
        price: 500000,
        propertyType: 'Single Family',
        bedrooms: 3,
        bathrooms: 2,
        squareFootage: 2000,
        city: 'Austin',
        state: 'TX',
        county: 'Travis',
        leadSource: 'Direct',
        earnestMoney: 0,
        salePrice: 500000,
        commissionRate: 0.06,
        commissionTotal: 30000,
        agents: 'Test Agent',
        createdBy: 'Test Agent',
        buySideCommission: 15000,
        sellSideCommission: 15000,
        companyDollar: 10000,
        referralSource: '',
        referralPercentage: 0,
        complianceStatus: 'OK',
        tags: [],
        originalPrice: 500000,
        yearBuilt: 2020,
        lotSize: 0,
        subdivision: '',
      };

      const plan: CommissionPlan = {
        id: 'test-plan',
        name: 'Test Plan',
        splitPercentage: 80,
        capAmount: 0,
        postCapSplit: 100,
      };

      const breakdown = calculateTransactionCommissionNew(record, plan);

      // 80% of 30000 = 24000 (agent), 20% = 6000 (company)
      expect(breakdown.totalGCI).toBe(30000);
      expect(breakdown.agentShare).toBe(24000);
      expect(breakdown.companyShare).toBe(6000);
      expect(breakdown.cappedAgentShare).toBe(24000);
      expect(breakdown.cappedCompanyShare).toBe(6000);
    });

    it('should apply cap to company share', () => {
      const record: DotloopRecord = {
        loopId: '1',
        loopViewUrl: '',
        loopName: 'Test Deal',
        loopStatus: 'Closed',
        createdDate: '2024-01-01',
        closingDate: '2024-01-15',
        listingDate: '',
        offerDate: '',
        address: '123 Main St',
        price: 500000,
        propertyType: 'Single Family',
        bedrooms: 3,
        bathrooms: 2,
        squareFootage: 2000,
        city: 'Austin',
        state: 'TX',
        county: 'Travis',
        leadSource: 'Direct',
        earnestMoney: 0,
        salePrice: 500000,
        commissionRate: 0.06,
        commissionTotal: 100000,
        agents: 'Test Agent',
        createdBy: 'Test Agent',
        buySideCommission: 50000,
        sellSideCommission: 50000,
        companyDollar: 40000,
        referralSource: '',
        referralPercentage: 0,
        complianceStatus: 'OK',
        tags: [],
        originalPrice: 500000,
        yearBuilt: 2020,
        lotSize: 0,
        subdivision: '',
      };

      const plan: CommissionPlan = {
        id: 'test-plan',
        name: 'Test Plan',
        splitPercentage: 80,
        capAmount: 10000, // Cap company dollar at 10000
        postCapSplit: 100, // Agent gets 100% after cap
      };

      const breakdown = calculateTransactionCommissionNew(record, plan);

      // 80% of 100000 = 80000 (agent), 20% = 20000 (company)
      // But company is capped at 10000, so agent gets the excess 10000
      // Agent total: 80000 + 10000 = 90000
      expect(breakdown.totalGCI).toBe(100000);
      expect(breakdown.agentShare).toBe(80000);
      expect(breakdown.companyShare).toBe(20000);
      expect(breakdown.cappedCompanyShare).toBe(10000);
      expect(breakdown.cappedAgentShare).toBe(90000);
      expect(breakdown.postCapSplit).toBe(100);
    });
  });

  describe('applyPlanToAgentMetrics', () => {
    it('should return original metrics when no plan is assigned', () => {
      const agentMetrics: AgentMetrics = {
        agentName: 'Agent Without Plan',
        totalTransactions: 10,
        closedDeals: 8,
        closingRate: 80,
        totalCommission: 50000,
        averageCommission: 5000,
        totalSalesVolume: 5000000,
        averageSalesPrice: 500000,
        averageDaysToClose: 30,
        activeListings: 1,
        underContract: 1,
        buySideCommission: 25000,
        sellSideCommission: 25000,
        buySidePercentage: 50,
        sellSidePercentage: 50,
        companyDollar: 30000,
      };

      const records: DotloopRecord[] = [];

      const result = applyPlanToAgentMetrics(agentMetrics, records);

      expect(result).toEqual(agentMetrics);
    });

    it('should recalculate commission when plan is assigned', () => {
      const agentMetrics: AgentMetrics = {
        agentName: 'Agent With Plan',
        totalTransactions: 1,
        closedDeals: 1,
        closingRate: 100,
        totalCommission: 30000,
        averageCommission: 30000,
        totalSalesVolume: 500000,
        averageSalesPrice: 500000,
        averageDaysToClose: 15,
        activeListings: 0,
        underContract: 0,
        buySideCommission: 15000,
        sellSideCommission: 15000,
        buySidePercentage: 50,
        sellSidePercentage: 50,
        companyDollar: 10000,
      };

      const record: DotloopRecord = {
        loopId: '1',
        loopViewUrl: '',
        loopName: 'Test Deal',
        loopStatus: 'Closed',
        createdDate: '2024-01-01',
        closingDate: '2024-01-15',
        listingDate: '',
        offerDate: '',
        address: '123 Main St',
        price: 500000,
        propertyType: 'Single Family',
        bedrooms: 3,
        bathrooms: 2,
        squareFootage: 2000,
        city: 'Austin',
        state: 'TX',
        county: 'Travis',
        leadSource: 'Direct',
        earnestMoney: 0,
        salePrice: 500000,
        commissionRate: 0.06,
        commissionTotal: 30000,
        agents: 'Agent With Plan',
        createdBy: 'Agent With Plan',
        buySideCommission: 15000,
        sellSideCommission: 15000,
        companyDollar: 10000,
        referralSource: '',
        referralPercentage: 0,
        complianceStatus: 'OK',
        tags: [],
        originalPrice: 500000,
        yearBuilt: 2020,
        lotSize: 0,
        subdivision: '',
      };

      const result = applyPlanToAgentMetrics(agentMetrics, [record]);

      // With 80/20 split: 80% of 30000 = 24000 (agent), 20% = 6000 (company)
      expect(result.totalCommission).toBe(24000);
      expect(result.averageCommission).toBe(24000);
      expect(result.agentName).toBe('Agent With Plan');
    });
  });

  describe('getCommissionComparison', () => {
    it('should show no comparison when no plan is assigned', () => {
      const agentMetrics: AgentMetrics = {
        agentName: 'Agent Without Plan',
        totalTransactions: 1,
        closedDeals: 1,
        closingRate: 100,
        totalCommission: 30000,
        averageCommission: 30000,
        totalSalesVolume: 500000,
        averageSalesPrice: 500000,
        averageDaysToClose: 15,
        activeListings: 0,
        underContract: 0,
        buySideCommission: 15000,
        sellSideCommission: 15000,
        buySidePercentage: 50,
        sellSidePercentage: 50,
        companyDollar: 10000,
      };

      const result = getCommissionComparison(agentMetrics, []);

      expect(result.hasComparison).toBe(false);
      expect(result.originalCommission).toBe(30000);
      expect(result.planBasedCommission).toBe(30000);
      expect(result.difference).toBe(0);
    });
  });
});
