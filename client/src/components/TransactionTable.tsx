/**
 * Transaction Table Component
 * Reusable component to display a list of transactions
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
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Closed</Badge>;
      case 'Active Listing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Active</Badge>;
      case 'Under Contract':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Under Contract</Badge>;
      case 'Archived':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Archived</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead className="font-semibold w-[180px]">Status</TableHead>
            <TableHead className="font-semibold">Property</TableHead>
            <TableHead className="font-semibold">Price</TableHead>
            <TableHead className="font-semibold">Commission</TableHead>
            <TableHead className="font-semibold">Created Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayTransactions.map((transaction, idx) => (
            <TableRow key={idx} className="border-border hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(transaction.loopStatus)}
                  {getStatusBadge(transaction.loopStatus)}
                </div>
              </TableCell>
              <TableCell className="text-sm text-foreground">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{transaction.loopName}</div>
                  {transaction.loopViewUrl && (
                    <a
                      href={transaction.loopViewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="View in Dotloop"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {transaction.address}
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
      {limit && transactions.length > limit && (
        <p className="text-xs text-muted-foreground mt-2">
          Showing {limit} of {transactions.length} transactions
        </p>
      )}
    </div>
  );
}
