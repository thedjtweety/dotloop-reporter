import { AgentMetrics } from '@/lib/csvParser';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/formatUtils';

interface AgentComparisonBarsProps {
  agents: AgentMetrics[];
  metric: 'totalCommission' | 'totalTransactions' | 'closingRate' | 'averageDaysToClose';
  maxValue?: number;
  onAgentClick?: (agent: AgentMetrics) => void;
}

export default function AgentComparisonBars({
  agents,
  metric,
  maxValue,
  onAgentClick
}: AgentComparisonBarsProps) {
  if (agents.length === 0) {
    return (
      <Card className="p-6 text-center text-foreground">
        No agents to compare
      </Card>
    );
  }

  // Get metric values
  const values = agents.map(agent => {
    switch (metric) {
      case 'totalCommission':
        return agent.totalCommission || 0;
      case 'totalTransactions':
        return agent.totalTransactions || 0;
      case 'closingRate':
        return agent.closingRate || 0;
      case 'averageDaysToClose':
        return agent.averageDaysToClose || 0;
      default:
        return 0;
    }
  });

  // Calculate max value for scaling
  const max = maxValue || Math.max(...values, 1);

  // Get metric label and formatter
  const getLabel = (value: number): string => {
    switch (metric) {
      case 'totalCommission':
        return formatCurrency(value);
      case 'totalTransactions':
        return formatNumber(value);
      case 'closingRate':
        return `${value.toFixed(1)}%`;
      case 'averageDaysToClose':
        return `${Math.round(value)} days`;
      default:
        return value.toString();
    }
  };

  // Get color based on metric performance
  const getBarColor = (index: number, value: number): string => {
    const percentage = (value / max) * 100;
    
    // Color gradient based on performance
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {agents.map((agent, index) => {
          const value = values[index];
          const percentage = (value / max) * 100;

          return (
            <div
              key={agent.agentName}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onAgentClick?.(agent)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground text-sm truncate">
                  {agent.agentName}
                </span>
                <span className="text-sm font-semibold text-foreground ml-2 whitespace-nowrap">
                  {getLabel(value)}
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${getBarColor(index, value)}`}
                  style={{ width: `${Math.max(percentage, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-foreground">80%+</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-foreground">60-80%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-foreground">40-60%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-foreground">&lt;40%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
