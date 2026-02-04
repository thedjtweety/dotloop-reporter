import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color: 'primary' | 'accent' | 'success' | 'warning' | 'destructive';
  onClick?: () => void;
  className?: string;
}

const colorClasses = {
  primary: 'bg-blue-500/10 border-blue-500 text-blue-600',
  accent: 'bg-purple-500/10 border-purple-500 text-purple-600',
  success: 'bg-emerald-500/10 border-emerald-500 text-emerald-600',
  warning: 'bg-amber-500/10 border-amber-500 text-amber-600',
  destructive: 'bg-red-500/10 border-red-500 text-red-600',
};

const trendColors = {
  positive: 'text-emerald-500',
  negative: 'text-red-500',
};

/**
 * Professional KPI card with trend indicator
 * Displays key metrics with optional trend data
 */
export function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  color,
  onClick,
  className = '',
}: KPICardProps) {
  const isTrendPositive = trend !== undefined && trend >= 0;
  const trendColor = isTrendPositive ? trendColors.positive : trendColors.negative;
  const TrendIcon = isTrendPositive ? TrendingUp : TrendingDown;

  return (
    <Card
      onClick={onClick}
      className={`
        p-6 border-2 transition-all duration-300 cursor-pointer group
        hover:shadow-lg hover:scale-105
        ${colorClasses[color]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      <div className="space-y-4">
        {/* Header with Icon and Title */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-foreground">{value}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="text-3xl opacity-60 group-hover:opacity-100 transition-opacity">
            {icon}
          </div>
        </div>

        {/* Trend Indicator */}
        {trend !== undefined && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <TrendIcon className={`w-4 h-4 ${trendColor}`} />
            <span className={`text-sm font-medium ${trendColor}`}>
              {isTrendPositive ? '+' : ''}{trend.toFixed(1)}%
            </span>
            {trendLabel && (
              <span className="text-xs text-muted-foreground">{trendLabel}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
