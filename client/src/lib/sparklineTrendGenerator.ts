import { DotloopRecord } from './csvParser';
import { SparklineTrend } from './sparklineUtils';
import { filterRecordsByDate, getPreviousPeriod } from './dateUtils';
import { DateRange } from 'react-day-picker';

/**
 * Generate sparkline trend data for a metric based on historical records
 * Divides the date range into 7 periods and calculates metric value for each
 */
export function generateMetricSparklineTrend(
  records: DotloopRecord[],
  dateRange: DateRange | undefined,
  metricCalculator: (recordsInPeriod: DotloopRecord[]) => number
): SparklineTrend {
  if (records.length === 0) {
    return {
      data: [0],
      direction: 'flat',
      percentChange: 0,
      minValue: 0,
      maxValue: 0,
    };
  }

  // Get date range
  let startDate: Date;
  let endDate: Date;

  if (dateRange?.from && dateRange?.to) {
    startDate = dateRange.from;
    endDate = dateRange.to;
  } else {
    // Use all available data
    const dates = records
      .map(r => {
        const date = r.closingDate ? new Date(r.closingDate) : null;
        return date && !isNaN(date.getTime()) ? date : null;
      })
      .filter((d): d is Date => d !== null);

    if (dates.length === 0) {
      return {
        data: [0],
        direction: 'flat',
        percentChange: 0,
        minValue: 0,
        maxValue: 0,
      };
    }

    startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    endDate = new Date(Math.max(...dates.map(d => d.getTime())));
  }

  // Divide into 7 periods
  const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const values: number[] = [];

  for (let i = 0; i < 7; i++) {
    const periodStart = new Date(startDate.getTime() + i * periodDays * 24 * 60 * 60 * 1000);
    const periodEnd = new Date(periodStart.getTime() + periodDays * 24 * 60 * 60 * 1000);

    const periodRecords = records.filter(r => {
      const date = r.closingDate ? new Date(r.closingDate) : null;
      return date && date >= periodStart && date <= periodEnd;
    });

    const value = metricCalculator(periodRecords);
    values.push(value);
  }

  // Calculate trend direction and percent change
  const firstValue = values[0] || 1;
  const lastValue = values[values.length - 1] || 1;
  const percentChange = Math.round(((lastValue - firstValue) / firstValue) * 100);
  const direction = percentChange > 5 ? 'up' : percentChange < -5 ? 'down' : 'flat';

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  return {
    data: values,
    direction,
    percentChange,
    minValue,
    maxValue,
  };
}

/**
 * Generate sparkline trends for all dashboard metrics
 */
export function generateDashboardSparklineTrends(
  records: DotloopRecord[],
  dateRange: DateRange | undefined
) {
  return {
    totalTransactions: generateMetricSparklineTrend(
      records,
      dateRange,
      (recs) => recs.length
    ),
    totalVolume: generateMetricSparklineTrend(
      records,
      dateRange,
      (recs) => recs.reduce((sum, r) => sum + ((r.salePrice || r.price) || 0), 0)
    ),
    closingRate: generateMetricSparklineTrend(
      records,
      dateRange,
      (recs) => {
        if (recs.length === 0) return 0;
        const closed = recs.filter(r => 
          r.loopStatus?.toLowerCase().includes('closed') || 
          r.loopStatus?.toLowerCase().includes('sold')
        ).length;
        return (closed / recs.length) * 100;
      }
    ),
    avgDaysToClose: generateMetricSparklineTrend(
      records,
      dateRange,
      (recs) => {
        const closedDeals = recs.filter(r =>
          r.loopStatus?.toLowerCase().includes('closed') ||
          r.loopStatus?.toLowerCase().includes('sold')
        );
        if (closedDeals.length === 0) return 0;
        const totalDays = closedDeals.reduce((sum, r) => sum + (r.daysToClose || 0), 0);
        return Math.round(totalDays / closedDeals.length);
      }
    ),
  };
}
