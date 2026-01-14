/**
 * Agent Leaderboard Component with Export Functionality
 * Displays agent performance metrics with pagination, search, filters, and export options
 * Design: Professional data table with sorting, filtering, and navigation controls
 */

import React, { useState, useEffect, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { ArrowUpDown, TrendingUp, Download, FileText, Sheet as SheetIcon, Medal, Trophy, Eye, Search, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import AgentCommissionModal from './AgentCommissionModal';
import AgentDetailsPanel from './AgentDetailsPanel';
import AgentCommissionBreakdown from './AgentCommissionBreakdown';
import { DotloopRecord } from '@/lib/csvParser';
import WinnersPodium from './WinnersPodium';
import { formatCurrency, formatPercentage } from '@/lib/formatUtils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface AgentLeaderboardProps {
  agents: AgentMetrics[];
  records?: DotloopRecord[];
}

type SortField = keyof AgentMetrics;
type FilterType = 'all' | 'top10' | 'bottom10';

const ITEMS_PER_PAGE = 10;

export default function AgentLeaderboardWithExport({ agents, records = [] }: AgentLeaderboardProps) {
  const [sortField, setSortField] = useState<SortField>('totalCommission');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [exportingAgent, setExportingAgent] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentMetrics | null>(null);
  const [commissionBreakdownAgent, setCommissionBreakdownAgent] = useState<AgentMetrics | null>(null);
  const [showPodium, setShowPodium] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Check if financial data exists
  const hasFinancialData = agents.some(a => a.totalCommission > 0 || a.companyDollar > 0);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleExportPDF = (agent: AgentMetrics) => {
    setExportingAgent(agent.agentName);
    try {
      exportAgentAsPDF(agent, records);
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
      exportAllAgentsAsCSV(filteredAndSortedAgents);
    } catch (error) {
      console.error('Error exporting all agents:', error);
    }
  };

  // Filter agents based on search and filter type
  const filteredAndSortedAgents = useMemo(() => {
    let result = [...agents];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(agent =>
        agent.agentName.toLowerCase().includes(query)
      );
    }

    // Apply filter type
    if (filterType === 'top10') {
      result = result
        .sort((a, b) => b.totalCommission - a.totalCommission)
        .slice(0, 10);
    } else if (filterType === 'bottom10') {
      result = result
        .sort((a, b) => a.totalCommission - b.totalCommission)
        .slice(0, 10);
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return result;
  }, [agents, searchQuery, filterType, sortField, sortDirection]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedAgents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAgents = filteredAndSortedAgents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
      className="cursor-pointer hover:bg-muted/50 transition-colors font-display font-bold text-foreground uppercase tracking-wider text-xs"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        {label}
        <ArrowUpDown className={`w-4 h-4 ${sortField === field ? 'opacity-100 text-primary' : 'opacity-50'}`} />
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-display font-semibold text-foreground">
              Agent Performance Leaderboard
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowPodium(!showPodium)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Trophy className={`w-4 h-4 ${showPodium ? 'text-yellow-500' : 'text-foreground'}`} />
              {showPodium ? 'Hide Podium' : 'Show Podium'}
            </Button>
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
        </div>

        {/* Search and Filter Controls */}
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search agent by name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-8"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setFilterType('all');
                setCurrentPage(1);
              }}
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
            >
              All Agents ({agents.length})
            </Button>
            <Button
              onClick={() => {
                setFilterType('top10');
                setCurrentPage(1);
              }}
              variant={filterType === 'top10' ? 'default' : 'outline'}
              size="sm"
            >
              Top 10 Performers
            </Button>
            <Button
              onClick={() => {
                setFilterType('bottom10');
                setCurrentPage(1);
              }}
              variant={filterType === 'bottom10' ? 'default' : 'outline'}
              size="sm"
            >
              Bottom 10
            </Button>
          </div>

          {/* Results Info */}
          <p className="text-sm text-muted-foreground">
            Showing {paginatedAgents.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredAndSortedAgents.length)} of {filteredAndSortedAgents.length} agents
          </p>
        </div>
      </div>

      {/* Winners Podium */}
      {agents.length >= 3 && showPodium && (
        <div className="px-6 pt-6">
          <WinnersPodium 
            agents={[...agents].sort((a, b) => b.totalCommission - a.totalCommission)} 
            transactions={records}
          />
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="relative overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
        <Table className="min-w-[1200px]">
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
              <TableHead className="w-16 text-center font-display font-bold text-foreground uppercase tracking-wider text-xs py-4">
                Rank
              </TableHead>
              <TableHead className="font-display font-bold text-foreground uppercase tracking-wider text-xs min-w-[200px]">
                Agent Name
              </TableHead>
              {hasFinancialData && <SortableHeader field="totalCommission" label="Total GCI" />}
              {hasFinancialData && <SortableHeader field="companyDollar" label="Company $" />}
              {hasFinancialData && <SortableHeader field="averageCommission" label="Avg GCI" />}
              <SortableHeader field="totalTransactions" label="Deals" />
              <SortableHeader field="closedDeals" label="Closed" />
              <SortableHeader field="closingRate" label="Close Rate" />
              <SortableHeader field="averageSalesPrice" label="Avg Price" />
              <SortableHeader field="averageDaysToClose" label="Avg Days" />
              <SortableHeader field="activeListings" label="Active" />
              <SortableHeader field="underContract" label="Pending" />
              {hasFinancialData && <SortableHeader field="buySideCommission" label="Buy Side" />}
              {hasFinancialData && <SortableHeader field="sellSideCommission" label="Sell Side" />}
              {hasFinancialData && <SortableHeader field="buySidePercentage" label="Buy %" />}
              {hasFinancialData && <SortableHeader field="sellSidePercentage" label="Sell %" />}
              <TableHead className="w-32 text-center font-display font-bold text-foreground uppercase tracking-wider text-xs sticky right-0 bg-card shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAgents.map((agent, index) => (
              <React.Fragment key={agent.agentName}>
                <TableRow className="hover:bg-muted/50 transition-colors">
                  <TableCell className="text-center font-display font-semibold text-primary">
                    {startIndex + index === 0 ? (
                      <div className="flex justify-center">
                        <Medal className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      </div>
                    ) : startIndex + index === 1 ? (
                      <div className="flex justify-center">
                        <Medal className="w-5 h-5 text-gray-400 fill-gray-400" />
                      </div>
                    ) : startIndex + index === 2 ? (
                      <div className="flex justify-center">
                        <Medal className="w-5 h-5 text-amber-700 fill-amber-700" />
                      </div>
                    ) : (
                      `#${startIndex + index + 1}`
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
                  {hasFinancialData && (
                    <TableCell className="font-semibold text-foreground">
                      {formatCurrency(agent.totalCommission)}
                    </TableCell>
                  )}
                  {hasFinancialData && (
                    <TableCell className="font-semibold text-primary">
                      {formatCurrency(agent.companyDollar)}
                    </TableCell>
                  )}
                  {hasFinancialData && (
                    <TableCell className="text-foreground">
                      {formatCurrency(agent.averageCommission)}
                    </TableCell>
                  )}
                  <TableCell className="text-foreground">
                    {agent.totalTransactions}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {agent.closedDeals}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={agent.closingRate}
                        className="w-12 h-2"
                      />
                      <span className="text-sm font-semibold text-foreground">
                        {formatPercentage(agent.closingRate)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">
                    {formatCurrency(agent.averageSalesPrice)}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {agent.averageDaysToClose} days
                  </TableCell>
                  <TableCell className="text-foreground">
                    {agent.activeListings}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {agent.underContract}
                  </TableCell>
                  {hasFinancialData && (
                    <TableCell className="text-foreground">
                      {formatCurrency(agent.buySideCommission)}
                    </TableCell>
                  )}
                  {hasFinancialData && (
                    <TableCell className="text-foreground">
                      {formatCurrency(agent.sellSideCommission)}
                    </TableCell>
                  )}
                  {hasFinancialData && (
                    <TableCell className="text-foreground">
                      {formatPercentage(agent.buySidePercentage)}
                    </TableCell>
                  )}
                  {hasFinancialData && (
                    <TableCell className="text-foreground">
                      {formatPercentage(agent.sellSidePercentage)}
                    </TableCell>
                  )}
                  <TableCell className="sticky right-0 bg-card shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                    <div className="flex justify-center gap-1">
                      <Button
                        onClick={() => setCommissionBreakdownAgent(agent)}
                        variant="ghost"
                        size="sm"
                        title="View commission breakdown"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => setSelectedAgent(agent)}
                        variant="ghost"
                        size="sm"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleExportPDF(agent)}
                        variant="ghost"
                        size="sm"
                        disabled={exportingAgent === agent.agentName}
                        title="Export as PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleExportCSV(agent)}
                        variant="ghost"
                        size="sm"
                        disabled={exportingAgent === agent.agentName}
                        title="Export as Excel"
                      >
                        <SheetIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, currentPage - 2) + i;
              return pageNum <= totalPages ? (
                <Button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                >
                  {pageNum}
                </Button>
              ) : null;
            })}
            <Button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Commission Breakdown Sheet */}
      {commissionBreakdownAgent && (
        <Sheet open={!!commissionBreakdownAgent} onOpenChange={() => setCommissionBreakdownAgent(null)}>
          <SheetContent side="right" className="w-full sm:w-[700px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{commissionBreakdownAgent.agentName} - Commission Breakdown</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <AgentCommissionBreakdown agent={commissionBreakdownAgent} transactions={records} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Agent Details Sheet */}
      {selectedAgent && (
        <Sheet open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
          <SheetContent side="right" className="w-full sm:w-[600px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{selectedAgent.agentName}</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <AgentDetailsPanel agent={selectedAgent} transactions={records} />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </Card>
  );
}
