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
      <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4 border-b">
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

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Card className="p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <p className="text-sm text-foreground/70 mb-2">Projected Deals</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{deals.length}</p>
            <p className="text-xs text-foreground/60 mt-2">
              {Math.round((deals.length / totalDealsInPipeline) * 100)}% of pipeline
            </p>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <p className="text-sm text-foreground/70 mb-2">Avg Probability</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{avgProbability}%</p>
            <p className="text-xs text-foreground/60 mt-2">Confidence level</p>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <p className="text-sm text-foreground/70 mb-2">Projected Commission</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(totalProjectedCommission)}
            </p>
            <p className="text-xs text-foreground/60 mt-2">Total GCI</p>
          </Card>
        </div>

        {/* Sort and Export Controls */}
        <div className="flex gap-3 mb-6 flex-wrap items-center justify-between">
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
              onClick={() => exportForecastAsPDF(timeframe, deals, {
                totalDeals: deals.length,
                avgProbability: avgProbability,
                projectedCommission: totalProjectedCommission,
                pipelineCount: totalDealsInPipeline,
              })}
            >
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportForecastAsCSV(timeframe, deals, {
                totalDeals: deals.length,
                avgProbability: avgProbability,
                projectedCommission: totalProjectedCommission,
                pipelineCount: totalDealsInPipeline,
              })}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Deals List */}
        <div className="space-y-4">
          {sortedDeals.map((deal, idx) => (
            <div key={idx} className="border-l-4 border-orange-500 bg-slate-900/50 p-5 rounded-lg hover:bg-slate-800/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{deal.address}</h3>
                  <p className="text-sm text-foreground/60">Agent: {deal.agent}</p>
                </div>
                <Badge className={getProbabilityColor(deal.probability)}>
                  {deal.probability}% • {getProbabilityLabel(deal.probability)}
                </Badge>
              </div>

              {/* Deal Details Grid - 5 columns for better spacing */}
              <div className="grid grid-cols-5 gap-6 mb-4">
                <div>
                  <p className="text-xs text-foreground/60 mb-1">List Price</p>
                  <p className="font-semibold text-base">{formatCurrency(deal.price)}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground/60 mb-1">Commission</p>
                  <p className="font-semibold text-base">{formatCurrency(deal.commission)}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground/60 mb-1">Days in Contract</p>
                  <p className="font-semibold text-base">{deal.daysInContract}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground/60 mb-1">Expected Close</p>
                  <p className="font-semibold text-base">{typeof deal.expectedCloseDate === 'string' ? deal.expectedCloseDate : deal.expectedCloseDate?.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground/60 mb-1">Probability</p>
                  <p className="font-semibold text-base">{deal.probability}%</p>
                </div>
              </div>

              {/* Probability Bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all"
                    style={{ width: `${deal.probability}%` }}
                  />
                </div>
                <span className="text-sm text-foreground/70 font-medium w-10 text-right">{deal.probability}%</span>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
