import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, PolarAngleAxis, PolarRadiusAxis, RadarChart, Radar, PolarGrid
} from 'recharts';
import { DotloopRecord } from '@/lib/csvParser';
import { formatNumber } from '@/lib/formatUtils';
import { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/DateRangePicker';
import TransactionDetailModal from '@/components/TransactionDetailModal';

interface InteractivePipelineChartProps {
  data: DotloopRecord[];
  onDrillDown?: (status: string, records: DotloopRecord[]) => void;
}

type VisualizationMode = 'funnel' | 'radial';

interface ConversionMetric {
  from: string;
  to: string;
  rate: number;
  count: number;
  benchmark?: number;
}

const PIPELINE_COLORS = {
  'Closed': '#10b981',
  'Active Listings': '#3b82f6',
  'Under Contract': '#f59e0b',
  'Archived': '#ef4444',
};

const BENCHMARK_RATES: Record<string, number> = {
  'Active Listings to Under Contract': 35,
  'Under Contract to Closed': 85,
};

export default function InteractivePipelineChart({ data, onDrillDown }: InteractivePipelineChartProps) {
  const [mode, setMode] = useState<VisualizationMode>('funnel');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalTransactions, setModalTransactions] = useState<DotloopRecord[]>([]);

  // Filter data by date range
  const filteredData = React.useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return data;
    
    return data.filter(record => {
      const date = record.closingDate ? new Date(record.closingDate) : null;
      if (!date) return true;
      return date >= dateRange.from && date <= dateRange.to;
    });
  }, [data, dateRange]);

  // Calculate conversion metrics
  const conversionMetrics = React.useMemo(() => {
    const metrics: ConversionMetric[] = [];
    const stageOrder = ['Active Listings', 'Under Contract', 'Closed'];
    
    for (let i = 0; i < stageOrder.length - 1; i++) {
      const fromStage = stageOrder[i];
      const toStage = stageOrder[i + 1];
      
      const fromCount = filteredData.filter(r => {
        const status = r.loopStatus?.toLowerCase() || '';
        return status.includes(fromStage.toLowerCase().replace(' ', ''));
      }).length;
      
      const toCount = filteredData.filter(r => {
        const status = r.loopStatus?.toLowerCase() || '';
        return status.includes(toStage.toLowerCase().replace(' ', ''));
      }).length;
      
      if (fromCount > 0) {
        const key = `${fromStage} to ${toStage}`;
        metrics.push({
          from: fromStage,
          to: toStage,
          rate: (toCount / fromCount) * 100,
          count: toCount,
          benchmark: BENCHMARK_RATES[key],
        });
      }
    }
    
    return metrics;
  }, [filteredData]);

  const handleStageClick = (stageName: string) => {
    const filtered = filteredData.filter(record => {
      const status = record.loopStatus?.toLowerCase() || '';
      if (stageName === 'Closed') {
        return status.includes('closed') || status.includes('sold');
      } else if (stageName === 'Active Listings') {
        return status.includes('active');
      } else if (stageName === 'Under Contract') {
        return status.includes('contract') || status.includes('pending');
      } else if (stageName === 'Archived') {
        return status.includes('archived');
      }
      return false;
    });
    
    setSelectedStage(stageName);
    setModalTitle(stageName);
    setModalTransactions(filtered);
    setModalOpen(true);
    if (onDrillDown) {
      onDrillDown(stageName, filtered);
    }
  };

  // Calculate pipeline breakdown
  const pipelineData = React.useMemo(() => {
    const stages = {
      'Closed': 0,
      'Active Listings': 0,
      'Under Contract': 0,
      'Archived': 0,
    };

    filteredData.forEach((record) => {
      const status = (record.loopStatus || '').toLowerCase();
      if (status.includes('closed') || status.includes('sold')) {
        stages['Closed']++;
      } else if (status.includes('active')) {
        stages['Active Listings']++;
      } else if (status.includes('contract') || status.includes('pending')) {
        stages['Under Contract']++;
      } else if (status.includes('archived')) {
        stages['Archived']++;
      }
    });

    return [
      { name: 'Closed', value: stages['Closed'], color: PIPELINE_COLORS['Closed'] },
      { name: 'Active Listings', value: stages['Active Listings'], color: PIPELINE_COLORS['Active Listings'] },
      { name: 'Under Contract', value: stages['Under Contract'], color: PIPELINE_COLORS['Under Contract'] },
      { name: 'Archived', value: stages['Archived'], color: PIPELINE_COLORS['Archived'] },
    ];
  }, [filteredData]);

  const funnelData = React.useMemo(() => {
    return pipelineData.slice(0, 4);
  }, [pipelineData]);

  const totalTransactions = filteredData.length;

  const renderFunnelChart = () => {
    const maxValue = Math.max(...funnelData.map(d => d.value));
    const funnelHeight = 80;

    return (
      <div className="w-full h-[400px] flex flex-col justify-center items-center gap-4 p-4">
        {funnelData.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;

          return (
            <div key={index} className="w-full">
              <div
                className="relative transition-all duration-300 hover:shadow-lg rounded-lg cursor-pointer group hover:opacity-100 mx-auto"
                style={{
                  width: `${percentage}%`,
                  height: `${funnelHeight}px`,
                  backgroundColor: item.color,
                  opacity: selectedStage === item.name ? 1 : 0.85,
                }}
                onClick={() => handleStageClick(item.name)}
              >
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-background border border-border p-3 rounded-lg shadow-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <p className="font-medium">{((item.value / totalTransactions) * 100).toFixed(1)}% of total</p>
                  <p className="text-xs text-muted-foreground">Click to drill down</p>
                </div>
                <div className="h-full flex items-center justify-center">
                  <span className="font-semibold text-white drop-shadow-lg">
                    {item.name} ({item.value})
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderRadialBarChart = () => {
    const radarData = funnelData.map(item => ({
      name: item.name,
      value: item.value,
      fill: item.color,
    }));

    return (
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="name" stroke="#9CA3AF" />
            <PolarRadiusAxis stroke="#9CA3AF" />
            <Radar
              name="Deals"
              dataKey="value"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
              formatter={(value) => formatNumber(value as number)}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Pipeline Breakdown</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={mode === 'funnel' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('funnel')}
                  className="gap-2"
                >
                  Funnel
                </Button>
                <Button
                  variant={mode === 'radial' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('radial')}
                  className="gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Radial
                </Button>
              </div>
            </div>

            {/* Date Range Picker */}
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />

            {/* Conversion Metrics with Benchmarks */}
            {conversionMetrics.length > 0 && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                {conversionMetrics.map((metric, idx) => {
                  const isBelowBenchmark = metric.benchmark && metric.rate < metric.benchmark;
                  const isAboveBenchmark = metric.benchmark && metric.rate >= metric.benchmark;
                  
                  return (
                    <div key={idx} className="bg-muted/50 rounded-lg p-3 border border-border">
                      <p className="text-muted-foreground text-xs mb-1">
                        {metric.from} to {metric.to}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-foreground text-lg">
                          {metric.rate.toFixed(1)}%
                        </p>
                        {metric.benchmark && (
                          <div className="flex items-center gap-1">
                            {isAboveBenchmark ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : isBelowBenchmark ? (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            ) : null}
                            <span className={`text-xs font-medium ${
                              isAboveBenchmark ? 'text-green-600 dark:text-green-400' :
                              isBelowBenchmark ? 'text-red-600 dark:text-red-400' :
                              'text-muted-foreground'
                            }`}>
                              vs {metric.benchmark.toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {metric.count} deals
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total Transactions */}
            <div className="text-sm text-muted-foreground text-center">
              Showing {totalTransactions} transaction{totalTransactions !== 1 ? 's' : ''}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            {mode === 'funnel' ? renderFunnelChart() : renderRadialBarChart()}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        transactions={modalTransactions}
        fullScreen={true}
      />
    </>
  );
}
