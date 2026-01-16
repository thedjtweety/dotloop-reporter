/**
 * Agent Commission Summary Component
 * 
 * Displays commission breakdowns grouped by agent with expandable transaction details
 * - Shows agent summary with total commission
 * - Click to expand and view all transactions for that agent
 * - Sortable by total commission (highest to lowest)
 */

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Breakdown {
  agentName: string;
  loopName: string;
  closingDate: string;
  grossCommissionIncome: number;
  brokerageSplitAmount: number;
  agentNetCommission: number;
  ytdAfterTransaction: number;
  splitType: string;
}

interface AgentSummary {
  agentName: string;
  totalCommission: number;
  transactionCount: number;
  transactions: Breakdown[];
  totalGCI: number;
  totalCompanyDollar: number;
}

interface Props {
  breakdowns: Breakdown[];
}

export default function AgentCommissionSummary({ breakdowns }: Props) {
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());

  // Group and aggregate data by agent
  const agentSummaries = useMemo(() => {
    const grouped: Record<string, AgentSummary> = {};

    breakdowns.forEach((breakdown) => {
      if (!grouped[breakdown.agentName]) {
        grouped[breakdown.agentName] = {
          agentName: breakdown.agentName,
          totalCommission: 0,
          transactionCount: 0,
          transactions: [],
          totalGCI: 0,
          totalCompanyDollar: 0,
        };
      }

      grouped[breakdown.agentName].totalCommission += breakdown.agentNetCommission;
      grouped[breakdown.agentName].totalGCI += breakdown.grossCommissionIncome;
      grouped[breakdown.agentName].totalCompanyDollar += breakdown.brokerageSplitAmount;
      grouped[breakdown.agentName].transactionCount += 1;
      grouped[breakdown.agentName].transactions.push(breakdown);
    });

    // Convert to array and sort by total commission (highest first)
    return Object.values(grouped).sort((a, b) => b.totalCommission - a.totalCommission);
  }, [breakdowns]);

  const toggleExpanded = (agentName: string) => {
    const newExpanded = new Set(expandedAgents);
    if (newExpanded.has(agentName)) {
      newExpanded.delete(agentName);
    } else {
      newExpanded.add(agentName);
    }
    setExpandedAgents(newExpanded);
  };

  return (
    <div className="space-y-2">
      {agentSummaries.map((summary) => (
        <div key={summary.agentName} className="border rounded-lg overflow-hidden">
          {/* Agent Summary Row */}
          <button
            onClick={() => toggleExpanded(summary.agentName)}
            className="w-full bg-card hover:bg-muted/50 transition-colors p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="flex-shrink-0">
                {expandedAgents.has(summary.agentName) ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 text-left">
                <h4 className="font-semibold text-foreground">{summary.agentName}</h4>
                <p className="text-sm text-muted-foreground">
                  {summary.transactionCount} transaction{summary.transactionCount !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Commission</p>
                  <p className="text-lg font-bold text-foreground">
                    ${summary.totalCommission.toFixed(2)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total GCI</p>
                  <p className="text-sm font-medium text-foreground">
                    ${summary.totalGCI.toFixed(2)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Company Dollar</p>
                  <p className="text-sm font-medium text-foreground">
                    ${summary.totalCompanyDollar.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </button>

          {/* Expanded Transaction Details */}
          {expandedAgents.has(summary.agentName) && (
            <div className="bg-muted/30 border-t">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-2 px-4 font-semibold text-foreground">Loop Name</th>
                      <th className="text-left py-2 px-4 font-semibold text-foreground">Closing Date</th>
                      <th className="text-right py-2 px-4 font-semibold text-foreground">GCI</th>
                      <th className="text-right py-2 px-4 font-semibold text-foreground">Company $</th>
                      <th className="text-right py-2 px-4 font-semibold text-foreground">Agent Commission</th>
                      <th className="text-right py-2 px-4 font-semibold text-foreground">YTD Co $</th>
                      <th className="text-center py-2 px-4 font-semibold text-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.transactions.map((transaction, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50 last:border-b-0">
                        <td className="py-2 px-4 text-foreground">{transaction.loopName}</td>
                        <td className="py-2 px-4 text-foreground">
                          {new Date(transaction.closingDate).toLocaleDateString()}
                        </td>
                        <td className="text-right py-2 px-4 text-foreground">
                          ${transaction.grossCommissionIncome.toFixed(2)}
                        </td>
                        <td className="text-right py-2 px-4 text-foreground">
                          ${transaction.brokerageSplitAmount.toFixed(2)}
                        </td>
                        <td className="text-right py-2 px-4 font-medium text-foreground">
                          ${transaction.agentNetCommission.toFixed(2)}
                        </td>
                        <td className="text-right py-2 px-4 text-foreground">
                          ${transaction.ytdAfterTransaction.toFixed(2)}
                        </td>
                        <td className="text-center py-2 px-4">
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
          )}
        </div>
      ))}
    </div>
  );
}
