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
    <div className="space-y-8 p-8 bg-muted/10 rounded-xl border border-border/50 shadow-inner">
      {/* Performance Summary */}
      <div>
        <h3 className="text-xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full"></span>
          Performance Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-5 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Total Deals
            </div>
            <div className="text-3xl font-bold text-foreground">
              {agentTransactions.length}
            </div>
          </div>
          <div className="p-5 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Closed
            </div>
            <div className="text-3xl font-bold text-emerald-600">
              {transactionsByStatus.closed.length}
            </div>
          </div>
          <div className="p-5 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Active
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {transactionsByStatus.active.length}
            </div>
          </div>
          <div className="p-5 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Under Contract
            </div>
            <div className="text-3xl font-bold text-amber-600">
              {transactionsByStatus.underContract.length}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-accent rounded-full"></span>
          Transaction History
        </h3>
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <TransactionTable transactions={agentTransactions} limit={10} />
        </div>
      </div>
    </div>
  );
}
