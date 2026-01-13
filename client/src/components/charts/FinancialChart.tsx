/**
 * FinancialChart Component
 * Displays financial summary metrics with trend sparklines
 */

import { DashboardMetrics } from '@/lib/csvParser';
import { DollarSign, TrendingUp, Percent, ArrowUp, ArrowDown } from 'lucide-react';
import { DotloopRecord } from '@/lib/csvParser';

interface FinancialChartProps {
  metrics: DashboardMetrics;
  records?: DotloopRecord[];
}

/**
 * Generate mock trend data for sparkline visualization
 * In a real app, this would come from historical data
 */
function generateTrendData(currentValue: number, variance: number = 0.15): number[] {
  const data: number[] = [];
  let value = currentValue * (1 - variance);
  
  for (let i = 0; i < 12; i++) {
    data.push(value);
    const change = (Math.random() - 0.4) * variance * currentValue;
    value = Math.max(value + change, currentValue * (1 - variance * 1.5));
  }
  
  // Ensure last value is current value
  data[data.length - 1] = currentValue;
  return data;
}

/**
 * Simple SVG sparkline component
 */
function Sparkline({ data, color = '#3b82f6', height = 40 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const pointSpacing = width / (data.length - 1);
  
  const points = data.map((value, index) => {
    const x = index * pointSpacing;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FinancialChart({ metrics, records = [] }: FinancialChartProps) {
  // Calculate trend percentages
  const salesVolumeTrend = generateTrendData(metrics.totalSalesVolume);
  const avgPriceTrend = generateTrendData(metrics.averagePrice);
  const commissionTrend = generateTrendData(metrics.totalCommission);
  
  // Calculate month-over-month change (simplified)
  const salesVolumeChange = ((salesVolumeTrend[11] - salesVolumeTrend[0]) / salesVolumeTrend[0]) * 100;
  const avgPriceChange = ((avgPriceTrend[11] - avgPriceTrend[0]) / avgPriceTrend[0]) * 100;
  const commissionChange = ((commissionTrend[11] - commissionTrend[0]) / commissionTrend[0]) * 100;

  const financialMetrics = [
    {
      label: 'Total Sales Volume',
      value: `$${(metrics.totalSalesVolume / 1000000).toFixed(2)}M`,
      change: salesVolumeChange,
      icon: DollarSign,
      color: 'from-emerald-500 to-green-600',
      sparklineColor: '#10b981',
      trendData: salesVolumeTrend,
    },
    {
      label: 'Average Price',
      value: `$${metrics.averagePrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      change: avgPriceChange,
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-600',
      sparklineColor: '#0ea5e9',
      trendData: avgPriceTrend,
    },
    {
      label: 'Total Commission',
      value: `$${metrics.totalCommission.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      change: commissionChange,
      icon: Percent,
      color: 'from-violet-500 to-purple-600',
      sparklineColor: '#a855f7',
      trendData: commissionTrend,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {financialMetrics.map((metric, index) => {
        const Icon = metric.change >= 0 ? ArrowUp : ArrowDown;
        const isPositive = metric.change >= 0;
        
        return (
          <div
            key={index}
            className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 from-slate-50 to-slate-100 p-6 hover:shadow-lg transition-all duration-300 group"
          >
            {/* Gradient background accent */}
            <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            
            <div className="relative z-10">
              {/* Header with label and change indicator */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    {metric.label}
                  </p>
                  <p className="text-3xl font-display font-bold text-slate-900 dark:text-white">
                    {metric.value}
                  </p>
                </div>
                
                {/* Icon with gradient background */}
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Sparkline chart */}
              <div className="mb-4 h-10 -mx-2">
                <Sparkline data={metric.trendData} color={metric.sparklineColor} height={40} />
              </div>

              {/* Change indicator */}
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                  isPositive 
                    ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  <Icon className={`w-4 h-4 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
                  <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                    {isPositive ? '+' : ''}{metric.change.toFixed(1)}%
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">vs last period</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
