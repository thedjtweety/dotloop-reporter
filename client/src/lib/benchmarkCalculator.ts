/**
 * Benchmark Calculator
 * Compares agent/brokerage performance against NAR 2024 industry benchmarks
 * Calculates percentiles, rankings, and generates insights
 */

import { DotloopRecord, AgentMetrics } from './csvParser';

export interface BenchmarkMetrics {
  medianTransactions: number;
  medianGCI: number;
  medianClosingRate: number;
  medianDaysToClose: number;
  medianDealValue: number;
  medianCommissionRate: number;
}

export interface ComparisonResult {
  metric: string;
  userValue: number;
  benchmarkValue: number;
  percentile: number;
  percentileRank: string;
  difference: number;
  differencePercent: number;
  isAboveBenchmark: boolean;
  insight: string;
  color: string;
}

export interface BrokerageComparison {
  brokerage: {
    avgTransactions: number;
    avgGCI: number;
    avgClosingRate: number;
    avgDaysToClose: number;
    avgDealValue: number;
  };
  comparisons: ComparisonResult[];
  overallPercentile: number;
  overallRank: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

/**
 * NAR 2024 Industry Benchmarks
 * Source: National Association of REALTORS 2024 Member Profile
 */
const NAR_BENCHMARKS: BenchmarkMetrics = {
  medianTransactions: 10,
  medianGCI: 58100,
  medianClosingRate: 70,
  medianDaysToClose: 50,
  medianDealValue: 425000,
  medianCommissionRate: 5.5
};

/**
 * Calculate percentile (0-100) for a value against all values
 */
export function calculatePercentile(value: number, allValues: number[]): number {
  if (allValues.length === 0) return 0;

  const sorted = [...allValues].sort((a, b) => a - b);
  const count = sorted.filter(v => v <= value).length;
  return Math.round((count / allValues.length) * 100);
}

/**
 * Get percentile rank description
 */
export function getPercentileRank(percentile: number): string {
  if (percentile >= 90) return 'Top 10%';
  if (percentile >= 75) return 'Top 25%';
  if (percentile >= 50) return 'Top 50%';
  if (percentile >= 25) return 'Top 75%';
  return 'Below Average';
}

/**
 * Get color for percentile
 */
export function getPercentileColor(percentile: number): string {
  if (percentile >= 75) return '#10b981'; // Green - excellent
  if (percentile >= 50) return '#3b82f6'; // Blue - good
  if (percentile >= 25) return '#f59e0b'; // Amber - fair
  return '#ef4444'; // Red - below average
}

/**
 * Calculate brokerage metrics from all records
 */
export function calculateBrokerageMetrics(
  records: DotloopRecord[],
  agentMetrics: AgentMetrics[]
) {
  const totalAgents = agentMetrics.length;
  
  if (totalAgents === 0) {
    return {
      avgTransactions: 0,
      avgGCI: 0,
      avgClosingRate: 0,
      avgDaysToClose: 0,
      avgDealValue: 0
    };
  }

  const avgTransactions = Math.round(
    agentMetrics.reduce((sum, a) => sum + a.totalTransactions, 0) / totalAgents
  );

  const avgGCI = Math.round(
    agentMetrics.reduce((sum, a) => sum + a.totalCommission, 0) / totalAgents
  );

  const closedRecords = records.filter(r => r.loopStatus === 'Closed' || r.loopStatus === 'Sold');
  const avgClosingRate = records.length > 0
    ? Math.round((closedRecords.length / records.length) * 100)
    : 0;

  const daysArray = closedRecords
    .filter(r => r.listingDate && r.closingDate)
    .map(r => {
      const listing = new Date(r.listingDate);
      const closing = new Date(r.closingDate);
      return Math.floor((closing.getTime() - listing.getTime()) / (1000 * 60 * 60 * 24));
    });

  const avgDaysToClose = daysArray.length > 0
    ? Math.round(daysArray.reduce((a, b) => a + b, 0) / daysArray.length)
    : 0;

  const avgDealValue = records.length > 0
    ? Math.round(records.reduce((sum, r) => sum + (r.salePrice || 0), 0) / records.length)
    : 0;

  return {
    avgTransactions,
    avgGCI,
    avgClosingRate,
    avgDaysToClose,
    avgDealValue
  };
}

/**
 * Compare brokerage metrics against benchmarks
 */
export function compareBrokerageMetrics(
  brokerageMetrics: ReturnType<typeof calculateBrokerageMetrics>,
  allAgentMetrics: AgentMetrics[]
): ComparisonResult[] {
  const allTransactions = allAgentMetrics.map(a => a.totalTransactions);
  const allGCI = allAgentMetrics.map(a => a.totalCommission);

  const comparisons: ComparisonResult[] = [
    {
      metric: 'Transactions per Agent',
      userValue: brokerageMetrics.avgTransactions,
      benchmarkValue: NAR_BENCHMARKS.medianTransactions,
      percentile: calculatePercentile(brokerageMetrics.avgTransactions, allTransactions),
      percentileRank: getPercentileRank(calculatePercentile(brokerageMetrics.avgTransactions, allTransactions)),
      difference: brokerageMetrics.avgTransactions - NAR_BENCHMARKS.medianTransactions,
      differencePercent: Math.round(
        ((brokerageMetrics.avgTransactions - NAR_BENCHMARKS.medianTransactions) / NAR_BENCHMARKS.medianTransactions) * 100
      ),
      isAboveBenchmark: brokerageMetrics.avgTransactions > NAR_BENCHMARKS.medianTransactions,
      insight: generateInsight('transactions', brokerageMetrics.avgTransactions, NAR_BENCHMARKS.medianTransactions),
      color: getPercentileColor(calculatePercentile(brokerageMetrics.avgTransactions, allTransactions))
    },
    {
      metric: 'GCI per Agent',
      userValue: brokerageMetrics.avgGCI,
      benchmarkValue: NAR_BENCHMARKS.medianGCI,
      percentile: calculatePercentile(brokerageMetrics.avgGCI, allGCI),
      percentileRank: getPercentileRank(calculatePercentile(brokerageMetrics.avgGCI, allGCI)),
      difference: brokerageMetrics.avgGCI - NAR_BENCHMARKS.medianGCI,
      differencePercent: Math.round(
        ((brokerageMetrics.avgGCI - NAR_BENCHMARKS.medianGCI) / NAR_BENCHMARKS.medianGCI) * 100
      ),
      isAboveBenchmark: brokerageMetrics.avgGCI > NAR_BENCHMARKS.medianGCI,
      insight: generateInsight('gci', brokerageMetrics.avgGCI, NAR_BENCHMARKS.medianGCI),
      color: getPercentileColor(calculatePercentile(brokerageMetrics.avgGCI, allGCI))
    },
    {
      metric: 'Closing Rate',
      userValue: brokerageMetrics.avgClosingRate,
      benchmarkValue: NAR_BENCHMARKS.medianClosingRate,
      percentile: 0, // Will be calculated differently for percentage
      percentileRank: brokerageMetrics.avgClosingRate > NAR_BENCHMARKS.medianClosingRate ? 'Above Average' : 'Below Average',
      difference: brokerageMetrics.avgClosingRate - NAR_BENCHMARKS.medianClosingRate,
      differencePercent: Math.round(
        ((brokerageMetrics.avgClosingRate - NAR_BENCHMARKS.medianClosingRate) / NAR_BENCHMARKS.medianClosingRate) * 100
      ),
      isAboveBenchmark: brokerageMetrics.avgClosingRate > NAR_BENCHMARKS.medianClosingRate,
      insight: generateInsight('closing_rate', brokerageMetrics.avgClosingRate, NAR_BENCHMARKS.medianClosingRate),
      color: brokerageMetrics.avgClosingRate > NAR_BENCHMARKS.medianClosingRate ? '#10b981' : '#ef4444'
    },
    {
      metric: 'Days to Close',
      userValue: brokerageMetrics.avgDaysToClose,
      benchmarkValue: NAR_BENCHMARKS.medianDaysToClose,
      percentile: 0,
      percentileRank: brokerageMetrics.avgDaysToClose < NAR_BENCHMARKS.medianDaysToClose ? 'Faster' : 'Slower',
      difference: brokerageMetrics.avgDaysToClose - NAR_BENCHMARKS.medianDaysToClose,
      differencePercent: Math.round(
        ((brokerageMetrics.avgDaysToClose - NAR_BENCHMARKS.medianDaysToClose) / NAR_BENCHMARKS.medianDaysToClose) * 100
      ),
      isAboveBenchmark: brokerageMetrics.avgDaysToClose < NAR_BENCHMARKS.medianDaysToClose,
      insight: generateInsight('days_to_close', brokerageMetrics.avgDaysToClose, NAR_BENCHMARKS.medianDaysToClose),
      color: brokerageMetrics.avgDaysToClose < NAR_BENCHMARKS.medianDaysToClose ? '#10b981' : '#ef4444'
    },
    {
      metric: 'Average Deal Value',
      userValue: brokerageMetrics.avgDealValue,
      benchmarkValue: NAR_BENCHMARKS.medianDealValue,
      percentile: 0,
      percentileRank: brokerageMetrics.avgDealValue > NAR_BENCHMARKS.medianDealValue ? 'Premium' : 'Below Market',
      difference: brokerageMetrics.avgDealValue - NAR_BENCHMARKS.medianDealValue,
      differencePercent: Math.round(
        ((brokerageMetrics.avgDealValue - NAR_BENCHMARKS.medianDealValue) / NAR_BENCHMARKS.medianDealValue) * 100
      ),
      isAboveBenchmark: brokerageMetrics.avgDealValue > NAR_BENCHMARKS.medianDealValue,
      insight: generateInsight('deal_value', brokerageMetrics.avgDealValue, NAR_BENCHMARKS.medianDealValue),
      color: brokerageMetrics.avgDealValue > NAR_BENCHMARKS.medianDealValue ? '#10b981' : '#f59e0b'
    }
  ];

  return comparisons;
}

/**
 * Generate insight text for a comparison
 */
function generateInsight(metric: string, userValue: number, benchmarkValue: number): string {
  const diff = userValue - benchmarkValue;
  const diffPercent = Math.round((diff / benchmarkValue) * 100);

  switch (metric) {
    case 'transactions':
      if (diff > 0) {
        return `Your agents close ${Math.abs(diff)} more deals annually than the median`;
      } else {
        return `Your agents close ${Math.abs(diff)} fewer deals annually than the median`;
      }

    case 'gci':
      if (diff > 0) {
        return `Your agents earn $${(Math.abs(diff) / 1000).toFixed(0)}k more GCI than the median`;
      } else {
        return `Your agents earn $${(Math.abs(diff) / 1000).toFixed(0)}k less GCI than the median`;
      }

    case 'closing_rate':
      if (diff > 0) {
        return `Your closing rate is ${Math.abs(diff)}% higher than industry average`;
      } else {
        return `Your closing rate is ${Math.abs(diff)}% lower than industry average`;
      }

    case 'days_to_close':
      if (diff < 0) {
        return `Your agents close deals ${Math.abs(diff)} days faster than average`;
      } else {
        return `Your agents close deals ${Math.abs(diff)} days slower than average`;
      }

    case 'deal_value':
      if (diff > 0) {
        return `Your average deal value is ${diffPercent}% above market median`;
      } else {
        return `Your average deal value is ${Math.abs(diffPercent)}% below market median`;
      }

    default:
      return '';
  }
}

/**
 * Generate recommendations based on comparisons
 */
export function generateRecommendations(comparisons: ComparisonResult[]): string[] {
  const recommendations: string[] = [];

  comparisons.forEach(comp => {
    if (comp.metric === 'Transactions per Agent' && !comp.isAboveBenchmark) {
      recommendations.push('Focus on increasing agent transaction volume through prospecting and lead generation');
    }

    if (comp.metric === 'GCI per Agent' && !comp.isAboveBenchmark) {
      recommendations.push('Review commission structures and deal sizes to increase GCI per agent');
    }

    if (comp.metric === 'Closing Rate' && !comp.isAboveBenchmark) {
      recommendations.push('Improve closing rates through better negotiation training and follow-up processes');
    }

    if (comp.metric === 'Days to Close' && !comp.isAboveBenchmark) {
      recommendations.push('Streamline closing processes to reduce time on market');
    }

    if (comp.metric === 'Average Deal Value' && !comp.isAboveBenchmark) {
      recommendations.push('Target higher-value properties or premium market segments');
    }
  });

  // Add positive recommendations
  comparisons.forEach(comp => {
    if (comp.metric === 'Transactions per Agent' && comp.isAboveBenchmark) {
      recommendations.push('Excellent transaction volume - maintain current prospecting strategies');
    }

    if (comp.metric === 'Closing Rate' && comp.isAboveBenchmark) {
      recommendations.push('Strong closing rate - consider sharing best practices with other agents');
    }

    if (comp.metric === 'Days to Close' && comp.isAboveBenchmark) {
      recommendations.push('Fast closing times - document and share your process as a best practice');
    }
  });

  return recommendations.slice(0, 5); // Return top 5 recommendations
}

/**
 * Identify strengths based on comparisons
 */
export function identifyStrengths(comparisons: ComparisonResult[]): string[] {
  return comparisons
    .filter(c => c.isAboveBenchmark || c.percentile >= 75)
    .map(c => `${c.metric}: ${c.percentileRank}`)
    .slice(0, 3);
}

/**
 * Identify weaknesses based on comparisons
 */
export function identifyWeaknesses(comparisons: ComparisonResult[]): string[] {
  return comparisons
    .filter(c => !c.isAboveBenchmark && c.percentile < 50)
    .map(c => `${c.metric}: ${c.percentileRank}`)
    .slice(0, 3);
}

/**
 * Calculate overall percentile ranking
 */
export function calculateOverallPercentile(comparisons: ComparisonResult[]): number {
  const percentiles = comparisons
    .filter(c => c.percentile > 0)
    .map(c => c.percentile);

  if (percentiles.length === 0) return 50;

  return Math.round(percentiles.reduce((a, b) => a + b, 0) / percentiles.length);
}

/**
 * Get NAR benchmarks
 */
export function getNARBenchmarks(): BenchmarkMetrics {
  return NAR_BENCHMARKS;
}

/**
 * Format currency
 */
export function formatCurrency(value: number): string {
  return `$${(value / 1000).toFixed(0)}k`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${value > 0 ? '+' : ''}${value}%`;
}
