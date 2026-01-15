/**
 * FinancialChart Component
 * Displays financial summary metrics with trend sparklines
 */

import { DashboardMetrics } from '@/lib/csvParser';
import { TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
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
function Sparkline({ data, color = '#3b82f6', height = 60 }: { data: number[]; color?: string; height?: number }) {
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
        strokeWidth="2.5"
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
      color: 'from-emerald-500 to-green-600',
      sparklineColor: '#10b981',
      trendData: salesVolumeTrend,
    },
    {
      label: 'Average Price',
      value: `$${metrics.averagePrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      change: avgPriceChange,
      color: 'from-blue-500 to-cyan-600',
      sparklineColor: '#0ea5e9',
      trendData: avgPriceTrend,
    },
    {
      label: 'Total Commission',
      value: `$${metrics.totalCommission.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      change: commissionChange,
      color: 'from-violet-500 to-purple-600',
      sparklineColor: '#a855f7',
      trendData: commissionTrend,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      {financialMetrics.map((metric, index) => {
        const isPositive = metric.change >= 0;
        const Icon = isPositive ? ArrowUp : ArrowDown;
        
        return (
          <div
            key={index}
            className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 from-slate-50 to-slate-100 p-4 md:p-6 hover:shadow-lg transition-all duration-300 group flex flex-col h-full min-h-[280px]"
          >
            {/* Gradient background accent */}
            <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            
            <div className="relative z-10 flex flex-col h-full">
              {/* Header with label */}
              <div className="mb-3">
                <p className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  {metric.label}
                </p>
              </div>

              {/* Main value */}
              <div className="mb-4">
                <p className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white leading-tight break-words">
                  {metric.value}
                </p>
              </div>

              {/* Sparkline chart - takes up remaining space */}
              <div className="flex-1 mb-4 flex items-center justify-center min-h-[50px]">
                <Sparkline data={metric.trendData} color={metric.sparklineColor} height={50} />
              </div>

              {/* Change indicator at bottom */}
              <div className="flex items-center gap-2 mt-auto">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs md:text-sm ${
                  isPositive 
                    ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  <Icon className={`w-3 h-3 md:w-4 md:h-4 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
                  <span className={`font-semibold ${isPositive ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                    {isPositive ? '+' : ''}{metric.change.toFixed(1)}%
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">vs last</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
