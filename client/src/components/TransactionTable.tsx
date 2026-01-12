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
import { CheckCircle2, Clock, Archive, AlertCircle } from 'lucide-react';
import DotloopLogo from './DotloopLogo';

interface TransactionTableProps {
  transactions: DotloopRecord[];
  limit?: number;
  compact?: boolean;
}

export default function TransactionTable({ transactions, limit, compact = false }: TransactionTableProps) {
  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;

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
    <div className="w-full">
      <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="font-semibold w-[12%] text-[10px] sm:text-sm py-1 px-2 sm:py-2 sm:px-3">Status</TableHead>
              <TableHead className="font-semibold w-[28%] text-[10px] sm:text-sm py-1 px-2 sm:py-2 sm:px-3">Property</TableHead>
              <TableHead className="font-semibold w-[13%] text-[10px] sm:text-sm py-1 px-2 sm:py-2 sm:px-3">Agent</TableHead>
              <TableHead className="font-semibold w-[11%] text-[10px] sm:text-sm py-1 px-2 sm:py-2 sm:px-3">Price</TableHead>
              <TableHead className="font-semibold w-[11%] text-[10px] sm:text-sm py-1 px-2 sm:py-2 sm:px-3">Commission</TableHead>
              <TableHead className="font-semibold w-[12%] text-[10px] sm:text-sm py-1 px-2 sm:py-2 sm:px-3">Date</TableHead>
              <TableHead className="font-semibold w-[13%] text-[10px] sm:text-sm py-1 px-2 sm:py-2 sm:px-3">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayTransactions.map((transaction, idx) => (
              <TableRow key={idx} className={`border-border hover:bg-muted/50 ${compact ? 'h-10 sm:h-12' : ''}`}>
                <TableCell className={compact ? 'py-1 px-2 sm:py-2 sm:px-4' : ''}>
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
                <TableCell className={`text-sm text-foreground ${compact ? 'py-1 px-2 sm:py-2 sm:px-4' : ''}`}>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] sm:text-sm font-medium truncate max-w-[160px] sm:max-w-[220px]" title={transaction.loopName}>
                      {transaction.loopName}
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[160px] sm:max-w-[220px]" title={transaction.address}>
                      {transaction.address}
                    </span>
                  </div>
                </TableCell>
                <TableCell className={`text-[11px] sm:text-sm text-foreground ${compact ? 'py-1 px-2 sm:py-2 sm:px-4' : ''}`}>
                  <span className="truncate max-w-[100px] inline-block" title={transaction.agentName}>
                    {transaction.agentName || 'N/A'}
                  </span>
                </TableCell>
                <TableCell className={`text-[11px] sm:text-sm font-medium text-foreground ${compact ? 'py-1 px-2 sm:py-2 sm:px-4' : ''}`}>
                  ${(transaction.price / 1000).toFixed(0)}K
                </TableCell>
                <TableCell className={`text-[11px] sm:text-sm font-semibold text-foreground ${compact ? 'py-1 px-2 sm:py-2 sm:px-4' : ''}`}>
                  ${(transaction.commissionTotal / 1000).toFixed(1)}K
                </TableCell>
                <TableCell className={`text-[10px] sm:text-sm text-foreground ${compact ? 'py-1 px-2 sm:py-2 sm:px-4' : ''}`}>
                  {transaction.createdDate
                    ? new Date(transaction.createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                    : 'N/A'}
                </TableCell>
                <TableCell className={compact ? 'py-1 px-2 sm:py-2 sm:px-4' : ''}>
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
        {limit && transactions.length > limit && (
          <p className="text-xs text-foreground mt-2 px-4 sm:px-0">
            Showing {limit} of {transactions.length} transactions
          </p>
        )}
      </div>
  );
}
