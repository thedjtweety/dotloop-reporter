import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DotloopRecord } from '@/lib/csvParser';
import { calculateForecastedDeals, ForecastedDeal } from '@/lib/projectionUtils';
import { exportForecastAsPDF, exportForecastAsCSV } from '@/lib/exportUtils';
import { formatCurrency, formatNumber } from '@/lib/formatUtils';

export default function ForecastedDealsPage() {
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState<'probability' | 'price' | 'commission'>('probability');
  
  // Get records from sessionStorage (passed from Home component)
  const records = useMemo(() => {
    try {
      const stored = sessionStorage.getItem('forecastedDealsRecords');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);
  
  const daysToForecast = useMemo(() => {
    try {
      const stored = sessionStorage.getItem('forecastedDaysForecast');
      return stored ? parseInt(stored) : 30;
    } catch {
      return 30;
    }
  }, []);

  // Calculate historical metrics
  const metrics = useMemo(() => {
    const closed = records.filter((r: DotloopRecord) => r.loopStatus?.toLowerCase().includes('closed') || r.loopStatus?.toLowerCase().includes('sold'));
    const closeRate = records.length > 0 ? closed.length / records.length : 0;
    const avgDaysToClose = closed.length > 0 
      ? closed.reduce((sum: number, r: DotloopRecord) => sum + (r.daysToClose || 0), 0) / closed.length 
      : 30;
    return { closeRate, avgDaysToClose };
  }, [records]);

  // Calculate forecasted deals
  const forecastedDeals = useMemo(() => {
    const underContract = records.filter((r: DotloopRecord) => r.loopStatus?.toLowerCase().includes('contract') || r.loopStatus?.toLowerCase().includes('pending'));
    return calculateForecastedDeals(underContract, metrics.closeRate, metrics.avgDaysToClose, daysToForecast);
  }, [records, daysToForecast, metrics]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const avgProbability = forecastedDeals.length > 0 
      ? forecastedDeals.reduce((sum, d) => sum + d.probability, 0) / forecastedDeals.length 
      : 0;
    const totalCommission = forecastedDeals.reduce((sum, d) => sum + (d.commission || 0), 0);
    
    return {
      totalDeals: forecastedDeals.length,
      avgProbability,
      projectedCommission: totalCommission,
      pipelineCount: records.length
    };
  }, [forecastedDeals, records]);

  // Sort deals based on selected sort option
  const sortedDeals = useMemo(() => {
    const sorted = [...forecastedDeals];
    switch (sortBy) {
      case 'price':
        return sorted.sort((a, b) => (b.listPrice || 0) - (a.listPrice || 0));
      case 'commission':
        return sorted.sort((a, b) => (b.commission || 0) - (a.commission || 0));
      case 'probability':
      default:
        return sorted.sort((a, b) => b.probability - a.probability);
    }
  }, [forecastedDeals, sortBy]);

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'border-l-green-500 bg-green-500/5';
    if (probability >= 60) return 'border-l-blue-500 bg-blue-500/5';
    if (probability >= 40) return 'border-l-amber-500 bg-amber-500/5';
    return 'border-l-red-500 bg-red-500/5';
  };

  const getProbabilityBadgeColor = (probability: number) => {
    if (probability >= 80) return 'bg-green-500/20 text-green-400';
    if (probability >= 60) return 'bg-blue-500/20 text-blue-400';
    if (probability >= 40) return 'bg-amber-500/20 text-amber-400';
    return 'bg-red-500/20 text-red-400';
  };

  const getProbabilityLabel = (probability: number) => {
    if (probability >= 80) return 'High';
    if (probability >= 60) return 'Medium-High';
    if (probability >= 40) return 'Medium';
    return 'Low';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Forecasted Deals</h1>
              <p className="text-sm text-foreground/70">{daysToForecast} Days Forecast</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportForecastAsPDF(daysToForecast, forecastedDeals, summary)}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportForecastAsCSV(daysToForecast, forecastedDeals, summary)}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <div className="space-y-2">
              <p className="text-sm text-foreground/70">Projected Deals</p>
              <p className="text-4xl font-bold text-emerald-400">{formatNumber(forecastedDeals.length)}</p>
              <p className="text-xs text-foreground/50">100% of pipeline</p>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <div className="space-y-2">
              <p className="text-sm text-foreground/70">Avg Probability</p>
              <p className="text-4xl font-bold text-blue-400">{summary.avgProbability.toFixed(0)}%</p>
              <p className="text-xs text-foreground/50">Confidence level</p>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <div className="space-y-2">
              <p className="text-sm text-foreground/70">Projected Commission</p>
              <p className="text-3xl font-bold text-purple-400">{formatCurrency(summary.projectedCommission)}</p>
              <p className="text-xs text-foreground/50">Total GCI</p>
            </div>
          </Card>
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2 mb-6">
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

        {/* Deals List */}
        <div className="space-y-4">
          {sortedDeals.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-foreground/70">No forecasted deals for this timeframe</p>
            </Card>
          ) : (
            sortedDeals.map((deal, index) => (
              <Card
                key={`${deal.address}-${index}`}
                className={`p-6 border-l-4 transition-all hover:shadow-lg ${getProbabilityColor(deal.probability)}`}
              >
                <div className="space-y-4">
                  {/* Deal Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{deal.address}</h3>
                      <p className="text-sm text-foreground/70">Agent: {deal.agent || 'Unknown'}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getProbabilityBadgeColor(deal.probability)}`}>
                      {deal.probability.toFixed(0)}% • {getProbabilityLabel(deal.probability)}
                    </div>
                  </div>

                  {/* Deal Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-foreground/70 mb-1">List Price</p>
                      <p className="text-lg font-semibold text-foreground">{formatCurrency(deal.listPrice || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground/70 mb-1">Commission</p>
                      <p className="text-lg font-semibold text-foreground">{formatCurrency(deal.commission || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground/70 mb-1">Days in Contract</p>
                      <p className="text-lg font-semibold text-foreground">{deal.daysInContract || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground/70 mb-1">Expected Close</p>
                      <p className="text-lg font-semibold text-foreground">{deal.expectedCloseDate?.toLocaleDateString?.() || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground/70 mb-1">Probability</p>
                      <p className="text-lg font-semibold text-foreground">{deal.probability.toFixed(0)}%</p>
                    </div>
                  </div>

                  {/* Probability Bar */}
                  <div className="space-y-1">
                    <div className="flex h-2 w-full rounded-full bg-background overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-emerald-500 transition-all"
                        style={{ width: `${deal.probability}%` }}
                      />
                      <div className="flex-1 bg-foreground/10" />
                    </div>
                    <p className="text-xs text-foreground/50 text-right">{deal.probability.toFixed(0)}% probability</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
