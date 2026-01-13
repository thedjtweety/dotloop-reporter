/**
 * Transaction Table Component
 * Reusable component to display a list of transactions
 * Optimized for mobile responsiveness with column visibility toggle
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { CheckCircle2, Clock, Archive, AlertCircle, ChevronLeft, ChevronRight, Search, Settings } from 'lucide-react';
import DotloopLogo from './DotloopLogo';
import { useState, useMemo, useEffect } from 'react';

interface TransactionTableProps {
  transactions: DotloopRecord[];
  limit?: number;
  compact?: boolean;
}

type ColumnKey = 'status' | 'property' | 'agent' | 'price' | 'commission' | 'date' | 'actions';

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  visible: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'status', label: 'Status', visible: true },
  { key: 'property', label: 'Property', visible: true },
  { key: 'agent', label: 'Agent', visible: true },
  { key: 'price', label: 'Price', visible: true },
  { key: 'commission', label: 'Commission', visible: true },
  { key: 'date', label: 'Date', visible: true },
  { key: 'actions', label: 'Actions', visible: true },
];

export default function TransactionTable({ transactions, limit, compact = false }: TransactionTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const itemsPerPage = 12;

  // Load column preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('transactionTableColumns');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setColumns(parsed);
      } catch (e) {
        // If parsing fails, use defaults
        setColumns(DEFAULT_COLUMNS);
      }
    }
  }, []);

  // Save column preferences to localStorage when they change
  const updateColumnVisibility = (key: ColumnKey, visible: boolean) => {
    const updated = columns.map(col => 
      col.key === key ? { ...col, visible } : col
    );
    setColumns(updated);
    localStorage.setItem('transactionTableColumns', JSON.stringify(updated));
  };

  const resetColumns = () => {
    setColumns(DEFAULT_COLUMNS);
    localStorage.setItem('transactionTableColumns', JSON.stringify(DEFAULT_COLUMNS));
  };

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

  const isColumnVisible = (key: ColumnKey) => {
    return columns.find(col => col.key === key)?.visible ?? true;
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
      {/* Search Box and Column Toggle - only show if not using limit prop */}
      {!limit && (
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by property, address, status, or agent..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2"
            />
          </div>

          {/* Column Visibility Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Show/Hide Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map(col => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={col.visible}
                  onCheckedChange={(checked) => updateColumnVisibility(col.key, checked)}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={resetColumns} className="text-xs text-muted-foreground">
                Reset to Default
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            {isColumnVisible('status') && (
              <TableHead className="font-semibold text-xs py-2 px-3 min-w-[140px]">Status</TableHead>
            )}
            {isColumnVisible('property') && (
              <TableHead className="font-semibold text-xs py-2 px-3 min-w-[200px]">Property</TableHead>
            )}
            {isColumnVisible('agent') && (
              <TableHead className="font-semibold text-xs py-2 px-3 min-w-[120px]">Agent</TableHead>
            )}
            {isColumnVisible('price') && (
              <TableHead className="font-semibold text-xs py-2 px-3 min-w-[100px]">Price</TableHead>
            )}
            {isColumnVisible('commission') && (
              <TableHead className="font-semibold text-xs py-2 px-3 min-w-[110px]">Commission</TableHead>
            )}
            {isColumnVisible('date') && (
              <TableHead className="font-semibold text-xs py-2 px-3 min-w-[110px]">Date</TableHead>
            )}
            {isColumnVisible('actions') && (
              <TableHead className="font-semibold text-xs py-2 px-3 min-w-[100px]">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayTransactions.map((transaction, idx) => (
            <TableRow key={idx} className="border-border hover:bg-muted/50">
              {isColumnVisible('status') && (
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
              )}
              {isColumnVisible('property') && (
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
              )}
              {isColumnVisible('agent') && (
                <TableCell className="text-xs text-foreground py-2 px-3">
                  <span className="line-clamp-1">
                    {transaction.agents || 'N/A'}
                  </span>
                </TableCell>
              )}
              {isColumnVisible('price') && (
                <TableCell className="text-xs font-medium text-foreground py-2 px-3">
                  ${(transaction.price / 1000).toFixed(0)}K
                </TableCell>
              )}
              {isColumnVisible('commission') && (
                <TableCell className="text-xs font-semibold text-foreground py-2 px-3">
                  ${(transaction.commissionTotal / 1000).toFixed(1)}K
                </TableCell>
              )}
              {isColumnVisible('date') && (
                <TableCell className="text-xs text-foreground py-2 px-3">
                  {transaction.createdDate
                    ? new Date(transaction.createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                    : 'N/A'}
                </TableCell>
              )}
              {isColumnVisible('actions') && (
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
              )}
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
