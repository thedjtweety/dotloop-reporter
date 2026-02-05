import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, TrendingUp, Download, FileText, Grid3x3, List } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [probabilityFilter, setProbabilityFilter] = useState<[number, number]>([0, 100]);

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch = deal.loopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          deal.agent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProbability = deal.probability >= probabilityFilter[0] && deal.probability <= probabilityFilter[1];
    return matchesSearch && matchesProbability;
  });

  const sortedDeals = [...filteredDeals].sort((a, b) => {
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
              {filteredDeals.length} of {totalDealsInPipeline} deals projected to close
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                viewMode === 'cards'
                  ? 'bg-emerald-600 text-white'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
              aria-label="Card view"
              title="Card view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                viewMode === 'table'
                  ? 'bg-emerald-600 text-white'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
              aria-label="Table view"
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-slate-700" />
            <button
              onClick={() => exportForecastAsPDF(timeframe, sortedDeals, {
                totalDeals: filteredDeals.length,
                avgProbability: avgProbability,
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
                totalDeals: filteredDeals.length,
                avgProbability: avgProbability,
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
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{filteredDeals.length}</p>
              <p className="text-xs text-slate-500 mt-1">
                {Math.round((filteredDeals.length / totalDealsInPipeline) * 100)}% of pipeline
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

          {/* Filter Controls - Only show in table view */}
          {viewMode === 'table' && (
            <div className="mb-4 space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Search by Loop Name or Agent</label>
                <input
                  type="text"
                  placeholder="Type to search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-2 block">
                  Probability Range: {probabilityFilter[0]}% - {probabilityFilter[1]}%
                </label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={probabilityFilter[0]}
                      onChange={(e) => setProbabilityFilter([parseInt(e.target.value), probabilityFilter[1]])}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">Min: {probabilityFilter[0]}%</p>
                  </div>
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={probabilityFilter[1]}
                      onChange={(e) => setProbabilityFilter([probabilityFilter[0], parseInt(e.target.value)])}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">Max: {probabilityFilter[1]}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {/* Deals View */}
          {viewMode === 'table' ? (
            // Table View
            <div className="border border-slate-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 border-b border-slate-700">
                      <th className="px-4 py-3 text-left text-slate-300 font-semibold">Loop Name</th>
                      <th className="px-4 py-3 text-left text-slate-300 font-semibold">Agent</th>
                      <th className="px-4 py-3 text-right text-slate-300 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => setSortBy('probability')} title="Click to sort">Probability</th>
                      <th className="px-4 py-3 text-right text-slate-300 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => setSortBy('price')} title="Click to sort">Price</th>
                      <th className="px-4 py-3 text-right text-slate-300 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => setSortBy('commission')} title="Click to sort">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDeals.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                          No deals match your filters
                        </td>
                      </tr>
                    ) : (
                      sortedDeals.map((deal) => (
                        <tr key={deal.id} className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 text-white">{deal.loopName}</td>
                          <td className="px-4 py-3 text-slate-300">{deal.agent}</td>
                          <td className="px-4 py-3 text-right">
                            <Badge className={`${getProbabilityColor(deal.probability)} border-0`}>
                              {deal.probability}%
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right text-white">{formatCurrency(deal.price)}</td>
                          <td className="px-4 py-3 text-right text-emerald-400 font-semibold">{formatCurrency(deal.commission)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // Card View
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
          )}

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
