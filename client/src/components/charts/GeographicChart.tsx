/**
 * GeographicChart Component
 * Displays geographic performance by state
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, TooltipProps } from 'recharts';
import { ChartData } from '@/lib/csvParser';
import { useRef, useEffect, useState } from 'react';
import { Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PropertyMapModal from '@/components/PropertyMapModal';

interface GeographicChartProps {
  data: ChartData[];
  onBarClick?: (label: string) => void;
  transactions?: any[];
}

const COLORS = ['#1e3a5f', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CustomTooltip = ({ active, payload, label, total }: TooltipProps<number, string> & { total: number }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value as number;
    const percentage = ((value / total) * 100).toFixed(2);
    
    return (
      <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        <div className="flex flex-col gap-1 text-sm">
          <p className="text-primary">
            Count: <span className="font-medium">{value}</span>
          </p>
          <p className="text-foreground">
            Share: <span className="font-medium">{percentage}%</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function GeographicChart({ data, onBarClick, transactions = [] }: GeographicChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [showMap, setShowMap] = useState(false);

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

  if (showMap && transactions.length > 0) {
    return (
      <PropertyMapModal
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        transactions={transactions}
        title="Property Locations by Geographic Distribution"
      />
    );
  }

  return (
    <div ref={chartRef}>
      <div className="flex items-center justify-between mb-4">
        <div />
        <Button
          onClick={() => setShowMap(true)}
          variant="outline"
          size="sm"
          className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-800"
          disabled={transactions.length === 0}
        >
          <MapIcon className="w-4 h-4" />
          Map View
        </Button>
      </div>
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
        <Bar 
          dataKey="value" 
          fill="#1e3a5f" 
          radius={[8, 8, 0, 0]}
          onClick={(data) => onBarClick && onBarClick(data.label)}
          className="cursor-pointer"
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
          }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={`url(#geo-gradient-${index})`} />
          ))}
        </Bar>
        <defs>
          {data.map((entry, index) => {
            const baseColor = COLORS[index % COLORS.length];
            return (
              <linearGradient key={`geo-gradient-${index}`} id={`geo-gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={baseColor} stopOpacity={0.9} />
                <stop offset="100%" stopColor={baseColor} stopOpacity={0.6} />
              </linearGradient>
            );
          })}
        </defs>
      </BarChart>
    </ResponsiveContainer>
    </div>
  );
}
