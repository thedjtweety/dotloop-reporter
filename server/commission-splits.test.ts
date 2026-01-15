import { describe, expect, it } from "vitest";
import { calculateTransactionCommission, type CommissionPlan, type TransactionInput } from "./lib/commission-calculator";

/**
 * Commission Split Validation Tests
 * 
 * Focused test suite validating that commission splits are correctly applied
 * according to different agent plans with industry-standard logic.
 */

// Test Plans
const plans = {
  standard: {
    id: "plan-1",
    name: "Standard Sliding Scale",
    splitPercentage: 60,
    capAmount: 500000,
    postCapSplit: 100,
    useSliding: false,
  } as CommissionPlan,
  
  conservative: {
    id: "plan-2",
    name: "Conservative Plan",
    splitPercentage: 70,
    capAmount: 300000,
    postCapSplit: 100,
    useSliding: false,
  } as CommissionPlan,
  
  aggressive: {
    id: "plan-3",
    name: "Aggressive Growth",
    splitPercentage: 55,
    capAmount: 750000,
    postCapSplit: 100,
    useSliding: false,
  } as CommissionPlan,
  
  performance: {
    id: "plan-4",
    name: "Performance Tier",
    splitPercentage: 75,
    capAmount: 25000,
    postCapSplit: 100,
    useSliding: false,
  } as CommissionPlan,
};

function createTxn(overrides: Partial<TransactionInput> = {}): TransactionInput {
  return {
    id: "txn-001",
    loopName: "Test Property",
    closingDate: "2026-01-15",
    agents: "Agent One",
    salePrice: 500000,
    commissionRate: 3,
    commissionTotal: 15000,
    buySidePercent: 50,
    sellSidePercent: 50,
    ...overrides,
  };
}

describe("Commission Split Calculations", () => {
  it("60/40 split (Standard Plan) - Agent gets 60%", () => {
    const txn = createTxn({ commissionTotal: 10000 });
    const breakdown = calculateTransactionCommission(txn, "Agent One", plans.standard, undefined, 0);

    expect(breakdown.grossCommissionIncome).toBe(10000);
    expect(breakdown.brokerageSplitAmount).toBe(4000); // 40%
    expect(breakdown.agentNetCommission).toBe(6000); // 60%
  });

  it("70/30 split (Conservative Plan) - Agent gets 70%", () => {
    const txn = createTxn({ commissionTotal: 10000 });
    const breakdown = calculateTransactionCommission(txn, "Agent One", plans.conservative, undefined, 0);

    expect(breakdown.grossCommissionIncome).toBe(10000);
    expect(breakdown.brokerageSplitAmount).toBe(3000); // 30%
    expect(breakdown.agentNetCommission).toBe(7000); // 70%
  });

  it("55/45 split (Aggressive Plan) - Agent gets 55%", () => {
    const txn = createTxn({ commissionTotal: 10000 });
    const breakdown = calculateTransactionCommission(txn, "Agent One", plans.aggressive, undefined, 0);

    expect(breakdown.grossCommissionIncome).toBe(10000);
    expect(breakdown.brokerageSplitAmount).toBe(4500); // 45%
    expect(breakdown.agentNetCommission).toBe(5500); // 55%
  });

  it("75/25 split (Performance Plan) - Agent gets 75%", () => {
    const txn = createTxn({ commissionTotal: 10000 });
    const breakdown = calculateTransactionCommission(txn, "Agent One", plans.performance, undefined, 0);

    expect(breakdown.grossCommissionIncome).toBe(10000);
    expect(breakdown.brokerageSplitAmount).toBe(2500); // 25%
    expect(breakdown.agentNetCommission).toBe(7500); // 75%
  });
});

describe("Commission Cap Enforcement", () => {
  it("Pre-cap: Agent receives split percentage when under cap", () => {
    const txn = createTxn({ commissionTotal: 10000 });
    const breakdown = calculateTransactionCommission(txn, "Agent One", plans.standard, undefined, 100000);

    expect(breakdown.splitType).toBe("pre-cap");
    expect(breakdown.agentNetCommission).toBe(6000); // 60% of $10k
    expect(breakdown.brokerageSplitAmount).toBe(4000); // 40% of $10k
  });

  it("Post-cap: Agent receives 100% when cap is exceeded", () => {
    const txn = createTxn({ commissionTotal: 10000 });
    const breakdown = calculateTransactionCommission(txn, "Agent One", plans.standard, undefined, 500000);

    expect(breakdown.splitType).toBe("post-cap");
    expect(breakdown.agentNetCommission).toBe(10000); // 100%
    expect(breakdown.brokerageSplitAmount).toBe(0); // 0%
  });

  it("Mixed: Transaction crosses cap boundary", () => {
    const txn = createTxn({ commissionTotal: 10000 });
    const breakdown = calculateTransactionCommission(txn, "Agent One", plans.standard, undefined, 495000);

    expect(breakdown.splitType).toBe("mixed");
    // First $5k at 60/40, remaining $5k at 100%
    expect(breakdown.agentNetCommission).toBe(8000);
    expect(breakdown.brokerageSplitAmount).toBe(2000);
  });
});

describe("Multi-Agent Transactions", () => {
  it("GCI split equally among 3 agents", () => {
    const txn = createTxn({
      commissionTotal: 15000,
      agents: "Agent One, Agent Two, Agent Three",
    });
    const breakdown = calculateTransactionCommission(txn, "Agent One", plans.standard, undefined, 0);

    // $15k / 3 = $5k per agent
    expect(breakdown.grossCommissionIncome).toBe(5000);
    expect(breakdown.agentNetCommission).toBe(3000); // 60% of $5k
    expect(breakdown.brokerageSplitAmount).toBe(2000); // 40% of $5k
  });

  it("GCI split equally among 2 agents", () => {
    const txn = createTxn({
      commissionTotal: 12000,
      agents: "Buyer Agent, Seller Agent",
    });
    const breakdown = calculateTransactionCommission(txn, "Buyer Agent", plans.standard, undefined, 0);

    // $12k / 2 = $6k per agent
    expect(breakdown.grossCommissionIncome).toBe(6000);
    expect(breakdown.agentNetCommission).toBe(3600); // 60% of $6k
    expect(breakdown.brokerageSplitAmount).toBe(2400); // 40% of $6k
  });
});

describe("Plan Comparison - Agent Earnings", () => {
  it("Conservative plan (70%) pays more than Aggressive plan (55%)", () => {
    const txn = createTxn({ commissionTotal: 10000 });

    const conservative = calculateTransactionCommission(txn, "Agent One", plans.conservative, undefined, 0);
    const aggressive = calculateTransactionCommission(txn, "Agent One", plans.aggressive, undefined, 0);

    expect(conservative.agentNetCommission).toBe(7000);
    expect(aggressive.agentNetCommission).toBe(5500);
    expect(conservative.agentNetCommission).toBeGreaterThan(aggressive.agentNetCommission);
  });

  it("Lower cap limits post-cap earnings", () => {
    const txn = createTxn({ commissionTotal: 10000 });

    // Performance plan with $25k cap (already capped)
    const lowCap = calculateTransactionCommission(txn, "Agent One", plans.performance, undefined, 25000);
    
    // Standard plan with $500k cap (not capped)
    const highCap = calculateTransactionCommission(txn, "Agent One", plans.standard, undefined, 25000);

    // Low cap: agent gets 100% (post-cap)
    expect(lowCap.agentNetCommission).toBe(10000);
    
    // High cap: agent gets 60% (pre-cap)
    expect(highCap.agentNetCommission).toBe(6000);
  });
});

describe("Large Commission Amounts", () => {
  it("Handles large commissions correctly", () => {
    const txn = createTxn({ commissionTotal: 1000000 });
    const breakdown = calculateTransactionCommission(txn, "Agent One", plans.standard, undefined, 0);

    expect(breakdown.agentNetCommission).toBe(600000); // 60% of $1M
    expect(breakdown.brokerageSplitAmount).toBe(400000); // 40% of $1M
  });

  it("Handles fractional amounts correctly", () => {
    const txn = createTxn({ commissionTotal: 12345.67 });
    const breakdown = calculateTransactionCommission(txn, "Agent One", plans.standard, undefined, 0);

    expect(breakdown.agentNetCommission).toBeCloseTo(7407.40, 1);
    expect(breakdown.brokerageSplitAmount).toBeCloseTo(4938.27, 1);
  });
});

describe("Edge Cases", () => {
  it("Handles zero commission", () => {
    const txn = createTxn({ commissionTotal: 0 });
    const breakdown = calculateTransactionCommission(txn, "Agent One", plans.standard, undefined, 0);

    expect(breakdown.grossCommissionIncome).toBe(0);
    expect(breakdown.agentNetCommission).toBe(0);
    expect(breakdown.brokerageSplitAmount).toBe(0);
  });

  it("Handles unlimited cap (zero cap amount)", () => {
    const noCap: CommissionPlan = { ...plans.standard, capAmount: 0 };
    const txn = createTxn({ commissionTotal: 10000 });
    const breakdown = calculateTransactionCommission(txn, "Agent One", noCap, undefined, 1000000);

    expect(breakdown.splitType).toBe("pre-cap");
    expect(breakdown.agentNetCommission).toBe(6000);
  });
});
