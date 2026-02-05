/**
 * Lead Source Performance Chart
 * Donut chart showing distribution of transactions by lead source
 */

import { useRef, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface LeadSourceChartProps {
  data: Array<{
    label: string;
    value: number;
  }>;
  onSliceClick?: (label: string) => void;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#14b8a6', // teal
];

/**
 * Custom Tooltip Component
 */
function CustomTooltip({ active, payload, total }: any) {
  if (active && payload && payload.length) {
    const data = payload[0];
    const percent = ((data.value / total) * 100).toFixed(1);
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {data.value} transactions ({percent}%)
        </p>
      </div>
    );
  }
  return null;
}

export default function LeadSourceChart({ data, onSliceClick }: LeadSourceChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // Log when component mounts or data changes
  useEffect(() => {
    console.log('[LeadSourceChart] Mounted/Updated with data:', data.length, 'items, onSliceClick:', onSliceClick);
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
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={true}
          label={({ payload, percent }) => `${payload.label} (${(percent * 100).toFixed(1)}%)`}
          outerRadius={80}
          innerRadius={50}
          paddingAngle={2}
          fill="#8884d8"
          dataKey="value"
          className="cursor-pointer"
          animationBegin={0}
          animationDuration={1000}
          animationEasing="ease-out"
          style={{
            filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.15))'
          }}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={`url(#lead-gradient-${index})`}
              onClick={() => {
                console.log('[LeadSourceChart] Cell clicked:', entry.label, 'onSliceClick:', onSliceClick);
                onSliceClick && onSliceClick(entry.label);
              }}
              style={{
                transition: 'opacity 0.2s',
                cursor: 'pointer'
              }}
            />
          ))}
        </Pie>
        <defs>
          {data.map((entry, index) => {
            const baseColor = COLORS[index % COLORS.length];
            // Create radial gradient for pie slices
            return (
              <radialGradient key={`lead-gradient-${index}`} id={`lead-gradient-${index}`}>
                <stop offset="0%" stopColor={baseColor} stopOpacity={1} />
                <stop offset="100%" stopColor={baseColor} stopOpacity={0.7} />
              </radialGradient>
            );
          })}
        </defs>
        <Tooltip content={<CustomTooltip total={data.reduce((acc, curr) => acc + curr.value, 0)} />} />
      </PieChart>
      </ResponsiveContainer>
      
      {/* Custom Clickable Legend */}
      <div className="flex flex-wrap gap-2 justify-center mt-4">
      {data.map((entry, index) => {
        const total = data.reduce((acc, curr) => acc + curr.value, 0);
        const percent = ((entry.value / total) * 100).toFixed(1);
        const color = COLORS[index % COLORS.length];
        
        return (
          <button
            key={`legend-${index}`}
            onClick={() => {
              console.log('[LeadSourceChart] Legend clicked:', entry.label);
              onSliceClick && onSliceClick(entry.label);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/50 hover:bg-card border border-border hover:border-primary/50 transition-all cursor-pointer group"
          >
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: color }}
            />
            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {entry.label}
            </span>
            <span className="text-sm text-muted-foreground">({percent}%)</span>
          </button>
        );
      })}
      </div>
    </div>
  );
}
