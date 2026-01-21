import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, formatPercentage } from '@/lib/formatUtils';

interface RevenueDistributionChartProps {
  totalCommission: number;
  companyDollar: number;
}

export default function RevenueDistributionChart({ totalCommission, companyDollar }: RevenueDistributionChartProps) {
  // Calculate Agent Commission (Total - Company Dollar)
  // Ensure we don't get negative numbers if data is messy
  const agentCommission = Math.max(0, totalCommission - companyDollar);
  const safeCompanyDollar = Math.max(0, companyDollar);
  
  // Recalculate total based on clean positive numbers
  const total = agentCommission + safeCompanyDollar;
  
  const data = [
    { name: 'Agent Commission', value: agentCommission, color: '#8b5cf6' }, // violet-500
    { name: 'Company Dollar', value: safeCompanyDollar, color: '#f59e0b' }, // amber-500
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percent = total > 0 ? (item.value / total) * 100 : 0;
      
      return (
        <div className="bg-background border border-border p-2 rounded-lg shadow-lg text-sm">
          <p className="font-semibold" style={{ color: item.color }}>{item.name}</p>
          <p className="text-foreground">{formatCurrency(item.value)}</p>
          <p className="text-muted-foreground">{formatPercentage(percent)}</p>
        </div>
      );
    }
    return null;
  };

  if (total === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Revenue Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No revenue data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Revenue Distribution</CardTitle>
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
          <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Agent Split</p>
            <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
              {formatPercentage(total > 0 ? (agentCommission / total) * 100 : 0)}
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Company Split</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {formatPercentage(total > 0 ? (safeCompanyDollar / total) * 100 : 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
