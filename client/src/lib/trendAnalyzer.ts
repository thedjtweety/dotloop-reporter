/**
 * Trend Analysis Engine
 * Analyzes agent performance over time (monthly, quarterly)
 * Calculates trends, growth rates, and performance metrics by period
 */

import { DotloopRecord } from './csvParser';

export type TimePeriod = 'monthly' | 'quarterly' | 'ytd';

export interface PeriodMetrics {
  period: string; // "2024-01", "Q1 2024", etc.
  startDate: Date;
  endDate: Date;
  dealsClosed: number;
  totalGCI: number;
  avgDealValue: number;
  closingRate: number;
  daysToClose: number;
  avgCommissionPerDeal: number;
  growth: number; // percentage change from previous period
}

export interface AgentTrendData {
  agentName: string;
  periods: PeriodMetrics[];
  totalDeals: number;
  totalGCI: number;
  avgGrowth: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ComparisonTrendData {
  agents: AgentTrendData[];
  periods: string[];
  combinedMetrics: PeriodMetrics[];
}

/**
 * Group records by month
 */
export function groupByMonth(
  records: DotloopRecord[],
  agentName?: string
): Record<string, DotloopRecord[]> {
  const filtered = agentName
    ? records.filter(r => r.agents === agentName)
    : records;

  const grouped: Record<string, DotloopRecord[]> = {};

  filtered.forEach(record => {
    const date = new Date(record.closingDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(record);
  });

  return grouped;
}

/**
 * Group records by quarter
 */
export function groupByQuarter(
  records: DotloopRecord[],
  agentName?: string
): Record<string, DotloopRecord[]> {
  const filtered = agentName
    ? records.filter(r => r.agents === agentName)
    : records;

  const grouped: Record<string, DotloopRecord[]> = {};

  filtered.forEach(record => {
    const date = new Date(record.closingDate);
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    const key = `Q${quarter} ${date.getFullYear()}`;

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(record);
  });

  return grouped;
}

/**
 * Calculate metrics for a group of records
 */
export function calculateTrendMetrics(records: DotloopRecord[], startDate: Date, endDate: Date): PeriodMetrics {
  if (records.length === 0) {
    return {
      period: formatPeriod(startDate, endDate),
      startDate,
      endDate,
      dealsClosed: 0,
      totalGCI: 0,
      avgDealValue: 0,
      closingRate: 0,
      daysToClose: 0,
      avgCommissionPerDeal: 0,
      growth: 0
    };
  }

  const closedDeals = records.filter(r => r.loopStatus === 'Closed' || r.loopStatus === 'Sold');
  const totalGCI = records.reduce((sum, r) => sum + (r.commissionTotal || 0), 0);
  const avgDealValue = records.length > 0
    ? Math.round(records.reduce((sum, r) => sum + (r.salePrice || 0), 0) / records.length)
    : 0;

  const closingRate = records.length > 0
    ? Math.round((closedDeals.length / records.length) * 100)
    : 0;

  // Calculate days to close
  const daysArray = closedDeals
    .filter(r => r.listingDate && r.closingDate)
    .map(r => {
      const listing = new Date(r.listingDate);
      const closing = new Date(r.closingDate);
      return Math.floor((closing.getTime() - listing.getTime()) / (1000 * 60 * 60 * 24));
    });

  const daysToClose = daysArray.length > 0
    ? Math.round(daysArray.reduce((a, b) => a + b, 0) / daysArray.length)
    : 0;

  const avgCommissionPerDeal = records.length > 0
    ? Math.round(totalGCI / records.length)
    : 0;

  return {
    period: formatPeriod(startDate, endDate),
    startDate,
    endDate,
    dealsClosed: closedDeals.length,
    totalGCI,
    avgDealValue,
    closingRate,
    daysToClose,
    avgCommissionPerDeal,
    growth: 0 // Will be calculated when comparing periods
  };
}

/**
 * Format period string
 */
function formatPeriod(startDate: Date, endDate: Date): string {
  const start = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const end = endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return `${start} - ${end}`;
}

/**
 * Calculate growth percentage between two metrics
 */
export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Get trend data for a single agent
 */
export function getAgentTrendData(
  records: DotloopRecord[],
  agentName: string,
  period: TimePeriod = 'monthly'
): AgentTrendData {
  const agentRecords = records.filter(r => r.agents === agentName);
  
  if (agentRecords.length === 0) {
    return {
      agentName,
      periods: [],
      totalDeals: 0,
      totalGCI: 0,
      avgGrowth: 0,
      trend: 'stable'
    };
  }

  const grouped = period === 'quarterly' 
    ? groupByQuarter(agentRecords)
    : groupByMonth(agentRecords);

  const periodKeys = Object.keys(grouped).sort();
  const periods: PeriodMetrics[] = [];

  periodKeys.forEach((key, index) => {
    const recordsInPeriod = grouped[key];
    const startDate = recordsInPeriod[0] ? new Date(recordsInPeriod[0].closingDate) : new Date();
    const endDate = recordsInPeriod[recordsInPeriod.length - 1] 
      ? new Date(recordsInPeriod[recordsInPeriod.length - 1].closingDate)
      : new Date();

    const metrics = calculateTrendMetrics(recordsInPeriod, startDate, endDate);

    // Calculate growth from previous period
    if (index > 0 && periods[index - 1]) {
      metrics.growth = calculateGrowth(metrics.dealsClosed, periods[index - 1].dealsClosed);
    }

    periods.push(metrics);
  });

  // Calculate overall metrics
  const totalDeals = agentRecords.length;
  const totalGCI = agentRecords.reduce((sum, r) => sum + (r.commissionTotal || 0), 0);
  const growthValues = periods.map(p => p.growth).filter(g => g !== 0);
  const avgGrowth = growthValues.length > 0
    ? Math.round(growthValues.reduce((a, b) => a + b, 0) / growthValues.length)
    : 0;

  // Determine trend
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (periods.length >= 2) {
    const recentGrowth = periods[periods.length - 1].growth;
    if (recentGrowth > 10) trend = 'up';
    else if (recentGrowth < -10) trend = 'down';
  }

  return {
    agentName,
    periods,
    totalDeals,
    totalGCI,
    avgGrowth,
    trend
  };
}

/**
 * Get comparison trend data for multiple agents
 */
export function getComparisonTrendData(
  records: DotloopRecord[],
  agentNames: string[],
  period: TimePeriod = 'monthly'
): ComparisonTrendData {
  const agentTrends = agentNames.map(name => getAgentTrendData(records, name, period));

  // Get all unique periods
  const allPeriods = new Set<string>();
  agentTrends.forEach(trend => {
    trend.periods.forEach(p => allPeriods.add(p.period));
  });

  const periods = Array.from(allPeriods).sort();

  // Calculate combined metrics for each period
  const combinedMetrics: PeriodMetrics[] = periods.map(periodName => {
    let totalDeals = 0;
    let totalGCI = 0;
    let totalDaysToClose = 0;
    let countDaysToClose = 0;
    let totalClosingRate = 0;
    let countClosingRate = 0;
    let totalAvgDealValue = 0;

    agentTrends.forEach(trend => {
      const periodMetric = trend.periods.find(p => p.period === periodName);
      if (periodMetric) {
        totalDeals += periodMetric.dealsClosed;
        totalGCI += periodMetric.totalGCI;
        if (periodMetric.daysToClose > 0) {
          totalDaysToClose += periodMetric.daysToClose;
          countDaysToClose++;
        }
        totalClosingRate += periodMetric.closingRate;
        countClosingRate++;
        totalAvgDealValue += periodMetric.avgDealValue;
      }
    });

    const avgDealValue = totalAvgDealValue > 0 ? Math.round(totalAvgDealValue / agentTrends.length) : 0;
    const closingRate = countClosingRate > 0 ? Math.round(totalClosingRate / countClosingRate) : 0;
    const daysToClose = countDaysToClose > 0 ? Math.round(totalDaysToClose / countDaysToClose) : 0;

    return {
      period: periodName,
      startDate: new Date(),
      endDate: new Date(),
      dealsClosed: totalDeals,
      totalGCI,
      avgDealValue,
      closingRate,
      daysToClose,
      avgCommissionPerDeal: totalDeals > 0 ? Math.round(totalGCI / totalDeals) : 0,
      growth: 0
    };
  });

  return {
    agents: agentTrends,
    periods,
    combinedMetrics
  };
}

/**
 * Get trend indicator string
 */
export function getTrendIndicator(growth: number): string {
  if (growth > 10) return '↑';
  if (growth < -10) return '↓';
  return '→';
}

/**
 * Get trend color
 */
export function getTrendColor(growth: number): string {
  if (growth > 10) return '#10b981'; // Green - up
  if (growth < -10) return '#ef4444'; // Red - down
  return '#6b7280'; // Gray - stable
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return `$${(value / 1000).toFixed(0)}k`;
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
  return `${value > 0 ? '+' : ''}${value}%`;
}

/**
 * Get date range for period
 */
export function getDateRangeForPeriod(
  records: DotloopRecord[],
  period: TimePeriod
): { start: Date; end: Date } {
  if (records.length === 0) {
    return { start: new Date(), end: new Date() };
  }

  const dates = records.map(r => new Date(r.closingDate)).sort((a, b) => a.getTime() - b.getTime());
  
  return {
    start: dates[0],
    end: dates[dates.length - 1]
  };
}
