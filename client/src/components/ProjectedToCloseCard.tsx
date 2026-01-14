/**
 * Projected to Close Card Component
 * 
 * Displays forecasted deals and revenue for 30/60/90 days based on:
 * - Current pipeline (under contract deals)
 * - Historical close rate
 * - Average commission per deal
 * 
 * CTE-inspired feature for forecasting future performance
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Target, DollarSign } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatUtils';
import {
  calculateProjectedToClose,
  calculateHistoricalCloseRate,
  ProjectionMetrics,
} from '@/lib/projectionUtils';
import { DotloopRecord } from '@/lib/csvParser';

interface ProjectedToCloseCardProps {
  records: DotloopRecord[];
}

export default function ProjectedToCloseCard({ records }: ProjectedToCloseCardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<30 | 60 | 90>(30);

  // Get under contract deals
  const underContractDeals = records.filter(
    r =>
      r.loopStatus?.toLowerCase().includes('contract') ||
      r.loopStatus?.toLowerCase().includes('pending')
  );

  // Calculate historical close rate
  const historicalCloseRate = calculateHistoricalCloseRate(records);

  // Calculate projections for different timeframes
  const projection30 = calculateProjectedToClose(underContractDeals, historicalCloseRate, 30);
  const projection60 = calculateProjectedToClose(underContractDeals, historicalCloseRate, 60);
  const projection90 = calculateProjectedToClose(underContractDeals, historicalCloseRate, 90);

  const projections: Record<30 | 60 | 90, ProjectionMetrics> = {
    30: projection30,
    60: projection60,
    90: projection90,
  };

  const current = projections[selectedTimeframe];

  // Calculate confidence level display
  const confidenceColor =
    current.confidenceLevel >= 80
      ? 'text-green-600 dark:text-green-400'
      : current.confidenceLevel >= 60
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';

  return (
    <Card className="p-6 bg-card border border-border">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 dark:bg-blue-500/30 flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-foreground">
                Projected to Close
              </h3>
              <p className="text-sm text-foreground">
                {underContractDeals.length} deals in pipeline
              </p>
            </div>
          </div>
        </div>

        {/* Timeframe Selector */}
        <Tabs value={selectedTimeframe.toString()} onValueChange={(v) => setSelectedTimeframe(parseInt(v) as 30 | 60 | 90)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="30">30 Days</TabsTrigger>
            <TabsTrigger value="60">60 Days</TabsTrigger>
            <TabsTrigger value="90">90 Days</TabsTrigger>
          </TabsList>

          {/* 30 Days */}
          <TabsContent value="30" className="space-y-4 mt-4">
            <ProjectionDisplay projection={projection30} />
          </TabsContent>

          {/* 60 Days */}
          <TabsContent value="60" className="space-y-4 mt-4">
            <ProjectionDisplay projection={projection60} />
          </TabsContent>

          {/* 90 Days */}
          <TabsContent value="90" className="space-y-4 mt-4">
            <ProjectionDisplay projection={projection90} />
          </TabsContent>
        </Tabs>

        {/* Footer with confidence level */}
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">
              Close Rate: {historicalCloseRate}%
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-foreground mb-1">Confidence</p>
            <p className={`text-sm font-bold ${confidenceColor}`}>
              {current.confidenceLevel}%
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Projection Display Sub-component
 */
function ProjectionDisplay({ projection }: { projection: ProjectionMetrics }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Projected Deals */}
      <div className="p-4 rounded-lg bg-muted/50 dark:bg-muted/30">
        <p className="text-xs text-foreground mb-2 font-medium">Projected Deals</p>
        <p className="text-2xl font-display font-bold text-foreground">
          {formatNumber(projection.projectedClosedDeals)}
        </p>
        <p className="text-xs text-foreground mt-1">
          of {formatNumber(Math.ceil(projection.projectedClosedDeals / (projection.baselineCloseRate / 100)))} in pipeline
        </p>
      </div>

      {/* Projected Revenue */}
      <div className="p-4 rounded-lg bg-green-500/10 dark:bg-green-500/20">
        <p className="text-xs text-foreground mb-2 font-medium flex items-center gap-1">
          <DollarSign className="w-3 h-3" />
          Projected Revenue
        </p>
        <p className="text-2xl font-display font-bold text-green-600 dark:text-green-400">
          {formatCurrency(projection.projectedRevenue)}
        </p>
        <p className="text-xs text-foreground mt-1">
          Avg: {formatCurrency(projection.projectedRevenue / Math.max(1, projection.projectedClosedDeals))} per deal
        </p>
      </div>
    </div>
  );
}
