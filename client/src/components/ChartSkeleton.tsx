/**
 * ChartSkeleton Component
 * Loading skeleton animation for charts
 */

import { Card } from '@/components/ui/card';

interface ChartSkeletonProps {
  height?: string;
  showTitle?: boolean;
}

export default function ChartSkeleton({ height = 'h-80', showTitle = true }: ChartSkeletonProps) {
  return (
    <Card className={`p-6 ${height} animate-pulse`}>
      {showTitle && (
        <div className="mb-4">
          <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/4"></div>
        </div>
      )}
      
      <div className="flex items-end justify-between h-full gap-2 pb-8">
        {/* Animated bars */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-gradient-to-t from-muted to-muted/50 rounded-t"
            style={{
              height: `${Math.random() * 60 + 40}%`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-3 bg-muted rounded w-12"></div>
        ))}
      </div>
    </Card>
  );
}
