/**
 * Agent Leaderboard Component
 * Displays agent performance metrics with pagination, search, filters, and sticky header
 * Design: Professional data table with advanced navigation and filtering
 */

import { useState, useMemo } from 'react';
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
import {
  ArrowUpDown,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Users,
} from 'lucide-react';

interface AgentLeaderboardProps {
  agents: AgentMetrics[];
}

type SortField = keyof AgentMetrics;
type FilterType = 'all' | 'top10' | 'bottom10' | 'search';

const ITEMS_PER_PAGE = 10;

export default function AgentLeaderboard({ agents }: AgentLeaderboardProps) {
  const [sortField, setSortField] = useState<SortField>('totalCommission');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Apply sorting
  const sortedAgents = useMemo(() => {
    return [...agents].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [agents, sortField, sortDirection]);

  // Apply filters
  const filteredAgents = useMemo(() => {
    let result = sortedAgents;

    // Search filter
    if (searchQuery.trim()) {
      result = result.filter((agent) =>
        agent.agentName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Quick filters
    if (activeFilter === 'top10') {
      result = result.slice(0, 10);
    } else if (activeFilter === 'bottom10') {
      result = result.slice(-10).reverse();
    }

    return result;
  }, [sortedAgents, searchQuery, activeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAgents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAgents = filteredAgents.slice(startIndex, endIndex);

  // Reset page when filters change
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

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
      className="cursor-pointer hover:bg-muted/50 transition-colors sticky top-0 bg-muted/30 z-10"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        {label}
        <ArrowUpDown
          className={`w-4 h-4 transition-opacity ${
            sortField === field ? 'opacity-100' : 'opacity-30'
          }`}
        />
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
    <Card className="overflow-hidden flex flex-col">
      {/* Header Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-display font-semibold text-foreground">
            Agent Performance Leaderboard
          </h2>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search agent by name..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            All Agents ({filteredAgents.length})
          </button>
          <button
            onClick={() => handleFilterChange('top10')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'top10'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            Top 10
          </button>
          <button
            onClick={() => handleFilterChange('bottom10')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'bottom10'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            Bottom 10
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 sticky top-0 z-20">
              <TableHead className="w-12 text-center font-display font-semibold sticky left-0 bg-muted/30 z-20">
                Rank
              </TableHead>
              <TableHead className="font-display font-semibold sticky left-12 bg-muted/30 z-20">
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
            {paginatedAgents.map((agent, index) => (
              <TableRow
                key={agent.agentName}
                className="hover:bg-muted/50 transition-colors"
              >
                <TableCell className="text-center font-display font-semibold text-primary sticky left-0 bg-inherit">
                  #{startIndex + index + 1}
                </TableCell>
                <TableCell className="font-medium text-foreground sticky left-12 bg-inherit">
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

      {/* Footer with Pagination */}
      <div className="p-4 bg-muted/30 border-t border-border">
        <div className="flex items-center justify-between">
          <p className="text-xs text-foreground">
            Showing {paginatedAgents.length > 0 ? startIndex + 1 : 0}-
            {Math.min(endIndex, filteredAgents.length)} of {filteredAgents.length}{' '}
            agent{filteredAgents.length !== 1 ? 's' : ''}
            {searchQuery && ` (filtered from ${agents.length} total)`}
          </p>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
