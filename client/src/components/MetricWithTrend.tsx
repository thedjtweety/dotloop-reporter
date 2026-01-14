import { ReactNode } from 'react';
import Sparkline from './Sparkline';
import { SparklineTrend, getTrendArrow, getTrendColor } from '@/lib/sparklineUtils';
import { Card } from '@/components/ui/card';

interface MetricWithTrendProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
  trend?: SparklineTrend;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

export default function MetricWithTrend({
  title,
  value,
  icon,
  color = 'primary',
  trend,
  subtitle,
  onClick,
  className = ''
}: MetricWithTrendProps) {
  const trendArrow = trend ? getTrendArrow(trend.direction) : null;
  const trendColor = trend ? getTrendColor(trend.direction) : null;

  return (
    <Card
      className={`p-6 cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 ${
        color === 'primary' ? 'border-l-primary' : 
        color === 'accent' ? 'border-l-accent' : 
        'border-l-muted'
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-foreground/70 font-medium mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {trend && trendColor && (
              <div className="flex items-center gap-1">
                <span
                  className="text-lg font-bold"
                  style={{ color: trendColor }}
                >
                  {trendArrow}
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: trendColor }}
                >
                  {trend.percentChange > 0 ? '+' : ''}{trend.percentChange}%
                </span>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-foreground/60 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary ml-4">
            {icon}
          </div>
        )}
      </div>

      {/* Sparkline chart at bottom */}
      {trend && (
        <div className="mt-4 pt-4 border-t border-border">
          <Sparkline trend={trend} width={120} height={32} showLabel={false} />
        </div>
      )}
    </Card>
  );
}
