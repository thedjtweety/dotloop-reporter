/**
 * Commission Ratio Chart Component
 * Displays buy/sell commission split as a pie or donut chart for individual agents
 * Design: Clean, professional visualization with color-coded segments
 */

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { AgentMetrics } from '@/lib/csvParser';
import { Card } from '@/components/ui/card';

interface CommissionRatioChartProps {
  agent: AgentMetrics;
  chartType?: 'pie' | 'donut';
}

const COLORS = {
  buy: '#3b82f6', // Blue for buy side
  sell: '#10b981', // Green for sell side
};

export default function CommissionRatioChart({
  agent,
  chartType = 'donut',
}: CommissionRatioChartProps) {
  // Prepare data for the chart
  const chartData = [
    {
      name: 'Buy Side',
      value: agent.buySideCommission,
      percentage: agent.buySidePercentage,
    },
    {
      name: 'Sell Side',
      value: agent.sellSideCommission,
      percentage: agent.sellSidePercentage,
    },
  ].filter(item => item.value > 0); // Only show segments with values

  // If no commission data, show placeholder
  if (chartData.length === 0) {
    return (
      <Card className="p-6 bg-muted/30">
        <div className="text-center text-foreground text-sm">
          No commission data available for {agent.agentName}
        </div>
      </Card>
    );
  }

  const innerRadius = chartType === 'donut' ? 60 : 0;

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-display font-semibold text-foreground">
          {agent.agentName}
        </h3>
        <p className="text-sm text-foreground">
          Total Commission: ${(agent.totalCommission / 1000).toFixed(1)}K
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) =>
              `${name}: ${percentage.toFixed(1)}%`
            }
            outerRadius={100}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.name === 'Buy Side' ? COLORS.buy : COLORS.sell}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) =>
              `$${(value / 1000).toFixed(1)}K`
            }
            labelFormatter={(label: string) => label}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => {
              const item = chartData.find(d => d.name === value);
              return `${value}: $${(item?.value || 0 / 1000).toFixed(1)}K`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs font-semibold text-blue-600 uppercase mb-1">
            Buy Side
          </div>
          <div className="text-lg font-bold text-blue-900">
            ${(agent.buySideCommission / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-blue-700 mt-1">
            {agent.buySidePercentage.toFixed(1)}% of total
          </div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-xs font-semibold text-green-600 uppercase mb-1">
            Sell Side
          </div>
          <div className="text-lg font-bold text-green-900">
            ${(agent.sellSideCommission / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-green-700 mt-1">
            {agent.sellSidePercentage.toFixed(1)}% of total
          </div>
        </div>
      </div>
    </Card>
  );
}
