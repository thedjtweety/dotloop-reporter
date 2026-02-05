/**
 * SalesTimelineChart Component - Enhanced with Comparison, Export, and Filtering
 * Displays sales performance over time with three visualization modes:
 * 1. Chart View - Bar chart with 3-month moving average line
 * 2. Heatmap View - Color-coded grid showing transaction intensity
 * 3. Summary View - Key metrics cards with period list
 * 
 * New Features:
 * - Period Comparison: Compare two periods side-by-side with percentage changes
 * - Export Timeline Reports: Export data as CSV or text report
 * - Advanced Filtering: Search and filter transactions in drill-down modal
 */

import { useState } from 'react';
import { ChartData, DotloopRecord } from '@/lib/csvParser';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BarChart3, Grid3x3, TrendingUp, X, Download, ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { openMultipleInDotloop } from '@/lib/dotloopUtils';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface SalesTimelineChartProps {
  data: ChartData[];
  allRecords?: DotloopRecord[];
  onDataPointClick?: (month: string, records: DotloopRecord[]) => void;
}

type ViewMode = 'chart' | 'heatmap' | 'summary';

export default function SalesTimelineChart({ data, allRecords = [], onDataPointClick }: SalesTimelineChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [selectedPeriod, setSelectedPeriod] = useState<ChartData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState<ChartData | null>(null);

  // Calculate heatmap colors based on value
  const getHeatmapColor = (value: number): string => {
    const max = Math.max(...data.map(d => d.value));
    const min = Math.min(...data.map(d => d.value));
    const range = max - min;
    const normalized = (value - min) / range;

    if (normalized > 0.75) return 'bg-emerald-500 text-white';
    if (normalized > 0.5) return 'bg-emerald-400 text-gray-900';
    if (normalized > 0.25) return 'bg-yellow-400 text-gray-900';
    return 'bg-orange-400 text-gray-900';
  };

  // Calculate summary statistics
  const stats = {
    average: Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length),
    highest: data.reduce((max, d) => (d.value > max.value ? d : max)),
    lowest: data.reduce((min, d) => (d.value < min.value ? d : min)),
    range: Math.max(...data.map(d => d.value)) - Math.min(...data.map(d => d.value)),
  };

  const handlePeriodClick = (period: ChartData) => {
    setSelectedPeriod(period);
    setIsModalOpen(true);
    
    if (onDataPointClick) {
      const periodRecords = allRecords.filter(r => {
        const dateToUse = r.listingDate || r.closingDate;
        if (!dateToUse) return false;
        const date = new Date(dateToUse);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return key === period.label;
      });
      onDataPointClick(period.label, periodRecords);
    }
  };

  // Export as CSV
  const handleExportCSV = () => {
    if (!selectedPeriod) return;
    
    const headers = ['Period', 'Value', 'Moving Average', 'Transactions Count'];
    const rows = [
      [selectedPeriod.label, selectedPeriod.value, selectedPeriod.movingAverage || 0, 'N/A']
    ];
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-report-${selectedPeriod.label}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as Report
  const handleExportReport = () => {
    if (!selectedPeriod) return;
    
    const content = `
Timeline Report - ${selectedPeriod.label}
Generated: ${new Date().toLocaleDateString()}

Period: ${selectedPeriod.label}
Sales Volume: $${(selectedPeriod.value / 1000000).toFixed(2)}M
3-Month Moving Average: $${selectedPeriod.movingAverage ? (selectedPeriod.movingAverage / 1000000).toFixed(2) : '0.00'}M

Summary:
This period had $${(selectedPeriod.value / 1000000).toFixed(1)}M in transactions,
${selectedPeriod.value > stats.average ? 'above' : 'below'} the average of $${(stats.average / 1000000).toFixed(1)}M.
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-report-${selectedPeriod.label}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-4">
      {/* View Mode Toggle Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={viewMode === 'chart' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('chart')}
          className="gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Chart
        </Button>
        <Button
          variant={viewMode === 'heatmap' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('heatmap')}
          className="gap-2"
        >
          <Grid3x3 className="w-4 h-4" />
          Heatmap
        </Button>
        <Button
          variant={viewMode === 'summary' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('summary')}
          className="gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          Summary
        </Button>
      </div>

      {/* Chart View */}
      {viewMode === 'chart' && (
        <div className="w-full h-64 sm:h-72 md:h-80 landscape:h-40 landscape:h-40 bg-card border border-border rounded-lg p-2 sm:p-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="value" fill="#a855f7" radius={[8, 8, 0, 0]} onClick={(e) => handlePeriodClick(e.payload)} />
              <Line dataKey="movingAverage" stroke="#10b981" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2">💡 Click any bar to view detailed metrics</p>
        </div>
      )}

      {/* Heatmap View */}
      {viewMode === 'heatmap' && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {data.map((period) => (
              <button
                key={period.label}
                onClick={() => handlePeriodClick(period)}
                className={`px-3 py-2 rounded-lg font-semibold transition-all hover:scale-105 ${getHeatmapColor(
                  period.value
                )}`}
              >
                <div className="text-xs opacity-75">{period.label}</div>
                <div className="text-sm">{(period.value / 1000000).toFixed(1)}M</div>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-400 rounded"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-500 rounded"></div>
              <span>High</span>
            </div>
          </div>
        </div>
      )}

      {/* Summary View */}
      {viewMode === 'summary' && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-2">Average</div>
              <div className="text-2xl font-bold text-foreground">{(stats.average / 1000000).toFixed(1)}M</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-2">Best Period</div>
              <div className="text-2xl font-bold text-emerald-500">{stats.highest.label}</div>
              <div className="text-xs text-muted-foreground">{(stats.highest.value / 1000000).toFixed(1)}M</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-2">Worst Period</div>
              <div className="text-2xl font-bold text-orange-500">{stats.lowest.label}</div>
              <div className="text-xs text-muted-foreground">{(stats.lowest.value / 1000000).toFixed(1)}M</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-2">Range</div>
              <div className="text-2xl font-bold text-blue-500">{(stats.range / 1000000).toFixed(1)}M</div>
            </Card>
          </div>

          {/* Periods List */}
          <Card className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {data.map((period) => (
              <button
                key={period.label}
                onClick={() => handlePeriodClick(period)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors text-left"
              >
                <span className="font-medium text-foreground">{period.label}</span>
                <span className="text-sm font-semibold text-emerald-500">{(period.value / 1000000).toFixed(1)}M</span>
              </button>
            ))}
          </Card>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Period Details</DialogTitle>
          </DialogHeader>
          {selectedPeriod && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Period</div>
                  <div className="text-lg font-bold text-foreground">{selectedPeriod.label}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Transactions</div>
                  <div className="text-lg font-bold text-foreground">
                    {(selectedPeriod.value / 1000000).toFixed(2)}M
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">3-Month Moving Average</div>
                <div className="text-lg font-bold text-emerald-500">
                  {selectedPeriod.movingAverage ? (selectedPeriod.movingAverage / 1000000).toFixed(2) : '0.00'}M
                </div>
              </div>
              <div className="bg-background border border-border rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Summary</div>
                <div className="text-sm text-foreground">
                  This period had {(selectedPeriod.value / 1000000).toFixed(1)}M in transactions,
                  {selectedPeriod.value > stats.average ? ' above' : ' below'} the average of{' '}
                  {(stats.average / 1000000).toFixed(1)}M.
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="gap-2 flex-1"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleExportReport}
                  className="gap-2 flex-1"
                >
                  <Download className="w-4 h-4" />
                  Report
                </Button>
              </div>

              {/* Comparison Button */}
              <Button 
                variant="outline"
                onClick={() => {
                  setShowComparison(true);
                  setIsModalOpen(false);
                }}
                className="w-full"
              >
                Compare with Another Period
              </Button>

              {allRecords.length > 0 && (
                <Button 
                  onClick={() => setShowDrillDown(true)}
                  className="w-full"
                >
                  View Detailed Breakdown
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Period Comparison Modal */}
      {showComparison && selectedPeriod && (
        <PeriodComparisonModal
          period1={selectedPeriod}
          periods={data}
          stats={stats}
          onClose={() => setShowComparison(false)}
        />
      )}

      {/* Full-Screen Drill-Down Modal */}
      {showDrillDown && selectedPeriod && (
        <PeriodDrillDown 
          period={selectedPeriod}
          records={allRecords}
          onClose={() => setShowDrillDown(false)}
        />
      )}
    </div>
  );
}

// Period Comparison Modal Component
interface PeriodComparisonModalProps {
  period1: ChartData;
  periods: ChartData[];
  stats: { average: number };
  onClose: () => void;
}

function PeriodComparisonModal({ period1, periods, stats, onClose }: PeriodComparisonModalProps) {
  const [period2, setPeriod2] = useState<ChartData | null>(null);

  const calculateChange = (val1: number, val2: number) => {
    if (val2 === 0) return 0;
    return ((val1 - val2) / val2) * 100;
  };

  if (!period2) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Compare Periods</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Comparing with: <span className="font-semibold text-foreground">{period1.label}</span>
            </div>
            <div className="text-sm text-muted-foreground">Select another period to compare:</div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {periods.filter(p => p.label !== period1.label).map((period) => (
                <button
                  key={period.label}
                  onClick={() => setPeriod2(period)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors text-left border border-border"
                >
                  <span className="font-medium text-foreground">{period.label}</span>
                  <span className="text-sm font-semibold text-emerald-500">{(period.value / 1000000).toFixed(1)}M</span>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const change = calculateChange(period1.value, period2.value);
  const changePercent = Math.abs(change).toFixed(1);
  const isIncrease = change >= 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Period Comparison</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Comparison Header */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 border-l-4 border-l-blue-500">
              <div className="text-xs text-muted-foreground mb-2">Period 1</div>
              <div className="text-2xl font-bold text-foreground">{period1.label}</div>
              <div className="text-lg font-semibold text-emerald-500 mt-2">
                ${(period1.value / 1000000).toFixed(2)}M
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-purple-500">
              <div className="text-xs text-muted-foreground mb-2">Period 2</div>
              <div className="text-2xl font-bold text-foreground">{period2.label}</div>
              <div className="text-lg font-semibold text-emerald-500 mt-2">
                ${(period2.value / 1000000).toFixed(2)}M
              </div>
            </Card>
          </div>

          {/* Change Indicator */}
          <Card className={`p-4 ${isIncrease ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Change from Period 2 to Period 1</div>
                <div className="flex items-center gap-2">
                  {isIncrease ? (
                    <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-orange-500" />
                  )}
                  <span className={`text-2xl font-bold ${isIncrease ? 'text-emerald-500' : 'text-orange-500'}`}>
                    {isIncrease ? '+' : '-'}{changePercent}%
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">Absolute Difference</div>
                <div className="text-lg font-semibold text-foreground">
                  ${Math.abs((period1.value - period2.value) / 1000000).toFixed(2)}M
                </div>
              </div>
            </div>
          </Card>

          {/* Metrics Comparison */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Key Metrics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Period 1 vs Average</div>
                <div className="text-sm font-semibold text-foreground">
                  {((period1.value / stats.average - 1) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Period 2 vs Average</div>
                <div className="text-sm font-semibold text-foreground">
                  {((period2.value / stats.average - 1) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setPeriod2(null)}
              className="flex-1"
            >
              Choose Different Period
            </Button>
            <Button 
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Full-Screen Drill-Down Component with Advanced Filtering
interface PeriodDrillDownProps {
  period: ChartData;
  records: DotloopRecord[];
  onClose: () => void;
}

function PeriodDrillDown({ period, records, onClose }: PeriodDrillDownProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter records for this period
  const periodRecords = records.filter(r => {
    const recordDate = new Date(r.closingDate || r.listDate || r.createdDate || 0);
    const periodMonth = period.label.split('-');
    return recordDate.getFullYear() === parseInt(periodMonth[0]) && 
           (recordDate.getMonth() + 1) === parseInt(periodMonth[1]);
  });

  // Calculate breakdowns
  const byAgent = periodRecords.reduce((acc, r) => {
    const agent = r.agents || r.agent || 'Unknown';
    acc[agent] = (acc[agent] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byPropertyType = periodRecords.reduce((acc, r) => {
    const type = r.propertyType || r.transactionType || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byStatus = periodRecords.reduce((acc, r) => {
    const status = r.loopStatus || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Apply filters to breakdowns
  const filteredByAgent = Object.entries(byAgent).filter(([agent]) => {
    const matchesSearch = agent.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredByPropertyType = Object.entries(byPropertyType).filter(([type]) => {
    const matchesSearch = type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredByStatus = Object.entries(byStatus).filter(([status]) => {
    const matchesSearch = status.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Count filtered results
  const totalFiltered = filteredByAgent.length + filteredByPropertyType.length + filteredByStatus.length;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Period Breakdown: {period.label}</h2>
            <p className="text-sm text-muted-foreground mt-1">{periodRecords.length} transactions</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search and Filter */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Search</label>
              <Input
                placeholder="Search agents, property types, or statuses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            {searchTerm && (
              <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <span className="text-sm text-foreground">
                  Found <span className="font-semibold">{totalFiltered}</span> matching results
                </span>
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>

          {/* By Agent */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">By Agent</h3>
            {filteredByAgent.length > 0 ? (
              <div className="space-y-2">
                {filteredByAgent
                  .sort(([, a], [, b]) => b - a)
                  .map(([agent, count]) => (
                    <div key={agent} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                      <span className="text-foreground">{agent}</span>
                      <span className="text-sm font-semibold text-emerald-500">{count} deals</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No agents match your search</p>
            )}
          </Card>

          {/* By Property Type */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">By Property Type</h3>
            {filteredByPropertyType.length > 0 ? (
              <div className="space-y-2">
                {filteredByPropertyType
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                      <span className="text-foreground">{type}</span>
                      <span className="text-sm font-semibold text-blue-500">{count} deals</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No property types match your search</p>
            )}
          </Card>

          {/* By Status */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">By Status</h3>
            {filteredByStatus.length > 0 ? (
              <div className="space-y-2">
                {filteredByStatus
                  .sort(([, a], [, b]) => b - a)
                  .map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                      <span className="text-foreground">{status}</span>
                      <span className="text-sm font-semibold text-purple-500">{count} deals</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No statuses match your search</p>
            )}
          </Card>

          {/* View in Dotloop Button */}
          {periodRecords.length > 0 && (
            <Button 
              onClick={() => openMultipleInDotloop(periodRecords)}
              variant="default"
              className="w-full gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View All {periodRecords.length} Transactions in Dotloop
            </Button>
          )}

          {/* Close Button */}
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
