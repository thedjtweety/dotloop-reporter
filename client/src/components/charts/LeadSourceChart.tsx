/**
 * LeadSourceChart Component
 * Displays lead source distribution using a pie chart
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, TooltipProps } from 'recharts';
import { ChartData } from '@/lib/csvParser';

interface LeadSourceChartProps {
  data: ChartData[];
}

const COLORS = ['#1e3a5f', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CustomTooltip = ({ active, payload, total }: TooltipProps<number, string> & { total: number }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = payload[0].value as number;
    const percentage = ((value / total) * 100).toFixed(1);
    
    return (
      <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
        <p className="font-semibold text-foreground mb-1">{data.label}</p>
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

export default function LeadSourceChart({ data }: LeadSourceChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ label, percentage }) => `${label}: ${percentage}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip total={data.reduce((acc, curr) => acc + curr.value, 0)} />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
