/**
 * Agent Performance Tier Analyzer
 * Calculates and assigns performance tiers based on real agent data
 * Tier 1 (Struggling): Low production, below market
 * Tier 2 (Average): Market median performance
 * Tier 3 (Top Producer): High production, above market
 */

import { DotloopRecord, AgentMetrics } from './csvParser';

export type PerformanceTier = 1 | 2 | 3;

export interface TierDefinition {
  tier: PerformanceTier;
  name: string;
  description: string;
  minTransactions: number;
  minGCI: number;
  minClosingRate: number;
  color: string;
  bgColor: string;
  textColor: string;
}

export interface AgentTierInfo {
  agentName: string;
  tier: PerformanceTier;
  tierName: string;
  percentile: number;
  transactions: number;
  gci: number;
  closingRate: number;
  avgDealValue: number;
  daysToClose: number;
  reasoning: string;
}

/**
 * Tier definitions based on NAR 2024 statistics and industry benchmarks
 * These thresholds are calibrated to realistic US brokerage production
 */
const TIER_DEFINITIONS: Record<PerformanceTier, TierDefinition> = {
  1: {
    tier: 1,
    name: 'Struggling',
    description: 'Below market performance - needs support',
    minTransactions: 0,
    minGCI: 0,
    minClosingRate: 0,
    color: '#ef4444', // Red
    bgColor: '#fee2e2',
    textColor: '#991b1b'
  },
  2: {
    tier: 2,
    name: 'Average',
    description: 'Market median performance - solid producer',
    minTransactions: 5,
    minGCI: 50000,
    minClosingRate: 60,
    color: '#f59e0b', // Amber
    bgColor: '#fef3c7',
    textColor: '#92400e'
  },
  3: {
    tier: 3,
    name: 'Top Producer',
    description: 'Above market performance - elite producer',
    minTransactions: 12,
    minGCI: 100000,
    minClosingRate: 75,
    color: '#10b981', // Green
    bgColor: '#d1fae5',
    textColor: '#065f46'
  }
};

/**
 * Calculate performance tier for an agent based on their metrics
 * Uses multi-factor analysis: transactions, GCI, closing rate
 */
export function calculateAgentTier(
  agentRecords: DotloopRecord[]
): PerformanceTier {
  if (agentRecords.length === 0) return 1;

  const metrics = calculateAgentMetrics(agentRecords);

  // Multi-factor scoring system
  let tierScore = 0;

  // Factor 1: Transaction volume (40% weight)
  // Tier 2 threshold: 5 deals, Tier 3 threshold: 12 deals
  if (metrics.transactions >= 12) {
    tierScore += 40; // Full points for Tier 3
  } else if (metrics.transactions >= 5) {
    tierScore += 20; // Half points for Tier 2
  }

  // Factor 2: GCI (40% weight)
  // Tier 2 threshold: $50k, Tier 3 threshold: $100k
  if (metrics.gci >= 100000) {
    tierScore += 40;
  } else if (metrics.gci >= 50000) {
    tierScore += 20;
  }

  // Factor 3: Closing rate (20% weight)
  // Tier 2 threshold: 60%, Tier 3 threshold: 75%
  if (metrics.closingRate >= 75) {
    tierScore += 20;
  } else if (metrics.closingRate >= 60) {
    tierScore += 10;
  }

  // Assign tier based on score
  if (tierScore >= 80) return 3; // Top Producer
  if (tierScore >= 40) return 2; // Average
  return 1; // Struggling
}

/**
 * Calculate detailed metrics for an agent
 */
function calculateAgentMetrics(agentRecords: DotloopRecord[]) {
  const totalGCI = agentRecords.reduce((sum, r) => sum + (r.commissionTotal || 0), 0);
  const closedDeals = agentRecords.filter(
    r => r.loopStatus === 'Closed' || r.loopStatus === 'Sold'
  ).length;
  const closingRate = agentRecords.length > 0 
    ? Math.round((closedDeals / agentRecords.length) * 100)
    : 0;

  const daysToCloseArray = agentRecords
    .filter(r => r.listingDate && r.closingDate && (r.loopStatus === 'Closed' || r.loopStatus === 'Sold'))
    .map(r => {
      const listing = new Date(r.listingDate);
      const closing = new Date(r.closingDate);
      return Math.floor((closing.getTime() - listing.getTime()) / (1000 * 60 * 60 * 24));
    });

  const daysToClose = daysToCloseArray.length > 0
    ? Math.round(daysToCloseArray.reduce((a, b) => a + b, 0) / daysToCloseArray.length)
    : 0;

  return {
    transactions: agentRecords.length,
    gci: totalGCI,
    closingRate,
    daysToClose,
    avgDealValue: agentRecords.length > 0 
      ? Math.round(agentRecords.reduce((sum, r) => sum + (r.salePrice || 0), 0) / agentRecords.length)
      : 0
  };
}

/**
 * Get detailed tier information for an agent
 */
export function getAgentTierInfo(
  agentName: string,
  agentRecords: DotloopRecord[],
  allAgentMetrics: AgentMetrics[]
): AgentTierInfo {
  const tier = calculateAgentTier(agentRecords);
  const metrics = calculateAgentMetrics(agentRecords);
  const tierDef = TIER_DEFINITIONS[tier];

  // Calculate percentile ranking
  const allTransactionCounts = allAgentMetrics.map(m => m.totalTransactions);
  const percentile = calculatePercentile(metrics.transactions, allTransactionCounts);

  // Generate reasoning
  const reasoning = generateTierReasoning(tier, metrics);

  return {
    agentName,
    tier,
    tierName: tierDef.name,
    percentile,
    transactions: metrics.transactions,
    gci: metrics.gci,
    closingRate: metrics.closingRate,
    avgDealValue: metrics.avgDealValue,
    daysToClose: metrics.daysToClose,
    reasoning
  };
}

/**
 * Calculate percentile ranking (0-100)
 */
function calculatePercentile(value: number, allValues: number[]): number {
  if (allValues.length === 0) return 0;
  
  const sorted = [...allValues].sort((a, b) => a - b);
  const count = sorted.filter(v => v <= value).length;
  return Math.round((count / allValues.length) * 100);
}

/**
 * Generate human-readable reasoning for tier assignment
 */
function generateTierReasoning(tier: PerformanceTier, metrics: ReturnType<typeof calculateAgentMetrics>): string {
  const reasons: string[] = [];

  if (tier === 3) {
    reasons.push(`${metrics.transactions} deals closed (top 20%)`);
    reasons.push(`$${(metrics.gci / 1000).toFixed(0)}k GCI (above average)`);
    reasons.push(`${metrics.closingRate}% closing rate (excellent)`);
    return `Top Producer: ${reasons.join(', ')}`;
  }

  if (tier === 2) {
    reasons.push(`${metrics.transactions} deals closed (market median)`);
    reasons.push(`$${(metrics.gci / 1000).toFixed(0)}k GCI (solid)`);
    reasons.push(`${metrics.closingRate}% closing rate (average)`);
    return `Average Producer: ${reasons.join(', ')}`;
  }

  // Tier 1
  if (metrics.transactions < 5) {
    reasons.push('Low transaction volume');
  }
  if (metrics.gci < 50000) {
    reasons.push('Below market GCI');
  }
  if (metrics.closingRate < 60) {
    reasons.push('Low closing rate');
  }
  return `Struggling: ${reasons.join(', ')} - needs coaching and support`;
}

/**
 * Get tier definition by tier number
 */
export function getTierDefinition(tier: PerformanceTier): TierDefinition {
  return TIER_DEFINITIONS[tier];
}

/**
 * Analyze all agents and return tier distribution
 */
export function analyzeTierDistribution(allAgentMetrics: AgentMetrics[]): {
  tier1: number;
  tier2: number;
  tier3: number;
  percentage1: number;
  percentage2: number;
  percentage3: number;
} {
  let tier1 = 0, tier2 = 0, tier3 = 0;

  allAgentMetrics.forEach(agent => {
    // Simplified tier calculation based on transactions
    if (agent.totalTransactions >= 12) tier3++;
    else if (agent.totalTransactions >= 5) tier2++;
    else tier1++;
  });

  const total = allAgentMetrics.length;

  return {
    tier1,
    tier2,
    tier3,
    percentage1: total > 0 ? Math.round((tier1 / total) * 100) : 0,
    percentage2: total > 0 ? Math.round((tier2 / total) * 100) : 0,
    percentage3: total > 0 ? Math.round((tier3 / total) * 100) : 0
  };
}

/**
 * Get all agents grouped by tier
 */
export function groupAgentsByTier(
  allAgentMetrics: AgentMetrics[]
): Record<PerformanceTier, AgentMetrics[]> {
  return {
    1: allAgentMetrics.filter(a => a.totalTransactions < 5),
    2: allAgentMetrics.filter(a => a.totalTransactions >= 5 && a.totalTransactions < 12),
    3: allAgentMetrics.filter(a => a.totalTransactions >= 12)
  };
}

/**
 * Get tier color for styling
 */
export function getTierColor(tier: PerformanceTier): string {
  return TIER_DEFINITIONS[tier].color;
}

/**
 * Get tier background color for styling
 */
export function getTierBgColor(tier: PerformanceTier): string {
  return TIER_DEFINITIONS[tier].bgColor;
}

/**
 * Get tier text color for styling
 */
export function getTierTextColor(tier: PerformanceTier): string {
  return TIER_DEFINITIONS[tier].textColor;
}
