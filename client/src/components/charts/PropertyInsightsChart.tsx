import { useState, useMemo } from 'react';
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
import { BarChart3, Grid3x3, TrendingUp, Activity, Download } from 'lucide-react';

interface PropertyInsightsChartProps {
  data: DotloopRecord[];
}

type ChartViewType = 'box' | 'heatmap' | 'histogram' | 'scatter';
type DecadeRangeType = 5 | 10 | 20;

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
  const [decadeRange, setDecadeRange] = useState<DecadeRangeType>(10);
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
            <p className="text-foreground/60">No property data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate decade statistics based on selected range
  const decadeStats = useMemo(() => {
    const grouped = new Map<number, DotloopRecord[]>();
    
    validData.forEach(r => {
      const decade = Math.floor(r.yearBuilt / decadeRange) * decadeRange;
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
        const mean = prices.reduce((a, b) => a + b, 0) / n;

        return {
          decade: `${decade}s-${decade + decadeRange - 1}s`,
          year: decade,
          min: prices[0],
          q1: prices[q1Index],
          median: prices[medianIndex],
          q3: prices[q3Index],
          max: prices[n - 1],
          mean,
          count: n,
          properties: props,
        };
      })
      .sort((a, b) => a.year - b.year);
  }, [validData, decadeRange]);

  // Calculate histogram data
  const histogramData = useMemo(() => {
    const grouped = new Map<number, DotloopRecord[]>();
    
    validData.forEach(r => {
      const decade = Math.floor(r.yearBuilt / decadeRange) * decadeRange;
      if (!grouped.has(decade)) grouped.set(decade, []);
      grouped.get(decade)!.push(r);
    });

    return Array.from(grouped.entries())
      .map(([decade, props]) => {
        const avgPrice = props.reduce((sum, p) => sum + p.price, 0) / props.length;
        return {
          decade: `${decade}s-${decade + decadeRange - 1}s`,
          year: decade,
          count: props.length,
          avgPrice,
          properties: props,
        };
      })
      .sort((a, b) => a.year - b.year);
  }, [validData, decadeRange]);

  // Calculate heatmap data
  const heatmapData = useMemo(() => {
    const priceRanges = ['$0', '$250k', '$500k', '$750k', '$1M+'];
    const grouped = new Map<string, DotloopRecord[]>();
    
    validData.forEach(r => {
      const decade = Math.floor(r.yearBuilt / decadeRange) * decadeRange;
      let priceRange = '$0';
      if (r.price >= 250000) priceRange = '$250k';
      if (r.price >= 500000) priceRange = '$500k';
      if (r.price >= 750000) priceRange = '$750k';
      if (r.price >= 1000000) priceRange = '$1M+';
      
      const key = `${decade}-${priceRange}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(r);
    });

    const maxCount = Math.max(...Array.from(grouped.values()).map(v => v.length));

    return Array.from(grouped.entries())
      .map(([key, props]) => {
        const [decade, priceRange] = key.split('-');
        return {
          decade: `${decade}s-${parseInt(decade) + decadeRange - 1}s`,
          priceRange,
          count: props.length,
          intensity: props.length / maxCount,
          properties: props,
        };
      });
  }, [validData, decadeRange]);

  // Export to CSV
  const exportToCSV = (properties: DotloopRecord[]) => {
    const headers = ['Address', 'Year Built', 'Price', 'Sq Ft'];
    const rows = properties.map(p => [
      p.address || 'N/A',
      p.yearBuilt || 'N/A',
      formatCurrency(p.price || 0),
      p.sqft || 'N/A',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `properties-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Price vs. Year Built</CardTitle>
          <div className="flex gap-2">
            {/* View Toggle Buttons */}
            <div className="flex gap-1 border border-border rounded-lg p-1 bg-muted/30">
              <Button
                variant={chartView === 'box' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartView('box')}
                title="Box Plot View"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                variant={chartView === 'histogram' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartView('histogram')}
                title="Histogram View"
              >
                <TrendingUp className="w-4 h-4" />
              </Button>
              <Button
                variant={chartView === 'heatmap' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartView('heatmap')}
                title="Heatmap View"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={chartView === 'scatter' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartView('scatter')}
                title="Scatter View"
              >
                <Activity className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Decade Range Toggle */}
        <div className="flex gap-2 mt-4">
          <span className="text-sm text-foreground/60">Group by:</span>
          <Button
            variant={decadeRange === 5 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDecadeRange(5)}
            className="text-xs"
          >
            5-Year
          </Button>
          <Button
            variant={decadeRange === 10 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDecadeRange(10)}
            className="text-xs"
          >
            10-Year
          </Button>
          <Button
            variant={decadeRange === 20 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDecadeRange(20)}
            className="text-xs"
          >
            20-Year
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {chartView === 'box' && (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={decadeStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="decade" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Bar dataKey="median" fill="#3b82f6" name="Median" onClick={(data) => {
                    setSelectedDecade(data as DecadeStats);
                    setDrillDownOpen(true);
                  }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartView === 'histogram' && (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={histogramData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="decade" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value) => {
                      if (typeof value === 'number' && value > 1000) {
                        return formatCurrency(value);
                      }
                      return value;
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="#8b5cf6" name="Property Count" onClick={(data) => {
                    setSelectedDecade(data as HistogramBin);
                    setDrillDownOpen(true);
                  }} />
                  <Line yAxisId="right" type="monotone" dataKey="avgPrice" stroke="#10b981" name="Avg Price" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartView === 'heatmap' && (
            <div className="grid grid-cols-auto gap-2 p-4">
              {heatmapData.map((cell) => (
                <Button
                  key={`${cell.decade}-${cell.priceRange}`}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-center gap-1 cursor-pointer hover:border-primary"
                  style={{
                    backgroundColor: `rgba(59, 130, 246, ${cell.intensity * 0.7})`,
                    borderColor: cell.intensity > 0.5 ? '#3b82f6' : '#e5e7eb',
                  }}
                  onClick={() => {
                    setSelectedDecade({
                      decade: cell.decade,
                      year: parseInt(cell.decade),
                      count: cell.count,
                      avgPrice: 0,
                      properties: cell.properties,
                    } as HistogramBin);
                    setDrillDownOpen(true);
                  }}
                >
                  <span className="text-xs font-semibold">{cell.decade}</span>
                  <span className="text-xs">{cell.priceRange}</span>
                  <span className="text-xs font-bold">{cell.count}</span>
                </Button>
              ))}
            </div>
          )}

          {chartView === 'scatter' && (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="yearBuilt" name="Year Built" />
                  <YAxis type="number" dataKey="price" name="Price" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value) => {
                      if (typeof value === 'number' && value > 1000) {
                        return formatCurrency(value);
                      }
                      return value;
                    }}
                  />
                  <Scatter name="Properties" data={validData} fill="#a78bfa" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>

      {/* Drill-Down Modal */}
      <Dialog open={drillDownOpen} onOpenChange={setDrillDownOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Properties from {selectedDecade?.decade}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-foreground/60">Total Properties</p>
                <p className="text-2xl font-bold">{selectedDecade?.count}</p>
              </div>
              <div>
                <p className="text-sm text-foreground/60">Average Price</p>
                <p className="text-2xl font-bold">
                  {selectedDecade?.properties && selectedDecade.properties.length > 0
                    ? formatCurrency(
                        selectedDecade.properties.reduce((sum, p) => sum + (p.price || 0), 0) /
                          selectedDecade.properties.length
                      )
                    : 'N/A'}
                </p>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-foreground">Address</th>
                    <th className="px-4 py-2 text-left font-semibold text-foreground">Year Built</th>
                    <th className="px-4 py-2 text-left font-semibold text-foreground">Price</th>
                    <th className="px-4 py-2 text-left font-semibold text-foreground">Sq Ft</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDecade?.properties?.map((prop, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-2 text-foreground">{prop.address || 'N/A'}</td>
                      <td className="px-4 py-2 text-foreground">{prop.yearBuilt || 'N/A'}</td>
                      <td className="px-4 py-2 text-foreground">{formatCurrency(prop.price || 0)}</td>
                      <td className="px-4 py-2 text-foreground">{prop.sqft || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              onClick={() => exportToCSV(selectedDecade?.properties || [])}
              className="w-full gap-2"
            >
              <Download className="w-4 h-4" />
              Export to CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
