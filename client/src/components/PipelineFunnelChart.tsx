import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { DotloopRecord } from '@/lib/csvParser';
import { formatCurrency, formatNumber } from '@/lib/formatUtils';

interface PipelineStage {
  id: 'closed' | 'active' | 'contract' | 'archived';
  label: string;
  count: number;
  percentage: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  records: DotloopRecord[];
}

interface PipelineFunnelChartProps {
  records: DotloopRecord[];
  onStageClick: (stage: PipelineStage) => void;
}

/**
 * Interactive funnel chart showing pipeline stages
 * Displays Closed, Active, Under Contract, and Archived deals
 * Each segment is clickable for drill-down
 */
export function PipelineFunnelChart({ records, onStageClick }: PipelineFunnelChartProps) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  // Calculate pipeline stages
  const closed = records.filter(r => r.loopStatus?.toLowerCase().includes('closed') || r.loopStatus?.toLowerCase().includes('sold'));
  const active = records.filter(r => r.loopStatus?.toLowerCase().includes('active'));
  const contract = records.filter(r => r.loopStatus?.toLowerCase().includes('contract') || r.loopStatus?.toLowerCase().includes('pending'));
  const archived = records.filter(r => r.loopStatus?.toLowerCase().includes('archived'));

  const total = records.length;

  const stages: PipelineStage[] = [
    {
      id: 'closed',
      label: 'Closed',
      count: closed.length,
      percentage: total > 0 ? (closed.length / total) * 100 : 0,
      color: '#10b981',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500',
      icon: '✓',
      records: closed,
    },
    {
      id: 'active',
      label: 'Active Listings',
      count: active.length,
      percentage: total > 0 ? (active.length / total) * 100 : 0,
      color: '#3b82f6',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500',
      icon: '🏠',
      records: active,
    },
    {
      id: 'contract',
      label: 'Under Contract',
      count: contract.length,
      percentage: total > 0 ? (contract.length / total) * 100 : 0,
      color: '#f59e0b',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500',
      icon: '📋',
      records: contract,
    },
    {
      id: 'archived',
      label: 'Archived',
      count: archived.length,
      percentage: total > 0 ? (archived.length / total) * 100 : 0,
      color: '#ef4444',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500',
      icon: '📦',
      records: archived,
    },
  ];

  // Calculate widths for funnel effect (decreasing from top to bottom)
  const getWidth = (index: number) => {
    const baseWidth = 100 - index * 15;
    return Math.max(baseWidth, 40);
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Pipeline Breakdown</h3>
          <p className="text-sm text-muted-foreground">Market Penetration Analysis</p>
        </div>

        {/* Funnel Visualization */}
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.id} className="flex flex-col items-center">
              <button
                onClick={() => onStageClick(stage)}
                onMouseEnter={() => setHoveredStage(stage.id)}
                onMouseLeave={() => setHoveredStage(null)}
                className={`w-full transition-all duration-300 cursor-pointer group`}
                style={{ maxWidth: `${getWidth(index)}%` }}
              >
                <div
                  className={`
                    relative px-6 py-4 rounded-lg border-2 transition-all duration-300
                    ${hoveredStage === stage.id ? 'shadow-lg scale-105' : 'hover:shadow-md'}
                    ${stage.bgColor} ${stage.borderColor}
                  `}
                  style={{
                    borderColor: hoveredStage === stage.id ? stage.color : undefined,
                    backgroundColor: hoveredStage === stage.id ? `${stage.color}20` : undefined,
                  }}
                >
                  {/* Status Label and Count */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{stage.icon}</span>
                      <h4 className="font-semibold text-foreground">{stage.label}</h4>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatNumber(stage.count)} deals
                    </span>
                  </div>

                  {/* Percentage */}
                  <div className="text-center">
                    <div
                      className="text-3xl font-bold"
                      style={{ color: stage.color }}
                    >
                      {stage.percentage.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">of pipeline</p>
                  </div>

                  {/* Hover Indicator */}
                  <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border-2 border-dashed" style={{ borderColor: stage.color }} />
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Analyzing</p>
            <p className="text-2xl font-bold text-foreground">{formatNumber(total)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Conversion Rate</p>
            <p className="text-2xl font-bold text-emerald-500">
              {total > 0 ? ((closed.length / total) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        {/* Click Hint */}
        <p className="text-xs text-muted-foreground text-center">
          Click any segment to view detailed transactions
        </p>
      </div>
    </Card>
  );
}
