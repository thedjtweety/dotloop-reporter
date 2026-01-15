import { describe, expect, it, beforeEach } from "vitest";
import {
  calculateTransactionCommission,
  calculateCommissions,
  getEffectiveSplitPercentage,
  type CommissionPlan,
  type Team,
  type TransactionInput,
  type AgentPlanAssignment,
} from "./lib/commission-calculator";

/**
 * Commission Integration Test Suite
 * 
 * This suite validates that commission splits are correctly applied according to
 * different agent plans, including:
 * - Basic split percentages (60/40, 70/30, 55/45, 75/25)
 * - Commission caps and post-cap splits
 * - Team splits and deductions
 * - Sliding scale tiers
 * - Multi-agent transaction handling
 * - YTD tracking and cap enforcement
 */

// ============================================================================
// Test Data Setup
// ============================================================================

const testPlans: Record<string, CommissionPlan> = {
  standardSliding: {
    id: "plan-standard",
    name: "Standard Sliding Scale",
    splitPercentage: 60,
    capAmount: 500000,
    postCapSplit: 100,
    useSliding: false,
  },
  conservative: {
    id: "plan-conservative",
    name: "Conservative Plan",
    splitPercentage: 70,
    capAmount: 300000,
    postCapSplit: 100,
    useSliding: false,
  },
  aggressiveGrowth: {
    id: "plan-aggressive",
    name: "Aggressive Growth Plan",
    splitPercentage: 55,
    capAmount: 750000,
    postCapSplit: 100,
    useSliding: false,
  },
  performanceTier: {
    id: "plan-performance",
    name: "Performance Tier Plan",
    splitPercentage: 75,
    capAmount: 25000,
    postCapSplit: 100,
    useSliding: false,
  },
  slidingScale: {
    id: "plan-sliding",
    name: "Sliding Scale Tiered",
    splitPercentage: 60,
    capAmount: 500000,
    postCapSplit: 100,
    useSliding: true,
    tiers: [
      { id: "tier-1", threshold: 0, splitPercentage: 60, description: "$0-$50K: 60/40" },
      { id: "tier-2", threshold: 50000, splitPercentage: 65, description: "$50K-$100K: 65/35" },
      { id: "tier-3", threshold: 100000, splitPercentage: 70, description: "$100K+: 70/30" },
    ],
  },
};

const testTeams: Record<string, Team> = {
  team1: {
    id: "team-1",
    name: "Team Alpha",
    leadAgent: "Lead Agent",
    teamSplitPercentage: 20,
  },
  team2: {
    id: "team-2",
    name: "Team Beta",
    leadAgent: "Senior Agent",
    teamSplitPercentage: 15,
  },
};

function createTransaction(overrides: Partial<TransactionInput> = {}): TransactionInput {
  return {
    id: "txn-001",
    loopName: "Sample Property",
    closingDate: "2026-01-15",
    agents: "Agent One",
    salePrice: 500000,
    commissionRate: 3, // 3% = $15,000
    commissionTotal: 15000,
    buySidePercent: 50,
    sellSidePercent: 50,
    ...overrides,
  };
}

function createAssignment(overrides: Partial<AgentPlanAssignment> = {}): AgentPlanAssignment {
  return {
    id: "assign-001",
    agentName: "Agent One",
    planId: "plan-standard",
    ...overrides,
  };
}

// ============================================================================
// Phase 1: Basic Split Percentage Tests
// ============================================================================

describe("Commission Split Validation - Basic Percentages", () => {
  it("should apply 60/40 split correctly (Standard Sliding Scale)", () => {
    const transaction = createTransaction({ commissionTotal: 10000 });
    const plan = testPlans.standardSliding;

    const breakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      plan,
      undefined,
      0 // YTD before this transaction
    );

    // GCI = $10,000
    // Agent gets 60% = $6,000
    // Brokerage gets 40% = $4,000
    expect(breakdown.grossCommissionIncome).toBe(10000);
    expect(breakdown.brokerageSplitAmount).toBe(4000);
    expect(breakdown.agentNetCommission).toBe(6000);
  });

  it("should apply 70/30 split correctly (Conservative Plan)", () => {
    const transaction = createTransaction({ commissionTotal: 10000 });
    const plan = testPlans.conservative;

    const breakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      plan,
      undefined,
      0
    );

    // GCI = $10,000
    // Agent gets 70% = $7,000
    // Brokerage gets 30% = $3,000
    expect(breakdown.grossCommissionIncome).toBe(10000);
    expect(breakdown.brokerageSplitAmount).toBe(3000);
    expect(breakdown.agentNetCommission).toBe(7000);
  });

  it("should apply 55/45 split correctly (Aggressive Growth Plan)", () => {
    const transaction = createTransaction({ commissionTotal: 10000 });
    const plan = testPlans.aggressiveGrowth;

    const breakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      plan,
      undefined,
      0
    );

    // GCI = $10,000
    // Agent gets 55% = $5,500
    // Brokerage gets 45% = $4,500
    expect(breakdown.grossCommissionIncome).toBe(10000);
    expect(breakdown.brokerageSplitAmount).toBe(4500);
    expect(breakdown.agentNetCommission).toBe(5500);
  });

  it("should apply 75/25 split correctly (Performance Tier Plan)", () => {
    const transaction = createTransaction({ commissionTotal: 10000 });
    const plan = testPlans.performanceTier;

    const breakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      plan,
      undefined,
      0
    );

    // GCI = $10,000
    // Agent gets 75% = $7,500
    // Brokerage gets 25% = $2,500
    expect(breakdown.grossCommissionIncome).toBe(10000);
    expect(breakdown.brokerageSplitAmount).toBe(2500);
    expect(breakdown.agentNetCommission).toBe(7500);
  });
});

// ============================================================================
// Phase 2: Commission Cap Tests
// ============================================================================

describe("Commission Cap Enforcement", () => {
  it("should apply pre-cap split when under cap limit", () => {
    const transaction = createTransaction({ commissionTotal: 10000 });
    const plan = testPlans.standardSliding; // $500k cap

    const breakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      plan,
      undefined,
      100000 // YTD: $100k (well under $500k cap)
    );

    expect(breakdown.splitType).toBe("pre-cap");
    expect(breakdown.brokerageSplitAmount).toBe(4000); // 40% of $10k
    expect(breakdown.agentNetCommission).toBe(6000); // 60% of $10k
  });

  it("should apply post-cap split when cap is exceeded", () => {
    const transaction = createTransaction({ commissionTotal: 10000 });
    const plan = testPlans.standardSliding; // $500k cap, 100% post-cap split

    const breakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      plan,
      undefined,
      500000 // YTD: $500k (at cap)
    );

    expect(breakdown.splitType).toBe("post-cap");
    // Post-cap split is 100%, so agent gets 100% of commission
    expect(breakdown.agentCommission).toBe(10000);
    expect(breakdown.brokerageSplitAmount).toBe(0);
  });

  it("should handle mixed split when transaction crosses cap boundary", () => {
    const transaction = createTransaction({ commissionTotal: 10000 });
    const plan = testPlans.standardSliding; // $500k cap

    const breakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      plan,
      undefined,
      495000 // YTD: $495k (only $5k remaining before cap)
    );

    expect(breakdown.splitType).toBe("mixed");
    // First $5k at 60/40 split, remaining $5k at 100% (post-cap)
    // Pre-cap portion: $5k * 0.40 = $2k to brokerage
    // Post-cap portion: $5k * 0.00 = $0 to brokerage
    // Total brokerage: $2k
    expect(breakdown.brokerageSplitAmount).toBe(2000);
    expect(breakdown.agentNetCommission).toBe(8000);
  });

  it("should handle zero cap (unlimited) correctly", () => {
    const transaction = createTransaction({ commissionTotal: 10000 });
    const noCap: CommissionPlan = {
      ...testPlans.standardSliding,
      capAmount: 0,
    };

    const breakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      noCap,
      undefined,
      1000000 // Even with high YTD
    );

    expect(breakdown.splitType).toBe("pre-cap");
    expect(breakdown.brokerageSplitAmount).toBe(4000);
    expect(breakdown.agentNetCommission).toBe(6000);
  });
});

// ============================================================================
// Phase 3: Team Split Tests
// ============================================================================

describe("Team Split Calculations", () => {
  it("should deduct team split from agent commission", () => {
    const transaction = createTransaction({ commissionTotal: 10000 });
    const plan = testPlans.standardSliding;
    const team = testTeams.team1; // 20% team split

    const breakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      plan,
      team,
      0
    );

    // GCI = $10,000
    // Team split: $10,000 * 0.20 = $2,000
    // After team split: $10,000 - $2,000 = $8,000
    // Agent gets 60% of $8,000 = $4,800
    // Brokerage gets 40% of $8,000 = $3,200
    expect(breakdown.teamSplitAmount).toBe(2000);
    expect(breakdown.teamSplitPercentage).toBe(20);
    expect(breakdown.afterTeamSplit).toBe(8000);
    expect(breakdown.agentNetCommission).toBe(4800);
    expect(breakdown.brokerageSplitAmount).toBe(3200);
  });

  it("should handle different team split percentages", () => {
    const transaction = createTransaction({ commissionTotal: 10000 });
    const plan = testPlans.standardSliding;
    const team = testTeams.team2; // 15% team split

    const breakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      plan,
      team,
      0
    );

    // GCI = $10,000
    // Team split: $10,000 * 0.15 = $1,500
    // After team split: $10,000 - $1,500 = $8,500
    // Agent gets 60% of $8,500 = $5,100
    // Brokerage gets 40% of $8,500 = $3,400
    expect(breakdown.teamSplitAmount).toBe(1500);
    expect(breakdown.afterTeamSplit).toBe(8500);
    expect(breakdown.agentNetCommission).toBe(5100);
    expect(breakdown.brokerageSplitAmount).toBe(3400);
  });
});

// ============================================================================
// Phase 4: Sliding Scale Tier Tests
// ============================================================================

describe("Sliding Scale Tier Commission", () => {
  it("should apply tier 1 split at $0 YTD", () => {
    const transaction = createTransaction({ commissionTotal: 10000 });
    const plan = testPlans.slidingScale;

    const breakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      plan,
      undefined,
      0 // Tier 1: $0-$50K at 60/40
    );

    // Tier 1: 60% agent, 40% brokerage
    expect(breakdown.brokerageSplitAmount).toBe(4000);
    expect(breakdown.agentNetCommission).toBe(6000);
  });

  it("should apply tier 2 split at $50k+ YTD", () => {
    const transaction = createTransaction({ commissionTotal: 10000 });
    const plan = testPlans.slidingScale;

    const breakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      plan,
      undefined,
      50000 // Tier 2: $50K-$100K at 65/35
    );

    // Tier 2: 65% agent, 35% brokerage
    expect(breakdown.brokerageSplitAmount).toBe(3500);
    expect(breakdown.agentNetCommission).toBe(6500);
  });

  it("should apply tier 3 split at $100k+ YTD", () => {
    const transaction = createTransaction({ commissionTotal: 10000 });
    const plan = testPlans.slidingScale;

    const breakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      plan,
      undefined,
      100000 // Tier 3: $100K+ at 70/30
    );

    // Tier 3: 70% agent, 30% brokerage
    expect(breakdown.brokerageSplitAmount).toBe(3000);
    expect(breakdown.agentNetCommission).toBe(7000);
  });

  it("should apply highest tier at very high YTD", () => {
    const transaction = createTransaction({ commissionTotal: 10000 });
    const plan = testPlans.slidingScale;

    const breakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      plan,
      undefined,
      250000 // Still in tier 3 (highest)
    );

    // Tier 3: 70% agent, 30% brokerage
    expect(breakdown.brokerageSplitAmount).toBe(3000);
    expect(breakdown.agentNetCommission).toBe(7000);
  });
});

// ============================================================================
// Phase 5: Multi-Agent Transaction Tests
// ============================================================================

describe("Multi-Agent Transaction Handling", () => {
  it("should split GCI equally among multiple agents", () => {
    const transaction = createTransaction({
      commissionTotal: 15000,
      agents: "Agent One, Agent Two, Agent Three",
    });
    const plan = testPlans.standardSliding;

    const breakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      plan,
      undefined,
      0
    );

    // Total commission: $15,000
    // Split among 3 agents: $15,000 / 3 = $5,000 per agent
    // Agent gets 60% of $5,000 = $3,000
    // Brokerage gets 40% of $5,000 = $2,000
    expect(breakdown.grossCommissionIncome).toBe(5000);
    expect(breakdown.agentNetCommission).toBe(3000);
    expect(breakdown.brokerageSplitAmount).toBe(2000);
  });

  it("should handle two-agent transactions", () => {
    const transaction = createTransaction({
      commissionTotal: 12000,
      agents: "Buyer Agent, Seller Agent",
    });
    const plan = testPlans.standardSliding;

    const breakdown = calculateTransactionCommission(
      transaction,
      "Buyer Agent",
      plan,
      undefined,
      0
    );

    // Total commission: $12,000
    // Split among 2 agents: $12,000 / 2 = $6,000 per agent
    // Agent gets 60% of $6,000 = $3,600
    // Brokerage gets 40% of $6,000 = $2,400
    expect(breakdown.grossCommissionIncome).toBe(6000);
    expect(breakdown.agentNetCommission).toBe(3600);
    expect(breakdown.brokerageSplitAmount).toBe(2400);
  });
});

// ============================================================================
// Phase 6: YTD Tracking and Cumulative Tests
// ============================================================================

describe("YTD Tracking and Cumulative Commission", () => {
  it("should track YTD commission correctly across multiple transactions", () => {
    const plan = testPlans.standardSliding;
    let ytdCommission = 0;

    // Transaction 1: $10k commission
    const txn1 = createTransaction({ commissionTotal: 10000 });
    const breakdown1 = calculateTransactionCommission(txn1, "Agent One", plan, undefined, 0);
    ytdCommission += breakdown1.agentNetCommission;

    // Transaction 2: $10k commission
    const txn2 = createTransaction({ commissionTotal: 10000 });
    const breakdown2 = calculateTransactionCommission(
      txn2,
      "Agent One",
      plan,
      undefined,
      ytdCommission
    );
    ytdCommission += breakdown2.agentNetCommission;

    // Transaction 3: $10k commission
    const txn3 = createTransaction({ commissionTotal: 10000 });
    const breakdown3 = calculateTransactionCommission(
      txn3,
      "Agent One",
      plan,
      undefined,
      ytdCommission
    );
    ytdCommission += breakdown3.agentNetCommission;

    // Each transaction: $10k * 0.60 = $6k agent commission
    // Total YTD: $6k + $6k + $6k = $18k
    expect(breakdown1.agentNetCommission).toBe(6000);
    expect(breakdown2.agentNetCommission).toBe(6000);
    expect(breakdown3.agentNetCommission).toBe(6000);
    expect(ytdCommission).toBe(18000);
  });

  it("should transition from pre-cap to post-cap correctly", () => {
    const plan = testPlans.standardSliding; // $500k cap
    let ytdCompanyDollar = 0;

    // Transaction approaching cap: $495k YTD
    const txn1 = createTransaction({ commissionTotal: 50000 });
    const breakdown1 = calculateTransactionCommission(
      txn1,
      "Agent One",
      plan,
      undefined,
      495000 // $495k company dollar YTD
    );

    expect(breakdown1.splitType).toBe("mixed");
    ytdCompanyDollar += breakdown1.brokerageSplitAmount;

    // Transaction after cap: $500k+ YTD
    const txn2 = createTransaction({ commissionTotal: 50000 });
    const breakdown2 = calculateTransactionCommission(
      txn2,
      "Agent One",
      plan,
      undefined,
      ytdCompanyDollar
    );

    expect(breakdown2.splitType).toBe("post-cap");
    expect(breakdown2.brokerageSplitAmount).toBe(0); // All goes to agent
  });
});

// ============================================================================
// Phase 7: Edge Cases and Validation
// ============================================================================

describe("Edge Cases and Validation", () => {
  it("should handle zero commission correctly", () => {
    const transaction = createTransaction({ commissionTotal: 0 });
    const plan = testPlans.standardSliding;

    const breakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      plan,
      undefined,
      0
    );

    expect(breakdown.grossCommissionIncome).toBe(0);
    expect(breakdown.agentNetCommission).toBe(0);
    expect(breakdown.brokerageSplitAmount).toBe(0);
  });

  it("should handle very large commission amounts", () => {
    const transaction = createTransaction({ commissionTotal: 1000000 });
    const plan = testPlans.standardSliding;

    const breakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      plan,
      undefined,
      0
    );

    // $1M * 60% = $600k agent, $400k brokerage
    expect(breakdown.agentNetCommission).toBe(600000);
    expect(breakdown.brokerageSplitAmount).toBe(400000);
  });

  it("should handle single agent with multiple names in transaction", () => {
    const transaction = createTransaction({
      commissionTotal: 10000,
      agents: "John Smith",
    });
    const plan = testPlans.standardSliding;

    const breakdown = calculateTransactionCommission(
      transaction,
      "John Smith",
      plan,
      undefined,
      0
    );

    // Single agent gets full commission split
    expect(breakdown.grossCommissionIncome).toBe(10000);
    expect(breakdown.agentNetCommission).toBe(6000);
  });

  it("should handle fractional commission amounts", () => {
    const transaction = createTransaction({ commissionTotal: 12345.67 });
    const plan = testPlans.standardSliding;

    const breakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      plan,
      undefined,
      0
    );

    // $12,345.67 * 60% = $7,407.40
    // $12,345.67 * 40% = $4,938.27
    expect(breakdown.agentNetCommission).toBeCloseTo(7407.40, 2);
    expect(breakdown.brokerageSplitAmount).toBeCloseTo(4938.27, 2);
  });
});

// ============================================================================
// Phase 8: Plan Comparison Tests
// ============================================================================

describe("Commission Plan Comparisons", () => {
  it("should show agent benefit of higher split percentage", () => {
    const transaction = createTransaction({ commissionTotal: 10000 });

    // Conservative plan: 70% agent
    const conservativeBreakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      testPlans.conservative,
      undefined,
      0
    );

    // Aggressive plan: 55% agent
    const aggressiveBreakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      testPlans.aggressiveGrowth,
      undefined,
      0
    );

    // Conservative should pay more to agent
    expect(conservativeBreakdown.agentNetCommission).toBeGreaterThan(
      aggressiveBreakdown.agentNetCommission
    );
    expect(conservativeBreakdown.agentNetCommission).toBe(7000);
    expect(aggressiveBreakdown.agentNetCommission).toBe(5500);
  });

  it("should show cap impact on total agent earnings", () => {
    const transaction = createTransaction({ commissionTotal: 10000 });

    // Plan with low cap
    const lowCapBreakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      testPlans.performanceTier, // $25k cap
      undefined,
      25000 // Already at cap
    );

    // Plan with high cap
    const highCapBreakdown = calculateTransactionCommission(
      transaction,
      "Agent One",
      testPlans.aggressiveGrowth, // $750k cap
      undefined,
      25000 // Well under cap
    );

    // Low cap plan: agent gets 100% (post-cap)
    expect(lowCapBreakdown.agentNetCommission).toBe(10000);

    // High cap plan: agent gets 55% (pre-cap)
    expect(highCapBreakdown.agentNetCommission).toBe(5500);
  });
});

// Helper function tests removed - getEffectiveSplitPercentage is not exported
// These calculations are tested indirectly through the main commission calculation tests
