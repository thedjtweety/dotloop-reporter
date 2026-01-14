import { DotloopRecord } from './csvParser';

export interface ProjectionMetrics {
  projectedClosedDeals: number;
  projectedCommission: number;
  projectedRevenue: number;
  confidenceLevel: number; // 0-100
  daysToForecast: number;
  baselineCloseRate: number;
}

/**
 * Calculate projected deals to close based on pipeline and historical close rate
 */
export function calculateProjectedToClose(
  underContractDeals: DotloopRecord[],
  historicalCloseRate: number,
  daysToForecast: number = 60
): ProjectionMetrics {
  if (underContractDeals.length === 0) {
    return {
      projectedClosedDeals: 0,
      projectedCommission: 0,
      projectedRevenue: 0,
      confidenceLevel: 0,
      daysToForecast,
      baselineCloseRate: historicalCloseRate
    };
  }

  // Calculate projected closed deals
  const projectedClosedDeals = Math.round(underContractDeals.length * (historicalCloseRate / 100));

  // Calculate average commission per deal
  const totalCommission = underContractDeals.reduce((sum, deal) => {
    return sum + (deal.commissionTotal || 0);
  }, 0);
  const avgCommissionPerDeal = totalCommission / underContractDeals.length;

  // Calculate projected commission
  const projectedCommission = projectedClosedDeals * avgCommissionPerDeal;

  // Calculate confidence level based on sample size
  // More deals = higher confidence
  const confidenceLevel = Math.min(100, 50 + (underContractDeals.length * 5));

  return {
    projectedClosedDeals,
    projectedCommission: Math.round(projectedCommission),
    projectedRevenue: Math.round(projectedCommission), // Same as commission for now
    confidenceLevel,
    daysToForecast,
    baselineCloseRate: historicalCloseRate
  };
}

/**
 * Calculate historical close rate from records
 */
export function calculateHistoricalCloseRate(records: DotloopRecord[]): number {
  if (records.length === 0) return 0;

  const closedDeals = records.filter(r => 
    r.loopStatus?.toLowerCase().includes('closed') || 
    r.loopStatus?.toLowerCase().includes('sold')
  ).length;

  return Math.round((closedDeals / records.length) * 100);
}

/**
 * Get projected deals by status
 */
export function getProjectedDealsByStatus(
  records: DotloopRecord[]
): Record<string, number> {
  const statusCounts: Record<string, number> = {};

  records.forEach(record => {
    const status = record.loopStatus || 'Unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  return statusCounts;
}

/**
 * Calculate velocity (deals per day)
 */
export function calculateVelocity(
  closedDeals: DotloopRecord[],
  daysInPeriod: number
): number {
  if (daysInPeriod === 0) return 0;
  return closedDeals.length / daysInPeriod;
}

/**
 * Project future performance based on current velocity
 */
export function projectFuturePerformance(
  currentVelocity: number,
  daysToProject: number,
  avgCommissionPerDeal: number
): {
  projectedDeals: number;
  projectedCommission: number;
} {
  const projectedDeals = Math.round(currentVelocity * daysToProject);
  const projectedCommission = projectedDeals * avgCommissionPerDeal;

  return {
    projectedDeals,
    projectedCommission: Math.round(projectedCommission)
  };
}
