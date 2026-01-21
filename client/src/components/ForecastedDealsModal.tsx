import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, TrendingUp, Download, FileText } from 'lucide-react';
import { ForecastedDeal } from '@/lib/projectionUtils';
import { formatCurrency, formatPercentage } from '@/lib/formatUtils';
import { exportForecastAsPDF, exportForecastAsCSV } from '@/lib/exportUtils';

interface ForecastedDealsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deals: ForecastedDeal[];
  timeframe: number; // 30, 60, or 90 days
  totalDealsInPipeline: number;
}

export default function ForecastedDealsModal({
  isOpen,
  onClose,
  deals,
  timeframe,
  totalDealsInPipeline,
}: ForecastedDealsModalProps) {
  const [sortBy, setSortBy] = useState<'probability' | 'price' | 'commission'>('probability');

  const sortedDeals = [...deals].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return b.price - a.price;
      case 'commission':
        return b.commission - a.commission;
      case 'probability':
      default:
        return b.probability - a.probability;
    }
  });

  const totalProjectedCommission = deals.reduce((sum, deal) => sum + deal.commission, 0);
  const avgProbability = deals.length > 0 ? Math.round(deals.reduce((sum, deal) => sum + deal.probability, 0) / deals.length) : 0;

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return 'bg-green-500/20 text-green-700 dark:text-green-400';
    if (probability >= 40) return 'bg-amber-500/20 text-amber-700 dark:text-amber-400';
    return 'bg-red-500/20 text-red-700 dark:text-red-400';
  };

  const getProbabilityLabel = (probability: number) => {
    if (probability >= 70) return 'High';
    if (probability >= 40) return 'Medium';
    return 'Low';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !overflow-y-auto !rounded-none !p-0 !m-0 !bg-background/95 !backdrop-blur-sm !border-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !grid-cols-1">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4 border-b px-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                Forecasted Deals - {timeframe} Days
              </DialogTitle>
              <p className="text-sm text-foreground/70 mt-1">
                {deals.length} of {totalDealsInPipeline} deals projected to close
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content wrapper with padding */}
        <div className="px-6 pb-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <p className="text-sm text-foreground/70 mb-1">Projected Deals</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{deals.length}</p>
            <p className="text-xs text-foreground/60 mt-1">
              {Math.round((deals.length / totalDealsInPipeline) * 100)}% of pipeline
            </p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <p className="text-sm text-foreground/70 mb-1">Avg Probability</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{avgProbability}%</p>
            <p className="text-xs text-foreground/60 mt-1">Confidence level</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <p className="text-sm text-foreground/70 mb-1">Projected Commission</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(totalProjectedCommission)}
            </p>
            <p className="text-xs text-foreground/60 mt-1">Total GCI</p>
          </Card>
        </div>

        {/* Sort and Export Controls */}
        <div className="flex gap-2 mb-4 flex-wrap items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'probability' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('probability')}
            >
              Sort by Probability
            </Button>
            <Button
              variant={sortBy === 'price' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('price')}
            >
              Sort by Price
            </Button>
            <Button
              variant={sortBy === 'commission' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('commission')}
            >
              Sort by Commission
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportForecastAsPDF(timeframe, sortedDeals, {
                totalDeals: deals.length,
                avgProbability: avgProbability / 100,
                projectedCommission: totalProjectedCommission,
                pipelineCount: totalDealsInPipeline,
              })}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportForecastAsCSV(timeframe, sortedDeals, {
                totalDeals: deals.length,
                avgProbability: avgProbability / 100,
                projectedCommission: totalProjectedCommission,
                pipelineCount: totalDealsInPipeline,
              })}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Deals List */}
        <div className="space-y-3">
          {sortedDeals.length === 0 ? (
            <Card className="p-8 text-center bg-muted/50">
              <p className="text-foreground/70">No deals projected to close in this timeframe</p>
            </Card>
          ) : (
            sortedDeals.map((deal) => (
              <Card
                key={deal.id}
                className="p-4 hover:shadow-md transition-shadow border-l-4"
                style={{
                  borderLeftColor:
                    deal.status === 'high'
                      ? '#10b981'
                      : deal.status === 'medium'
                        ? '#f59e0b'
                        : '#ef4444',
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{deal.loopName}</h3>
                    <p className="text-sm text-foreground/70">Agent: {deal.agent}</p>
                  </div>
                  <Badge className={`${getProbabilityColor(deal.probability)} border-0`}>
                    {deal.probability}% • {getProbabilityLabel(deal.probability)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-foreground/60">List Price</p>
                    <p className="font-semibold text-foreground">{formatCurrency(deal.price)}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60">Commission</p>
                    <p className="font-semibold text-foreground">{formatCurrency(deal.commission)}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60">Days in Contract</p>
                    <p className="font-semibold text-foreground">{deal.daysInContract} days</p>
                  </div>
                  <div>
                    <p className="text-foreground/60">Expected Close</p>
                    <p className="font-semibold text-foreground">
                      {deal.expectedCloseDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Probability Indicator */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        deal.status === 'high'
                          ? 'bg-green-500'
                          : deal.status === 'medium'
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${deal.probability}%` }}
                    />
                  </div>
                  <span className="text-xs text-foreground/60 w-8 text-right">{deal.probability}%</span>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-foreground/70">
              <p className="font-semibold text-foreground mb-1">How we calculate probability:</p>
              <ul className="space-y-1 text-xs">
                <li>• Base rate: Historical close rate for similar deals</li>
                <li>• Days in contract: Deals in contract longer are more likely to close</li>
                <li>• Deal complexity: High-value deals may have slightly lower probability</li>
              </ul>
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
