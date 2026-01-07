/**
 * Agent Details Panel Component
 * Displays transaction-level details and performance history for an agent
 * Design: Clean, organized panel with transaction list and metrics
 */

import { AgentMetrics } from '@/lib/csvParser';
import { DotloopRecord } from '@/lib/csvParser';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle2, Clock, Archive } from 'lucide-react';

interface AgentDetailsPanelProps {
  agent: AgentMetrics;
  transactions: DotloopRecord[];
}

export default function AgentDetailsPanel({
  agent,
  transactions,
}: AgentDetailsPanelProps) {
  // Filter transactions for this agent
  const agentTransactions = transactions.filter(t => {
    const agents = t.agents ? t.agents.split(',').map(a => a.trim()) : [];
    return agents.includes(agent.agentName);
  });

  // Group transactions by status
  const transactionsByStatus = {
    closed: agentTransactions.filter(t => t.loopStatus === 'Closed'),
    active: agentTransactions.filter(t => t.loopStatus === 'Active Listing'),
    underContract: agentTransactions.filter(t => t.loopStatus === 'Under Contract'),
    archived: agentTransactions.filter(t => t.loopStatus === 'Archived'),
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
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Closed':
        return <Badge className="bg-green-100 text-green-800">Closed</Badge>;
      case 'Active Listing':
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
      case 'Under Contract':
        return <Badge className="bg-amber-100 text-amber-800">Under Contract</Badge>;
      case 'Archived':
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-6 bg-muted/30 rounded-lg border border-border">
      {/* Performance Summary */}
      <div>
        <h3 className="text-lg font-display font-semibold text-foreground mb-4">
          Performance Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-card rounded-lg border border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">
              Total Deals
            </div>
            <div className="text-2xl font-bold text-foreground">
              {agentTransactions.length}
            </div>
          </div>
          <div className="p-3 bg-card rounded-lg border border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">
              Closed
            </div>
            <div className="text-2xl font-bold text-green-600">
              {transactionsByStatus.closed.length}
            </div>
          </div>
          <div className="p-3 bg-card rounded-lg border border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">
              Active
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {transactionsByStatus.active.length}
            </div>
          </div>
          <div className="p-3 bg-card rounded-lg border border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">
              Under Contract
            </div>
            <div className="text-2xl font-bold text-amber-600">
              {transactionsByStatus.underContract.length}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-lg font-display font-semibold text-foreground mb-4">
          Recent Transactions
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Property</TableHead>
                <TableHead className="font-semibold">Price</TableHead>
                <TableHead className="font-semibold">Commission</TableHead>
                <TableHead className="font-semibold">Created Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentTransactions.slice(0, 10).map((transaction, idx) => (
                <TableRow key={idx} className="border-border hover:bg-muted/50">
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusIcon(transaction.loopStatus)}
                      {getStatusBadge(transaction.loopStatus)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    <div className="font-medium">{transaction.loopName}</div>
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
        </div>
        {agentTransactions.length > 10 && (
          <p className="text-xs text-muted-foreground mt-2">
            Showing 10 of {agentTransactions.length} transactions
          </p>
        )}
      </div>
    </div>
  );
}
