/**
 * MetricCard Component
 * Displays key performance indicators with icons and styling
 */

import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color?: 'primary' | 'accent' | 'secondary';
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
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
          {subtitle && (
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
