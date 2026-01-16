/**
 * Commission Recalculation Helper
 * Recalculates commission for agents based on their assigned commission plans
 * Integrates with the existing commission.ts module
 */

import { CommissionPlan, getPlanForAgent, getAgentAssignments } from './commission';
import { AgentMetrics, DotloopRecord } from './csvParser';

export interface RecalculatedAgentMetrics extends AgentMetrics {
  recalculatedCommission: number;
  recalculatedCompanyDollar: number;
  planName?: string;
  hasPlan: boolean;
  commissionDifference: number; // Recalculated - Original
  companyDollarDifference: number; // Recalculated - Original
}

/**
 * Calculate agent's commission based on their assigned plan
 * @param agentName - Agent name
 * @param transactions - Transactions for this agent
 * @param plan - Commission plan (if any)
 * @returns Recalculated commission amounts
 */
export function calculatePlanBasedCommission(
  transactions: DotloopRecord[],
  plan: CommissionPlan | undefined
): { agentCommission: number; companyDollar: number } {
  if (!plan) {
    // No plan assigned - use original values
    return {
      agentCommission: transactions.reduce((sum, t) => sum + (t.commissionTotal || 0), 0),
      companyDollar: transactions.reduce((sum, t) => sum + (t.companyDollar || 0), 0),
    };
  }

  let totalAgentCommission = 0;
  let totalCompanyDollar = 0;
  let ytdCompanyDollar = 0;

  // Process each transaction
  transactions.forEach(transaction => {
    const grossCommission = transaction.commissionTotal || 0;
    if (grossCommission <= 0) return;

    // Calculate company dollar based on plan
    let companyDollarForTransaction = 0;
    const agentShare = (grossCommission * plan.splitPercentage) / 100;
    const brokerageShare = grossCommission - agentShare;

    // Check if cap applies
    if (plan.capAmount > 0 && ytdCompanyDollar >= plan.capAmount) {
      // Already capped - use post-cap split
      companyDollarForTransaction = (brokerageShare * (100 - plan.postCapSplit)) / 100;
    } else if (plan.capAmount > 0) {
      // Check if this transaction hits the cap
      const remainingCap = plan.capAmount - ytdCompanyDollar;
      if (brokerageShare > remainingCap) {
        // This transaction hits the cap
        const excessAmount = brokerageShare - remainingCap;
        const postCapCompanyShare = (excessAmount * (100 - plan.postCapSplit)) / 100;
        companyDollarForTransaction = remainingCap + postCapCompanyShare;
      } else {
        // Below cap
        companyDollarForTransaction = brokerageShare;
      }
    } else {
      // No cap
      companyDollarForTransaction = brokerageShare;
    }

    totalCompanyDollar += companyDollarForTransaction;
    ytdCompanyDollar += companyDollarForTransaction;
  });

  // Agent commission is total commission minus company dollar
  const totalCommission = transactions.reduce((sum, t) => sum + (t.commissionTotal || 0), 0);
  totalAgentCommission = totalCommission - totalCompanyDollar;

  return {
    agentCommission: totalAgentCommission,
    companyDollar: totalCompanyDollar,
  };
}

/**
 * Recalculate metrics for all agents based on their commission plans
 * @param agents - Original agent metrics
 * @param records - All transaction records
 * @returns Recalculated agent metrics with plan-based commission
 */
export function recalculateAgentMetricsWithPlans(
  agents: AgentMetrics[],
  records: DotloopRecord[]
): RecalculatedAgentMetrics[] {
  return agents.map(agent => {
    // Get agent's assigned plan
    const plan = getPlanForAgent(agent.agentName);

    // Get transactions for this agent
    const agentTransactions = records.filter(t => {
      const agents = t.agents ? t.agents.split(',').map(a => a.trim()) : [];
      return agents.includes(agent.agentName);
    });

    // Calculate plan-based commission
    const { agentCommission: recalculatedCommission, companyDollar: recalculatedCompanyDollar } =
      calculatePlanBasedCommission(agentTransactions, plan);

    // Calculate differences
    const commissionDifference = recalculatedCommission - agent.totalCommission;
    const companyDollarDifference = recalculatedCompanyDollar - agent.companyDollar;

    return {
      ...agent,
      recalculatedCommission,
      recalculatedCompanyDollar,
      planName: plan?.name,
      hasPlan: !!plan,
      commissionDifference,
      companyDollarDifference,
    };
  });
}

/**
 * Get agents that don't have commission plans assigned
 * @param agents - Agent metrics
 * @returns List of agent names without plans
 */
export function getAgentsWithoutPlans(agents: AgentMetrics[]): string[] {
  return agents
    .filter(agent => !getPlanForAgent(agent.agentName))
    .map(agent => agent.agentName);
}

/**
 * Check if recalculated commission differs significantly from original
 * @param original - Original commission
 * @param recalculated - Recalculated commission
 * @param threshold - Percentage threshold (default 5%)
 * @returns true if difference exceeds threshold
 */
export function hasSignificantCommissionDifference(
  original: number,
  recalculated: number,
  threshold: number = 5
): boolean {
  if (original === 0) return recalculated !== 0;
  const percentChange = Math.abs(((recalculated - original) / original) * 100);
  return percentChange > threshold;
}
