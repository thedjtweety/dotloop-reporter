import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  ScatterChart, Scatter, BarChart, Bar, LineChart, Line, ComposedChart, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { DotloopRecord } from '@/lib/csvParser';
import { formatCurrency } from '@/lib/formatUtils';

interface EnhancedPriceVsYearBuiltChartProps {
  data: DotloopRecord[];
}

type VisualizationMode = 'hexbin' | 'histogram2d' | 'violin' | 'boxplot' | 'trendline' | 'density';

const MODES: { mode: VisualizationMode; label: string; description: string }[] = [
  { mode: 'hexbin', label: 'Hexbin Heatmap', description: 'Color intensity shows data density' },
  { mode: 'histogram2d', label: '2D Histogram', description: 'Binned rectangles with counts' },
  { mode: 'violin', label: 'Violin Plot', description: 'Price distribution by decade' },
  { mode: 'boxplot', label: 'Box Plot', description: 'Quartiles and outliers' },
  { mode: 'trendline', label: 'Trend Line', description: 'Average price with confidence bands' },
  { mode: 'density', label: 'Density Contour', description: 'Smooth density visualization' },
];

export default function EnhancedPriceVsYearBuiltChart({ data }: EnhancedPriceVsYearBuiltChartProps) {
  const [currentModeIndex, setCurrentModeIndex] = useState(0);
  const currentMode = MODES[currentModeIndex].mode;

  // Filter valid data
  const validData = useMemo(() => {
    return data.filter(r => r.yearBuilt > 1900 && r.price > 0);
  }, [data]);

  if (validData.length === 0) return null;

  // Process data for different visualizations
  const hexbinData = useMemo(() => {
    const bins = new Map<string, number>();
    const binSize = 5; // 5-year bins for year, $50k bins for price
    
    validData.forEach(r => {
      const yearBin = Math.floor(r.yearBuilt / binSize) * binSize;
      const priceBin = Math.floor(r.price / 50000) * 50000;
      const key = `${yearBin}-${priceBin}`;
      bins.set(key, (bins.get(key) || 0) + 1);
    });

    return Array.from(bins.entries()).map(([key, count]) => {
      const [year, price] = key.split('-').map(Number);
      return { year, price, count };
    });
  }, [validData]);

  const histogram2dData = useMemo(() => {
    const bins = new Map<string, number>();
    const yearBinSize = 10;
    const priceBinSize = 100000;

    validData.forEach(r => {
      const yearBin = Math.floor(r.yearBuilt / yearBinSize) * yearBinSize;
      const priceBin = Math.floor(r.price / priceBinSize) * priceBinSize;
      const key = `${yearBin}-${priceBin}`;
      bins.set(key, (bins.get(key) || 0) + 1);
    });

    return Array.from(bins.entries()).map(([key, count]) => {
      const [year, price] = key.split('-').map(Number);
      return { year, price, count };
    });
  }, [validData]);

  const violinData = useMemo(() => {
    const decades = new Map<number, number[]>();
    
    validData.forEach(r => {
      const decade = Math.floor(r.yearBuilt / 10) * 10;
      if (!decades.has(decade)) decades.set(decade, []);
      decades.get(decade)!.push(r.price);
    });

    return Array.from(decades.entries()).map(([decade, prices]) => {
      prices.sort((a, b) => a - b);
      const q1 = prices[Math.floor(prices.length * 0.25)];
      const median = prices[Math.floor(prices.length * 0.5)];
      const q3 = prices[Math.floor(prices.length * 0.75)];
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return { decade, min, q1, median, q3, max, count: prices.length };
    });
  }, [validData]);

  const boxplotData = useMemo(() => {
    const decades = new Map<number, number[]>();
    
    validData.forEach(r => {
      const decade = Math.floor(r.yearBuilt / 10) * 10;
      if (!decades.has(decade)) decades.set(decade, []);
      decades.get(decade)!.push(r.price);
    });

    return Array.from(decades.entries()).map(([decade, prices]) => {
      prices.sort((a, b) => a - b);
      const q1 = prices[Math.floor(prices.length * 0.25)];
      const median = prices[Math.floor(prices.length * 0.5)];
      const q3 = prices[Math.floor(prices.length * 0.75)];
      const iqr = q3 - q1;
      const min = Math.max(q1 - 1.5 * iqr, Math.min(...prices));
      const max = Math.min(q3 + 1.5 * iqr, Math.max(...prices));
      return { decade, min, q1, median, q3, max };
    }).sort((a, b) => a.decade - b.decade);
  }, [validData]);

  const trendlineData = useMemo(() => {
    const yearGroups = new Map<number, number[]>();
    
    validData.forEach(r => {
      const year = Math.floor(r.yearBuilt / 5) * 5;
      if (!yearGroups.has(year)) yearGroups.set(year, []);
      yearGroups.get(year)!.push(r.price);
    });

    return Array.from(yearGroups.entries())
      .map(([year, prices]) => {
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const std = Math.sqrt(prices.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / prices.length);
        return { year, avg, upper: avg + std, lower: Math.max(0, avg - std) };
      })
      .sort((a, b) => a.year - b.year);
  }, [validData]);

  const densityData = useMemo(() => {
    // Simplified density: create a grid and count nearby points
    const grid: { year: number; price: number; density: number }[] = [];
    const yearStep = 5;
    const priceStep = 50000;
    const bandwidth = 10; // years

    for (let year = 1940; year <= 2030; year += yearStep) {
      for (let price = 0; price <= 1300000; price += priceStep) {
        let density = 0;
        validData.forEach(r => {
          const yearDist = Math.abs(r.yearBuilt - year) / bandwidth;
          const priceDist = Math.abs(r.price - price) / 100000;
          const dist = Math.sqrt(yearDist * yearDist + priceDist * priceDist);
          density += Math.exp(-dist * dist);
        });
        if (density > 0.1) {
          grid.push({ year, price, density });
        }
      }
    }
    return grid;
  }, [validData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border p-2 rounded-lg shadow-lg text-sm">
          {data.count && <p>Count: {data.count}</p>}
          {data.year && <p>Year: {data.year}</p>}
          {data.price !== undefined && <p>Price: {formatCurrency(data.price)}</p>}
          {data.avg && <p>Avg: {formatCurrency(data.avg)}</p>}
          {data.median && <p>Median: {formatCurrency(data.median)}</p>}
          {data.density && <p>Density: {data.density.toFixed(2)}</p>}
        </div>
      );
    }
    return null;
  };

  const getColorByValue = (value: number, max: number) => {
    const hue = (1 - value / max) * 240;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const renderVisualization = () => {
    switch (currentMode) {
      case 'hexbin':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="year" name="Year" domain={[1940, 2030]} />
              <YAxis type="number" dataKey="price" name="Price" tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter name="Hexbin" data={hexbinData} fill="#8884d8">
                {hexbinData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorByValue(entry.count, Math.max(...hexbinData.map(d => d.count)))} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'histogram2d':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogram2dData} margin={{ top: 20, right: 20, bottom: 20, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]}>
                {histogram2dData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorByValue(entry.count, Math.max(...histogram2dData.map(d => d.count)))} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'violin':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={violinData} margin={{ top: 20, right: 20, bottom: 20, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="decade" />
              <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="max" stackId="a" fill="rgba(136, 132, 216, 0.1)" />
              <Bar dataKey="q3" stackId="a" fill="rgba(136, 132, 216, 0.3)" />
              <Bar dataKey="median" stackId="a" fill="rgba(136, 132, 216, 0.6)" />
              <Bar dataKey="q1" stackId="a" fill="rgba(136, 132, 216, 0.3)" />
              <Bar dataKey="min" stackId="a" fill="rgba(136, 132, 216, 0.1)" />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'boxplot':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={boxplotData} margin={{ top: 20, right: 20, bottom: 20, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="decade" />
              <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              {boxplotData.map((entry, idx) => (
                <ReferenceLine key={`median-${idx}`} x={entry.decade} stroke="rgba(136, 132, 216, 0.5)" />
              ))}
              <Bar dataKey="max" fill="rgba(136, 132, 216, 0.2)" />
              <Bar dataKey="q3" fill="rgba(136, 132, 216, 0.5)" />
              <Bar dataKey="median" fill="rgba(136, 132, 216, 0.8)" />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'trendline':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendlineData} margin={{ top: 20, right: 20, bottom: 20, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="upper" stroke="rgba(136, 132, 216, 0.3)" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="avg" stroke="#8884d8" strokeWidth={2} />
              <Line type="monotone" dataKey="lower" stroke="rgba(136, 132, 216, 0.3)" strokeDasharray="5 5" />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'density':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="year" domain={[1940, 2030]} />
              <YAxis type="number" dataKey="price" tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter name="Density" data={densityData} fill="#8884d8">
                {densityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorByValue(entry.density, Math.max(...densityData.map(d => d.density)))} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const nextMode = () => {
    setCurrentModeIndex((prev) => (prev + 1) % MODES.length);
  };

  const prevMode = () => {
    setCurrentModeIndex((prev) => (prev - 1 + MODES.length) % MODES.length);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium">Price vs. Year Built</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{MODES[currentModeIndex].description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={prevMode}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">{MODES[currentModeIndex].label}</span>
            <Button variant="outline" size="sm" onClick={nextMode}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          {renderVisualization()}
        </div>
      </CardContent>
    </Card>
  );
}
