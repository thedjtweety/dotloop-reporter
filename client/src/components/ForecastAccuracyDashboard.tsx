import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target, Zap, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AccuracyMetrics {
  totalForecasts: number;
  avgDealsAccuracy: number;
  avgRevenueAccuracy: number;
  avgCommissionAccuracy: number;
  avgHitRate: number;
  avgMape: number;
  byTimeframe: {
    '30': any[];
    '60': any[];
    '90': any[];
  };
}

interface Props {
  metrics: AccuracyMetrics | null;
  isLoading?: boolean;
}

export default function ForecastAccuracyDashboard({ metrics, isLoading = false }: Props) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'30' | '60' | '90'>('30');

  if (isLoading) {
    return (
      <Card className="p-8 bg-card border border-border">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-muted-foreground">Loading accuracy metrics...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="p-8 bg-card border border-border">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No forecast accuracy data available yet.</p>
            <p className="text-sm text-muted-foreground">Create forecasts and wait for results to see accuracy metrics.</p>
          </div>
        </div>
      </Card>
    );
  }

  // Prepare trend data
  const trendData = metrics.byTimeframe[selectedTimeframe]
    .slice(0, 12)
    .reverse()
    .map((item: any, index: number) => ({
      date: `Day ${index + 1}`,
      dealsAccuracy: item.dealsAccuracy || 0,
      revenueAccuracy: item.revenueAccuracy || 0,
      commissionAccuracy: item.commissionAccuracy || 0,
      hitRate: item.hitRate || 0,
    }));

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 85) return 'text-green-500';
    if (accuracy >= 70) return 'text-blue-500';
    if (accuracy >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getAccuracyBgColor = (accuracy: number) => {
    if (accuracy >= 85) return 'bg-green-50 border-green-200';
    if (accuracy >= 70) return 'bg-blue-50 border-blue-200';
    if (accuracy >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex gap-3">
        {(['30', '60', '90'] as const).map((tf) => (
          <Button
            key={tf}
            variant={selectedTimeframe === tf ? 'default' : 'outline'}
            onClick={() => setSelectedTimeframe(tf)}
            className="min-w-24"
          >
            {tf} Days
          </Button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Deals Accuracy */}
        <Card className={`p-4 border-l-4 border-l-blue-500 ${getAccuracyBgColor(metrics.avgDealsAccuracy)}`}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-medium">Deals Accuracy</p>
              <Target className="w-4 h-4 text-blue-500" />
            </div>
            <p className={`text-3xl font-bold ${getAccuracyColor(metrics.avgDealsAccuracy)}`}>
              {metrics.avgDealsAccuracy}%
            </p>
            <p className="text-xs text-muted-foreground">
              Based on {metrics.totalForecasts} forecasts
            </p>
          </div>
        </Card>

        {/* Revenue Accuracy */}
        <Card className={`p-4 border-l-4 border-l-green-500 ${getAccuracyBgColor(metrics.avgRevenueAccuracy)}`}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-medium">Revenue Accuracy</p>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className={`text-3xl font-bold ${getAccuracyColor(metrics.avgRevenueAccuracy)}`}>
              {metrics.avgRevenueAccuracy}%
            </p>
            <p className="text-xs text-muted-foreground">
              Variance tracking
            </p>
          </div>
        </Card>

        {/* Commission Accuracy */}
        <Card className={`p-4 border-l-4 border-l-purple-500 ${getAccuracyBgColor(metrics.avgCommissionAccuracy)}`}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-medium">Commission Accuracy</p>
              <Zap className="w-4 h-4 text-purple-500" />
            </div>
            <p className={`text-3xl font-bold ${getAccuracyColor(metrics.avgCommissionAccuracy)}`}>
              {metrics.avgCommissionAccuracy}%
            </p>
            <p className="text-xs text-muted-foreground">
              Financial precision
            </p>
          </div>
        </Card>

        {/* Hit Rate */}
        <Card className={`p-4 border-l-4 border-l-amber-500 ${getAccuracyBgColor(metrics.avgHitRate)}`}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-medium">Hit Rate</p>
              <Target className="w-4 h-4 text-amber-500" />
            </div>
            <p className={`text-3xl font-bold ${getAccuracyColor(metrics.avgHitRate)}`}>
              {metrics.avgHitRate}%
            </p>
            <p className="text-xs text-muted-foreground">
              Deals closed
            </p>
          </div>
        </Card>

        {/* MAPE */}
        <Card className={`p-4 border-l-4 border-l-red-500 ${getAccuracyBgColor(100 - metrics.avgMape)}`}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-medium">MAPE</p>
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <p className={`text-3xl font-bold ${getAccuracyColor(100 - metrics.avgMape)}`}>
              {metrics.avgMape}%
            </p>
            <p className="text-xs text-muted-foreground">
              Mean error
            </p>
          </div>
        </Card>
      </div>

      {/* Accuracy Trend Chart */}
      {trendData.length > 0 && (
        <Card className="p-6 bg-card border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Accuracy Trend ({selectedTimeframe} Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                formatter={(value: any) => `${value}%`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="dealsAccuracy"
                stroke="#3b82f6"
                dot={false}
                strokeWidth={2}
                name="Deals"
              />
              <Line
                type="monotone"
                dataKey="revenueAccuracy"
                stroke="#10b981"
                dot={false}
                strokeWidth={2}
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="commissionAccuracy"
                stroke="#a855f7"
                dot={false}
                strokeWidth={2}
                name="Commission"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Accuracy by Timeframe Comparison */}
      {metrics.byTimeframe['30'].length > 0 && (
        <Card className="p-6 bg-card border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Accuracy by Timeframe</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                {
                  timeframe: '30 Days',
                  accuracy: metrics.byTimeframe['30'][0]?.dealsAccuracy || 0,
                },
                {
                  timeframe: '60 Days',
                  accuracy: metrics.byTimeframe['60'][0]?.dealsAccuracy || 0,
                },
                {
                  timeframe: '90 Days',
                  accuracy: metrics.byTimeframe['90'][0]?.dealsAccuracy || 0,
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="timeframe" stroke="#888" />
              <YAxis stroke="#888" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                formatter={(value: any) => `${value}%`}
              />
              <Bar dataKey="accuracy" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Info Box */}
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium">How Accuracy is Calculated</p>
            <p className="mt-1 text-blue-800">
              Deals Accuracy measures how close your projected deal count is to actual closures. Revenue Accuracy tracks projected vs. actual revenue variance. Commission Accuracy measures financial forecast precision. Hit Rate shows the percentage of projected deals that actually closed. MAPE (Mean Absolute Percentage Error) is the average error across all three metrics.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
