import { describe, it, expect } from 'vitest';
import {
  calculateTransactionCommission,
  calculateCommissions,
  getCycleStartDate,
  getCycleEndDate,
  type CommissionPlan,
  type Team,
  type AgentPlanAssignment,
  type TransactionInput,
} from './commission-calculator';

describe('Commission Calculator', () => {
  // Test Data Setup
  const basicPlan: CommissionPlan = {
    id: 'basic-80-20',
    name: 'Basic 80/20',
    splitPercentage: 80,
    capAmount: 18000,
    postCapSplit: 100,
  };

  const noCapPlan: CommissionPlan = {
    id: 'no-cap-70-30',
    name: 'No Cap 70/30',
    splitPercentage: 70,
    capAmount: 0,
    postCapSplit: 70,
  };

  const planWithDeductions: CommissionPlan = {
    id: 'plan-with-deductions',
    name: 'Plan with Deductions',
    splitPercentage: 80,
    capAmount: 20000,
    postCapSplit: 100,
    deductions: [
      { id: 'd1', name: 'Tech Fee', amount: 50, type: 'fixed', frequency: 'per_transaction' },
      { id: 'd2', name: 'E&O Insurance', amount: 2, type: 'percentage', frequency: 'per_transaction' },
    ],
  };

  const planWithRoyalty: CommissionPlan = {
    id: 'franchise-plan',
    name: 'Franchise Plan',
    splitPercentage: 80,
    capAmount: 18000,
    postCapSplit: 100,
    royaltyPercentage: 6,
    royaltyCap: 500,
  };

  const testTeam: Team = {
    id: 'team-1',
    name: 'Alpha Team',
    leadAgent: 'John Doe',
    teamSplitPercentage: 50,
  };

  const basicTransaction: TransactionInput = {
    id: 'txn-1',
    loopName: '123 Main St',
    closingDate: '2024-06-15',
    agents: 'John Doe',
    salePrice: 500000,
    commissionRate: 3, // 3%
  };

  describe('getCycleStartDate', () => {
    it('should return Jan 1 for calendar year (no anniversary)', () => {
      const txnDate = new Date('2024-06-15');
      const cycleStart = getCycleStartDate(txnDate);
      expect(cycleStart.getFullYear()).toBe(2024);
      expect(cycleStart.getMonth()).toBe(0); // January
      expect(cycleStart.getDate()).toBe(1);
    });

    it('should return correct cycle start for anniversary date', () => {
      const txnDate = new Date('2024-06-15');
      const cycleStart = getCycleStartDate(txnDate, '03-01'); // March 1st
      expect(cycleStart.getFullYear()).toBe(2024);
      expect(cycleStart.getMonth()).toBe(2); // March (0-indexed)
      expect(cycleStart.getDate()).toBe(1);
    });

    it('should use previous year if transaction is before anniversary', () => {
      const txnDate = new Date('2024-02-15');
      const cycleStart = getCycleStartDate(txnDate, '03-01');
      expect(cycleStart.getFullYear()).toBe(2023);
      expect(cycleStart.getMonth()).toBe(2); // March
      expect(cycleStart.getDate()).toBe(1);
    });
  });

  describe('getCycleEndDate', () => {
    it('should return one year minus one day from cycle start', () => {
      const cycleStart = new Date('2024-03-01');
      const cycleEnd = getCycleEndDate(cycleStart);
      expect(cycleEnd.getFullYear()).toBe(2025);
      expect(cycleEnd.getMonth()).toBe(1); // February (0-indexed)
      expect(cycleEnd.getDate()).toBe(28);
    });
  });

  describe('calculateTransactionCommission - Basic Scenarios', () => {
    it('should calculate basic 80/20 split correctly', () => {
      const result = calculateTransactionCommission(
        basicTransaction,
        'John Doe',
        basicPlan,
        undefined,
        0 // YTD = 0
      );

      // GCI = $500,000 * 3% = $15,000
      expect(result.grossCommissionIncome).toBe(15000);
      
      // No team split
      expect(result.teamSplitAmount).toBe(0);
      expect(result.afterTeamSplit).toBe(15000);
      
      // Brokerage gets 20% = $3,000
      expect(result.brokerageSplitAmount).toBe(3000);
      expect(result.brokerageSplitPercentage).toBe(20);
      expect(result.splitType).toBe('pre-cap');
      
      // Agent gets 80% = $12,000
      expect(result.agentNetCommission).toBe(12000);
      
      // YTD tracking
      expect(result.ytdBeforeTransaction).toBe(0);
      expect(result.ytdAfterTransaction).toBe(3000);
      expect(result.percentToCap).toBeCloseTo(16.67, 1); // 3000/18000
      expect(result.isCapped).toBe(false);
    });

    it('should handle multiple agents splitting commission', () => {
      const multiAgentTxn: TransactionInput = {
        ...basicTransaction,
        agents: 'John Doe, Jane Smith',
      };

      const result = calculateTransactionCommission(
        multiAgentTxn,
        'John Doe',
        basicPlan,
        undefined,
        0
      );

      // GCI split between 2 agents = $15,000 / 2 = $7,500
      expect(result.grossCommissionIncome).toBe(7500);
      expect(result.brokerageSplitAmount).toBe(1500); // 20% of $7,500
      expect(result.agentNetCommission).toBe(6000); // 80% of $7,500
    });

    it('should handle no-cap plans', () => {
      const result = calculateTransactionCommission(
        basicTransaction,
        'John Doe',
        noCapPlan,
        undefined,
        0
      );

      // 70/30 split, no cap
      expect(result.brokerageSplitAmount).toBe(4500); // 30% of $15,000
      expect(result.agentNetCommission).toBe(10500); // 70% of $15,000
      expect(result.splitType).toBe('pre-cap');
      expect(result.percentToCap).toBe(100); // No cap = always 100%
      expect(result.isCapped).toBe(false);
    });
  });

  describe('calculateTransactionCommission - Cap Scenarios', () => {
    it('should handle transaction before cap', () => {
      const result = calculateTransactionCommission(
        basicTransaction,
        'John Doe',
        basicPlan,
        undefined,
        5000 // YTD = $5,000
      );

      // Still under cap ($5,000 + $3,000 = $8,000 < $18,000)
      expect(result.brokerageSplitAmount).toBe(3000);
      expect(result.splitType).toBe('pre-cap');
      expect(result.ytdAfterTransaction).toBe(8000);
      expect(result.isCapped).toBe(false);
    });

    it('should handle transaction after cap is already hit', () => {
      const result = calculateTransactionCommission(
        basicTransaction,
        'John Doe',
        basicPlan,
        undefined,
        20000 // YTD = $20,000 (already capped)
      );

      // Post-cap split = 100% to agent, 0% to brokerage
      expect(result.brokerageSplitAmount).toBe(0);
      expect(result.splitType).toBe('post-cap');
      expect(result.agentNetCommission).toBe(15000); // Gets full $15,000
      expect(result.isCapped).toBe(true);
    });

    it('should handle transaction that hits cap (mixed)', () => {
      const result = calculateTransactionCommission(
        basicTransaction,
        'John Doe',
        basicPlan,
        undefined,
        17000 // YTD = $17,000, cap = $18,000
      );

      // Remaining cap = $1,000
      // Pre-cap portion: $1,000 (brokerage gets this)
      // Post-cap portion: $3,000 - $1,000 = $2,000 (brokerage gets 0%)
      // Total brokerage = $1,000 + $0 = $1,000
      expect(result.brokerageSplitAmount).toBe(1000);
      expect(result.splitType).toBe('mixed');
      expect(result.ytdAfterTransaction).toBe(18000);
      expect(result.isCapped).toBe(true);
      expect(result.agentNetCommission).toBe(14000); // $15,000 - $1,000
    });
  });

  describe('calculateTransactionCommission - Team Splits', () => {
    it('should apply team split before brokerage split', () => {
      const result = calculateTransactionCommission(
        basicTransaction,
        'John Doe',
        basicPlan,
        testTeam, // 50% team split
        0
      );

      // GCI = $15,000
      // Team gets 50% = $7,500
      expect(result.teamSplitAmount).toBe(7500);
      expect(result.teamSplitPercentage).toBe(50);
      expect(result.afterTeamSplit).toBe(7500);
      
      // Brokerage gets 20% of remaining $7,500 = $1,500
      expect(result.brokerageSplitAmount).toBe(1500);
      
      // Agent gets 80% of $7,500 = $6,000
      expect(result.agentNetCommission).toBe(6000);
    });
  });

  describe('calculateTransactionCommission - Deductions', () => {
    it('should apply fixed and percentage deductions', () => {
      const result = calculateTransactionCommission(
        basicTransaction,
        'John Doe',
        planWithDeductions,
        undefined,
        0
      );

      // GCI = $15,000
      // Brokerage split = $3,000 (20%)
      // Agent before deductions = $12,000
      
      // Deductions:
      // - Tech Fee: $50 (fixed)
      // - E&O Insurance: 2% of $15,000 = $300
      expect(result.deductions).toHaveLength(2);
      expect(result.deductions[0]).toEqual({ name: 'Tech Fee', amount: 50, type: 'fixed' });
      expect(result.deductions[1]).toEqual({ name: 'E&O Insurance', amount: 300, type: 'percentage' });
      expect(result.totalDeductions).toBe(350);
      
      // Net = $12,000 - $350 = $11,650
      expect(result.agentNetCommission).toBe(11650);
    });

    it('should apply transaction-specific adjustments', () => {
      const adjustments = [
        { description: 'Staging Fee', amount: 200 },
        { description: 'Photography', amount: 150 },
      ];

      const result = calculateTransactionCommission(
        basicTransaction,
        'John Doe',
        basicPlan,
        undefined,
        0,
        adjustments
      );

      expect(result.deductions).toHaveLength(2);
      expect(result.totalDeductions).toBe(350);
      expect(result.agentNetCommission).toBe(11650); // $12,000 - $350
    });
  });

  describe('calculateTransactionCommission - Royalties', () => {
    it('should calculate franchise royalty', () => {
      const result = calculateTransactionCommission(
        basicTransaction,
        'John Doe',
        planWithRoyalty,
        undefined,
        0
      );

      // GCI = $15,000
      // Royalty = 6% of $15,000 = $900
      // But capped at $500
      expect(result.royaltyAmount).toBe(500);
      expect(result.royaltyPercentage).toBe(6);
      
      // Net = $12,000 (80% of GCI) - $500 (royalty) = $11,500
      expect(result.agentNetCommission).toBe(11500);
    });

    it('should not exceed royalty cap', () => {
      const smallTxn: TransactionInput = {
        ...basicTransaction,
        salePrice: 100000, // GCI = $3,000
      };

      const result = calculateTransactionCommission(
        smallTxn,
        'John Doe',
        planWithRoyalty,
        undefined,
        0
      );

      // Royalty = 6% of $3,000 = $180 (under $500 cap)
      expect(result.royaltyAmount).toBe(180);
    });
  });

  describe('calculateCommissions - Multiple Transactions', () => {
    const transactions: TransactionInput[] = [
      {
        id: 'txn-1',
        loopName: '123 Main St',
        closingDate: '2024-01-15',
        agents: 'John Doe',
        salePrice: 500000,
        commissionRate: 3,
      },
      {
        id: 'txn-2',
        loopName: '456 Oak Ave',
        closingDate: '2024-03-20',
        agents: 'John Doe',
        salePrice: 600000,
        commissionRate: 3,
      },
      {
        id: 'txn-3',
        loopName: '789 Pine Rd',
        closingDate: '2024-06-10',
        agents: 'John Doe',
        salePrice: 700000,
        commissionRate: 3,
      },
    ];

    const assignments: AgentPlanAssignment[] = [
      {
        agentName: 'John Doe',
        planId: 'basic-80-20',
      },
    ];

    it('should calculate YTD correctly across multiple transactions', () => {
      const result = calculateCommissions(
        transactions,
        [basicPlan],
        [],
        assignments
      );

      expect(result.breakdowns).toHaveLength(3);
      
      // Transaction 1: GCI = $15,000, Brokerage = $3,000
      expect(result.breakdowns[0].ytdBeforeTransaction).toBe(0);
      expect(result.breakdowns[0].ytdAfterTransaction).toBe(3000);
      
      // Transaction 2: GCI = $18,000, Brokerage = $3,600
      expect(result.breakdowns[1].ytdBeforeTransaction).toBe(3000);
      expect(result.breakdowns[1].ytdAfterTransaction).toBe(6600);
      
      // Transaction 3: GCI = $21,000, Brokerage = $4,200
      expect(result.breakdowns[2].ytdBeforeTransaction).toBe(6600);
      expect(result.breakdowns[2].ytdAfterTransaction).toBe(10800);
      
      // YTD Summary
      expect(result.ytdSummaries).toHaveLength(1);
      expect(result.ytdSummaries[0].agentName).toBe('John Doe');
      expect(result.ytdSummaries[0].ytdCompanyDollar).toBe(10800);
      expect(result.ytdSummaries[0].ytdGrossCommission).toBe(54000); // $15k + $18k + $21k
      expect(result.ytdSummaries[0].transactionCount).toBe(3);
      expect(result.ytdSummaries[0].percentToCap).toBeCloseTo(60, 0); // 10800/18000
      expect(result.ytdSummaries[0].isCapped).toBe(false);
    });

    it('should handle cap hit across multiple transactions', () => {
      const highValueTxns: TransactionInput[] = [
        {
          id: 'txn-1',
          loopName: '1M Property',
          closingDate: '2024-01-15',
          agents: 'John Doe',
          salePrice: 1000000,
          commissionRate: 3,
        },
        {
          id: 'txn-2',
          loopName: '1.5M Property',
          closingDate: '2024-03-20',
          agents: 'John Doe',
          salePrice: 1500000,
          commissionRate: 3,
        },
      ];

      const result = calculateCommissions(
        highValueTxns,
        [basicPlan],
        [],
        assignments
      );

      // Transaction 1: GCI = $30,000, Brokerage = $6,000
      expect(result.breakdowns[0].ytdAfterTransaction).toBe(6000);
      expect(result.breakdowns[0].splitType).toBe('pre-cap');
      
      // Transaction 2: GCI = $45,000, Brokerage should be $9,000 normally
      // But cap is $18,000, YTD is $6,000, so remaining = $12,000
      // After team split: $45,000 (no team)
      // Normal brokerage split: 20% of $45,000 = $9,000
      // Pre-cap portion: $9,000 (but only $12,000 remaining)
      // Since $9,000 < $12,000, should NOT hit cap!
      expect(result.breakdowns[1].ytdBeforeTransaction).toBe(6000);
      expect(result.breakdowns[1].ytdAfterTransaction).toBe(15000); // $6k + $9k = $15k
      expect(result.breakdowns[1].splitType).toBe('pre-cap'); // Should NOT hit cap
      expect(result.breakdowns[1].brokerageSplitAmount).toBe(9000);
      
      // YTD Summary
      expect(result.ytdSummaries[0].ytdCompanyDollar).toBe(15000); // $6k + $9k
      expect(result.ytdSummaries[0].isCapped).toBe(false); // Not capped yet
      expect(result.ytdSummaries[0].percentToCap).toBeCloseTo(83.33, 1); // 15000/18000
      expect(result.ytdSummaries[0].remainingToCap).toBe(3000); // $18k - $15k
    });

    it('should handle anniversary date cycle resets', () => {
      const crossYearTxns: TransactionInput[] = [
        {
          id: 'txn-1',
          loopName: 'Before Anniversary',
          closingDate: '2024-02-15',
          agents: 'John Doe',
          salePrice: 500000,
          commissionRate: 3,
        },
        {
          id: 'txn-2',
          loopName: 'After Anniversary',
          closingDate: '2024-04-15',
          agents: 'John Doe',
          salePrice: 500000,
          commissionRate: 3,
        },
      ];

      const assignmentsWithAnniversary: AgentPlanAssignment[] = [
        {
          agentName: 'John Doe',
          planId: 'basic-80-20',
          anniversaryDate: '03-01', // March 1st
        },
      ];

      const result = calculateCommissions(
        crossYearTxns,
        [basicPlan],
        [],
        assignmentsWithAnniversary
      );

      // Transaction 1 (Feb 15): Cycle started Mar 1, 2023
      expect(result.breakdowns[0].ytdBeforeTransaction).toBe(0);
      expect(result.breakdowns[0].ytdAfterTransaction).toBe(3000);
      
      // Transaction 2 (Apr 15): NEW CYCLE started Mar 1, 2024
      // YTD should reset
      expect(result.breakdowns[1].ytdBeforeTransaction).toBe(0); // Reset!
      expect(result.breakdowns[1].ytdAfterTransaction).toBe(3000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero GCI', () => {
      const zeroTxn: TransactionInput = {
        ...basicTransaction,
        salePrice: 0,
      };

      const result = calculateTransactionCommission(
        zeroTxn,
        'John Doe',
        basicPlan,
        undefined,
        0
      );

      expect(result.grossCommissionIncome).toBe(0);
      expect(result.brokerageSplitAmount).toBe(0);
      expect(result.agentNetCommission).toBe(0);
    });

    it('should handle agent with no plan assignment', () => {
      const result = calculateCommissions(
        [basicTransaction],
        [basicPlan],
        [],
        [] // No assignments
      );

      expect(result.breakdowns).toHaveLength(0);
      expect(result.ytdSummaries).toHaveLength(0);
    });

    it('should handle deductions exceeding commission', () => {
      const highDeductionPlan: CommissionPlan = {
        ...basicPlan,
        deductions: [
          { id: 'd1', name: 'Huge Fee', amount: 20000, type: 'fixed', frequency: 'per_transaction' },
        ],
      };

      const result = calculateTransactionCommission(
        basicTransaction,
        'John Doe',
        highDeductionPlan,
        undefined,
        0
      );

      // Agent gets $12,000 but deduction is $20,000
      // Net should be negative
      expect(result.agentNetCommission).toBe(-8000);
    });
  });
});
