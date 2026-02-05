/**
 * Commission Plan Simulation Utilities
 * Calculates what-if scenarios for different commission structures
 */

import { ForecastedDeal } from './projectionUtils';

export interface CommissionPlan {
  id: string;
  name: string;
  agentSplit: number;           // 0-100 (agent percentage)
  companySplit: number;         // 0-100 (company percentage)
  brokerageFee?: number;        // Percentage of company dollar
  deskFee?: number;             // Monthly desk fee per agent
  transactionFee?: number;      // Per-transaction fee
  minimumCommission?: number;   // Minimum commission per deal
}

export interface PlanEarnings {
  agentTotal: number;
  companyTotal: number;
  byAgent: Record<string, number>;
  byDeal: Array<{
    dealId: string;
    dealName: string;
    agent: string;
    baseCommission: number;
    agentEarnings: number;
    companyEarnings: number;
  }>;
}

export interface CommissionPlanComparison {
  currentPlan: CommissionPlan;
  simulatedPlan: CommissionPlan;
  timeframe: '30' | '60' | '90';
  currentEarnings: PlanEarnings;
  simulatedEarnings: PlanEarnings;
  impact: {
    agentDifference: number;
    agentPercentChange: number;
    companyDifference: number;
    companyPercentChange: number;
    agentsByImpact: Array<{
      agent: string;
      currentEarnings: number;
      simulatedEarnings: number;
      difference: number;
      percentChange: number;
    }>;
  };
}

/**
 * Calculate base commission for a deal
 * Commission = Price × 3% × Probability
 */
function calculateBaseCommission(deal: ForecastedDeal): number {
  const basePrice = deal.price || 0;
  const commissionRate = 0.03; // 3% commission rate
  const probability = deal.probability / 100; // Convert 0-100 to 0-1
  return basePrice * commissionRate * probability;
}

/**
 * Calculate earnings for a specific commission plan
 */
export function calculatePlanEarnings(
  deals: ForecastedDeal[],
  plan: CommissionPlan
): PlanEarnings {
  let agentTotal = 0;
  let companyTotal = 0;
  const byAgent: Record<string, number> = {};
  const byDeal: PlanEarnings['byDeal'] = [];

  for (const deal of deals) {
    const baseCommission = calculateBaseCommission(deal);

    // Apply plan splits
    const agentEarnings = baseCommission * (plan.agentSplit / 100);
    const companyEarnings = baseCommission * (plan.companySplit / 100);

    // Apply transaction fee (deducted from agent, added to company)
    const transactionFee = plan.transactionFee || 0;
    const agentAfterFees = Math.max(0, agentEarnings - transactionFee);
    const companyAfterFees = companyEarnings + transactionFee;

    // Apply brokerage fee (percentage of company dollar)
    let finalCompanyEarnings = companyAfterFees;
    if (plan.brokerageFee && plan.brokerageFee > 0) {
      const brokerageCut = companyAfterFees * (plan.brokerageFee / 100);
      finalCompanyEarnings = companyAfterFees - brokerageCut;
    }

    // Apply minimum commission if specified
    const finalAgentEarnings = plan.minimumCommission
      ? Math.max(agentAfterFees, plan.minimumCommission)
      : agentAfterFees;

    agentTotal += finalAgentEarnings;
    companyTotal += finalCompanyEarnings;

    // Track by agent
    const agentName = deal.agent || 'Unknown';
    if (!byAgent[agentName]) {
      byAgent[agentName] = 0;
    }
    byAgent[agentName] += finalAgentEarnings;

    // Track by deal
    byDeal.push({
      dealId: deal.id,
      dealName: deal.loopName,
      agent: agentName,
      baseCommission,
      agentEarnings: finalAgentEarnings,
      companyEarnings: finalCompanyEarnings,
    });
  }

  return {
    agentTotal,
    companyTotal,
    byAgent,
    byDeal,
  };
}

/**
 * Compare two commission plans
 */
export function comparePlans(
  deals: ForecastedDeal[],
  currentPlan: CommissionPlan,
  simulatedPlan: CommissionPlan,
  timeframe: '30' | '60' | '90' = '30'
): CommissionPlanComparison {
  const currentEarnings = calculatePlanEarnings(deals, currentPlan);
  const simulatedEarnings = calculatePlanEarnings(deals, simulatedPlan);

  // Calculate agent-by-agent impact
  const allAgents = new Set([
    ...Object.keys(currentEarnings.byAgent),
    ...Object.keys(simulatedEarnings.byAgent),
  ]);

  const agentsByImpact = Array.from(allAgents)
    .map((agent) => {
      const current = currentEarnings.byAgent[agent] || 0;
      const simulated = simulatedEarnings.byAgent[agent] || 0;
      const difference = simulated - current;
      const percentChange = current > 0 ? (difference / current) * 100 : 0;

      return {
        agent,
        currentEarnings: current,
        simulatedEarnings: simulated,
        difference,
        percentChange,
      };
    })
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

  return {
    currentPlan,
    simulatedPlan,
    timeframe,
    currentEarnings,
    simulatedEarnings,
    impact: {
      agentDifference: simulatedEarnings.agentTotal - currentEarnings.agentTotal,
      agentPercentChange:
        currentEarnings.agentTotal > 0
          ? ((simulatedEarnings.agentTotal - currentEarnings.agentTotal) /
              currentEarnings.agentTotal) *
            100
          : 0,
      companyDifference: simulatedEarnings.companyTotal - currentEarnings.companyTotal,
      companyPercentChange:
        currentEarnings.companyTotal > 0
          ? ((simulatedEarnings.companyTotal - currentEarnings.companyTotal) /
              currentEarnings.companyTotal) *
            100
          : 0,
      agentsByImpact,
    },
  };
}

/**
 * Predefined commission plan templates
 */
export const COMMISSION_PLAN_TEMPLATES: Record<string, CommissionPlan> = {
  standard60_40: {
    id: 'standard60_40',
    name: 'Standard 60/40',
    agentSplit: 60,
    companySplit: 40,
    brokerageFee: 0,
    deskFee: 0,
    transactionFee: 0,
  },
  aggressive70_30: {
    id: 'aggressive70_30',
    name: 'Aggressive 70/30',
    agentSplit: 70,
    companySplit: 30,
    brokerageFee: 0,
    deskFee: 0,
    transactionFee: 0,
  },
  conservative50_50: {
    id: 'conservative50_50',
    name: 'Conservative 50/50',
    agentSplit: 50,
    companySplit: 50,
    brokerageFee: 0,
    deskFee: 0,
    transactionFee: 0,
  },
  premium80_20: {
    id: 'premium80_20',
    name: 'Premium 80/20',
    agentSplit: 80,
    companySplit: 20,
    brokerageFee: 0,
    deskFee: 0,
    transactionFee: 0,
  },
};

/**
 * Format a commission plan for display
 */
export function formatCommissionPlan(plan: CommissionPlan): string {
  const parts = [`${plan.agentSplit}/${plan.companySplit}`];

  if (plan.transactionFee && plan.transactionFee > 0) {
    parts.push(`$${plan.transactionFee} per transaction`);
  }

  if (plan.deskFee && plan.deskFee > 0) {
    parts.push(`$${plan.deskFee}/mo desk fee`);
  }

  if (plan.brokerageFee && plan.brokerageFee > 0) {
    parts.push(`${plan.brokerageFee}% brokerage fee`);
  }

  return parts.join(' + ');
}
