/**
 * Revenue Overview Component
 * Displays key financial metrics in a horizontal stacked layout
 * Shows Total Sales Volume, Average Price, and Total Commission
 */

import { TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/formatUtils';

interface RevenueOverviewProps {
  totalVolume: number;
  averagePrice: number;
  totalCommission: number;
  volumeChange?: number;
  priceChange?: number;
  commissionChange?: number;
}

export default function RevenueOverview({
  totalVolume,
  averagePrice,
  totalCommission,
  volumeChange = 0,
  priceChange = 0,
  commissionChange = 0,
}: RevenueOverviewProps) {
  const metrics = [
    {
      label: 'Total Sales Volume',
      value: formatCurrency(totalVolume),
      change: volumeChange,
      color: 'from-emerald-500 to-teal-600',
      accentColor: 'text-emerald-400',
    },
    {
      label: 'Average Price',
      value: formatCurrency(averagePrice),
      change: priceChange,
      color: 'from-blue-500 to-cyan-600',
      accentColor: 'text-blue-400',
    },
    {
      label: 'Total Commission',
      value: formatCurrency(totalCommission),
      change: commissionChange,
      color: 'from-purple-500 to-pink-600',
      accentColor: 'text-purple-400',
    },
  ];

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-emerald-500" />
        Revenue Overview
      </h2>

      {/* Full-Width Vertical Layout - Desktop */}
      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <Card
            key={index}
            className="relative overflow-hidden p-6 border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:from-slate-800/70 hover:to-slate-900/70 transition-all duration-300 group"
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${metric.color}`} />

            {/* Content */}
            <div className="relative z-10 space-y-4">
              <h3 className="text-sm font-medium text-foreground/70 uppercase tracking-wider">
                {metric.label}
              </h3>

              <div className="space-y-2">
                <p className={`text-3xl md:text-4xl font-bold ${metric.accentColor}`}>
                  {metric.value}
                </p>

                {metric.change !== 0 && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className={`w-4 h-4 ${metric.change > 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                    <span className={`text-sm font-semibold ${metric.change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </span>
                    <span className="text-xs text-foreground/50">vs last period</span>
                  </div>
                )}
              </div>
            </div>

            {/* Hover Border Effect */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${metric.color} rounded-lg`} style={{ pointerEvents: 'none' }} />
          </Card>
        ))}
      </div>

      {/* Vertical Stack Layout - Tablet */}
      <div className="hidden md:grid lg:hidden grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <Card
            key={index}
            className="relative overflow-hidden p-5 border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:from-slate-800/70 hover:to-slate-900/70 transition-all duration-300 group"
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${metric.color}`} />

            {/* Content */}
            <div className="relative z-10 space-y-3">
              <h3 className="text-xs font-medium text-foreground/70 uppercase tracking-wider">
                {metric.label}
              </h3>

              <div className="space-y-2">
                <p className={`text-2xl md:text-3xl font-bold ${metric.accentColor}`}>
                  {metric.value}
                </p>

                {metric.change !== 0 && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className={`w-3 h-3 ${metric.change > 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                    <span className={`text-xs font-semibold ${metric.change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </span>
                    <span className="text-xs text-foreground/50">vs last</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Full Vertical Stack - Mobile */}
      <div className="md:hidden space-y-3">
        {metrics.map((metric, index) => (
          <Card
            key={index}
            className="relative overflow-hidden p-4 border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:from-slate-800/70 hover:to-slate-900/70 transition-all duration-300"
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${metric.color}`} />

            {/* Content */}
            <div className="relative z-10 space-y-2">
              <h3 className="text-xs font-medium text-foreground/70 uppercase tracking-wider">
                {metric.label}
              </h3>

              <div className="space-y-1">
                <p className={`text-2xl font-bold ${metric.accentColor}`}>
                  {metric.value}
                </p>

                {metric.change !== 0 && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className={`w-3 h-3 ${metric.change > 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                    <span className={`text-xs font-semibold ${metric.change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
