/**
 * Commission Comparison Report Component
 * Shows side-by-side comparison of original CSV commission vs plan-based recalculated commission
 */

import React, { useMemo } from 'react';
import { DotloopRecord } from '@/lib/csvParser';
import { CommissionPlan, getAgentAssignments, getPlanForAgent } from '@/lib/commission';
import { calculatePlanBasedCommission } from '@/lib/commissionRecalculator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CommissionComparisonReportProps {
  records: DotloopRecord[];
}

interface ComparisonRow {
  agentName: string;
  originalCommission: number;
  recalculatedCommission: number;
  difference: number;
  percentChange: number;
  plan: CommissionPlan | undefined;
  transactionCount: number;
}

export default function CommissionComparisonReport({ records }: CommissionComparisonReportProps) {
  const assignments = useMemo(() => getAgentAssignments(), []);

  const comparisonData = useMemo(() => {
    const agentMap = new Map<string, DotloopRecord[]>();

    // Group records by agent
    records.forEach(record => {
      if (record.agents) {
        record.agents.split(',').forEach(agent => {
          const trimmedAgent = agent.trim();
          if (!agentMap.has(trimmedAgent)) {
            agentMap.set(trimmedAgent, []);
          }
          agentMap.get(trimmedAgent)!.push(record);
        });
      }
    });

    // Calculate comparison for each agent
    const comparisons: ComparisonRow[] = [];

    agentMap.forEach((transactions, agentName) => {
      const plan = getPlanForAgent(agentName);
      
      // Original commission (from CSV)
      const originalCommission = transactions.reduce((sum, t) => sum + (t.commissionTotal || 0), 0);

      // Recalculated commission (based on plan)
      const recalculated = calculatePlanBasedCommission(transactions, plan || undefined);
      const recalculatedCommission = recalculated.agentCommission;

      const difference = recalculatedCommission - originalCommission;
      const percentChange = originalCommission > 0 ? (difference / originalCommission) * 100 : 0;

      comparisons.push({
        agentName,
        originalCommission,
        recalculatedCommission,
        difference,
        percentChange,
        plan,
        transactionCount: transactions.length,
      });
    });

    return comparisons.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  }, [records, assignments]);

  const totalOriginal = useMemo(
    () => comparisonData.reduce((sum, row) => sum + row.originalCommission, 0),
    [comparisonData]
  );

  const totalRecalculated = useMemo(
    () => comparisonData.reduce((sum, row) => sum + row.recalculatedCommission, 0),
    [comparisonData]
  );

  const totalDifference = totalRecalculated - totalOriginal;

  const agentsWithoutPlans = useMemo(
    () => comparisonData.filter(row => !row.plan),
    [comparisonData]
  );

  const significantDifferences = useMemo(
    () => comparisonData.filter(row => Math.abs(row.percentChange) > 5),
    [comparisonData]
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Original Commission</p>
          <p className="text-2xl font-bold">${totalOriginal.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Recalculated Commission</p>
          <p className="text-2xl font-bold">${totalRecalculated.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Difference</p>
          <p className={`text-2xl font-bold ${totalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${totalDifference.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Agents Analyzed</p>
          <p className="text-2xl font-bold">{comparisonData.length}</p>
        </Card>
      </div>

      {/* Alerts */}
      {agentsWithoutPlans.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {agentsWithoutPlans.length} agent{agentsWithoutPlans.length !== 1 ? 's' : ''} without assigned plans. Their commission is shown as-is from CSV.
          </AlertDescription>
        </Alert>
      )}

      {significantDifferences.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            {significantDifferences.length} agent{significantDifferences.length !== 1 ? 's' : ''} have commission differences greater than 5%. Review these carefully.
          </AlertDescription>
        </Alert>
      )}

      {/* Comparison Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent Name</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Original Commission</TableHead>
                <TableHead className="text-right">Recalculated Commission</TableHead>
                <TableHead className="text-right">Difference</TableHead>
                <TableHead className="text-right">% Change</TableHead>
                <TableHead>Plan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonData.map((row) => (
                <TableRow key={row.agentName} className={row.difference !== 0 ? 'bg-muted/50' : ''}>
                  <TableCell className="font-medium">{row.agentName}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{row.transactionCount}</TableCell>
                  <TableCell className="text-right">
                    ${row.originalCommission.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="text-right">
                    ${row.recalculatedCommission.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={row.difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${row.difference.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {row.percentChange > 0 && <TrendingUp className="w-4 h-4 text-green-600" />}
                      {row.percentChange < 0 && <TrendingDown className="w-4 h-4 text-red-600" />}
                      <span className={row.percentChange > 0 ? 'text-green-600' : row.percentChange < 0 ? 'text-red-600' : 'text-muted-foreground'}>
                        {row.percentChange > 0 ? '+' : ''}{row.percentChange.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.plan ? (
                      <Badge variant="outline" className="text-xs">
                        {row.plan.splitPercentage}%
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        No Plan
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Footer with totals */}
        <div className="border-t p-4 bg-muted/50">
          <div className="grid grid-cols-6 gap-4 text-sm font-semibold">
            <div>TOTAL</div>
            <div className="text-right"></div>
            <div className="text-right">
              ${totalOriginal.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-right">
              ${totalRecalculated.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className={`text-right ${totalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totalDifference.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className={`text-right ${totalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {((totalDifference / totalOriginal) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </Card>

      {/* Insights */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-sm mb-2">Insights</h4>
        <ul className="text-sm space-y-1 text-blue-900">
          <li>• {comparisonData.length} agents analyzed</li>
          <li>• {agentsWithoutPlans.length} agents without commission plans</li>
          <li>• {significantDifferences.length} agents with significant differences (&gt;5%)</li>
          <li>• Total variance: ${Math.abs(totalDifference).toLocaleString('en-US', { maximumFractionDigits: 0 })}</li>
        </ul>
      </Card>
    </div>
  );
}
