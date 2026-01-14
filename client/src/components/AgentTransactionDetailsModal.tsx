/**
 * Agent Transaction Details Modal
 * Full-screen modal showing all transactions for a selected agent
 * Displays transaction-level details with sorting and filtering options
 */

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ArrowUpDown } from 'lucide-react';
import { formatCurrency } from '@/lib/formatUtils';

interface Breakdown {
  agentName: string;
  loopName: string;
  grossCommissionIncome: number;
  brokerageSplitAmount: number;
  agentNetCommission: number;
  ytdAfterTransaction: number;
  splitType: string;
}

interface AgentSummary {
  agentName: string;
  totalTransactions: number;
  totalGCI: number;
  totalCompanyDollar: number;
  totalAgentCommission: number;
  avgCommissionPerDeal: number;
  transactions: Breakdown[];
}

interface AgentTransactionDetailsModalProps {
  agent: AgentSummary;
  onClose: () => void;
}

type SortField = 'loopName' | 'gci' | 'commission' | 'ytd';
type SortDirection = 'asc' | 'desc';

export default function AgentTransactionDetailsModal({ 
  agent, 
  onClose 
}: AgentTransactionDetailsModalProps) {
  const [sortField, setSortField] = useState<SortField>('gci');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    const sorted = [...agent.transactions];
    
    sorted.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case 'loopName':
          aVal = a.loopName;
          bVal = b.loopName;
          break;
        case 'gci':
          aVal = a.grossCommissionIncome;
          bVal = b.grossCommissionIncome;
          break;
        case 'commission':
          aVal = a.agentNetCommission;
          bVal = b.agentNetCommission;
          break;
        case 'ytd':
          aVal = a.ytdAfterTransaction;
          bVal = b.ytdAfterTransaction;
          break;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc' 
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return sorted;
  }, [agent.transactions, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background w-full h-full max-h-[95vh] rounded-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                {agent.agentName}
              </h2>
              <p className="text-sm text-foreground mt-1">
                {agent.totalTransactions} transactions • {formatCurrency(agent.totalAgentCommission)} total commission
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-10 w-10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="px-6 pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs text-foreground mb-1">Total GCI</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(agent.totalGCI)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-foreground mb-1">Company Dollar</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(agent.totalCompanyDollar)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-foreground mb-1">Agent Commission</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(agent.totalAgentCommission)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-foreground mb-1">Avg per Deal</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(agent.avgCommissionPerDeal)}
            </p>
          </Card>
        </div>

        {/* Transactions Table */}
        <div className="flex-1 overflow-auto px-6 py-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b sticky top-0 bg-muted/50">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    <button
                      onClick={() => handleSort('loopName')}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      Property/Loop
                      {sortField === 'loopName' && (
                        <ArrowUpDown className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">
                    <button
                      onClick={() => handleSort('gci')}
                      className="flex items-center justify-end gap-2 hover:text-primary transition-colors w-full"
                    >
                      GCI
                      {sortField === 'gci' && (
                        <ArrowUpDown className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">
                    <button
                      onClick={() => handleSort('commission')}
                      className="flex items-center justify-end gap-2 hover:text-primary transition-colors w-full"
                    >
                      Agent Comm
                      {sortField === 'commission' && (
                        <ArrowUpDown className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">
                    <button
                      onClick={() => handleSort('ytd')}
                      className="flex items-center justify-end gap-2 hover:text-primary transition-colors w-full"
                    >
                      YTD Commission
                      {sortField === 'ytd' && (
                        <ArrowUpDown className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.map((transaction, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-foreground font-medium">
                      {transaction.loopName}
                    </td>
                    <td className="text-right py-3 px-4 text-foreground">
                      {formatCurrency(transaction.grossCommissionIncome)}
                    </td>
                    <td className="text-right py-3 px-4 font-medium text-blue-600 dark:text-blue-400">
                      {formatCurrency(transaction.agentNetCommission)}
                    </td>
                    <td className="text-right py-3 px-4 text-foreground">
                      {formatCurrency(transaction.ytdAfterTransaction)}
                    </td>
                    <td className="text-center py-3 px-4">
                      <Badge 
                        variant={transaction.splitType === 'post-cap' ? 'destructive' : 'default'}
                        className="text-xs"
                      >
                        {transaction.splitType}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/50 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground">
              Showing {sortedTransactions.length} transactions
            </p>
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
