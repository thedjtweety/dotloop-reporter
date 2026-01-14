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
 * Scales projections based on the daysToForecast timeframe
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
  // Scale based on timeframe: 30 days = ~0.33x, 60 days = ~0.67x, 90 days = ~1x
  const timeframeScale = Math.min(1, daysToForecast / 90);
  const projectedClosedDeals = Math.round(underContractDeals.length * (historicalCloseRate / 100) * timeframeScale);

  // Calculate average commission per deal
  const totalCommission = underContractDeals.reduce((sum, deal) => {
    return sum + (deal.commissionTotal || 0);
  }, 0);
  const avgCommissionPerDeal = totalCommission / underContractDeals.length;

  // Calculate projected commission
  const projectedCommission = projectedClosedDeals * avgCommissionPerDeal;

  // Calculate confidence level based on sample size and timeframe
  // More deals = higher confidence, but longer timeframes have slightly lower confidence
  const sampleConfidence = Math.min(100, 50 + (underContractDeals.length * 5));
  const timeframeConfidence = 100 - (daysToForecast > 60 ? 10 : 0); // Reduce confidence for 90+ day forecasts
  const confidenceLevel = Math.round((sampleConfidence + timeframeConfidence) / 2);

  return {
    projectedClosedDeals: Math.max(0, projectedClosedDeals),
    projectedCommission: Math.round(projectedCommission),
    projectedRevenue: Math.round(projectedCommission), // Same as commission for now
    confidenceLevel: Math.max(0, Math.min(100, confidenceLevel)),
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


/**
 * Deal-level forecast with probability score
 */
export interface ForecastedDeal {
  id: string;
  loopName: string;
  agent: string;
  price: number;
  commission: number;
  closingDate: Date | undefined;
  daysInContract: number;
  probability: number; // 0-100
  expectedCloseDate: Date;
  status: 'high' | 'medium' | 'low'; // probability category
}

/**
 * Calculate individual deal probability based on days in contract and historical patterns
 * Deals that have been in contract longer are more likely to close
 */
export function calculateDealProbability(
  deal: DotloopRecord,
  historicalCloseRate: number,
  avgDaysToClose: number
): number {
  // Base probability from historical close rate
  let probability = historicalCloseRate;

  // Adjust based on days in contract
  if (deal.contractDate) {
    const daysInContract = Math.floor(
      (new Date().getTime() - new Date(deal.contractDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Deals that have been in contract longer are more likely to close
    // If deal has been in contract for avg days, boost probability by 15%
    if (daysInContract > 0 && avgDaysToClose > 0) {
      const daysRatio = Math.min(1, daysInContract / avgDaysToClose);
      probability = probability * (0.85 + daysRatio * 0.15); // 85-100% of base rate
    }
  }

  // Adjust based on price (higher prices may have lower probability due to complexity)
  if (deal.price && deal.price > 0) {
    const avgPrice = 350000; // Typical average price
    if (deal.price > avgPrice * 1.5) {
      probability *= 0.95; // 5% reduction for high-value deals
    }
  }

  return Math.max(0, Math.min(100, Math.round(probability)));
}

/**
 * Predict close date for a deal based on historical average days to close
 */
export function predictCloseDate(
  deal: DotloopRecord,
  avgDaysToClose: number
): Date {
  const contractDate = deal.contractDate ? new Date(deal.contractDate) : new Date();
  const predictedDate = new Date(contractDate);
  predictedDate.setDate(predictedDate.getDate() + avgDaysToClose);
  return predictedDate;
}

/**
 * Calculate forecasted deals with probability scores and expected close dates
 */
export function calculateForecastedDeals(
  underContractDeals: DotloopRecord[],
  historicalCloseRate: number,
  avgDaysToClose: number,
  daysToForecast: number = 60
): ForecastedDeal[] {
  return underContractDeals
    .map((deal, index) => {
      const probability = calculateDealProbability(deal, historicalCloseRate, avgDaysToClose);
      const expectedCloseDate = predictCloseDate(deal, avgDaysToClose);

      // Determine if deal will close within forecast period
      const daysUntilExpectedClose = Math.floor(
        (expectedCloseDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only include deals that are likely to close within forecast period
      if (daysUntilExpectedClose > daysToForecast) {
        return null;
      }

      const daysInContract = deal.contractDate
        ? Math.floor((new Date().getTime() - new Date(deal.contractDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        id: `deal-${index}`,
        loopName: deal.loopName || 'Unknown',
        agent: deal.agent || 'Unknown',
        price: deal.price || 0,
        commission: deal.commissionTotal || 0,
        closingDate: deal.closingDate ? new Date(deal.closingDate) : undefined,
        daysInContract: Math.max(0, daysInContract),
        probability,
        expectedCloseDate,
        status: probability >= 70 ? 'high' : probability >= 40 ? 'medium' : 'low'
      };
    })
    .filter((deal): deal is ForecastedDeal => deal !== null)
    .sort((a, b) => {
      if (!a || !b) return 0;
      return b.probability - a.probability;
    }); // Sort by probability descending
}
