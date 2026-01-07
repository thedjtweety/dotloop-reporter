/**
 * Agent Details Panel Component
 * Displays transaction-level details and performance history for an agent
 * Design: Clean, organized panel with transaction list and metrics
 */

import { AgentMetrics } from '@/lib/csvParser';
import { DotloopRecord } from '@/lib/csvParser';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TransactionTable from './TransactionTable';

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
        <TransactionTable transactions={agentTransactions} limit={10} />
      </div>
    </div>
  );
}
