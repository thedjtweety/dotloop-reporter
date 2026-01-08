/**
 * MetricCard Component
 * Displays key performance indicators with icons and styling
 */

import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { MetricTrend } from '@/lib/csvParser';
import { formatPercentage } from '@/lib/formatUtils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color?: 'primary' | 'accent' | 'secondary';
  trend?: MetricTrend;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
}: MetricCardProps) {
  const colorClasses = {
    primary: 'bg-blue-50 text-primary',
    accent: 'bg-green-50 text-accent',
    secondary: 'bg-purple-50 text-purple-600',
  };

  return (
    <Card className="p-6 bg-card border border-border hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium mb-2">
            {title}
          </p>
          <p className="text-3xl font-display font-bold text-foreground">
            {value}
          </p>
          {trend ? (
            <div className="flex items-center gap-2 mt-2">
              <div className={`flex items-center text-xs font-medium ${
                trend.direction === 'up' ? 'text-green-600' : 
                trend.direction === 'down' ? 'text-red-600' : 
                'text-muted-foreground'
              }`}>
                {trend.direction === 'up' && <ArrowUpRight className="w-3 h-3 mr-1" />}
                {trend.direction === 'down' && <ArrowDownRight className="w-3 h-3 mr-1" />}
                {trend.direction === 'neutral' && <Minus className="w-3 h-3 mr-1" />}
                {formatPercentage(trend.value)}
              </div>
              <p className="text-xs text-muted-foreground">vs previous period</p>
            </div>
          ) : subtitle && (
            <p className="text-xs text-muted-foreground mt-2">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
