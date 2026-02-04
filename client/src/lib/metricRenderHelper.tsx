import React from 'react';
import { HomeIcon, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import { formatCurrency, formatPercentage } from '@/lib/formatUtils';
import { DashboardMetrics } from '@/lib/csvParser';
import { MetricId } from '@/hooks/useMetricsOrder';

export function renderMetricCard(
  metricId: MetricId,
  metrics: DashboardMetrics,
  sparklineTrends: any,
  onMetricClick: (type: 'total' | 'volume' | 'closing' | 'days' | 'active' | 'contract' | 'closed' | 'archived') => void
): React.ReactNode {
  switch (metricId) {
    case 'transactions':
      return (
        <MetricCard
          key="transactions"
          title="Total Transactions"
          value={metrics.totalTransactions}
          icon={<HomeIcon className="w-5 h-5" />}
          color="primary"
          trend={metrics.trends?.totalTransactions}
          sparklineTrend={sparklineTrends?.totalTransactions}
          onClick={() => onMetricClick('total')}
        />
      );
    case 'volume':
      return (
        <MetricCard
          key="volume"
          title="Total Sales Volume"
          value={formatCurrency(metrics.totalSalesVolume)}
          subtitle={`Avg: ${formatCurrency(metrics.averagePrice)}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="accent"
          trend={metrics.trends?.totalVolume}
          sparklineTrend={sparklineTrends?.totalVolume}
          onClick={() => onMetricClick('volume')}
        />
      );
    case 'closingRate':
      return (
        <MetricCard
          key="closingRate"
          title="Closing Rate"
          value={formatPercentage(metrics.closingRate)}
          subtitle={`${metrics.closed} closed deals`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="accent"
          trend={metrics.trends?.closingRate}
          sparklineTrend={sparklineTrends?.closingRate}
          onClick={() => onMetricClick('closing')}
        />
      );
    case 'daysToClose':
      return (
        <MetricCard
          key="daysToClose"
          title="Avg Days to Close"
          value={metrics.averageDaysToClose}
          icon={<Calendar className="w-5 h-5" />}
          color="primary"
          trend={metrics.trends?.avgDaysToClose}
          sparklineTrend={sparklineTrends?.avgDaysToClose}
          onClick={() => onMetricClick('days')}
        />
      );
    default:
      return null;
  }
}
