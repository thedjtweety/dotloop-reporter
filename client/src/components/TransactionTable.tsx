/**
 * Transaction Table Component
 * Reusable component to display a list of transactions
 * Optimized for mobile responsiveness
 */

import { DotloopRecord } from '@/lib/csvParser';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Clock, Archive, AlertCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import DotloopLogo from './DotloopLogo';
import { useState, useMemo } from 'react';

interface TransactionTableProps {
  transactions: DotloopRecord[];
  limit?: number;
  compact?: boolean;
}

export default function TransactionTable({ transactions, limit, compact = false }: TransactionTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 12;

  // Filter transactions based on search query
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const query = searchQuery.toLowerCase();
    return transactions.filter(t => 
      t.loopName?.toLowerCase().includes(query) ||
      t.address?.toLowerCase().includes(query) ||
      t.loopStatus?.toLowerCase().includes(query) ||
      t.agents?.toLowerCase().includes(query)
    );
  }, [transactions, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayTransactions = limit ? filteredTransactions.slice(0, limit) : filteredTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Closed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'Active Listing':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'Under Contract':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'Archived':
        return <Archive className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Closed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 whitespace-nowrap">Closed</Badge>;
      case 'Active Listing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 whitespace-nowrap">Active</Badge>;
      case 'Under Contract':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 whitespace-nowrap">Under Contract</Badge>;
      case 'Archived':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 whitespace-nowrap">Archived</Badge>;
      default:
        return <Badge variant="outline" className="whitespace-nowrap">{status || 'Unknown'}</Badge>;
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-foreground">
        No transactions found.
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Search Box - only show if not using limit prop */}
      {!limit && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by property, address, status, or agent..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2"
          />
        </div>
      )}

      {/* Results count */}
      {!limit && (
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
          {searchQuery && ` (filtered from ${transactions.length} total)`}
        </div>
      )}

      <Table className="w-full">
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="font-semibold text-xs py-2 px-3 min-w-[140px]">Status</TableHead>
              <TableHead className="font-semibold text-xs py-2 px-3 min-w-[200px]">Property</TableHead>
              <TableHead className="font-semibold text-xs py-2 px-3 min-w-[120px]">Agent</TableHead>
              <TableHead className="font-semibold text-xs py-2 px-3 min-w-[100px]">Price</TableHead>
              <TableHead className="font-semibold text-xs py-2 px-3 min-w-[110px]">Commission</TableHead>
              <TableHead className="font-semibold text-xs py-2 px-3 min-w-[110px]">Date</TableHead>
              <TableHead className="font-semibold text-xs py-2 px-3 min-w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayTransactions.map((transaction, idx) => (
              <TableRow key={idx} className="border-border hover:bg-muted/50">
                <TableCell className="py-2 px-3">
                  <div className="flex items-center gap-1 sm:gap-2">
                    {getStatusIcon(transaction.loopStatus)}
                    <span className="hidden sm:inline-block">
                      {getStatusBadge(transaction.loopStatus)}
                    </span>
                    <span className="sm:hidden text-[10px] sm:text-xs font-medium text-foreground">
                      {transaction.loopStatus}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-2 px-3">
                  <div className="flex flex-col gap-0">
                    <span className="font-medium text-xs text-foreground line-clamp-1">
                      {transaction.loopName || 'N/A'}
                    </span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1">
                      {transaction.address || 'N/A'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground py-2 px-3">
                  <span className="line-clamp-1">
                    {transaction.agents || 'N/A'}
                  </span>
                </TableCell>
                <TableCell className="text-xs font-medium text-foreground py-2 px-3">
                  ${(transaction.price / 1000).toFixed(0)}K
                </TableCell>
                <TableCell className="text-xs font-semibold text-foreground py-2 px-3">
                  ${(transaction.commissionTotal / 1000).toFixed(1)}K
                </TableCell>
                <TableCell className="text-xs text-foreground py-2 px-3">
                  {transaction.createdDate
                    ? new Date(transaction.createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                    : 'N/A'}
                </TableCell>
                <TableCell className="py-2 px-3">
                  {transaction.loopViewUrl && (
                    <a
                      href={transaction.loopViewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[10px] sm:text-xs font-medium"
                      title="View in Dotloop"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DotloopLogo size={14} />
                      <span className="hidden sm:inline">View</span>
                    </a>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

      {/* Pagination Controls - only show if not using limit prop */}
      {!limit && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Legacy limit message */}
      {limit && transactions.length > limit && (
        <p className="text-xs text-foreground mt-2 px-4 sm:px-0">
          Showing {limit} of {transactions.length} transactions
        </p>
      )}
    </div>
  );
}
