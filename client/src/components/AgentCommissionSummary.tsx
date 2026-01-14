/**
 * Agent Commission Summary Component
 * Displays all agents with their total commission metrics in a summary table
 * Clicking an agent name opens full-screen transaction details modal
 */

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/formatUtils';
import AgentTransactionDetailsModal from './AgentTransactionDetailsModal';

interface Breakdown {
  agentName: string;
  loopName: string;
  grossCommissionIncome: number;
  brokerageSplitAmount: number;
  agentNetCommission: number;
  ytdAfterTransaction: number;
  splitType: string;
}

interface AgentCommissionSummaryProps {
  breakdowns: Breakdown[];
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

export default function AgentCommissionSummary({ breakdowns }: AgentCommissionSummaryProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentSummary | null>(null);

  // Group breakdowns by agent and calculate totals
  const agentSummaries = useMemo(() => {
    const agentMap = new Map<string, Breakdown[]>();

    // Group by agent
    breakdowns.forEach(breakdown => {
      if (!agentMap.has(breakdown.agentName)) {
        agentMap.set(breakdown.agentName, []);
      }
      agentMap.get(breakdown.agentName)!.push(breakdown);
    });

    // Calculate summaries
    const summaries: AgentSummary[] = [];
    agentMap.forEach((transactions, agentName) => {
      const totalGCI = transactions.reduce((sum, t) => sum + t.grossCommissionIncome, 0);
      const totalCompanyDollar = transactions.reduce((sum, t) => sum + t.brokerageSplitAmount, 0);
      const totalAgentCommission = transactions.reduce((sum, t) => sum + t.agentNetCommission, 0);

      summaries.push({
        agentName,
        totalTransactions: transactions.length,
        totalGCI,
        totalCompanyDollar,
        totalAgentCommission,
        avgCommissionPerDeal: transactions.length > 0 ? totalAgentCommission / transactions.length : 0,
        transactions,
      });
    });

    // Sort by total commission descending
    return summaries.sort((a, b) => b.totalAgentCommission - a.totalAgentCommission);
  }, [breakdowns]);

  const totalAllAgents = useMemo(() => {
    return {
      transactions: agentSummaries.reduce((sum, a) => sum + a.totalTransactions, 0),
      gci: agentSummaries.reduce((sum, a) => sum + a.totalGCI, 0),
      company: agentSummaries.reduce((sum, a) => sum + a.totalCompanyDollar, 0),
      agent: agentSummaries.reduce((sum, a) => sum + a.totalAgentCommission, 0),
    };
  }, [agentSummaries]);

  return (
    <>
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-foreground mb-1">Total Agents</p>
            <p className="text-3xl font-bold text-foreground">{agentSummaries.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-foreground mb-1">Total Transactions</p>
            <p className="text-3xl font-bold text-foreground">{totalAllAgents.transactions}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-foreground mb-1">Total GCI</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalAllAgents.gci)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-foreground mb-1">Total Agent Commission</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(totalAllAgents.agent)}
            </p>
          </Card>
        </div>

        {/* Agent Summary Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Agent Name</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Transactions</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Total GCI</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Company $</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Agent Commission</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Avg per Deal</th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {agentSummaries.map((agent) => (
                  <tr 
                    key={agent.agentName} 
                    className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td 
                      className="py-3 px-4 font-medium text-foreground"
                      onClick={() => setSelectedAgent(agent)}
                    >
                      {agent.agentName}
                    </td>
                    <td className="text-right py-3 px-4 text-foreground">{agent.totalTransactions}</td>
                    <td className="text-right py-3 px-4 text-foreground">
                      {formatCurrency(agent.totalGCI)}
                    </td>
                    <td className="text-right py-3 px-4 text-foreground">
                      {formatCurrency(agent.totalCompanyDollar)}
                    </td>
                    <td className="text-right py-3 px-4 font-medium text-blue-600 dark:text-blue-400">
                      {formatCurrency(agent.totalAgentCommission)}
                    </td>
                    <td className="text-right py-3 px-4 text-foreground">
                      {formatCurrency(agent.avgCommissionPerDeal)}
                    </td>
                    <td className="text-center py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAgent(agent)}
                        className="gap-1"
                      >
                        <span className="text-xs">View</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer with totals */}
          <div className="border-t p-4 bg-muted/50">
            <div className="grid grid-cols-7 gap-4 text-sm font-semibold text-foreground">
              <div>TOTAL</div>
              <div className="text-right">{totalAllAgents.transactions}</div>
              <div className="text-right">{formatCurrency(totalAllAgents.gci)}</div>
              <div className="text-right">{formatCurrency(totalAllAgents.company)}</div>
              <div className="text-right text-blue-600 dark:text-blue-400">
                {formatCurrency(totalAllAgents.agent)}
              </div>
              <div className="text-right">
                {formatCurrency(totalAllAgents.agent / totalAllAgents.transactions)}
              </div>
              <div></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Transaction Details Modal */}
      {selectedAgent && (
        <AgentTransactionDetailsModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </>
  );
}
