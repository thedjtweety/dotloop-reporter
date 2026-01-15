import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ScatterChart, Scatter, 
  BarChart, Bar, 
  ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { DotloopRecord } from '@/lib/csvParser';
import { formatCurrency } from '@/lib/formatUtils';
import { BarChart3, Grid3x3, TrendingUp, Activity } from 'lucide-react';

interface PropertyInsightsChartProps {
  data: DotloopRecord[];
}

type ChartViewType = 'box' | 'heatmap' | 'histogram' | 'scatter';

interface DecadeStats {
  decade: string;
  year: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
  count: number;
  properties: DotloopRecord[];
}

interface HistogramBin {
  decade: string;
  year: number;
  count: number;
  avgPrice: number;
  properties: DotloopRecord[];
}

interface HeatmapCell {
  decade: string;
  priceRange: string;
  count: number;
  intensity: number;
  properties: DotloopRecord[];
}

export default function PropertyInsightsChart({ data }: PropertyInsightsChartProps) {
  const [chartView, setChartView] = useState<ChartViewType>('box');
  const [selectedDecade, setSelectedDecade] = useState<DecadeStats | HistogramBin | null>(null);
  const [drillDownOpen, setDrillDownOpen] = useState(false);

  // Filter for valid data
  const validData = useMemo(() => 
    data.filter(r => r.yearBuilt > 1900 && r.price > 0),
    [data]
  );

  if (validData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Price vs. Year Built</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center">
            <p className="text-muted-foreground">No property data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate decade statistics for Box Plot
  const decadeStats = useMemo(() => {
    const grouped = new Map<number, DotloopRecord[]>();
    
    validData.forEach(r => {
      const decade = Math.floor(r.yearBuilt / 10) * 10;
      if (!grouped.has(decade)) grouped.set(decade, []);
      grouped.get(decade)!.push(r);
    });

    return Array.from(grouped.entries())
      .map(([decade, props]) => {
        const prices = props.map(p => p.price).sort((a, b) => a - b);
        const n = prices.length;
        const q1Index = Math.floor(n * 0.25);
        const medianIndex = Math.floor(n * 0.5);
        const q3Index = Math.floor(n * 0.75);

        return {
          decade: `${decade}s`,
          year: decade,
          min: prices[0],
          q1: prices[q1Index],
          median: prices[medianIndex],
          q3: prices[q3Index],
          max: prices[n - 1],
          mean: prices.reduce((a, b) => a + b, 0) / n,
          count: n,
          properties: props
        };
      })
      .sort((a, b) => a.year - b.year);
  }, [validData]);

  // Calculate histogram data
  const histogramData = useMemo(() => {
    const grouped = new Map<number, DotloopRecord[]>();
    
    validData.forEach(r => {
      const decade = Math.floor(r.yearBuilt / 10) * 10;
      if (!grouped.has(decade)) grouped.set(decade, []);
      grouped.get(decade)!.push(r);
    });

    return Array.from(grouped.entries())
      .map(([decade, props]) => ({
        decade: `${decade}s`,
        year: decade,
        count: props.length,
        avgPrice: props.reduce((a, b) => a + b.price, 0) / props.length,
        properties: props
      }))
      .sort((a, b) => a.year - b.year);
  }, [validData]);

  // Calculate heatmap data
  const heatmapData = useMemo(() => {
    const priceRanges = [
      { min: 0, max: 250000, label: '$0-250k' },
      { min: 250000, max: 500000, label: '$250k-500k' },
      { min: 500000, max: 750000, label: '$500k-750k' },
      { min: 750000, max: 1000000, label: '$750k-1M' },
      { min: 1000000, max: Infinity, label: '$1M+' }
    ];

    const grouped = new Map<string, DotloopRecord[]>();
    
    validData.forEach(r => {
      const decade = Math.floor(r.yearBuilt / 10) * 10;
      const priceRange = priceRanges.find(pr => r.price >= pr.min && r.price < pr.max);
      if (priceRange) {
        const key = `${decade}-${priceRange.label}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(r);
      }
    });

    const maxCount = Math.max(...Array.from(grouped.values()).map(v => v.length));

    return Array.from(grouped.entries())
      .map(([key, props]) => {
        const [decadeStr, priceRange] = key.split('-');
        const decade = parseInt(decadeStr);
        return {
          decade: `${decade}s`,
          priceRange,
          count: props.length,
          intensity: props.length / maxCount,
          properties: props
        };
      });
  }, [validData]);

  // Scatter data
  const scatterData = useMemo(() =>
    validData.map(r => ({
      year: r.yearBuilt,
      price: r.price,
      address: r.address,
      size: r.squareFootage || 1000
    })),
    [validData]
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border p-2 rounded-lg shadow-lg text-sm">
          <p className="font-semibold">{data.address}</p>
          <p>Year Built: {data.year}</p>
          <p>Price: {formatCurrency(data.price)}</p>
          {data.size > 1000 && <p>Sq Ft: {data.size}</p>}
        </div>
      );
    }
    return null;
  };

  const handleDrillDown = (decade: DecadeStats | HistogramBin) => {
    setSelectedDecade(decade);
    setDrillDownOpen(true);
  };

  const getHeatmapColor = (intensity: number) => {
    if (intensity < 0.2) return '#1e3a5f';
    if (intensity < 0.4) return '#3b5998';
    if (intensity < 0.6) return '#5b7ec6';
    if (intensity < 0.8) return '#7b9ef4';
    return '#9bbfff';
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">Price vs. Year Built</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={chartView === 'box' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartView('box')}
              title="Box Plot View"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button
              variant={chartView === 'histogram' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartView('histogram')}
              title="Histogram View"
            >
              <TrendingUp className="w-4 h-4" />
            </Button>
            <Button
              variant={chartView === 'heatmap' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartView('heatmap')}
              title="Heatmap View"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={chartView === 'scatter' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartView('scatter')}
              title="Scatter View"
            >
              <Activity className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            {chartView === 'box' && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={decadeStats} margin={{ top: 20, right: 20, bottom: 20, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="decade" />
                  <YAxis tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload?.[0]) {
                        const data = payload[0].payload as DecadeStats;
                        return (
                          <div className="bg-background border border-border p-3 rounded-lg shadow-lg text-sm">
                            <p className="font-semibold">{data.decade}</p>
                            <p>Min: {formatCurrency(data.min)}</p>
                            <p>Q1: {formatCurrency(data.q1)}</p>
                            <p>Median: {formatCurrency(data.median)}</p>
                            <p>Q3: {formatCurrency(data.q3)}</p>
                            <p>Max: {formatCurrency(data.max)}</p>
                            <p>Mean: {formatCurrency(data.mean)}</p>
                            <p className="text-foreground/60">Count: {data.count}</p>
                            <button 
                              onClick={() => handleDrillDown(data)}
                              className="mt-2 text-blue-400 hover:underline text-xs"
                            >
                              View Details →
                            </button>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="min" stackId="a" fill="#1e3a5f" name="Min" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="q1" stackId="a" fill="#3b5998" name="Q1" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="median" stackId="a" fill="#10b981" name="Median" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="q3" stackId="a" fill="#3b5998" name="Q3" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="max" stackId="a" fill="#1e3a5f" name="Max" radius={[0, 0, 4, 4]} />
                  <Line type="monotone" dataKey="mean" stroke="#f59e0b" strokeWidth={2} name="Mean" />
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {chartView === 'histogram' && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={histogramData} margin={{ top: 20, right: 20, bottom: 20, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="decade" />
                  <YAxis yAxisId="left" label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `$${val/1000}k`} label={{ value: 'Avg Price', angle: 90, position: 'insideRight' }} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload?.[0]) {
                        const data = payload[0].payload as HistogramBin;
                        return (
                          <div className="bg-background border border-border p-3 rounded-lg shadow-lg text-sm">
                            <p className="font-semibold">{data.decade}</p>
                            <p>Properties: {data.count}</p>
                            <p>Avg Price: {formatCurrency(data.avgPrice)}</p>
                            <button 
                              onClick={() => handleDrillDown(data)}
                              className="mt-2 text-blue-400 hover:underline text-xs"
                            >
                              View Details →
                            </button>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Property Count" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="avgPrice" stroke="#10b981" strokeWidth={2} name="Avg Price" />
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {chartView === 'heatmap' && (
              <div className="w-full h-full flex flex-col">
                <div className="flex-1 overflow-auto">
                  <div className="grid gap-1 p-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))' }}>
                    {heatmapData.map((cell, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleDrillDown(cell as any)}
                        className="p-3 rounded-lg border border-border transition-all hover:scale-105 cursor-pointer"
                        style={{ backgroundColor: getHeatmapColor(cell.intensity) }}
                        title={`${cell.decade} - ${cell.priceRange}: ${cell.count} properties`}
                      >
                        <div className="text-xs font-semibold text-white">{cell.decade}</div>
                        <div className="text-xs text-white/80">{cell.priceRange}</div>
                        <div className="text-sm font-bold text-white">{cell.count}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {chartView === 'scatter' && (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 60 }}>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="year" name="Year Built" domain={['auto', 'auto']} tickCount={10} />
                  <YAxis type="number" dataKey="price" name="Price" unit="$" tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Properties" data={scatterData} fill="#8884d8" fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Drill-Down Modal */}
      <Dialog open={drillDownOpen} onOpenChange={setDrillDownOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDecade ? `Properties from ${(selectedDecade as any).decade}` : 'Properties'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDecade && 'properties' in selectedDecade && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-card rounded-lg border border-border">
                  <p className="text-sm text-foreground/60">Total Properties</p>
                  <p className="text-2xl font-bold">{selectedDecade.properties.length}</p>
                </div>
                <div className="p-3 bg-card rounded-lg border border-border">
                  <p className="text-sm text-foreground/60">Average Price</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedDecade.properties.reduce((a, b) => a + b.price, 0) / selectedDecade.properties.length)}</p>
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-2 text-left">Address</th>
                        <th className="px-4 py-2 text-right">Year Built</th>
                        <th className="px-4 py-2 text-right">Price</th>
                        <th className="px-4 py-2 text-right">Sq Ft</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDecade.properties.map((prop, idx) => (
                        <tr key={idx} className="border-b border-border hover:bg-muted/30">
                          <td className="px-4 py-2">{prop.address}</td>
                          <td className="px-4 py-2 text-right">{prop.yearBuilt}</td>
                          <td className="px-4 py-2 text-right font-semibold">{formatCurrency(prop.price)}</td>
                          <td className="px-4 py-2 text-right">{prop.squareFootage?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
