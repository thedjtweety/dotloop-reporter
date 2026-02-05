/**
 * Commission Calculation Utilities
 * Provides accurate commission forecasting with probability scoring and agent breakdown
 */

import { DotloopRecord } from './csvParser';
import { ForecastedDeal, calculateForecastedDeals } from './projectionUtils';

export interface AgentCommission {
  agent: string;
  totalCommission: number;
  dealCount: number;
  avgDealValue: number;
  avgCommissionPerDeal: number;
}

export interface CommissionForecast {
  totalCommission: number;
  dealCount: number;
  avgCommissionPerDeal: number;
  agentBreakdown: AgentCommission[];
  riskAdjustedCommission: number;
}

/**
 * Calculate commission for a single forecasted deal
 * Uses probability-weighted commission to account for deal uncertainty
 */
export function calculateDealCommission(deal: ForecastedDeal): number {
  // Use the commission from the deal record and apply probability weighting
  const baseCommission = deal.commission || 0;
  const probability = deal.probability / 100; // Convert 0-100 to 0-1
  
  // Apply probability weighting to account for deal uncertainty
  const probabilityWeightedCommission = baseCommission * probability;
  
  return probabilityWeightedCommission;
}

/**
 * Calculate total commission forecast for a set of deals
 * Includes probability weighting and agent breakdown
 */
export function calculateCommissionForecast(
  records: DotloopRecord[],
  historicalCloseRate: number,
  avgDaysToClose: number,
  daysToForecast: number = 30
): CommissionForecast {
  // Get forecasted deals using probability-based forecasting
  const forecastedDeals = calculateForecastedDeals(records, historicalCloseRate, avgDaysToClose, daysToForecast);
  
  let totalCommission = 0;
  const agentMap = new Map<string, AgentCommission>();
  
  forecastedDeals.forEach(deal => {
    const commission = calculateDealCommission(deal);
    totalCommission += commission;
    
    // Track by agent
    const agentName = deal.agent || 'Unknown';
    if (!agentMap.has(agentName)) {
      agentMap.set(agentName, {
        agent: agentName,
        totalCommission: 0,
        dealCount: 0,
        avgDealValue: 0,
        avgCommissionPerDeal: 0,
      });
    }
    
    const agentData = agentMap.get(agentName)!;
    agentData.totalCommission += commission;
    agentData.dealCount += 1;
  });
  
  // Calculate averages
  const agentBreakdown = Array.from(agentMap.values()).map(agent => ({
    ...agent,
    avgDealValue: agent.dealCount > 0 ? totalCommission / agent.dealCount : 0,
    avgCommissionPerDeal: agent.dealCount > 0 ? agent.totalCommission / agent.dealCount : 0,
  }));
  
  const dealCount = forecastedDeals.length;
  const avgCommissionPerDeal = dealCount > 0 ? totalCommission / dealCount : 0;
  
  return {
    totalCommission,
    dealCount,
    avgCommissionPerDeal,
    agentBreakdown: agentBreakdown.sort((a, b) => b.totalCommission - a.totalCommission),
    riskAdjustedCommission: totalCommission, // Will be multiplied by risk factor in component
  };
}

/**
 * Apply risk adjustment to commission forecast
 * Risk factor: 0-100 represents fall-through percentage
 * Returns: Commission × (1 - riskFactor/100)
 */
export function applyRiskAdjustment(
  commission: number,
  riskFactorPercent: number
): number {
  const riskMultiplier = 1 - (riskFactorPercent / 100);
  return commission * riskMultiplier;
}

/**
 * Format commission breakdown for display
 */
export function formatCommissionBreakdown(forecast: CommissionForecast): string {
  const lines = [
    `Total Forecasted Commission: $${forecast.totalCommission.toFixed(2)}`,
    `Projected Deals: ${forecast.dealCount}`,
    `Avg Commission per Deal: $${forecast.avgCommissionPerDeal.toFixed(2)}`,
    '',
    'Agent Breakdown:',
  ];
  
  forecast.agentBreakdown.forEach(agent => {
    lines.push(
      `  ${agent.agent}: $${agent.totalCommission.toFixed(2)} (${agent.dealCount} deals)`
    );
  });
  
  return lines.join('\n');
}
