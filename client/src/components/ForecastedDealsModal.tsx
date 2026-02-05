import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, TrendingUp, Download, FileText, Grid3x3, List, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Pagination logic
  const totalPages = Math.ceil(sortedDeals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDeals = sortedDeals.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filtering changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, probabilityFilter, sortBy]);

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
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6 flex-shrink-0">
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
            <div className="mb-4 space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700 flex-shrink-0">
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
          <div className="flex gap-2 mb-4 flex-wrap items-center flex-shrink-0">
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

          {/* Deals View - Scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {viewMode === 'table' ? (
              // Table View with Sticky Header
              <div className="border border-slate-700 rounded-lg overflow-hidden flex flex-col h-full">
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-800 border-b border-slate-700 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-slate-300 font-semibold">Loop Name</th>
                        <th className="px-4 py-3 text-left text-slate-300 font-semibold">Agent</th>
                        <th className="px-4 py-3 text-left text-slate-300 font-semibold">Probability</th>
                        <th className="px-4 py-3 text-right text-slate-300 font-semibold">Price</th>
                        <th className="px-4 py-3 text-right text-slate-300 font-semibold">Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedDeals.map((deal, idx) => (
                        <tr key={idx} className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 text-slate-200">{deal.loopName}</td>
                          <td className="px-4 py-3 text-slate-400">{deal.agent}</td>
                          <td className="px-4 py-3">
                            <Badge className={getProbabilityColor(deal.probability)}>
                              {deal.probability}% {getProbabilityLabel(deal.probability)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-200">{formatCurrency(deal.price)}</td>
                          <td className="px-4 py-3 text-right text-emerald-400 font-semibold">{formatCurrency(deal.commission)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-slate-800 border-t border-slate-700">
                    <p className="text-sm text-slate-400">
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedDeals.length)} of {sortedDeals.length}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-2 py-1 rounded text-sm transition-colors ${
                              currentPage === page
                                ? 'bg-emerald-600 text-white'
                                : 'hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Card View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedDeals.map((deal, idx) => (
                  <Card key={idx} className="p-4 bg-slate-800 border-slate-700 hover:border-emerald-500/50 transition-colors">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-white truncate">{deal.loopName}</p>
                        <p className="text-xs text-slate-400">{deal.agent}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge className={getProbabilityColor(deal.probability)}>
                          {deal.probability}%
                        </Badge>
                        <span className="text-sm font-semibold text-emerald-400">{formatCurrency(deal.commission)}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        <p>Price: {formatCurrency(deal.price)}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Pagination for Card View */}
          {viewMode === 'cards' && totalPages > 1 && (
            <div className="flex-shrink-0 flex items-center justify-between mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-400">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedDeals.length)} of {sortedDeals.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-2 py-1 rounded text-sm transition-colors ${
                        currentPage === page
                          ? 'bg-emerald-600 text-white'
                          : 'hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  {totalPages > 5 && <span className="text-slate-400">...</span>}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
