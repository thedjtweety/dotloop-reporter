/**
 * Agent Leaderboard Component
 * Displays agent performance metrics in a sortable table with key KPIs
 * Design: Professional data table with color-coded performance indicators
 */

import { useState } from 'react';
import { AgentMetrics } from '@/lib/csvParser';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, TrendingUp } from 'lucide-react';

interface AgentLeaderboardProps {
  agents: AgentMetrics[];
}

type SortField = keyof AgentMetrics;

export default function AgentLeaderboard({ agents }: AgentLeaderboardProps) {
  const [sortField, setSortField] = useState<SortField>('totalCommission');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedAgents = [...agents].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const getPerformanceBadge = (closingRate: number) => {
    if (closingRate >= 50) return 'bg-accent text-foreground-foreground';
    if (closingRate >= 30) return 'bg-primary/20 text-primary';
    return 'bg-secondary/20 text-secondary-foreground';
  };

  const SortableHeader = ({
    field,
    label,
  }: {
    field: SortField;
    label: string;
  }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        {label}
        <ArrowUpDown className="w-4 h-4 opacity-50" />
      </div>
    </TableHead>
  );

  if (agents.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-foreground">
          No agent data available
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-display font-semibold text-foreground">
            Agent Performance Leaderboard
          </h2>
        </div>
        <p className="text-sm text-foreground">
          Click column headers to sort. Rankings based on total commission earned.
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-12 text-center font-display font-semibold">
                Rank
              </TableHead>
              <TableHead className="font-display font-semibold">
                Agent Name
              </TableHead>
              <SortableHeader field="totalCommission" label="Total Commission" />
              <SortableHeader
                field="averageCommission"
                label="Avg Commission"
              />
              <SortableHeader field="totalTransactions" label="Transactions" />
              <SortableHeader field="closedDeals" label="Closed" />
              <SortableHeader field="closingRate" label="Close Rate" />
              <SortableHeader field="averageSalesPrice" label="Avg Sale Price" />
              <SortableHeader field="averageDaysToClose" label="Avg Days" />
              <SortableHeader field="activeListings" label="Active" />
              <SortableHeader field="underContract" label="Pending" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAgents.map((agent, index) => (
              <TableRow
                key={agent.agentName}
                className="hover:bg-muted/50 transition-colors"
              >
                <TableCell className="text-center font-display font-semibold text-primary">
                  #{index + 1}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {agent.agentName}
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  ${(agent.totalCommission / 1000).toFixed(1)}K
                </TableCell>
                <TableCell className="text-foreground">
                  ${(agent.averageCommission / 1000).toFixed(1)}K
                </TableCell>
                <TableCell className="text-center font-medium">
                  {agent.totalTransactions}
                </TableCell>
                <TableCell className="text-center font-medium text-foreground">
                  {agent.closedDeals}
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={getPerformanceBadge(agent.closingRate)}>
                    {agent.closingRate.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-foreground">
                  ${(agent.averageSalesPrice / 1000).toFixed(0)}K
                </TableCell>
                <TableCell className="text-center text-foreground">
                  {agent.averageDaysToClose} days
                </TableCell>
                <TableCell className="text-center font-medium">
                  {agent.activeListings}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {agent.underContract}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="p-4 bg-muted/30 border-t border-border text-xs text-foreground">
        <p>
          Showing {sortedAgents.length} agent{sortedAgents.length !== 1 ? 's' : ''}
          . Metrics are calculated from all transactions in the uploaded data.
        </p>
      </div>
    </Card>
  );
}
