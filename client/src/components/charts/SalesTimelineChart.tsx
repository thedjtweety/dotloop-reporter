/**
 * SalesTimelineChart Component - Rebuilt from Scratch
 * Displays sales performance over time with three visualization modes:
 * 1. Chart View - Bar chart with 3-month moving average line
 * 2. Heatmap View - Color-coded grid showing transaction intensity
 * 3. Summary View - Key metrics cards with period list
 */

import { useState } from 'react';
import { ChartData } from '@/lib/csvParser';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BarChart3, Grid3x3, TrendingUp } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

interface SalesTimelineChartProps {
  data: ChartData[];
}

type ViewMode = 'chart' | 'heatmap' | 'summary';

export default function SalesTimelineChart({ data }: SalesTimelineChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [selectedPeriod, setSelectedPeriod] = useState<ChartData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
              <Bar
                dataKey="value"
                fill="#a855f7"
                radius={[4, 4, 0, 0]}
                name="Transactions"
                onClick={(data) => handlePeriodClick(data)}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
              <Line
                type="monotone"
                dataKey="movingAverage"
                stroke="#10b981"
                strokeWidth={3}
                dot={false}
                name="3-Month Moving Avg"
              />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2">💡 Click any bar to view detailed metrics</p>
        </div>
      )}

      {/* Heatmap View */}
      {viewMode === 'heatmap' && (
        <div className="w-full bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-4 gap-2 mb-4">
            {data.map((period, idx) => (
              <button
                key={idx}
                onClick={() => handlePeriodClick(period)}
                className={`p-3 rounded-lg text-center cursor-pointer transition-transform hover:scale-105 ${getHeatmapColor(period.value)}`}
              >
                <div className="text-xs font-semibold">{period.label}</div>
                <div className="text-sm font-bold">{(period.value / 1000000).toFixed(1)}M</div>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-400 rounded"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-400 rounded"></div>
              <span>High</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">💡 Click any cell to view detailed metrics</p>
        </div>
      )}

      {/* Summary View */}
      {viewMode === 'summary' && (
        <div className="w-full bg-card border border-border rounded-lg p-4 space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-background border border-border rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Average</div>
              <div className="text-xl font-bold text-foreground">
                {(stats.average / 1000000).toFixed(1)}M
              </div>
            </div>
            <div className="bg-background border border-border rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Best Period</div>
              <div className="text-xl font-bold text-emerald-500">{stats.highest.label}</div>
              <div className="text-xs text-muted-foreground">{(stats.highest.value / 1000000).toFixed(1)}M</div>
            </div>
            <div className="bg-background border border-border rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Worst Period</div>
              <div className="text-xl font-bold text-orange-500">{stats.lowest.label}</div>
              <div className="text-xs text-muted-foreground">{(stats.lowest.value / 1000000).toFixed(1)}M</div>
            </div>
            <div className="bg-background border border-border rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Range</div>
              <div className="text-xl font-bold text-foreground">
                {(stats.range / 1000000).toFixed(1)}M
              </div>
            </div>
          </div>

          {/* Period List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <div className="text-sm font-semibold text-foreground mb-2">All Periods</div>
            {data.map((period, idx) => (
              <button
                key={idx}
                onClick={() => handlePeriodClick(period)}
                className="w-full text-left p-2 rounded-lg bg-background border border-border hover:border-primary transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">{period.label}</span>
                  <span className="text-sm text-muted-foreground">{(period.value / 1000000).toFixed(1)}M</span>
                </div>
              </button>
            ))}
          </div>
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
                  {(selectedPeriod.movingAverage / 1000000).toFixed(2)}M
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
