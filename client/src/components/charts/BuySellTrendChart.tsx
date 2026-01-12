import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/formatUtils';
import { DotloopRecord } from '@/lib/csvParser';

interface BuySellTrendChartProps {
  data: DotloopRecord[];
}

export default function BuySellTrendChart({ data }: BuySellTrendChartProps) {
  // Aggregate data by month
  const monthlyData = React.useMemo(() => {
    const grouped = new Map<string, { buySide: number; sellSide: number; date: Date }>();

    data.forEach(record => {
      if (!record.closingDate) return;
      
      const date = new Date(record.closingDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, { buySide: 0, sellSide: 0, date });
      }
      
      const entry = grouped.get(key)!;
      entry.buySide += record.buySideCommission || 0;
      entry.sellSide += record.sellSideCommission || 0;
    });

    return Array.from(grouped.entries())
      .map(([key, value]) => ({
        name: key,
        displayDate: value.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        buySide: value.buySide,
        sellSide: value.sellSide,
        timestamp: value.date.getTime()
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-2 rounded-lg shadow-lg text-sm">
          <p className="font-semibold mb-1">{payload[0].payload.displayDate}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (monthlyData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Buy vs Sell Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-foreground/70">
          No trend data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Buy vs Sell Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="displayDate" 
                className="text-xs" 
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                tickFormatter={(value) => `$${value / 1000}k`}
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="buySide" 
                name="Buy Side" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="sellSide" 
                name="Sell Side" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
