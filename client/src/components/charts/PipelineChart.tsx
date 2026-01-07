/**
 * PipelineChart Component
 * Displays transaction pipeline breakdown by status using a bar chart
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, TooltipProps } from 'recharts';
import { ChartData } from '@/lib/csvParser';

interface PipelineChartProps {
  data: ChartData[];
}

const COLORS = ['#1e3a5f', '#10b981', '#f59e0b', '#ef4444'];

const CustomTooltip = ({ active, payload, label, total }: TooltipProps<number, string> & { total: number }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value as number;
    const percentage = ((value / total) * 100).toFixed(1);
    
    return (
      <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        <div className="flex flex-col gap-1 text-sm">
          <p className="text-primary">
            Count: <span className="font-medium">{value}</span>
          </p>
          <p className="text-muted-foreground">
            Share: <span className="font-medium">{percentage}%</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function PipelineChart({ data }: PipelineChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="label"
          angle={-45}
          textAnchor="end"
          height={100}
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
        <Tooltip content={<CustomTooltip total={data.reduce((acc, curr) => acc + curr.value, 0)} />} />
        <Bar dataKey="value" fill="#1e3a5f" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
