import { DotloopRecord, AgentMetrics } from './csvParser';
import { 
  CommissionPlan, 
  Team, 
  AgentPlanAssignment, 
  getCommissionPlans, 
  getTeams, 
  getAgentAssignments,
  getTransactionAdjustments,
  getPlanForAgent
} from './commission';

export interface AgentYTD {
  agentName: string;
  ytdCompanyDollar: number;
  capAmount: number;
  percentToCap: number;
  isCapped: boolean;
  planName: string;
  teamName?: string;
  anniversaryDate?: string;
}

export interface TransactionSnapshot {
  grossCommission: number;
  teamSplitAmount: number;
  brokerageSplitAmount: number;
  deductionsAmount: number;
  deductionsBreakdown: { name: string; amount: number }[];
  agentNetCommission: number;
  ytdBefore: number;
  ytdAfter: number;
  isCapped: boolean;
  splitPercentageApplied: number;
}

export interface AuditResult {
  recordId: string;
  loopName: string;
  closingDate: string;
  agentName: string;
  actualCompanyDollar: number;
  expectedCompanyDollar: number;
  difference: number;
  status: 'match' | 'overpaid' | 'underpaid';
  notes: string;
  snapshot?: TransactionSnapshot;
}

// Helper to check if a date falls within the current anniversary year
function isInAnniversaryYear(date: Date, anniversaryDateStr: string | undefined): boolean {
  if (!anniversaryDateStr) {
    // Default to calendar year if no anniversary set
    return date.getFullYear() === new Date().getFullYear();
  }

  const [month, day] = anniversaryDateStr.split('-').map(Number);
  const currentYear = new Date().getFullYear();
  
  // Construct the anniversary date for the current year
  const anniversaryThisYear = new Date(currentYear, month - 1, day);
  
  // If today is before the anniversary, the "current year" started last year
  // Wait, we need to check if the TRANSACTION date is in the "current" cycle relative to TODAY?
  // No, we need to group transactions by THEIR anniversary cycle.
  // Actually, for YTD stats, we usually mean "Current Cycle".
  
  // Let's simplify: Calculate YTD based on the transaction's date relative to the agent's anniversary.
  // But for the "YTD Tracker" on the dashboard, we want the CURRENT status.
  // So we filter transactions that happened AFTER the most recent anniversary date.
  
  const now = new Date();
  let cycleStart = new Date(now.getFullYear(), month - 1, day);
  if (now < cycleStart) {
    cycleStart = new Date(now.getFullYear() - 1, month - 1, day);
  }
  
  return date >= cycleStart;
}

// Helper to get the start of the cycle for a specific transaction date
function getCycleStartDate(transactionDate: Date, anniversaryDateStr: string | undefined): Date {
  if (!anniversaryDateStr) {
    return new Date(transactionDate.getFullYear(), 0, 1); // Jan 1st
  }
  const [month, day] = anniversaryDateStr.split('-').map(Number);
  let cycleStart = new Date(transactionDate.getFullYear(), month - 1, day);
  if (transactionDate < cycleStart) {
    cycleStart = new Date(transactionDate.getFullYear() - 1, month - 1, day);
  }
  return cycleStart;
}

export function calculateCommissionAudit(records: DotloopRecord[]): { ytdStats: AgentYTD[], auditResults: AuditResult[] } {
  const plans = getCommissionPlans();
  const teams = getTeams();
  const assignments = getAgentAssignments();
  const adjustments = getTransactionAdjustments();

  // Sort records by closing date to process chronologically
  const sortedRecords = [...records].sort((a, b) => 
    new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime()
  );

  // We need to track YTD per agent, but RESET it on their anniversary.
  // Map<AgentName, { currentYTD: number, lastResetDate: Date }>
  const agentStateMap = new Map<string, { currentYTD: number, cycleStartDate: Date }>();
  
  const auditResults: AuditResult[] = [];

  sortedRecords.forEach(record => {
    if (!record.agents) return;
    
    const agents = record.agents.split(',').map(a => a.trim());
    const gciPerAgent = (record.commissionTotal || 0) / agents.length;
    const actualCompanyDollarPerAgent = (record.companyDollar || 0) / agents.length;
    const closingDate = new Date(record.closingDate);

    agents.forEach(agentName => {
      const assignment = assignments.find(a => a.agentName === agentName);
      const plan = plans.find(p => p.id === assignment?.planId);
      const team = teams.find(t => t.id === assignment?.teamId);

      let expectedCompanyDollar = 0;
      let notes = '';
      let snapshot: TransactionSnapshot | undefined;

      if (plan) {
        // Determine Cycle Start for this transaction
        const cycleStart = getCycleStartDate(closingDate, assignment?.anniversaryDate);
        
        // Get or Initialize State
        let agentState = agentStateMap.get(agentName);
        if (!agentState || agentState.cycleStartDate.getTime() !== cycleStart.getTime()) {
          // Reset if new cycle or first time
          agentState = { currentYTD: 0, cycleStartDate: cycleStart };
        }

        const currentYTD = agentState.currentYTD;
        const remainingCap = Math.max(0, plan.capAmount - currentYTD);
        
        // Team Split
        let agentGCI = gciPerAgent;
        let teamSplitAmount = 0;
        if (team) {
          teamSplitAmount = agentGCI * (team.teamSplitPercentage / 100);
          agentGCI -= teamSplitAmount;
          notes += `Team Split: ${team.teamSplitPercentage}%; `;
        }

        // Brokerage Split
        let brokerageSplit = 0;
        let splitApplied = plan.splitPercentage;
        
        if (remainingCap > 0) {
          const brokerageShare = 100 - plan.splitPercentage;
          const potentialCompanyDollar = agentGCI * (brokerageShare / 100);

          if (potentialCompanyDollar > remainingCap) {
            // Split deal
            brokerageSplit = remainingCap + ((potentialCompanyDollar - remainingCap) * ((100 - plan.postCapSplit) / 100));
            notes += 'Hit Cap on this deal; ';
            splitApplied = 100; // Effectively mixed, but capped after
          } else {
            brokerageSplit = potentialCompanyDollar;
          }
        } else {
          brokerageSplit = agentGCI * ((100 - plan.postCapSplit) / 100);
          notes += 'Capped; ';
          splitApplied = plan.postCapSplit;
        }

        expectedCompanyDollar = brokerageSplit;
        let agentNet = agentGCI - brokerageSplit;

        // Apply Deductions
        let totalDeductions = 0;
        const deductionsBreakdown: { name: string; amount: number }[] = [];
        
        // 1. Standard Plan Deductions
        if (plan.deductions) {
          plan.deductions.forEach(d => {
            let amount = 0;
            if (d.type === 'fixed') {
              amount = d.amount;
            } else if (d.type === 'percentage') {
              amount = gciPerAgent * (d.amount / 100);
            }
            totalDeductions += amount;
            deductionsBreakdown.push({ name: d.name, amount });
          });
        }

        // 2. One-Off Transaction Adjustments
        const recordAdjustments = adjustments.filter(adj => 
          adj.recordId === record.loopId && adj.agentName === agentName
        );
        
        recordAdjustments.forEach(adj => {
          totalDeductions += adj.amount;
          deductionsBreakdown.push({ name: adj.description, amount: adj.amount });
        });
        
        agentNet -= totalDeductions;
        
        // Snapshot for Statement
        snapshot = {
          grossCommission: gciPerAgent,
          teamSplitAmount,
          brokerageSplitAmount: brokerageSplit,
          deductionsAmount: totalDeductions,
          deductionsBreakdown,
          agentNetCommission: agentNet,
          ytdBefore: currentYTD,
          ytdAfter: currentYTD + brokerageSplit,
          isCapped: (currentYTD + brokerageSplit) >= plan.capAmount,
          splitPercentageApplied: splitApplied
        };

        // Update State
        agentState.currentYTD += expectedCompanyDollar;
        agentStateMap.set(agentName, agentState);
      } else {
        notes = 'No Plan Assigned';
      }

      // Audit Logic
      const diff = actualCompanyDollarPerAgent - expectedCompanyDollar;
      let status: AuditResult['status'] = 'match';
      if (Math.abs(diff) > 1) {
        status = diff > 0 ? 'underpaid' : 'overpaid'; 
      }

      if (plan) {
        auditResults.push({
          recordId: record.loopId,
          loopName: record.loopName,
          closingDate: record.closingDate,
          agentName,
          actualCompanyDollar: actualCompanyDollarPerAgent,
          expectedCompanyDollar,
          difference: diff,
          status,
          notes,
          snapshot
        });
      }
    });
  });

  // Generate Current YTD Stats (based on the LATEST state)
  const ytdStats: AgentYTD[] = assignments.map(assignment => {
    const plan = plans.find(p => p.id === assignment.planId);
    const team = teams.find(t => t.id === assignment.teamId);
    const agentState = agentStateMap.get(assignment.agentName);
    
    // We need to check if the "latest state" is actually for the CURRENT cycle.
    // If the last transaction was last year, their current YTD is 0.
    const now = new Date();
    const currentCycleStart = getCycleStartDate(now, assignment.anniversaryDate);
    
    let ytd = 0;
    if (agentState && agentState.cycleStartDate.getTime() === currentCycleStart.getTime()) {
      ytd = agentState.currentYTD;
    }

    const cap = plan?.capAmount || 0;

    return {
      agentName: assignment.agentName,
      ytdCompanyDollar: ytd,
      capAmount: cap,
      percentToCap: cap > 0 ? Math.min(100, (ytd / cap) * 100) : 100,
      isCapped: cap > 0 && ytd >= cap,
      planName: plan?.name || 'Unknown',
      teamName: team?.name,
      anniversaryDate: assignment.anniversaryDate
    };
  }).sort((a, b) => b.percentToCap - a.percentToCap);

  return { ytdStats, auditResults };
}


/**
 * Commission Breakdown for Display (NEW FUNCTIONS)
 * Represents a transaction's commission breakdown
 */
export interface CommissionBreakdownDisplay {
  totalGCI: number; // Gross Commission Income (from CSV)
  agentShare: number; // Agent's portion based on plan split
  companyShare: number; // Company's portion
  cappedCompanyShare: number; // Company share after cap applied
  cappedAgentShare: number; // Agent share after cap applied
  postCapSplit: number; // Agent's share after hitting cap
}

/**
 * Calculate commission breakdown for a single transaction based on plan
 * @param record - The transaction record
 * @param plan - The commission plan to apply
 * @returns Commission breakdown with plan-based calculations
 */
export function calculateTransactionCommissionNew(
  record: DotloopRecord,
  plan: CommissionPlan | undefined
): CommissionBreakdownDisplay {
  const totalGCI = record.commissionTotal || 0;

  // If no plan assigned, return CSV values as-is
  if (!plan) {
    return {
      totalGCI,
      agentShare: record.buySideCommission || 0,
      companyShare: record.companyDollar || 0,
      cappedCompanyShare: record.companyDollar || 0,
      cappedAgentShare: record.buySideCommission || 0,
      postCapSplit: 0,
    };
  }

  // Calculate agent and company shares based on plan split percentage
  const agentShare = (totalGCI * plan.splitPercentage) / 100;
  const companyShare = totalGCI - agentShare;

  // Apply cap if specified
  let cappedCompanyShare = companyShare;
  let cappedAgentShare = agentShare;
  let postCapSplit = 0;

  if (plan.capAmount > 0) {
    // If company share exceeds cap, agent gets the excess
    if (companyShare > plan.capAmount) {
      cappedCompanyShare = plan.capAmount;
      const excess = companyShare - plan.capAmount;
      cappedAgentShare = agentShare + excess;
      postCapSplit = plan.postCapSplit || 100; // Agent gets 100% after cap
    }
  }

  return {
    totalGCI,
    agentShare,
    companyShare,
    cappedCompanyShare,
    cappedAgentShare,
    postCapSplit,
  };
}

/**
 * Recalculate agent metrics with plan-based commissions
 * @param agentRecords - All records for the agent
 * @param agentName - The agent's name
 * @returns Recalculated commission totals
 */
export function recalculateAgentCommission(
  agentRecords: DotloopRecord[],
  agentName: string
): {
  totalCommission: number;
  companyDollar: number;
  buySideCommission: number;
  sellSideCommission: number;
} {
  const plan = getPlanForAgent(agentName);

  let totalCommission = 0;
  let companyDollar = 0;
  let buySideCommission = 0;
  let sellSideCommission = 0;

  agentRecords.forEach(record => {
    const breakdown = calculateTransactionCommissionNew(record, plan);
    
    // Use capped values for totals
    totalCommission += breakdown.cappedAgentShare;
    companyDollar += breakdown.cappedCompanyShare;
    
    // Keep buy/sell split from CSV (these are typically already split by side)
    buySideCommission += record.buySideCommission || 0;
    sellSideCommission += record.sellSideCommission || 0;
  });

  return {
    totalCommission,
    companyDollar,
    buySideCommission,
    sellSideCommission,
  };
}

/**
 * Calculate agent metrics with plan-based commissions
 * This is used to override the standard calculateAgentMetrics when plans are assigned
 * @param agentMetrics - Original agent metrics from CSV
 * @param records - All records for the agent
 * @returns Updated metrics with plan-based commissions
 */
export function applyPlanToAgentMetrics(
  agentMetrics: AgentMetrics,
  records: DotloopRecord[]
): AgentMetrics {
  const plan = getPlanForAgent(agentMetrics.agentName);

  if (!plan) {
    // No plan assigned, return original metrics
    return agentMetrics;
  }

  // Get agent's records
  const agentRecords = records.filter(r => {
    const agents = r.agents ? r.agents.split(',').map(a => a.trim()) : [];
    return agents.includes(agentMetrics.agentName);
  });

  const recalculated = recalculateAgentCommission(agentRecords, agentMetrics.agentName);

  // Calculate average commission with new total
  const averageCommission = agentMetrics.totalTransactions > 0
    ? recalculated.totalCommission / agentMetrics.totalTransactions
    : 0;

  return {
    ...agentMetrics,
    totalCommission: recalculated.totalCommission,
    companyDollar: recalculated.companyDollar,
    buySideCommission: recalculated.buySideCommission,
    sellSideCommission: recalculated.sellSideCommission,
    averageCommission,
  };
}

/**
 * Apply plans to all agent metrics
 * @param agentMetrics - Array of agent metrics
 * @param records - All records
 * @returns Updated metrics with plan-based commissions applied
 */
export function applyPlansToAllAgents(
  agentMetrics: AgentMetrics[],
  records: DotloopRecord[]
): AgentMetrics[] {
  return agentMetrics.map(metrics => applyPlanToAgentMetrics(metrics, records));
}

/**
 * Get commission comparison for an agent (original vs plan-based)
 * @param agentMetrics - Original metrics
 * @param records - All records
 * @returns Comparison data
 */
export function getCommissionComparison(
  agentMetrics: AgentMetrics,
  records: DotloopRecord[]
) {
  const plan = getPlanForAgent(agentMetrics.agentName);

  if (!plan) {
    return {
      hasComparison: false,
      originalCommission: agentMetrics.totalCommission,
      planBasedCommission: agentMetrics.totalCommission,
      difference: 0,
      percentageDifference: 0,
    };
  }

  const recalculated = recalculateAgentCommission(records, agentMetrics.agentName);

  const difference = recalculated.totalCommission - agentMetrics.totalCommission;
  const percentageDifference = agentMetrics.totalCommission > 0
    ? (difference / agentMetrics.totalCommission) * 100
    : 0;

  return {
    hasComparison: true,
    originalCommission: agentMetrics.totalCommission,
    planBasedCommission: recalculated.totalCommission,
    difference,
    percentageDifference,
    planName: plan.name,
  };
}


