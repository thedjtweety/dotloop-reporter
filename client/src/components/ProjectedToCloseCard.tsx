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

import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target, DollarSign, Download, FileText, BarChart3, Eye } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatUtils';
import {
  calculateProjectedToClose,
  calculateHistoricalCloseRate,
  calculateForecastedDeals,
  ProjectionMetrics,
} from '@/lib/projectionUtils';
import { DotloopRecord } from '@/lib/csvParser';
import ForecastedDealsModal from './ForecastedDealsModal';
import ForecastAccuracyDashboard from './ForecastAccuracyDashboard';
import { exportForecastAsPDF, exportForecastAsCSV } from '@/lib/exportUtils';

interface ProjectedToCloseCardProps {
  records: DotloopRecord[];
}

export default function ProjectedToCloseCard({ records }: ProjectedToCloseCardProps) {
  const [, setLocation] = useLocation();
  const [selectedTimeframe, setSelectedTimeframe] = useState<30 | 60 | 90>(30);
  const [showDealsModal, setShowDealsModal] = useState(false);
  const [showAccuracyDashboard, setShowAccuracyDashboard] = useState(false);

  // Handle navigation to full-screen forecasted deals page
  const handleViewFullScreen = () => {
    sessionStorage.setItem('forecastedDealsRecords', JSON.stringify(records));
    sessionStorage.setItem('forecastedDaysForecast', selectedTimeframe.toString());
    setLocation('/forecasted-deals');
  };

  // Get under contract deals
  const underContractDeals = useMemo(
    () =>
      records.filter(
        r =>
          r.loopStatus?.toLowerCase().includes('contract') ||
          r.loopStatus?.toLowerCase().includes('pending')
      ),
    [records]
  );

  // Calculate historical close rate
  const historicalCloseRate = useMemo(
    () => calculateHistoricalCloseRate(records),
    [records]
  );

  // Calculate average days to close
  const avgDaysToClose = useMemo(() => {
    const closedDeals = records.filter(r => 
      r.loopStatus?.toLowerCase().includes('closed') || 
      r.loopStatus?.toLowerCase().includes('sold')
    );
    
    if (closedDeals.length === 0) return 60; // Default to 60 days
    
    const totalDays = closedDeals.reduce((sum, deal) => {
      if (!deal.contractDate || !deal.closingDate) return sum;
      const days = Math.floor(
        (new Date(deal.closingDate).getTime() - new Date(deal.contractDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + Math.max(0, days);
    }, 0);
    
    return Math.round(totalDays / closedDeals.length);
  }, [records]);

  // Calculate all projections using useMemo
  const projections = useMemo(() => {
    const proj30 = calculateProjectedToClose(underContractDeals, historicalCloseRate, 30);
    const proj60 = calculateProjectedToClose(underContractDeals, historicalCloseRate, 60);
    const proj90 = calculateProjectedToClose(underContractDeals, historicalCloseRate, 90);

    return {
      30: proj30,
      60: proj60,
      90: proj90,
    };
  }, [underContractDeals, historicalCloseRate]);

  // Calculate forecasted deals for current timeframe
  const forecastedDeals = useMemo(() => {
    return calculateForecastedDeals(underContractDeals, historicalCloseRate, avgDaysToClose, selectedTimeframe);
  }, [underContractDeals, historicalCloseRate, avgDaysToClose, selectedTimeframe]);

  // Get current projection based on selected timeframe
  const current = projections[selectedTimeframe];

  // Calculate confidence level display
  const confidenceColor =
    current.confidenceLevel >= 80
      ? 'text-green-600 dark:text-green-400'
      : current.confidenceLevel >= 60
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';

  return (
    <>
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

          {/* Timeframe Selector - Using simple buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSelectedTimeframe(30)}
              className={`py-2 px-3 rounded-lg font-medium transition-all ${
                selectedTimeframe === 30
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setSelectedTimeframe(60)}
              className={`py-2 px-3 rounded-lg font-medium transition-all ${
                selectedTimeframe === 60
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              60 Days
            </button>
            <button
              onClick={() => setSelectedTimeframe(90)}
              className={`py-2 px-3 rounded-lg font-medium transition-all ${
                selectedTimeframe === 90
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              90 Days
            </button>
          </div>

          {/* Projection Display */}
          <ProjectionDisplay 
            projection={current} 
            onViewDeals={handleViewFullScreen}
          />

          {/* Footer with confidence level and export buttons */}
          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
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
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAccuracyDashboard(!showAccuracyDashboard)}
                className="gap-2 flex-1"
              >
                <BarChart3 className="w-4 h-4" />
                {showAccuracyDashboard ? 'Hide' : 'View'} Accuracy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportForecastAsPDF(selectedTimeframe, forecastedDeals, {
                  totalDeals: forecastedDeals.length,
                  avgProbability: historicalCloseRate / 100,
                  projectedCommission: current.projectedCommission,
                  pipelineCount: underContractDeals.length,
                })}
                className="gap-2 flex-1"
              >
                <FileText className="w-4 h-4" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportForecastAsCSV(selectedTimeframe, forecastedDeals, {
                  totalDeals: forecastedDeals.length,
                  avgProbability: historicalCloseRate / 100,
                  projectedCommission: current.projectedCommission,
                  pipelineCount: underContractDeals.length,
                })}
                className="gap-2 flex-1"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Accuracy Dashboard */}
      {showAccuracyDashboard && (
        <Card className="mt-6 p-6 bg-card border border-border">
          <h3 className="text-lg font-display font-bold text-foreground mb-4">Forecast Accuracy Tracking</h3>
          <ForecastAccuracyDashboard metrics={null} isLoading={false} />
        </Card>
      )}

      {/* Forecasted Deals Modal */}
      <ForecastedDealsModal
        isOpen={showDealsModal}
        onClose={() => setShowDealsModal(false)}
        deals={forecastedDeals}
        timeframe={selectedTimeframe}
        totalDealsInPipeline={underContractDeals.length}
      />
    </>
  );
}

/**
 * Projection Display Sub-component
 */
function ProjectionDisplay({ 
  projection, 
  onViewDeals 
}: { 
  projection: ProjectionMetrics;
  onViewDeals: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Projected Deals - Clickable */}
      <button
        onClick={onViewDeals}
        className="p-4 rounded-lg bg-muted/50 dark:bg-muted/30 hover:bg-muted/70 dark:hover:bg-muted/50 transition-colors text-left cursor-pointer group"
      >
        <p className="text-xs text-foreground mb-2 font-medium">Projected Deals</p>
        <p className="text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
          {formatNumber(projection.projectedClosedDeals)}
        </p>
        <p className="text-xs text-foreground mt-1">
          of {formatNumber(Math.ceil(projection.projectedClosedDeals / (projection.baselineCloseRate / 100)))} in pipeline
        </p>
        <p className="text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          Click to view deals →
        </p>
      </button>

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
