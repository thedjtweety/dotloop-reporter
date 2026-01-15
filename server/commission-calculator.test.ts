import { describe, it, expect, beforeEach } from 'vitest';
import { calculateCommissions } from './lib/commission-calculator';
import type { TransactionInput, CommissionPlan, Team, AgentPlanAssignment } from '@shared/types';

describe('Commission Calculator', () => {
  let transactions: TransactionInput[];
  let plans: CommissionPlan[];
  let teams: Team[];
  let assignments: AgentPlanAssignment[];

  beforeEach(() => {
    // Sample transaction data
    // Note: commissionRate is in percentage format (e.g., 6 for 6%), not decimal
    transactions = [
      {
        id: 'txn-1',
        loopName: 'Property A',
        closingDate: '2024-01-15',
        agents: 'Amanda Garcia',
        salePrice: 500000,
        commissionRate: 6, // 6%
        buySidePercent: 50,
        sellSidePercent: 50,
      },
      {
        id: 'txn-2',
        loopName: 'Property B',
        closingDate: '2024-01-20',
        agents: 'ashley martin', // Different case
        salePrice: 450000,
        commissionRate: 6, // 6%
        buySidePercent: 50,
        sellSidePercent: 50,
      },
      {
        id: 'txn-3',
        loopName: 'Property C',
        closingDate: '2024-01-25',
        agents: '  CHRISTOPHER HARRIS  ', // With extra whitespace
        salePrice: 600000,
        commissionRate: 6, // 6%
        buySidePercent: 50,
        sellSidePercent: 50,
      },
    ];

    // Commission plans
    plans = [
      {
        id: 'plan-1',
        name: 'Standard (80/20)',
        splitPercentage: 80,
        capAmount: 10000,
        postCapSplit: 100,
        deductions: undefined,
        royaltyPercentage: 0,
        royaltyCap: 0,
        useSliding: false,
      },
    ];

    // Teams
    teams = [];

    // Agent assignments with canonical names
    assignments = [
      {
        id: 'assign-1',
        agentName: 'Amanda Garcia', // Canonical name
        planId: 'plan-1',
        teamId: undefined,
        startDate: '2024-01-01',
        anniversaryDate: '01-01',
      },
      {
        id: 'assign-2',
        agentName: 'Ashley Martin', // Canonical name (different case than CSV)
        planId: 'plan-1',
        teamId: undefined,
        startDate: '2024-01-01',
        anniversaryDate: '01-01',
      },
      {
        id: 'assign-3',
        agentName: 'Christopher Harris', // Canonical name (different whitespace than CSV)
        planId: 'plan-1',
        teamId: undefined,
        startDate: '2024-01-01',
        anniversaryDate: '01-01',
      },
    ];
  });

  it('should generate breakdowns for all agents despite case/whitespace differences', () => {
    const result = calculateCommissions(transactions, plans, teams, assignments);

    // Should have 3 breakdowns (one per transaction)
    expect(result.breakdowns).toHaveLength(3);
    expect(result.breakdowns[0].agentName).toBe('Amanda Garcia');
    expect(result.breakdowns[1].agentName).toBe('Ashley Martin');
    expect(result.breakdowns[2].agentName).toBe('Christopher Harris');
  });

  it('should match agent names case-insensitively', () => {
    const result = calculateCommissions(transactions, plans, teams, assignments);

    // All breakdowns should be generated despite case differences
    const agentNames = result.breakdowns.map(b => b.agentName);
    expect(agentNames).toContain('Amanda Garcia');
    expect(agentNames).toContain('Ashley Martin');
    expect(agentNames).toContain('Christopher Harris');
  });

  it('should handle whitespace differences in agent names', () => {
    const result = calculateCommissions(transactions, plans, teams, assignments);

    // Should have generated breakdown for Christopher Harris despite extra whitespace
    const christopherBreakdown = result.breakdowns.find(b => b.agentName === 'Christopher Harris');
    expect(christopherBreakdown).toBeDefined();
    expect(christopherBreakdown?.loopName).toBe('Property C');
  });

  it('should calculate correct commission amounts', () => {
    const result = calculateCommissions(transactions, plans, teams, assignments);

    // Transaction 1: $500,000 * 6% = $30,000 GCI
    const txn1 = result.breakdowns[0];
    expect(txn1.grossCommissionIncome).toBe(30000);
    expect(txn1.brokerageSplitAmount).toBeGreaterThan(0); // 20% of GCI
    expect(txn1.agentNetCommission).toBeGreaterThan(0); // 80% of split

    // Transaction 2: $450,000 * 6% = $27,000 GCI
    const txn2 = result.breakdowns[1];
    expect(txn2.grossCommissionIncome).toBe(27000);

    // Transaction 3: $600,000 * 6% = $36,000 GCI
    const txn3 = result.breakdowns[2];
    expect(txn3.grossCommissionIncome).toBe(36000);
  });

  it('should generate YTD summaries for all assigned agents', () => {
    const result = calculateCommissions(transactions, plans, teams, assignments);

    // Should have 3 YTD summaries (one per agent)
    expect(result.ytdSummaries).toHaveLength(3);

    // Check that all agents have summaries
    const summaryAgents = result.ytdSummaries.map(s => s.agentName);
    expect(summaryAgents).toContain('Amanda Garcia');
    expect(summaryAgents).toContain('Ashley Martin');
    expect(summaryAgents).toContain('Christopher Harris');
  });

  it('should correctly track YTD commission per agent', () => {
    const result = calculateCommissions(transactions, plans, teams, assignments);

    // Amanda Garcia should have YTD from one transaction
    const amandaSummary = result.ytdSummaries.find(s => s.agentName === 'Amanda Garcia');
    expect(amandaSummary).toBeDefined();
    expect(amandaSummary?.transactionCount).toBe(1);
    expect(amandaSummary?.ytdGrossCommission).toBe(30000);

    // Ashley Martin should have YTD from one transaction
    const ashleySummary = result.ytdSummaries.find(s => s.agentName === 'Ashley Martin');
    expect(ashleySummary).toBeDefined();
    expect(ashleySummary?.transactionCount).toBe(1);
    expect(ashleySummary?.ytdGrossCommission).toBe(27000);

    // Christopher Harris should have YTD from one transaction
    const christopherSummary = result.ytdSummaries.find(s => s.agentName === 'Christopher Harris');
    expect(christopherSummary).toBeDefined();
    expect(christopherSummary?.transactionCount).toBe(1);
    expect(christopherSummary?.ytdGrossCommission).toBe(36000);
  });

  it('should skip agents without plan assignments', () => {
    // Add a transaction for an unassigned agent
    const txnWithUnassignedAgent: TransactionInput = {
      id: 'txn-4',
      loopName: 'Property D',
      closingDate: '2024-01-30',
      agents: 'Unknown Agent',
      salePrice: 400000,
      commissionRate: 6, // 6%
      buySidePercent: 50,
      sellSidePercent: 50,
    };

    const result = calculateCommissions(
      [...transactions, txnWithUnassignedAgent],
      plans,
      teams,
      assignments
    );

    // Should still have only 3 breakdowns (unassigned agent skipped)
    expect(result.breakdowns).toHaveLength(3);

    // Should have 3 YTD summaries (only assigned agents)
    expect(result.ytdSummaries).toHaveLength(3);
  });

  it('should handle multiple agents per transaction', () => {
    const multiAgentTxn: TransactionInput = {
      id: 'txn-multi',
      loopName: 'Multi-Agent Property',
      closingDate: '2024-02-01',
      agents: 'Amanda Garcia, Ashley Martin',
      salePrice: 500000,
      commissionRate: 6, // 6%
      buySidePercent: 50,
      sellSidePercent: 50,
    };

    const result = calculateCommissions([multiAgentTxn], plans, teams, assignments);

    // Should have 2 breakdowns (one per agent)
    expect(result.breakdowns).toHaveLength(2);
    expect(result.breakdowns[0].agentName).toBe('Amanda Garcia');
    expect(result.breakdowns[1].agentName).toBe('Ashley Martin');

    // GCI is split between agents: $500,000 * 6% = $30,000 total, $15,000 each
    expect(result.breakdowns[0].grossCommissionIncome).toBe(15000);
    expect(result.breakdowns[1].grossCommissionIncome).toBe(15000);
  });
});
