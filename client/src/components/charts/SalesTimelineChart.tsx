/**
 * SalesTimelineChart Component
 * Displays sales performance over time using a line chart
 */

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartData } from '@/lib/csvParser';

interface SalesTimelineChartProps {
  data: ChartData[];
}

export default function SalesTimelineChart({ data }: SalesTimelineChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-foreground/70">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
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
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
          }}
          formatter={(value: number, name: string) => [
            value, 
            name === 'value' ? 'Transactions' : '3-Month Moving Avg'
          ]}
        />
        <Legend verticalAlign="top" height={36} />
        <Bar 
          dataKey="value" 
          fill="#1e3a5f" 
          radius={[4, 4, 0, 0]} 
          name="Transactions"
          barSize={40}
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
  );
}
