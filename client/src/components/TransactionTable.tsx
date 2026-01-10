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
import { CheckCircle2, Clock, Archive, AlertCircle, ExternalLink } from 'lucide-react';

interface TransactionTableProps {
  transactions: DotloopRecord[];
  limit?: number;
}

export default function TransactionTable({ transactions, limit }: TransactionTableProps) {
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
      <div className="text-center py-8 text-muted-foreground">
        No transactions found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="min-w-[600px] px-4 sm:px-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="font-semibold w-[140px] sm:w-[180px]">Status</TableHead>
              <TableHead className="font-semibold min-w-[200px]">Property</TableHead>
              <TableHead className="font-semibold w-[100px]">Price</TableHead>
              <TableHead className="font-semibold w-[100px]">Commission</TableHead>
              <TableHead className="font-semibold w-[120px]">Created Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayTransactions.map((transaction, idx) => (
              <TableRow key={idx} className="border-border hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(transaction.loopStatus)}
                    <span className="hidden sm:inline-block">
                      {getStatusBadge(transaction.loopStatus)}
                    </span>
                    <span className="sm:hidden text-xs font-medium text-muted-foreground">
                      {transaction.loopStatus}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-foreground">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate max-w-[180px] sm:max-w-[300px]" title={transaction.loopName}>
                        {transaction.loopName}
                      </span>
                      {transaction.loopViewUrl && (
                        <a
                          href={transaction.loopViewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0"
                          title="View in Dotloop"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-[180px] sm:max-w-[300px]" title={transaction.address}>
                      {transaction.address}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium text-foreground">
                  ${(transaction.price / 1000).toFixed(0)}K
                </TableCell>
                <TableCell className="text-sm font-semibold text-accent">
                  ${(transaction.commissionTotal / 1000).toFixed(1)}K
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {transaction.createdDate
                    ? new Date(transaction.createdDate).toLocaleDateString()
                    : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {limit && transactions.length > limit && (
        <p className="text-xs text-muted-foreground mt-2 px-4 sm:px-0">
          Showing {limit} of {transactions.length} transactions
        </p>
      )}
    </div>
  );
}
