/**
 * FinancialChart Component
 * Displays financial summary metrics
 */

import { DashboardMetrics } from '@/lib/csvParser';
import { DollarSign, TrendingUp, Percent } from 'lucide-react';

interface FinancialChartProps {
  metrics: DashboardMetrics;
}

export default function FinancialChart({ metrics }: FinancialChartProps) {
  const financialMetrics = [
    {
      label: 'Total Sales Volume',
      value: `$${(metrics.totalSalesVolume / 1000000).toFixed(2)}M`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Average Price',
      value: `$${metrics.averagePrice.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Total Commission',
      value: `$${metrics.totalCommission.toLocaleString()}`,
      icon: Percent,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {financialMetrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div key={index} className="p-6 bg-background rounded-lg border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-2">
                  {metric.label}
                </p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {metric.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${metric.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
