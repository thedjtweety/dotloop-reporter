import { describe, it, expect } from 'vitest';
import {
  calculateTransactionCommission,
  calculateCommissions,
  CommissionPlan,
  CommissionTier,
  Team,
  TransactionInput,
} from './commission-calculator';

describe('Commission Calculator - Sliding Scale Support', () => {
  describe('Single Tier Calculations', () => {
    it('should apply correct split for transaction within first tier', () => {
      const plan: CommissionPlan = {
        id: 'sliding-plan-1',
        name: 'Sliding Scale Plan',
        splitPercentage: 60, // Fallback
        capAmount: 100000,
        postCapSplit: 100,
        useSliding: true,
        tiers: [
          { id: 't1', threshold: 0, splitPercentage: 60, description: '$0-$50K: 60/40' },
          { id: 't2', threshold: 50000, splitPercentage: 70, description: '$50K-$100K: 70/30' },
          { id: 't3', threshold: 100000, splitPercentage: 80, description: '$100K+: 80/20' },
        ],
      };

      const transaction: TransactionInput = {
        id: 'txn1',
        loopName: 'Property 1',
        closingDate: '2025-01-15',
        agents: 'John Doe',
        salePrice: 500000,
        commissionRate: 3, // $15,000 total commission
      };

      // YTD before transaction is $10,000 (in first tier)
      const result = calculateTransactionCommission(
        transaction,
        'John Doe',
        plan,
        undefined,
        10000 // YTD company dollar before transaction
      );

      // At $10K YTD, should use 60/40 split (tier 1)
      // GCI = $15,000
      // Agent share (60%) = $9,000
      // Company share (40%) = $6,000
      expect(result.grossCommissionIncome).toBe(15000);
      expect(result.agentNetCommission).toBeGreaterThan(0); // After deductions
      expect(result.brokerageSplitPercentage).toBe(40); // 100 - 60
    });

    it('should apply correct split for transaction in middle tier', () => {
      const plan: CommissionPlan = {
        id: 'sliding-plan-1',
        name: 'Sliding Scale Plan',
        splitPercentage: 60,
        capAmount: 100000,
        postCapSplit: 100,
        useSliding: true,
        tiers: [
          { id: 't1', threshold: 0, splitPercentage: 60, description: '$0-$50K: 60/40' },
          { id: 't2', threshold: 50000, splitPercentage: 70, description: '$50K-$100K: 70/30' },
          { id: 't3', threshold: 100000, splitPercentage: 80, description: '$100K+: 80/20' },
        ],
      };

      const transaction: TransactionInput = {
        id: 'txn2',
        loopName: 'Property 2',
        closingDate: '2025-02-15',
        agents: 'Jane Smith',
        salePrice: 400000,
        commissionRate: 3, // $12,000 total commission
      };

      // YTD before transaction is $60,000 (in second tier)
      const result = calculateTransactionCommission(
        transaction,
        'Jane Smith',
        plan,
        undefined,
        60000 // YTD company dollar before transaction
      );

      // At $60K YTD, should use 70/30 split (tier 2)
      // GCI = $12,000
      // Agent share (70%) = $8,400
      // Company share (30%) = $3,600
      expect(result.grossCommissionIncome).toBe(12000);
      expect(result.brokerageSplitPercentage).toBe(30); // 100 - 70
    });

    it('should apply correct split for transaction in highest tier', () => {
      const plan: CommissionPlan = {
        id: 'sliding-plan-1',
        name: 'Sliding Scale Plan',
        splitPercentage: 60,
        capAmount: 200000,
        postCapSplit: 100,
        useSliding: true,
        tiers: [
          { id: 't1', threshold: 0, splitPercentage: 60, description: '$0-$50K: 60/40' },
          { id: 't2', threshold: 50000, splitPercentage: 70, description: '$50K-$100K: 70/30' },
          { id: 't3', threshold: 100000, splitPercentage: 80, description: '$100K+: 80/20' },
        ],
      };

      const transaction: TransactionInput = {
        id: 'txn3',
        loopName: 'Property 3',
        closingDate: '2025-03-15',
        agents: 'Bob Wilson',
        salePrice: 600000,
        commissionRate: 3, // $18,000 total commission
      };

      // YTD before transaction is $120,000 (in highest tier)
      const result = calculateTransactionCommission(
        transaction,
        'Bob Wilson',
        plan,
        undefined,
        120000 // YTD company dollar before transaction
      );

      // At $120K YTD, should use 80/20 split (tier 3)
      // GCI = $18,000
      // Agent share (80%) = $14,400
      // Company share (20%) = $3,600
      expect(result.grossCommissionIncome).toBe(18000);
      expect(result.brokerageSplitPercentage).toBe(20); // 100 - 80
    });
  });

  describe('Multi-Transaction Tier Transitions', () => {
    it('should handle transaction that crosses tier boundary', () => {
      const plan: CommissionPlan = {
        id: 'sliding-plan-2',
        name: 'Sliding Scale with Boundary',
        splitPercentage: 60,
        capAmount: 150000,
        postCapSplit: 100,
        useSliding: true,
        tiers: [
          { id: 't1', threshold: 0, splitPercentage: 60, description: '$0-$50K: 60/40' },
          { id: 't2', threshold: 50000, splitPercentage: 75, description: '$50K+: 75/25' },
        ],
      };

      // Transaction 1: YTD $40K -> $46K (stays in tier 1)
      const txn1: TransactionInput = {
        id: 'txn1',
        loopName: 'Property 1',
        closingDate: '2025-01-15',
        agents: 'Agent A',
        salePrice: 200000,
        commissionRate: 3, // $6,000 commission
      };

      const result1 = calculateTransactionCommission(
        txn1,
        'Agent A',
        plan,
        undefined,
        40000
      );

      expect(result1.brokerageSplitPercentage).toBe(40); // Tier 1: 60/40

      // Transaction 2: YTD $46K -> $52K (still in tier 1, but approaching tier 2)
      const txn2: TransactionInput = {
        id: 'txn2',
        loopName: 'Property 2',
        closingDate: '2025-02-15',
        agents: 'Agent A',
        salePrice: 200000,
        commissionRate: 3, // $6,000 commission
      };

      const result2 = calculateTransactionCommission(
        txn2,
        'Agent A',
        plan,
        undefined,
        46000
      );

      // At $46K, should still use tier 1 (60/40) since threshold is $50K
      expect(result2.brokerageSplitPercentage).toBe(40); // Tier 1: 60/40

      // Transaction 3: YTD $52K (crosses into tier 2)
      const txn3: TransactionInput = {
        id: 'txn3',
        loopName: 'Property 3',
        closingDate: '2025-03-15',
        agents: 'Agent A',
        salePrice: 200000,
        commissionRate: 3, // $6,000 commission
      };

      const result3 = calculateTransactionCommission(
        txn3,
        'Agent A',
        plan,
        undefined,
        52000
      );

      // At $52K, should use tier 2 (75/25)
      expect(result3.brokerageSplitPercentage).toBe(25); // Tier 2: 75/25
    });

    it('should track YTD correctly across multiple transactions with tier changes', () => {
      const plan: CommissionPlan = {
        id: 'sliding-plan-3',
        name: 'Multi-Tier Plan',
        splitPercentage: 50,
        capAmount: 200000,
        postCapSplit: 100,
        useSliding: true,
        tiers: [
          { id: 't1', threshold: 0, splitPercentage: 50, description: 'Tier 1' },
          { id: 't2', threshold: 40000, splitPercentage: 65, description: 'Tier 2' },
          { id: 't3', threshold: 80000, splitPercentage: 80, description: 'Tier 3' },
        ],
      };

      const transactions: TransactionInput[] = [
        {
          id: 'txn1',
          loopName: 'Deal 1',
          closingDate: '2025-01-01',
          agents: 'Top Agent',
          salePrice: 400000,
          commissionRate: 2.5, // $10,000
        },
        {
          id: 'txn2',
          loopName: 'Deal 2',
          closingDate: '2025-02-01',
          agents: 'Top Agent',
          salePrice: 400000,
          commissionRate: 2.5, // $10,000
        },
        {
          id: 'txn3',
          loopName: 'Deal 3',
          closingDate: '2025-03-01',
          agents: 'Top Agent',
          salePrice: 400000,
          commissionRate: 2.5, // $10,000
        },
      ];

      let ytdCompanyDollar = 0;

      // Transaction 1: $0 -> $5K (tier 1: 50/50)
      const result1 = calculateTransactionCommission(
        transactions[0],
        'Top Agent',
        plan,
        undefined,
        ytdCompanyDollar
      );
      expect(result1.brokerageSplitPercentage).toBe(50);
      ytdCompanyDollar += result1.brokerageSplitAmount;

      // Transaction 2: $5K -> $10K (tier 1: 50/50)
      const result2 = calculateTransactionCommission(
        transactions[1],
        'Top Agent',
        plan,
        undefined,
        ytdCompanyDollar
      );
      expect(result2.brokerageSplitPercentage).toBe(50);
      ytdCompanyDollar += result2.brokerageSplitAmount;

      // Transaction 3: $10K -> $15K (still tier 1, but approaching tier 2)
      const result3 = calculateTransactionCommission(
        transactions[2],
        'Top Agent',
        plan,
        undefined,
        ytdCompanyDollar
      );
      expect(result3.brokerageSplitPercentage).toBe(50);
    });
  });

  describe('Sliding Scale with Caps', () => {
    it('should apply sliding scale before hitting cap', () => {
      const plan: CommissionPlan = {
        id: 'sliding-with-cap',
        name: 'Sliding Scale with Cap',
        splitPercentage: 60,
        capAmount: 50000, // $50K cap on company dollar
        postCapSplit: 100, // Agent gets 100% after cap
        useSliding: true,
        tiers: [
          { id: 't1', threshold: 0, splitPercentage: 60, description: 'Tier 1' },
          { id: 't2', threshold: 30000, splitPercentage: 75, description: 'Tier 2' },
        ],
      };

      const transaction: TransactionInput = {
        id: 'txn1',
        loopName: 'Big Deal',
        closingDate: '2025-01-15',
        agents: 'Agent',
        salePrice: 1000000,
        commissionRate: 3, // $30,000 commission
      };

      // YTD company dollar is $35,000 (in tier 2, since threshold is $30K)
      const result = calculateTransactionCommission(
        transaction,
        'Agent',
        plan,
        undefined,
        35000
      );

      // Should use tier 2 split (75/25)
      expect(result.brokerageSplitPercentage).toBe(25);
      expect(result.splitType).toBe('pre-cap'); // Not hitting cap yet
    });

    it('should switch to post-cap split after hitting cap', () => {
      const plan: CommissionPlan = {
        id: 'sliding-with-cap-2',
        name: 'Sliding Scale with Cap',
        splitPercentage: 60,
        capAmount: 50000,
        postCapSplit: 100,
        useSliding: true,
        tiers: [
          { id: 't1', threshold: 0, splitPercentage: 60, description: 'Tier 1' },
          { id: 't2', threshold: 30000, splitPercentage: 75, description: 'Tier 2' },
        ],
      };

      const transaction: TransactionInput = {
        id: 'txn1',
        loopName: 'Deal After Cap',
        closingDate: '2025-02-15',
        agents: 'Agent',
        salePrice: 500000,
        commissionRate: 3, // $15,000 commission
      };

      // YTD company dollar is already $50,000 (at cap)
      const result = calculateTransactionCommission(
        transaction,
        'Agent',
        plan,
        undefined,
        50000
      );

      // Should use post-cap split (100/0 for agent)
      expect(result.splitType).toBe('post-cap');
      expect(result.brokerageSplitPercentage).toBe(0); // Agent gets 100%
    });
  });

  describe('Sliding Scale Disabled', () => {
    it('should use base split when useSliding is false', () => {
      const plan: CommissionPlan = {
        id: 'no-sliding',
        name: 'Fixed Split Plan',
        splitPercentage: 70, // Base split
        capAmount: 100000,
        postCapSplit: 100,
        useSliding: false, // Sliding disabled
        tiers: [
          { id: 't1', threshold: 0, splitPercentage: 60, description: 'Tier 1' },
          { id: 't2', threshold: 50000, splitPercentage: 80, description: 'Tier 2' },
        ],
      };

      const transaction: TransactionInput = {
        id: 'txn1',
        loopName: 'Property',
        closingDate: '2025-01-15',
        agents: 'Agent',
        salePrice: 400000,
        commissionRate: 3, // $12,000 commission
      };

      // Even with high YTD, should use base split (70/30)
      const result = calculateTransactionCommission(
        transaction,
        'Agent',
        plan,
        undefined,
        80000 // High YTD
      );

      // Should ignore tiers and use base split (70/30)
      expect(result.brokerageSplitPercentage).toBe(30); // 100 - 70
    });

    it('should use base split when no tiers defined', () => {
      const plan: CommissionPlan = {
        id: 'no-tiers',
        name: 'Simple Plan',
        splitPercentage: 75,
        capAmount: 100000,
        postCapSplit: 100,
        useSliding: true, // Enabled but no tiers
        // No tiers defined
      };

      const transaction: TransactionInput = {
        id: 'txn1',
        loopName: 'Property',
        closingDate: '2025-01-15',
        agents: 'Agent',
        salePrice: 300000,
        commissionRate: 3, // $9,000 commission
      };

      const result = calculateTransactionCommission(
        transaction,
        'Agent',
        plan,
        undefined,
        50000
      );

      // Should use base split (75/25)
      expect(result.brokerageSplitPercentage).toBe(25); // 100 - 75
    });
  });

  describe('Tier Edge Cases', () => {
    it('should handle empty tiers array', () => {
      const plan: CommissionPlan = {
        id: 'empty-tiers',
        name: 'Plan with Empty Tiers',
        splitPercentage: 65,
        capAmount: 100000,
        postCapSplit: 100,
        useSliding: true,
        tiers: [], // Empty array
      };

      const transaction: TransactionInput = {
        id: 'txn1',
        loopName: 'Property',
        closingDate: '2025-01-15',
        agents: 'Agent',
        salePrice: 350000,
        commissionRate: 3, // $10,500 commission
      };

      const result = calculateTransactionCommission(
        transaction,
        'Agent',
        plan,
        undefined,
        30000
      );

      // Should fall back to base split
      expect(result.brokerageSplitPercentage).toBe(35); // 100 - 65
    });

    it('should handle tier threshold of zero', () => {
      const plan: CommissionPlan = {
        id: 'zero-threshold',
        name: 'Plan with Zero Threshold',
        splitPercentage: 60,
        capAmount: 100000,
        postCapSplit: 100,
        useSliding: true,
        tiers: [
          { id: 't1', threshold: 0, splitPercentage: 60, description: 'Starting tier' },
          { id: 't2', threshold: 50000, splitPercentage: 75, description: 'Higher tier' },
        ],
      };

      const transaction: TransactionInput = {
        id: 'txn1',
        loopName: 'First Deal',
        closingDate: '2025-01-01',
        agents: 'New Agent',
        salePrice: 200000,
        commissionRate: 3, // $6,000 commission
      };

      // YTD is 0 (first transaction)
      const result = calculateTransactionCommission(
        transaction,
        'New Agent',
        plan,
        undefined,
        0
      );

      // Should use first tier (60/40)
      expect(result.brokerageSplitPercentage).toBe(40);
    });

    it('should handle very high YTD amounts', () => {
      const plan: CommissionPlan = {
        id: 'high-ytd',
        name: 'Plan for High Performers',
        splitPercentage: 50,
        capAmount: 500000,
        postCapSplit: 100,
        useSliding: true,
        tiers: [
          { id: 't1', threshold: 0, splitPercentage: 50, description: 'Tier 1' },
          { id: 't2', threshold: 100000, splitPercentage: 70, description: 'Tier 2' },
          { id: 't3', threshold: 250000, splitPercentage: 85, description: 'Tier 3' },
        ],
      };

      const transaction: TransactionInput = {
        id: 'txn1',
        loopName: 'Mega Deal',
        closingDate: '2025-12-15',
        agents: 'Top Producer',
        salePrice: 2000000,
        commissionRate: 2.5, // $50,000 commission
      };

      // YTD is $300,000 (well into tier 3)
      const result = calculateTransactionCommission(
        transaction,
        'Top Producer',
        plan,
        undefined,
        300000
      );

      // Should use tier 3 split (85/15)
      expect(result.brokerageSplitPercentage).toBe(15); // 100 - 85
    });
  });

  describe('Sliding Scale with Team Splits', () => {
    it('should apply team split before tier-based brokerage split', () => {
      const plan: CommissionPlan = {
        id: 'team-sliding',
        name: 'Team Plan with Sliding Scale',
        splitPercentage: 60,
        capAmount: 100000,
        postCapSplit: 100,
        useSliding: true,
        tiers: [
          { id: 't1', threshold: 0, splitPercentage: 60, description: 'Tier 1' },
          { id: 't2', threshold: 50000, splitPercentage: 75, description: 'Tier 2' },
        ],
      };

      const team: Team = {
        id: 'team1',
        name: 'Sales Team A',
        leadAgent: 'Team Lead',
        teamSplitPercentage: 10, // Team lead gets 10%
      };

      const transaction: TransactionInput = {
        id: 'txn1',
        loopName: 'Team Deal',
        closingDate: '2025-02-15',
        agents: 'Team Member',
        salePrice: 500000,
        commissionRate: 3, // $15,000 commission
      };

      // YTD is $60,000 (in tier 2)
      const result = calculateTransactionCommission(
        transaction,
        'Team Member',
        plan,
        team,
        60000
      );

      // GCI = $15,000
      // After team split (10%): $13,500
      // Agent share at tier 2 (75%): $10,125
      // Company share (25%): $3,375
      expect(result.teamSplitAmount).toBe(1500);
      expect(result.teamSplitPercentage).toBe(10);
      expect(result.brokerageSplitPercentage).toBe(25); // Tier 2: 75/25
    });
  });
});
