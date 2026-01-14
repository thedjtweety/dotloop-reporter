/**
 * Commission Calculator - Server-Side Implementation
 * 
 * This module provides automatic commission calculation functionality
 * that transforms the platform from audit-only to full commission management.
 * 
 * Features:
 * - Automatic commission calculation from transaction data
 * - Support for multiple commission plan types (percentage, cap, tier, flat)
 * - YTD tracking with anniversary date support
 * - Team split calculations
 * - Deduction handling (fixed and percentage-based)
 * - Franchise fee and royalty calculations
 * - Cap tracking and post-cap split handling
 */

export interface Deduction {
  id: string;
  name: string;
  amount: number;
  type: 'fixed' | 'percentage';
  frequency: 'per_transaction';
}

export interface CommissionTier {
  id: string;
  threshold: number; // YTD amount at which this tier starts (e.g., 0, 50000, 100000)
  splitPercentage: number; // Agent's share at this tier (e.g., 60 for 60/40)
  description: string; // e.g., "$0-$50K: 60/40"
}

export interface CommissionPlan {
  id: string;
  name: string;
  splitPercentage: number; // Default/base split percentage (used if no tiers defined)
  capAmount: number; // Annual cap on Company Dollar
  postCapSplit: number; // Agent's share after cap (usually 100)
  royaltyPercentage?: number; // Franchise fee percentage
  royaltyCap?: number; // Cap on royalty
  deductions?: Deduction[];
  tiers?: CommissionTier[]; // Sliding scale tiers (optional)
  useSliding: boolean; // Whether to use tiered splits or flat split
}

export interface Team {
  id: string;
  name: string;
  leadAgent: string;
  teamSplitPercentage: number;
}

export interface AgentPlanAssignment {
  id: string;
  agentName: string;
  planId: string;
  teamId?: string;
  startDate?: string;
  anniversaryDate?: string; // "MM-DD" format
}

export interface TransactionInput {
  id: string;
  loopName: string;
  closingDate: string;
  agents: string; // Comma-separated agent names
  salePrice: number;
  commissionRate: number; // As percentage (e.g., 3 for 3%)
  buySidePercent?: number; // Percentage of total commission (default 50)
  sellSidePercent?: number; // Percentage of total commission (default 50)
}

export interface CommissionBreakdown {
  // Transaction Info
  transactionId: string;
  loopName: string;
  closingDate: string;
  agentName: string;
  
  // Gross Commission
  grossCommissionIncome: number; // GCI for this agent
  
  // Team Split
  teamSplitAmount: number;
  teamSplitPercentage: number;
  afterTeamSplit: number;
  
  // Brokerage Split
  brokerageSplitAmount: number;
  brokerageSplitPercentage: number;
  splitType: 'pre-cap' | 'post-cap' | 'mixed'; // Mixed = hit cap during this transaction
  
  // Deductions
  deductions: Array<{
    name: string;
    amount: number;
    type: 'fixed' | 'percentage';
  }>;
  totalDeductions: number;
  
  // Royalty/Franchise Fee
  royaltyAmount: number;
  royaltyPercentage: number;
  
  // Net to Agent
  agentNetCommission: number;
  
  // YTD Tracking
  ytdBeforeTransaction: number;
  ytdAfterTransaction: number;
  capAmount: number;
  percentToCap: number;
  isCapped: boolean;
  
  // Plan Info
  planId: string;
  planName: string;
  teamId?: string;
  teamName?: string;
}

export interface AgentYTDSummary {
  agentName: string;
  planId: string;
  planName: string;
  teamId?: string;
  teamName?: string;
  
  // YTD Stats
  ytdCompanyDollar: number;
  ytdGrossCommission: number;
  ytdNetCommission: number;
  ytdDeductions: number;
  ytdRoyalties: number;
  
  // Cap Info
  capAmount: number;
  percentToCap: number;
  isCapped: boolean;
  remainingToCap: number;
  
  // Transaction Count
  transactionCount: number;
  
  // Anniversary
  anniversaryDate?: string;
  cycleStartDate: Date;
  cycleEndDate: Date;
}

/**
 * Get the cycle start date for a given transaction date and anniversary
 */
export function getCycleStartDate(
  transactionDate: Date,
  anniversaryDateStr?: string
): Date {
  if (!anniversaryDateStr) {
    // Default to calendar year
    return new Date(transactionDate.getFullYear(), 0, 1);
  }
  
  const [month, day] = anniversaryDateStr.split('-').map(Number);
  let cycleStart = new Date(transactionDate.getFullYear(), month - 1, day);
  
  // If transaction is before the anniversary this year, cycle started last year
  if (transactionDate < cycleStart) {
    cycleStart = new Date(transactionDate.getFullYear() - 1, month - 1, day);
  }
  
  return cycleStart;
}

/**
 * Get the cycle end date for a given cycle start
 */
export function getCycleEndDate(cycleStart: Date): Date {
  const endDate = new Date(cycleStart);
  endDate.setFullYear(endDate.getFullYear() + 1);
  endDate.setDate(endDate.getDate() - 1); // One day before next cycle start
  return endDate;
}

/**
 * Get the effective split percentage for an agent based on their YTD performance
 * Supports sliding scale tiers
 */
function getEffectiveSplitPercentage(
  plan: CommissionPlan,
  ytdCompanyDollar: number
): number {
  // If no tiers defined or sliding scale disabled, use base split
  if (!plan.useSliding || !plan.tiers || plan.tiers.length === 0) {
    return plan.splitPercentage;
  }

  // Sort tiers by threshold (ascending)
  const sortedTiers = [...plan.tiers].sort((a, b) => a.threshold - b.threshold);

  // Find the applicable tier based on YTD amount
  let applicableTier = sortedTiers[0]; // Default to first tier
  
  for (const tier of sortedTiers) {
    if (ytdCompanyDollar >= tier.threshold) {
      applicableTier = tier;
    } else {
      break; // Found the right tier, stop looking
    }
  }

  return applicableTier.splitPercentage;
}

/**
 * Calculate commission for a single transaction
 */
export function calculateTransactionCommission(
  transaction: TransactionInput,
  agentName: string,
  plan: CommissionPlan,
  team: Team | undefined,
  ytdCompanyDollar: number, // YTD before this transaction
  adjustments?: Array<{ description: string; amount: number }>
): CommissionBreakdown {
  const closingDate = new Date(transaction.closingDate);
  
  // Step 1: Calculate Gross Commission Income (GCI)
  const totalCommission = transaction.salePrice * (transaction.commissionRate / 100);
  const agents = transaction.agents.split(',').map(a => a.trim());
  const gciPerAgent = totalCommission / agents.length;
  
  // Step 2: Apply Team Split
  let afterTeamSplit = gciPerAgent;
  let teamSplitAmount = 0;
  let teamSplitPercentage = 0;
  
  if (team) {
    teamSplitPercentage = team.teamSplitPercentage;
    teamSplitAmount = gciPerAgent * (teamSplitPercentage / 100);
    afterTeamSplit = gciPerAgent - teamSplitAmount;
  }
  
  // Step 3: Calculate Brokerage Split (with cap logic and sliding scales)
  const effectiveAgentSplit = getEffectiveSplitPercentage(plan, ytdCompanyDollar);
  const remainingCap = Math.max(0, plan.capAmount - ytdCompanyDollar);
  const brokerageSharePercent = 100 - effectiveAgentSplit;
  const potentialCompanyDollar = afterTeamSplit * (brokerageSharePercent / 100);
  
  let brokerageSplitAmount = 0;
  let splitType: 'pre-cap' | 'post-cap' | 'mixed' = 'pre-cap';
  let effectiveSplitPercentage = brokerageSharePercent;
  
  if (plan.capAmount === 0) {
    // No cap - use standard split
    brokerageSplitAmount = potentialCompanyDollar;
    splitType = 'pre-cap';
  } else if (ytdCompanyDollar >= plan.capAmount) {
    // Already capped - use post-cap split
    brokerageSplitAmount = afterTeamSplit * ((100 - plan.postCapSplit) / 100);
    splitType = 'post-cap';
    effectiveSplitPercentage = 100 - plan.postCapSplit;
  } else if (potentialCompanyDollar <= remainingCap) {
    // Won't hit cap on this transaction
    brokerageSplitAmount = potentialCompanyDollar;
    splitType = 'pre-cap';
  } else {
    // Will hit cap during this transaction (mixed)
    const preCapPortion = remainingCap;
    const postCapPortion = potentialCompanyDollar - remainingCap;
    const postCapCompanyDollar = postCapPortion * ((100 - plan.postCapSplit) / 100);
    brokerageSplitAmount = preCapPortion + postCapCompanyDollar;
    splitType = 'mixed';
    effectiveSplitPercentage = (brokerageSplitAmount / afterTeamSplit) * 100;
  }
  
  // Step 4: Calculate Royalty/Franchise Fee
  let royaltyAmount = 0;
  let royaltyPercentage = 0;
  
  if (plan.royaltyPercentage && plan.royaltyPercentage > 0) {
    royaltyPercentage = plan.royaltyPercentage;
    royaltyAmount = gciPerAgent * (royaltyPercentage / 100);
    
    // Apply royalty cap if specified
    if (plan.royaltyCap && royaltyAmount > plan.royaltyCap) {
      royaltyAmount = plan.royaltyCap;
    }
  }
  
  // Step 5: Calculate Deductions
  const deductions: Array<{ name: string; amount: number; type: 'fixed' | 'percentage' }> = [];
  let totalDeductions = 0;
  
  // Standard plan deductions
  if (plan.deductions) {
    plan.deductions.forEach(d => {
      let amount = 0;
      if (d.type === 'fixed') {
        amount = d.amount;
      } else if (d.type === 'percentage') {
        amount = gciPerAgent * (d.amount / 100);
      }
      deductions.push({ name: d.name, amount, type: d.type });
      totalDeductions += amount;
    });
  }
  
  // Transaction-specific adjustments
  if (adjustments) {
    adjustments.forEach(adj => {
      deductions.push({ name: adj.description, amount: adj.amount, type: 'fixed' });
      totalDeductions += adj.amount;
    });
  }
  
  // Step 6: Calculate Net to Agent
  const agentNetCommission = afterTeamSplit - brokerageSplitAmount - royaltyAmount - totalDeductions;
  
  // Step 7: Update YTD
  const ytdAfterTransaction = ytdCompanyDollar + brokerageSplitAmount;
  const percentToCap = plan.capAmount > 0 ? Math.min(100, (ytdAfterTransaction / plan.capAmount) * 100) : 100;
  const isCapped = plan.capAmount > 0 && ytdAfterTransaction >= plan.capAmount;
  
  return {
    transactionId: transaction.id,
    loopName: transaction.loopName,
    closingDate: transaction.closingDate,
    agentName,
    
    grossCommissionIncome: gciPerAgent,
    
    teamSplitAmount,
    teamSplitPercentage,
    afterTeamSplit,
    
    brokerageSplitAmount,
    brokerageSplitPercentage: effectiveSplitPercentage,
    splitType,
    
    deductions,
    totalDeductions,
    
    royaltyAmount,
    royaltyPercentage,
    
    agentNetCommission,
    
    ytdBeforeTransaction: ytdCompanyDollar,
    ytdAfterTransaction,
    capAmount: plan.capAmount,
    percentToCap,
    isCapped,
    
    planId: plan.id,
    planName: plan.name,
    teamId: team?.id,
    teamName: team?.name,
  };
}

/**
 * Calculate commissions for multiple transactions
 * Returns breakdown for each transaction and YTD summary per agent
 */
export function calculateCommissions(
  transactions: TransactionInput[],
  plans: CommissionPlan[],
  teams: Team[],
  assignments: AgentPlanAssignment[],
  adjustmentsMap?: Map<string, Array<{ description: string; amount: number }>>
): {
  breakdowns: CommissionBreakdown[];
  ytdSummaries: AgentYTDSummary[];
} {
  // Sort transactions chronologically
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime()
  );
  
  // Track YTD per agent per cycle
  const agentYTDMap = new Map<string, { ytd: number; cycleStart: Date }>();
  const breakdowns: CommissionBreakdown[] = [];
  
  // Process each transaction
  sortedTransactions.forEach(transaction => {
    const agents = transaction.agents.split(',').map(a => a.trim());
    const closingDate = new Date(transaction.closingDate);
    
    agents.forEach(agentName => {
      // Normalize agent name for matching (case-insensitive, trim whitespace)
      const normalizedAgentName = agentName.trim().toLowerCase();
      const assignment = assignments.find(a => a.agentName.trim().toLowerCase() === normalizedAgentName);
      if (!assignment) {
        console.warn(`No assignment found for agent: "${agentName}" (normalized: "${normalizedAgentName}")`)
        console.warn('Available assignments:', assignments.map(a => `"${a.agentName}" (normalized: "${a.agentName.trim().toLowerCase()}")`));
        return; // Skip agents without plan assignments
      }
      
      // Use the canonical agent name from the assignment for consistency
      const canonicalAgentName = assignment.agentName;
      
      const plan = plans.find(p => p.id === assignment.planId);
      if (!plan) return; // Skip if plan not found
      
      const team = assignment.teamId ? teams.find(t => t.id === assignment.teamId) : undefined;
      
      // Determine cycle start for this transaction
      const cycleStart = getCycleStartDate(closingDate, assignment.anniversaryDate);
      
      // Get or initialize YTD for this agent using canonical name
      let agentYTD = agentYTDMap.get(canonicalAgentName);
      if (!agentYTD || agentYTD.cycleStart.getTime() !== cycleStart.getTime()) {
        // Reset YTD if new cycle or first transaction
        agentYTD = { ytd: 0, cycleStart };
      }
      
      // Get transaction-specific adjustments
      const adjustments = adjustmentsMap?.get(`${transaction.id}:${canonicalAgentName}`);
      
      // Calculate commission for this transaction
      const breakdown = calculateTransactionCommission(
        transaction,
        canonicalAgentName,
        plan,
        team,
        agentYTD.ytd,
        adjustments
      );
      
      breakdowns.push(breakdown);
      
      // Update YTD using canonical name
      agentYTD.ytd = breakdown.ytdAfterTransaction;
      agentYTDMap.set(canonicalAgentName, agentYTD);
    });
  });
  
  // Generate YTD summaries
  const ytdSummaries: AgentYTDSummary[] = assignments.map(assignment => {
    const plan = plans.find(p => p.id === assignment.planId);
    const team = assignment.teamId ? teams.find(t => t.id === assignment.teamId) : undefined;
    
    if (!plan) {
      // Return empty summary if no plan
      return {
        agentName: assignment.agentName,
        planId: '',
        planName: 'No Plan',
        ytdCompanyDollar: 0,
        ytdGrossCommission: 0,
        ytdNetCommission: 0,
        ytdDeductions: 0,
        ytdRoyalties: 0,
        capAmount: 0,
        percentToCap: 0,
        isCapped: false,
        remainingToCap: 0,
        transactionCount: 0,
        cycleStartDate: new Date(),
        cycleEndDate: new Date(),
      };
    }
    
    // Get agent's breakdowns (use canonical name from assignment)
    const agentBreakdowns = breakdowns.filter(b => b.agentName.trim().toLowerCase() === assignment.agentName.trim().toLowerCase());
    
    // Determine cycle dates from the latest transaction (or current date if no transactions)
    let cycleStart: Date;
    let cycleEnd: Date;
    
    if (agentBreakdowns.length > 0) {
      // Use the latest transaction's cycle
      const latestTxn = agentBreakdowns[agentBreakdowns.length - 1];
      cycleStart = getCycleStartDate(new Date(latestTxn.closingDate), assignment.anniversaryDate);
      cycleEnd = getCycleEndDate(cycleStart);
      
      // Filter to only transactions in the same cycle as the latest transaction
      const agentBreakdownsInCycle = agentBreakdowns.filter(
        b => new Date(b.closingDate) >= cycleStart
      );
      
      // Recalculate with filtered breakdowns
      const ytdCompanyDollar = agentBreakdownsInCycle.reduce((sum, b) => sum + b.brokerageSplitAmount, 0);
      const ytdGrossCommission = agentBreakdownsInCycle.reduce((sum, b) => sum + b.grossCommissionIncome, 0);
      const ytdNetCommission = agentBreakdownsInCycle.reduce((sum, b) => sum + b.agentNetCommission, 0);
      const ytdDeductions = agentBreakdownsInCycle.reduce((sum, b) => sum + b.totalDeductions, 0);
      const ytdRoyalties = agentBreakdownsInCycle.reduce((sum, b) => sum + b.royaltyAmount, 0);
      
      const percentToCap = plan.capAmount > 0 ? Math.min(100, (ytdCompanyDollar / plan.capAmount) * 100) : 100;
      const isCapped = plan.capAmount > 0 && ytdCompanyDollar >= plan.capAmount;
      const remainingToCap = plan.capAmount > 0 ? Math.max(0, plan.capAmount - ytdCompanyDollar) : 0;
      
      return {
        agentName: assignment.agentName,
        planId: plan.id,
        planName: plan.name,
        teamId: team?.id,
        teamName: team?.name,
        
        ytdCompanyDollar,
        ytdGrossCommission,
        ytdNetCommission,
        ytdDeductions,
        ytdRoyalties,
        
        capAmount: plan.capAmount,
        percentToCap,
        isCapped,
        remainingToCap,
        
        transactionCount: agentBreakdownsInCycle.length,
        
        anniversaryDate: assignment.anniversaryDate,
        cycleStartDate: cycleStart,
        cycleEndDate: cycleEnd,
      };
    } else {
      // No transactions - use current date
      const now = new Date();
      cycleStart = getCycleStartDate(now, assignment.anniversaryDate);
      cycleEnd = getCycleEndDate(cycleStart);
      
      return {
        agentName: assignment.agentName,
        planId: plan.id,
        planName: plan.name,
        teamId: team?.id,
        teamName: team?.name,
        
        ytdCompanyDollar: 0,
        ytdGrossCommission: 0,
        ytdNetCommission: 0,
        ytdDeductions: 0,
        ytdRoyalties: 0,
        
        capAmount: plan.capAmount,
        percentToCap: 0,
        isCapped: false,
        remainingToCap: plan.capAmount,
        
        transactionCount: 0,
        
        anniversaryDate: assignment.anniversaryDate,
        cycleStartDate: cycleStart,
        cycleEndDate: cycleEnd,
      };
    }
  }).sort((a, b) => b.percentToCap - a.percentToCap);
  
  return { breakdowns, ytdSummaries };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(percent: number, decimals: number = 1): string {
  return `${percent.toFixed(decimals)}%`;
}
