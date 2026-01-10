import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/formatUtils';
import { AgentMetrics } from '@/lib/csvParser';

interface AgentMixChartProps {
  agents: AgentMetrics[];
}

export default function AgentMixChart({ agents }: AgentMixChartProps) {
  // Sort by total commission and take top 5
  const topAgents = React.useMemo(() => {
    return [...agents]
      .sort((a, b) => b.totalCommission - a.totalCommission)
      .slice(0, 5)
      .map(agent => ({
        name: agent.agentName.split(' ')[0], // First name only for cleaner labels
        fullName: agent.agentName,
        buySide: agent.buySideCommission,
        sellSide: agent.sellSideCommission,
        total: agent.totalCommission
      }));
  }, [agents]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border p-2 rounded-lg shadow-lg text-sm">
          <p className="font-semibold mb-1">{data.fullName}</p>
          <p className="text-blue-500">Buy Side: {formatCurrency(data.buySide)}</p>
          <p className="text-emerald-500">Sell Side: {formatCurrency(data.sellSide)}</p>
          <div className="border-t border-border mt-1 pt-1">
            <p className="font-medium">Total: {formatCurrency(data.total)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (topAgents.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Top Agent Mix</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No agent data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Top 5 Agents: Business Mix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topAgents} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={80}
                tick={{ fill: 'currentColor', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="buySide" name="Buy Side" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="sellSide" name="Sell Side" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
