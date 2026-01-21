/**
 * SalesTimelineChart Component - Rebuilt from Scratch
 * Displays sales performance over time with three visualization modes:
 * 1. Chart View - Bar chart with 3-month moving average line
 * 2. Heatmap View - Color-coded grid showing transaction intensity
 * 3. Summary View - Key metrics cards with period list
 */

import { useState } from 'react';
import { ChartData, DotloopRecord } from '@/lib/csvParser';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BarChart3, Grid3x3, TrendingUp, X } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';

interface SalesTimelineChartProps {
  data: ChartData[];
  allRecords?: DotloopRecord[];
}

type ViewMode = 'chart' | 'heatmap' | 'summary';

export default function SalesTimelineChart({ data, allRecords = [] }: SalesTimelineChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [selectedPeriod, setSelectedPeriod] = useState<ChartData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDrillDown, setShowDrillDown] = useState(false);

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
        <div className="w-full h-80 bg-card border border-border rounded-lg p-4">
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

// Full-Screen Drill-Down Component
interface PeriodDrillDownProps {
  period: ChartData;
  records: DotloopRecord[];
  onClose: () => void;
}

function PeriodDrillDown({ period, records, onClose }: PeriodDrillDownProps) {
  // Filter records for this period
  const periodRecords = records.filter(r => {
    const recordDate = new Date(r.closingDate || r.listDate || r.createdDate || 0);
    const periodMonth = period.label.split('-');
    return recordDate.getFullYear() === parseInt(periodMonth[0]) && 
           (recordDate.getMonth() + 1) === parseInt(periodMonth[1]);
  });

  // Calculate breakdowns
  const byAgent = periodRecords.reduce((acc, r) => {
    const agent = r.agent || 'Unknown';
    acc[agent] = (acc[agent] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byPropertyType = periodRecords.reduce((acc, r) => {
    const type = r.transactionType || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byStatus = periodRecords.reduce((acc, r) => {
    const status = r.loopStatus || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
          {/* By Agent */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">By Agent</h3>
            <div className="space-y-2">
              {Object.entries(byAgent)
                .sort(([, a], [, b]) => b - a)
                .map(([agent, count]) => (
                  <div key={agent} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                    <span className="text-foreground">{agent}</span>
                    <span className="text-sm font-semibold text-emerald-500">{count} deals</span>
                  </div>
                ))}
            </div>
          </Card>

          {/* By Property Type */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">By Property Type</h3>
            <div className="space-y-2">
              {Object.entries(byPropertyType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                    <span className="text-foreground">{type}</span>
                    <span className="text-sm font-semibold text-blue-500">{count} deals</span>
                  </div>
                ))}
            </div>
          </Card>

          {/* By Status */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">By Status</h3>
            <div className="space-y-2">
              {Object.entries(byStatus)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                    <span className="text-foreground">{status}</span>
                    <span className="text-sm font-semibold text-purple-500">{count} deals</span>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
