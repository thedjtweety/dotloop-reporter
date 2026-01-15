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
import ExportPDFButton from '@/components/ExportPDFButton';
import AgentCommissionSummary from '@/components/AgentCommissionSummary';
// CSV upload is handled on the main Analytics page
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

interface CommissionCalculatorProps {
  records?: DotloopRecord[];
}

export default function CommissionCalculator({ records: initialRecords }: CommissionCalculatorProps) {
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [transactions, setTransactions] = useState<DotloopRecord[]>([]);
  const [hasData, setHasData] = useState(false);


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
        
        // Use initialRecords if provided (from CommissionManagementPanel)
        if (initialRecords && initialRecords.length > 0) {
          setTransactions(initialRecords);
          setHasData(true);
          setError(null);
          return;
        }
        
        // Otherwise load from recent files
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
  }, [initialRecords]);

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
        commissionTotal: Number(t.commissionTotal) || 0, // Use actual commission from CSV
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
      b.grossCommission,
      b.companyDollar,
      b.agentCommission,
      b.ytdCompanyDollar,
      b.ytdAgentCommission,
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commission-breakdowns-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Info Section */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Automatic Commission Calculation</h3>
            <p className="text-sm text-muted-foreground">
              Calculate commissions automatically from your transaction data using configured plans and assignments.
            </p>
          </div>

          {/* Data Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-background rounded-lg border">
            <div>
              <p className="text-xs text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold">{transactions.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Plans</p>
              <p className="text-2xl font-bold">{plans?.length || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Agents</p>
              <p className="text-2xl font-bold">{assignments?.length || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant={result ? 'default' : 'secondary'}>
                {result ? 'Calculated' : 'Ready'}
              </Badge>
            </div>
          </div>

          {/* Calculate Button */}
          <Button
            onClick={handleCalculate}
            disabled={calculating || !hasData || !plans?.length || !assignments?.length}
            size="lg"
            className="w-full"
          >
            {calculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              'Calculate Commissions'
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

      {/* Results Section */}
      {result && (
        <Card className="p-6 border-green-200 bg-green-50">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-lg text-green-900">Calculation Complete</h3>
              <span className="text-sm text-green-700 ml-auto">{result.timestamp}</span>
            </div>

            {/* Results Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border border-green-200">
              <div>
                <p className="text-xs text-muted-foreground">Transactions Processed</p>
                <p className="text-2xl font-bold">{result.transactionCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Agents Calculated</p>
                <p className="text-2xl font-bold">{result.agentCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Breakdowns Generated</p>
                <p className="text-2xl font-bold">{result.data.breakdowns.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">YTD Summaries</p>
                <p className="text-2xl font-bold">{result.data.ytdSummaries.length}</p>
              </div>
            </div>

            {/* Results Tabs */}
            <Tabs defaultValue="breakdowns" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="breakdowns">
                  Commission Breakdowns ({result.data.breakdowns.length})
                </TabsTrigger>
                <TabsTrigger value="ytd">
                  YTD Summaries ({result.data.ytdSummaries.length})
                </TabsTrigger>
              </TabsList>

              {/* Commission Breakdowns Tab */}
              <TabsContent value="breakdowns" className="space-y-4">
                {result.data.breakdowns.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left py-2 px-2">Agent</th>
                          <th className="text-left py-2 px-2">Loop Name</th>
                          <th className="text-right py-2 px-2">Gross Commission</th>
                          <th className="text-right py-2 px-2">Agent Commission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.data.breakdowns.map((breakdown: any, idx: number) => (
                          <tr key={idx} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-2">{breakdown.agentName}</td>
                            <td className="py-2 px-2">{breakdown.loopName}</td>
                            <td className="text-right py-2 px-2">${breakdown.grossCommission?.toFixed(2) || '0.00'}</td>
                            <td className="text-right py-2 px-2 font-semibold">${breakdown.agentCommission?.toFixed(2) || '0.00'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No commission breakdowns generated</p>
                )}
              </TabsContent>

              {/* YTD Summaries Tab */}
              <TabsContent value="ytd" className="space-y-4">
                {result.data.ytdSummaries.length > 0 ? (
                  <AgentCommissionSummary breakdowns={result.data.ytdSummaries} />
                ) : (
                  <p className="text-muted-foreground text-center py-4">No YTD summaries available</p>
                )}
              </TabsContent>
            </Tabs>

            {/* Export Options */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <ExportPDFButton
                breakdowns={result.data.breakdowns}
                ytdSummaries={result.data.ytdSummaries}
              />
            </div>
          </div>
        </Card>
      )}

      {/* No Data Message */}
      {!loading && !hasData && !error && (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            Click "Calculate Commissions" to generate commission breakdowns and YTD summaries
          </p>
        </Card>
      )}
    </div>
  );
}
