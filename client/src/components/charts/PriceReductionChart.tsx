import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DotloopRecord } from '@/lib/csvParser';
import { formatCurrency, formatPercentage } from '@/lib/formatUtils';

interface PriceReductionChartProps {
  data: DotloopRecord[];
}

export default function PriceReductionChart({ data }: PriceReductionChartProps) {
  // Filter for records with both prices
  const comparisonData = data
    .filter(r => r.originalPrice > 0 && r.price > 0 && r.loopStatus === 'Sold')
    .map(r => ({
      address: r.address.split(',')[0], // Short address
      original: r.originalPrice,
      final: r.price,
      diff: r.price - r.originalPrice,
      percent: ((r.price - r.originalPrice) / r.originalPrice) * 100
    }))
    .sort((a, b) => a.percent - b.percent) // Sort by biggest drop first
    .slice(0, 10); // Top 10 most significant changes

  if (comparisonData.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border p-2 rounded-lg shadow-lg text-sm">
          <p className="font-semibold">{label}</p>
          <p className="text-muted-foreground">Original: {formatCurrency(data.original)}</p>
          <p className="text-foreground font-medium">Final: {formatCurrency(data.final)}</p>
          <p className={data.diff >= 0 ? "text-emerald-500" : "text-red-500"}>
            Change: {formatCurrency(data.diff)} ({formatPercentage(data.percent)})
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">List vs. Sale Price Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="address" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
              <YAxis tickFormatter={(val) => `$${val/1000}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <Legend />
              <Bar dataKey="original" name="Original List Price" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="final" name="Final Sale Price" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
