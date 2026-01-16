import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, formatPercentage } from '@/lib/formatUtils';

interface CommissionBreakdownChartProps {
  buySide: number;
  sellSide: number;
  onSliceClick?: (label: string) => void;
}

export default function CommissionBreakdownChart({ buySide, sellSide, onSliceClick }: CommissionBreakdownChartProps) {
  const total = buySide + sellSide;
  
  const data = [
    { name: 'Buy Side', value: buySide, color: '#3b82f6' }, // blue-500
    { name: 'Sell Side', value: sellSide, color: '#10b981' }, // emerald-500
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percent = total > 0 ? (item.value / total) * 100 : 0;
      
      return (
        <div className="bg-background border border-border p-2 rounded-lg shadow-lg text-sm">
          <p className="font-semibold" style={{ color: item.color }}>{item.name}</p>
          <p className="text-foreground">{formatCurrency(item.value)}</p>
          <p className="text-foreground">{formatPercentage(percent)}</p>
        </div>
      );
    }
    return null;
  };

  if (total === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Commission Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-foreground">
          No commission data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Commission Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                onClick={(data) => onSliceClick?.(data.name)}
                className="cursor-pointer"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => (
                  <span className="text-sm font-medium text-foreground ml-1">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-foreground mb-1">Buy Side</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {formatPercentage(total > 0 ? (buySide / total) * 100 : 0)}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <p className="text-xs text-foreground mb-1">Sell Side</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatPercentage(total > 0 ? (sellSide / total) * 100 : 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
