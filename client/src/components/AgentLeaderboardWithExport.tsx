/**
 * Agent Leaderboard Component with Export Functionality
 * Displays agent performance metrics with download options for PDF and Excel
 * Design: Professional data table with color-coded performance indicators and export buttons
 */

import React, { useState } from 'react';
import { AgentMetrics } from '@/lib/csvParser';
import { exportAgentAsCSV, exportAgentAsPDF, exportAllAgentsAsCSV } from '@/lib/exportReports';
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
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowUpDown, TrendingUp, Download, FileText, Sheet, BarChart3, Medal } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import AgentCommissionModal from './AgentCommissionModal';
import AgentDetailsPanel from './AgentDetailsPanel';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { DotloopRecord } from '@/lib/csvParser';
import WinnersPodium from './WinnersPodium';

interface AgentLeaderboardProps {
  agents: AgentMetrics[];
  records?: DotloopRecord[];
}

type SortField = keyof AgentMetrics;

export default function AgentLeaderboardWithExport({ agents, records = [] }: AgentLeaderboardProps) {
  const [sortField, setSortField] = useState<SortField>('totalCommission');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [exportingAgent, setExportingAgent] = useState<string | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExportPDF = (agent: AgentMetrics) => {
    setExportingAgent(agent.agentName);
    try {
      exportAgentAsPDF(agent);
      setTimeout(() => setExportingAgent(null), 1000);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setExportingAgent(null);
    }
  };

  const handleExportCSV = (agent: AgentMetrics) => {
    setExportingAgent(agent.agentName);
    try {
      exportAgentAsCSV(agent);
      setTimeout(() => setExportingAgent(null), 500);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      setExportingAgent(null);
    }
  };

  const handleExportAllCSV = () => {
    try {
      exportAllAgentsAsCSV(agents);
    } catch (error) {
      console.error('Error exporting all agents:', error);
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
    if (closingRate >= 50) return 'bg-accent text-accent-foreground';
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
        <div className="text-center text-muted-foreground">
          No agent data available
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-display font-semibold text-foreground">
              Agent Performance Leaderboard
            </h2>
          </div>
          <Button
            onClick={handleExportAllCSV}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export All
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Click column headers to sort. Download individual reports using the action buttons.
        </p>
      </div>

      {/* Winners Podium */}
      {agents.length >= 3 && (
        <div className="px-6 pt-6">
          <WinnersPodium agents={[...agents].sort((a, b) => b.totalCommission - a.totalCommission)} />
        </div>
      )}

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
              <SortableHeader field="buySideCommission" label="Buy Side" />
              <SortableHeader field="sellSideCommission" label="Sell Side" />
              <SortableHeader field="buySidePercentage" label="Buy %" />
              <SortableHeader field="sellSidePercentage" label="Sell %" />
              <TableHead className="w-32 text-center font-display font-semibold">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAgents.map((agent, index) => (
              <React.Fragment key={agent.agentName}>
                <TableRow
                  className="hover:bg-muted/50 transition-colors"
                >
                <TableCell className="text-center font-display font-semibold text-primary">
                  {index === 0 ? (
                    <div className="flex justify-center">
                      <Medal className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    </div>
                  ) : index === 1 ? (
                    <div className="flex justify-center">
                      <Medal className="w-5 h-5 text-gray-400 fill-gray-400" />
                    </div>
                  ) : index === 2 ? (
                    <div className="flex justify-center">
                      <Medal className="w-5 h-5 text-amber-700 fill-amber-700" />
                    </div>
                  ) : (
                    `#${index + 1}`
                  )}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {agent.agentName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {agent.agentName}
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-accent">
                  ${(agent.totalCommission / 1000).toFixed(1)}K
                </TableCell>
                <TableCell className="text-muted-foreground">
                  ${(agent.averageCommission / 1000).toFixed(1)}K
                </TableCell>
                <TableCell className="text-center font-medium">
                  {agent.totalTransactions}
                </TableCell>
                <TableCell className="text-center font-medium text-accent">
                  {agent.closedDeals}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Badge className={getPerformanceBadge(agent.closingRate)}>
                      {agent.closingRate.toFixed(1)}%
                    </Badge>
                    <Progress value={agent.closingRate} className="h-1.5 w-16" />
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  ${(agent.averageSalesPrice / 1000).toFixed(0)}K
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {agent.averageDaysToClose} days
                </TableCell>
                <TableCell className="text-center font-medium">
                  {agent.activeListings}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {agent.underContract}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  ${(agent.buySideCommission / 1000).toFixed(1)}K
                </TableCell>
                <TableCell className="text-muted-foreground">
                  ${(agent.sellSideCommission / 1000).toFixed(1)}K
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {agent.buySidePercentage.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {agent.sellSidePercentage.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex gap-1 justify-center">
                    <AgentCommissionModal agent={agent} />
                    <Button
                      onClick={() => setExpandedAgent(expandedAgent === agent.agentName ? null : agent.agentName)}
                      variant="ghost"
                      size="sm"
                      title="View details"
                      className="h-8 w-8 p-0"
                    >
                      {expandedAgent === agent.agentName ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      onClick={() => handleExportPDF(agent)}
                      variant="ghost"
                      size="sm"
                      title="Export as PDF"
                      disabled={exportingAgent === agent.agentName}
                      className="h-8 w-8 p-0"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleExportCSV(agent)}
                      variant="ghost"
                      size="sm"
                      title="Export as Excel"
                      disabled={exportingAgent === agent.agentName}
                      className="h-8 w-8 p-0"
                    >
                      <Sheet className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
                </TableRow>
                {expandedAgent === agent.agentName && (
                  <TableRow className="bg-muted/20">
                    <TableCell colSpan={16} className="p-0">
                      <AgentDetailsPanel agent={agent} transactions={records} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="p-4 bg-muted/30 border-t border-border text-xs text-muted-foreground">
        <p>
          Showing {sortedAgents.length} agent{sortedAgents.length !== 1 ? 's' : ''}
          . Download individual reports for performance reviews and team meetings.
        </p>
      </div>
    </Card>
  );
}
