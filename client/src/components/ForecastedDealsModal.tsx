import { useState } from 'react';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-0">
      {/* Modal Container - Full screen width */}
      <div className="w-screen h-screen max-w-none bg-slate-900 rounded-none flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-display font-semibold text-white">
              Forecasted Deals - {timeframe} Days
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {deals.length} of {totalDealsInPipeline} deals projected to close
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportForecastAsPDF(timeframe, sortedDeals, {
                totalDeals: deals.length,
                avgProbability: avgProbability / 100,
                projectedCommission: totalProjectedCommission,
                pipelineCount: totalDealsInPipeline,
              })}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white flex items-center gap-2 text-sm"
              aria-label="Export as PDF"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={() => exportForecastAsCSV(timeframe, sortedDeals, {
                totalDeals: deals.length,
                avgProbability: avgProbability / 100,
                projectedCommission: totalProjectedCommission,
                pipelineCount: totalDealsInPipeline,
              })}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white flex items-center gap-2 text-sm"
              aria-label="Export as CSV"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <p className="text-sm text-slate-400 mb-1">Projected Deals</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{deals.length}</p>
              <p className="text-xs text-slate-500 mt-1">
                {Math.round((deals.length / totalDealsInPipeline) * 100)}% of pipeline
              </p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <p className="text-sm text-slate-400 mb-1">Avg Probability</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{avgProbability}%</p>
              <p className="text-xs text-slate-500 mt-1">Confidence level</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <p className="text-sm text-slate-400 mb-1">Projected Commission</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(totalProjectedCommission)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total GCI</p>
            </Card>
          </div>

          {/* Sort Controls */}
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            <Button
              variant={sortBy === 'probability' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('probability')}
              className={sortBy === 'probability' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-slate-600 text-slate-300 hover:bg-slate-800'}
            >
              Sort by Probability
            </Button>
            <Button
              variant={sortBy === 'price' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('price')}
              className={sortBy === 'price' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-slate-600 text-slate-300 hover:bg-slate-800'}
            >
              Sort by Price
            </Button>
            <Button
              variant={sortBy === 'commission' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('commission')}
              className={sortBy === 'commission' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-slate-600 text-slate-300 hover:bg-slate-800'}
            >
              Sort by Commission
            </Button>
          </div>

          {/* Deals List */}
          <div className="space-y-3">
            {sortedDeals.length === 0 ? (
              <Card className="p-8 text-center bg-slate-800/50 border-slate-700">
                <p className="text-slate-400">No deals projected to close in this timeframe</p>
              </Card>
            ) : (
              sortedDeals.map((deal) => (
                <Card
                  key={deal.id}
                  className="p-4 hover:shadow-md transition-shadow border-l-4 bg-slate-800/50 border-slate-700"
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
                      <h3 className="font-semibold text-white">{deal.loopName}</h3>
                      <p className="text-sm text-slate-400">Agent: {deal.agent}</p>
                    </div>
                    <Badge className={`${getProbabilityColor(deal.probability)} border-0`}>
                      {deal.probability}% • {getProbabilityLabel(deal.probability)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">List Price</p>
                      <p className="font-semibold text-white">{formatCurrency(deal.price)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Commission</p>
                      <p className="font-semibold text-white">{formatCurrency(deal.commission)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Days in Contract</p>
                      <p className="font-semibold text-white">{deal.daysInContract} days</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Expected Close</p>
                      <p className="font-semibold text-white">
                        {deal.expectedCloseDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Probability Indicator */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
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
                    <span className="text-xs text-slate-500 w-8 text-right">{deal.probability}%</span>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Footer Info */}
          <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-slate-400">
                <p className="font-semibold text-white mb-1">How we calculate probability:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Base rate: Historical close rate for similar deals</li>
                  <li>• Days in contract: Deals in contract longer are more likely to close</li>
                  <li>• Deal complexity: High-value deals may have slightly lower probability</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-700 bg-slate-800 flex items-center justify-end">
          <Button 
            onClick={onClose}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
