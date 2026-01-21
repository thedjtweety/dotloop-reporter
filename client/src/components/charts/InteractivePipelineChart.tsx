import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Zap } from 'lucide-react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, PolarAngleAxis, PolarRadiusAxis, RadarChart, Radar
} from 'recharts';
import { DotloopRecord } from '@/lib/csvParser';
import { formatNumber } from '@/lib/formatUtils';

interface InteractivePipelineChartProps {
  data: DotloopRecord[];
}

type VisualizationMode = 'funnel' | 'radial';

const PIPELINE_COLORS = {
  'Closed': '#10b981',      // Emerald green
  'Active Listings': '#3b82f6',  // Blue
  'Under Contract': '#f59e0b',   // Amber
  'Archived': '#ef4444',    // Red
};

export default function InteractivePipelineChart({ data }: InteractivePipelineChartProps) {
  const [mode, setMode] = useState<VisualizationMode>('funnel');

  // Calculate pipeline breakdown
  const pipelineData = React.useMemo(() => {
    const stages = {
      'Closed': 0,
      'Active Listings': 0,
      'Under Contract': 0,
      'Archived': 0,
    };

    data.forEach(record => {
      const status = record.loopStatus?.toLowerCase() || '';
      if (status.includes('closed') || status.includes('sold')) {
        stages['Closed']++;
      } else if (status.includes('active')) {
        stages['Active Listings']++;
      } else if (status.includes('contract') || status.includes('pending')) {
        stages['Under Contract']++;
      } else if (status.includes('archived')) {
        stages['Archived']++;
      }
    });

    return Object.entries(stages).map(([name, value]) => ({
      name,
      value,
      color: PIPELINE_COLORS[name as keyof typeof PIPELINE_COLORS],
    }));
  }, [data]);

  // Prepare funnel data (sorted by value descending)
  const funnelData = React.useMemo(() => {
    return [...pipelineData].sort((a, b) => b.value - a.value).map((item, index) => ({
      ...item,
      width: 100 - (index * 15),
      fill: item.color,
    }));
  }, [pipelineData]);

  // Prepare radial data (for radar/radial chart)
  const radialData = React.useMemo(() => {
    return pipelineData.map(item => ({
      name: item.name,
      value: item.value,
      fill: item.color,
    }));
  }, [pipelineData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border p-2 rounded-lg shadow-lg text-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-foreground">{formatNumber(data.value)} deals</p>
        </div>
      );
    }
    return null;
  };

  const renderFunnelChart = () => {
    const maxValue = Math.max(...funnelData.map(d => d.value));
    const funnelHeight = 80;

    return (
      <div className="w-full h-[400px] flex flex-col justify-center items-center gap-4 p-4">
        {funnelData.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          const nextPercentage = index < funnelData.length - 1 
            ? (funnelData[index + 1].value / maxValue) * 100 
            : 0;

          return (
            <div key={item.name} className="w-full">
              {/* Funnel segment */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="relative transition-all duration-300 hover:shadow-lg rounded-lg cursor-pointer group"
                  style={{
                    width: `${percentage}%`,
                    height: `${funnelHeight}px`,
                    backgroundColor: item.color,
                    opacity: 0.85,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}
                >
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-white font-semibold">
                    <span className="text-sm">{item.name}</span>
                    <span className="text-lg font-bold">{formatNumber(item.value)}</span>
                  </div>

                  {/* Hover tooltip */}
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-background border border-border p-2 rounded-lg shadow-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <p>{((item.value / data.length) * 100).toFixed(1)}% of total</p>
                  </div>
                </div>

                {/* Connector line to next stage */}
                {index < funnelData.length - 1 && (
                  <div className="relative w-full h-8 flex justify-center">
                    <svg className="w-full h-full" viewBox="0 0 100 32" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={item.color} stopOpacity="0.3" />
                          <stop offset="100%" stopColor={funnelData[index + 1].color} stopOpacity="0.3" />
                        </linearGradient>
                      </defs>
                      <polygon
                        points={`${(100 - percentage) / 2},0 ${100 - (100 - percentage) / 2},0 ${(100 - nextPercentage) / 2},32 ${100 - (100 - nextPercentage) / 2},32`}
                        fill={`url(#gradient-${index})`}
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderRadialChart = () => {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={radialData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis />
          <Radar name="Pipeline" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  const renderRadialBarChart = () => {
    // Create a circular bar chart using PieChart as base
    const radius = 120;
    const innerRadius = 60;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={radialData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={radius}
            paddingAngle={5}
            dataKey="value"
            label={({ name, value }) => `${name}: ${formatNumber(value)}`}
          >
            {radialData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Pipeline Breakdown</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={mode === 'funnel' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('funnel')}
              className="gap-2"
            >
              <Zap className="h-4 w-4" />
              Funnel
            </Button>
            <Button
              variant={mode === 'radial' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('radial')}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Radial
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          {mode === 'funnel' ? renderFunnelChart() : renderRadialBarChart()}
        </div>
      </CardContent>
    </Card>
  );
}
