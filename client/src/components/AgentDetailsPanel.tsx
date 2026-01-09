/**
 * Agent Details Panel Component
 * Displays transaction-level details and performance history for an agent
 * Design: Clean, organized panel with transaction list and metrics
 */

import { AgentMetrics } from '@/lib/csvParser';
import { DotloopRecord } from '@/lib/csvParser';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, List } from 'lucide-react';
import TransactionTable from './TransactionTable';
import AgentOnePager from './AgentOnePager';

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
    <div className="space-y-4">
      <div className="flex justify-end">
        <AgentOnePager agent={agent} />
      </div>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="transactions" className="flex items-center gap-2">
          <List className="w-4 h-4" />
          Transactions
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 border-l-4 border-l-primary">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Total Deals
            </div>
            <div className="text-3xl font-bold text-foreground">
              {agentTransactions.length}
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-l-emerald-500">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Closed
            </div>
            <div className="text-3xl font-bold text-emerald-600">
              {transactionsByStatus.closed.length}
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Active
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {transactionsByStatus.active.length}
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-l-amber-500">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Pending
            </div>
            <div className="text-3xl font-bold text-amber-600">
              {transactionsByStatus.underContract.length}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card className="p-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Financial Performance</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm font-medium">Total GCI</span>
                <span className="text-lg font-bold text-primary">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(agent.totalCommission)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm font-medium">Avg Sale Price</span>
                <span className="text-lg font-bold">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(agent.averageSalesPrice)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm font-medium">Closing Rate</span>
                <Badge variant={agent.closingRate >= 50 ? "default" : "secondary"}>
                  {agent.closingRate.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="transactions">
        <Card className="border-none shadow-none">
          <TransactionTable transactions={agentTransactions} limit={50} />
        </Card>
      </TabsContent>
      </Tabs>
    </div>
  );
}
