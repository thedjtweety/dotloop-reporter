/**
 * Commission Calculator Component
 * 
 * Provides UI for automatic commission calculation
 * - Loads transaction data from recent uploads
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
import { getRecentFiles } from '@/lib/storage';
import CSVUploadWidget from '@/components/CSVUploadWidget';
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
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [transactions, setTransactions] = useState<DotloopRecord[]>([]);
  const [hasData, setHasData] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  // Fetch data from tRPC with staleTime: 0 to ensure fresh data
  const { data: plans, isLoading: plansLoading, error: plansError, refetch: refetchPlans } = trpc.commission.getPlans.useQuery(undefined, { staleTime: 0 });
  const { data: teams, isLoading: teamsLoading, error: teamsError, refetch: refetchTeams } = trpc.commission.getTeams.useQuery(undefined, { staleTime: 0 });
  const { data: assignments, isLoading: assignmentsLoading, error: assignmentsError, refetch: refetchAssignments } = trpc.commission.getAssignments.useQuery(undefined, { staleTime: 0 });
  const calculateMutation = trpc.commission.calculate.useMutation();

  // Log query status for debugging
  useEffect(() => {
    if (plansError) console.error('Plans query error:', plansError);
    if (teamsError) console.error('Teams query error:', teamsError);
    if (assignmentsError) console.error('Assignments query error:', assignmentsError);
    console.log('Plans:', plans?.length || 0, 'Teams:', teams?.length || 0, 'Assignments:', assignments?.length || 0);
  }, [plans, teams, assignments, plansError, teamsError, assignmentsError]);

  // Refetch data when component mounts to ensure latest plans and assignments
  useEffect(() => {
    const interval = setInterval(() => {
      refetchPlans();
      refetchTeams();
      refetchAssignments();
    }, 5000); // Refetch every 5 seconds to keep data fresh
    return () => clearInterval(interval);
  }, [refetchPlans, refetchTeams, refetchAssignments]);

  // Load recent transaction data on mount
  useEffect(() => {
    const loadRecentData = async () => {
      try {
        setLoading(true);
        const recentFiles = await getRecentFiles();
        if (recentFiles.length > 0) {
          const mostRecent = recentFiles[0];
          if (mostRecent.data && mostRecent.data.length > 0) {
            setTransactions(mostRecent.data);
            setHasData(true);
            setError(null);
          } else {
            setError('No transaction data found in recent uploads');
          }
        } else {
          setError('No recent uploads found. Please upload a Dotloop export first.');
        }
      } catch (err) {
        setError(`Failed to load transaction data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadRecentData();
  }, []);

  const handleCalculate = async () => {
    try {
      setCalculating(true);
      setError(null);

      // Refetch latest data before calculating
      const plansResult = await refetchPlans();
      const assignmentsResult = await refetchAssignments();

      // Validate data
      if (!transactions || transactions.length === 0) {
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
      const currentPlans = plansResult.data;
      const currentAssignments = assignmentsResult.data;

      // Transform transactions to match API schema
      const transactionInputs = transactions.map(t => ({
        id: t.loopId || `loop-${Math.random()}`,
        loopName: t.loopName || 'Unknown',
        closingDate: t.closingDate || new Date().toISOString().split('T')[0],
        agents: t.agents || '',
        salePrice: Number(t.salePrice) || 0,
        commissionRate: Number(t.commissionRate) || 0,
        buySidePercent: Number(t.buySidePercent) || 50,
        sellSidePercent: Number(t.sellSidePercent) || 50,
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

  if (loading || plansLoading || teamsLoading || assignmentsLoading) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading data...</p>
      </Card>
    );
  }

  // Show errors if queries failed
  if (plansError || teamsError || assignmentsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load configuration data. Please try refreshing the page.
          {plansError && <div>Plans error: {String(plansError)}</div>}
          {teamsError && <div>Teams error: {String(teamsError)}</div>}
          {assignmentsError && <div>Assignments error: {String(assignmentsError)}</div>}
        </AlertDescription>
      </Alert>
    );
  }

  const handleDataLoaded = (data: DotloopRecord[], uploadFileName: string) => {
    setTransactions(data);
    setFileName(uploadFileName);
    setHasData(true);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* CSV Upload Widget */}
      <CSVUploadWidget onDataLoaded={handleDataLoaded} isLoading={plansLoading || teamsLoading || assignmentsLoading} />

      {/* Status Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Automatic Commission Calculation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Calculate commissions automatically from your transaction data using configured plans and assignments.
            </p>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="font-medium">{transactions.length}</span>
                <span className="text-muted-foreground ml-1">Transactions</span>
              </div>
              <div>
                <span className="font-medium">{plans?.length || 0}</span>
                <span className="text-muted-foreground ml-1">Plans</span>
              </div>
              <div>
                <span className="font-medium">{assignments?.length || 0}</span>
                <span className="text-muted-foreground ml-1">Agents</span>
              </div>
            </div>
          </div>
          <Button 
            onClick={handleCalculate} 
            disabled={!hasData || calculating}
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
        <div className="space-y-6">
          {/* Summary */}
          <Card className="p-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-900 dark:text-green-100">Calculation Complete</h4>
              </div>
              <Badge variant="outline" className="text-xs">
                {new Date(result.timestamp).toLocaleString()}
              </Badge>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Transactions Processed</p>
                <p className="text-2xl font-bold">{result.transactionCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Agents Calculated</p>
                <p className="text-2xl font-bold">{result.agentCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Breakdowns Generated</p>
                <p className="text-2xl font-bold">{result.data.breakdowns.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">YTD Summaries</p>
                <p className="text-2xl font-bold">{result.data.ytdSummaries.length}</p>
              </div>
            </div>
          </Card>

          {/* Results Tabs */}
          <Tabs defaultValue="breakdowns" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="breakdowns"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                Commission Breakdowns ({result.data.breakdowns.length})
              </TabsTrigger>
              <TabsTrigger 
                value="ytd"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                YTD Summaries ({result.data.ytdSummaries.length})
              </TabsTrigger>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleExportCSV}
                className="ml-auto gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </TabsList>

            {/* Breakdowns Tab */}
            <TabsContent value="breakdowns" className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-semibold">Agent</th>
                      <th className="text-left py-2 px-4 font-semibold">Loop</th>
                      <th className="text-right py-2 px-4 font-semibold">GCI</th>
                      <th className="text-right py-2 px-4 font-semibold">Company $</th>
                      <th className="text-right py-2 px-4 font-semibold">Agent Comm</th>
                      <th className="text-right py-2 px-4 font-semibold">YTD Co $</th>
                      <th className="text-right py-2 px-4 font-semibold">YTD Ag Comm</th>
                      <th className="text-center py-2 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.breakdowns.map((breakdown: any, idx: number) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-4">{breakdown.agentName}</td>
                        <td className="py-2 px-4 text-muted-foreground">{breakdown.loopName}</td>
                        <td className="text-right py-2 px-4">${(breakdown.grossCommissionIncome / 100).toFixed(2)}</td>
                        <td className="text-right py-2 px-4">${(breakdown.brokerageSplitAmount / 100).toFixed(2)}</td>
                        <td className="text-right py-2 px-4 font-medium">${(breakdown.agentCommission / 100).toFixed(2)}</td>
                        <td className="text-right py-2 px-4">${(breakdown.ytdCompanyDollar / 100).toFixed(2)}</td>
                        <td className="text-right py-2 px-4 font-medium">${(breakdown.ytdAgentCommission / 100).toFixed(2)}</td>
                        <td className="text-center py-2 px-4">
                          <Badge variant={breakdown.splitType === 'post-cap' ? 'destructive' : 'default'}>
                            {breakdown.splitType}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* YTD Summaries Tab */}
            <TabsContent value="ytd" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.data.ytdSummaries.map((summary: any, idx: number) => (
                  <Card key={idx} className="p-4">
                    <h4 className="font-semibold mb-3">{summary.agentName}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">YTD Company Dollar:</span>
                        <span className="font-medium">${(summary.ytdCompanyDollar / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">YTD Agent Commission:</span>
                        <span className="font-medium">${(summary.ytdAgentCommission / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cap Amount:</span>
                        <span className="font-medium">${(summary.capAmount / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Remaining to Cap:</span>
                        <span className={`font-medium ${summary.remainingToCap <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ${(summary.remainingToCap / 100).toFixed(2)}
                        </span>
                      </div>
                      {summary.percentOfCap !== undefined && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex justify-between mb-2">
                            <span className="text-muted-foreground">Cap Progress:</span>
                            <span className="font-medium">{summary.percentOfCap.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(summary.percentOfCap, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Empty State */}
      {!result && !error && hasData && (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground space-y-2">
            <p>Click "Calculate Commissions" to generate automatic commission calculations</p>
            <p className="text-sm">Results will appear here with detailed breakdowns and YTD summaries</p>
          </div>
        </Card>
      )}
    </div>
  );
}
