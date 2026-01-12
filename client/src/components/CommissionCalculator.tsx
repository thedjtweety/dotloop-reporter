/**
 * Commission Calculator Component
 * 
 * Provides UI for automatic commission calculation
 * - Loads transaction data from database (uploaded CSV)
 * - Fetches commission plans and agent assignments
 * - Triggers calculation via tRPC API
 * - Displays results in formatted tables
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, Download, RefreshCw } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import type { DotloopRecord } from '@/lib/csvParser';

interface CalculationResult {
  success: boolean;
  data: {
    breakdowns: any[];
    ytdSummaries: any[];
  };
  timestamp: string;
  transactionCount: number;
  agentCount: number;
}

export default function CommissionCalculator() {
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [transactions, setTransactions] = useState<DotloopRecord[]>([]);
  const [uniqueAgents, setUniqueAgents] = useState<string[]>([]);

  // Fetch all transactions from database
  const { data: dbTransactions, isLoading: transactionsLoading, error: transactionsError, refetch: refetchTransactions } = trpc.uploads.getAllTransactions.useQuery(undefined, { staleTime: 0 });
  
  // Fetch data from tRPC with staleTime: 0 to ensure fresh data
  const { data: plans, isLoading: plansLoading, error: plansError, refetch: refetchPlans } = trpc.commission.getPlans.useQuery(undefined, { staleTime: 0 });
  const { data: teams, isLoading: teamsLoading, error: teamsError, refetch: refetchTeams } = trpc.commission.getTeams.useQuery(undefined, { staleTime: 0 });
  const { data: assignments, isLoading: assignmentsLoading, error: assignmentsError, refetch: refetchAssignments } = trpc.commission.getAssignments.useQuery(undefined, { staleTime: 0 });
  const calculateMutation = trpc.commission.calculate.useMutation();

  // Update transactions when database data changes
  useEffect(() => {
    if (dbTransactions && dbTransactions.length > 0) {
      setTransactions(dbTransactions);
      setError(null);
      
      // Extract unique agents from transactions
      const agentSet = new Set<string>();
      dbTransactions.forEach(t => {
        if (t.agents) {
          t.agents.split(',').forEach(agent => {
            const trimmed = agent.trim();
            if (trimmed) agentSet.add(trimmed);
          });
        }
      });
      setUniqueAgents(Array.from(agentSet).sort());
    } else if (dbTransactions && dbTransactions.length === 0) {
      setError('No transaction data found. Please upload a Dotloop export first.');
      setTransactions([]);
      setUniqueAgents([]);
    }
  }, [dbTransactions]);

  // Log query status for debugging
  useEffect(() => {
    if (transactionsError) console.error('Transactions query error:', transactionsError);
    if (plansError) console.error('Plans query error:', plansError);
    if (teamsError) console.error('Teams query error:', teamsError);
    if (assignmentsError) console.error('Assignments query error:', assignmentsError);
    console.log('Transactions:', transactions.length, 'Plans:', plans?.length || 0, 'Teams:', teams?.length || 0, 'Assignments:', assignments?.length || 0, 'Agents:', uniqueAgents.length);
  }, [transactions, plans, teams, assignments, uniqueAgents, transactionsError, plansError, teamsError, assignmentsError]);

  // Refetch data when component mounts to ensure latest plans and assignments
  useEffect(() => {
    const interval = setInterval(() => {
      refetchTransactions();
      refetchPlans();
      refetchTeams();
      refetchAssignments();
    }, 5000); // Refetch every 5 seconds to keep data fresh
    return () => clearInterval(interval);
  }, [refetchTransactions, refetchPlans, refetchTeams, refetchAssignments]);

  const handleCalculate = async () => {
    try {
      setCalculating(true);
      setError(null);

      // Refetch latest data before calculating
      const transactionsResult = await refetchTransactions();
      const plansResult = await refetchPlans();
      const assignmentsResult = await refetchAssignments();

      // Validate data
      if (!transactionsResult?.data || transactionsResult.data.length === 0) {
        setError('No transactions available to calculate. Please upload a Dotloop export first.');
        return;
      }

      if (!plansResult?.data || plansResult.data.length === 0) {
        setError('No commission plans configured. Please create a plan in the Plans tab first.');
        return;
      }

      if (!assignmentsResult?.data || assignmentsResult.data.length === 0) {
        setError('No agent assignments configured. Please assign agents to plans in the Agents tab first.');
        return;
      }

      // Use the refetched data
      const currentTransactions = transactionsResult.data;
      const currentPlans = plansResult.data;
      const currentAssignments = assignmentsResult.data;

      // Transform transactions to match API schema
      const transactionInputs = currentTransactions.map(t => ({
        id: t.loopId || `loop-${Math.random()}`,
        loopName: t.loopName || 'Unknown',
        closingDate: t.closingDate || new Date().toISOString().split('T')[0],
        agents: t.agents || '',
        salePrice: Number(t.salePrice) || 0,
        commissionRate: Number(t.commissionRate) || 0,
        buySideCommission: Number(t.buySideCommission) || 0,
        sellSideCommission: Number(t.sellSideCommission) || 0,
      }));

      // Call calculation API
      const response = await calculateMutation.mutateAsync({
        transactions: transactionInputs,
        planIds: currentPlans.map(p => p.id),
        teamIds: teams?.map(t => t.id) || [],
        agentAssignments: currentAssignments.map(a => ({
          id: a.id || Math.random().toString(36).substr(2, 9),
          agentName: a.agentName,
          planId: a.planId,
          teamId: a.teamId,
          startDate: a.startDate,
          anniversaryDate: a.anniversaryDate,
        })),
      });

      setResult(response as CalculationResult);
    } catch (err) {
      setError(`Calculation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCalculating(false);
    }
  };

  const handleExportCSV = () => {
    if (!result) return;

    // Create CSV from breakdowns
    const headers = ['Agent', 'Loop Name', 'Closing Date', 'Gross Commission', 'Company Dollar', 'Agent Commission', 'YTD Company Dollar', 'YTD Agent Commission'];
    const rows = result.data.breakdowns.map((b: any) => [
      b.agentName,
      b.loopName,
      b.closingDate,
      (b.grossCommissionIncome / 100).toFixed(2),
      (b.brokerageSplitAmount / 100).toFixed(2),
      (b.agentCommission / 100).toFixed(2),
      (b.ytdCompanyDollar / 100).toFixed(2),
      (b.ytdAgentCommission / 100).toFixed(2),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commission-calculation-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (transactionsLoading || plansLoading || teamsLoading || assignmentsLoading) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading data...</p>
      </Card>
    );
  }

  // Show errors if queries failed
  if (transactionsError || plansError || teamsError || assignmentsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load configuration data. Please try refreshing the page.
          {transactionsError && <div>Transactions error: {String(transactionsError)}</div>}
          {plansError && <div>Plans error: {String(plansError)}</div>}
          {teamsError && <div>Teams error: {String(teamsError)}</div>}
          {assignmentsError && <div>Assignments error: {String(assignmentsError)}</div>}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Automatic Commission Calculation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Calculate commissions automatically from your uploaded transaction data using configured plans and assignments.
            </p>
            <div className="flex gap-4 text-sm flex-wrap">
              <div>
                <span className="font-medium">{transactions.length}</span>
                <span className="text-muted-foreground ml-1">Transactions</span>
              </div>
              <div>
                <span className="font-medium">{plans?.length || 0}</span>
                <span className="text-muted-foreground ml-1">Plans</span>
              </div>
              <div>
                <span className="font-medium">{uniqueAgents.length}</span>
                <span className="text-muted-foreground ml-1">Agents</span>
              </div>
              <div>
                <span className="font-medium">{assignments?.length || 0}</span>
                <span className="text-muted-foreground ml-1">Assignments</span>
              </div>
            </div>
          </div>
          <Button 
            onClick={handleCalculate} 
            disabled={transactions.length === 0 || !plans?.length || !assignments?.length || calculating}
            size="lg"
            className="gap-2"
          >
            {calculating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Calculate Commissions
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {result && (
        <Card className="p-6 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">Calculation Complete</h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Processed {result.transactionCount} transactions for {result.agentCount} agents
                </p>
              </div>
            </div>
            <Button onClick={handleExportCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Results Tabs */}
          <Tabs defaultValue="breakdowns" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="breakdowns">Commission Breakdowns</TabsTrigger>
              <TabsTrigger value="summary">YTD Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="breakdowns" className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 px-4">Agent</th>
                      <th className="text-left py-2 px-4">Loop Name</th>
                      <th className="text-right py-2 px-4">Gross Commission</th>
                      <th className="text-right py-2 px-4">Company Dollar</th>
                      <th className="text-right py-2 px-4">Agent Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.breakdowns.map((breakdown: any, idx: number) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-4">{breakdown.agentName}</td>
                        <td className="py-2 px-4">{breakdown.loopName}</td>
                        <td className="text-right py-2 px-4">${(breakdown.grossCommissionIncome / 100).toFixed(2)}</td>
                        <td className="text-right py-2 px-4">${(breakdown.brokerageSplitAmount / 100).toFixed(2)}</td>
                        <td className="text-right py-2 px-4">${(breakdown.agentCommission / 100).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 px-4">Agent</th>
                      <th className="text-right py-2 px-4">YTD Company Dollar</th>
                      <th className="text-right py-2 px-4">YTD Agent Commission</th>
                      <th className="text-right py-2 px-4">Transaction Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.ytdSummaries.map((summary: any, idx: number) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-4">{summary.agentName}</td>
                        <td className="text-right py-2 px-4">${(summary.ytdCompanyDollar / 100).toFixed(2)}</td>
                        <td className="text-right py-2 px-4">${(summary.ytdAgentCommission / 100).toFixed(2)}</td>
                        <td className="text-right py-2 px-4">{summary.transactionCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}
