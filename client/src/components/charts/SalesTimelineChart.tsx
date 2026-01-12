/**
 * SalesTimelineChart Component
 * Displays sales performance over time using a line chart
 */

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartData } from '@/lib/csvParser';
import { useRef, useEffect } from 'react';

interface SalesTimelineChartProps {
  data: ChartData[];
}

export default function SalesTimelineChart({ data }: SalesTimelineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add entrance animation
    if (chartRef.current) {
      chartRef.current.style.opacity = '0';
      chartRef.current.style.transform = 'translateY(20px)';
      requestAnimationFrame(() => {
        if (chartRef.current) {
          chartRef.current.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
          chartRef.current.style.opacity = '1';
          chartRef.current.style.transform = 'translateY(0)';
        }
      });
    }
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-foreground">
        No data available
      </div>
    );
  }

  return (
    <div ref={chartRef}>
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
          fill="url(#barGradient)" 
          radius={[4, 4, 0, 0]} 
          name="Transactions"
          barSize={40}
          animationBegin={0}
          animationDuration={1000}
          animationEasing="ease-out"
        />
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#a855f7" stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <Line
          type="monotone"
          dataKey="movingAverage"
          stroke="#10b981"
          strokeWidth={3}
          dot={false}
          name="3-Month Moving Avg"
          animationBegin={400}
          animationDuration={1200}
          animationEasing="ease-in-out"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))'
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
    </div>
  );
}
