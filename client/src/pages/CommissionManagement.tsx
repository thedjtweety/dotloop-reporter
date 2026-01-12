/**
 * Commission Management - Dedicated Module
 * 
 * Centralized hub for all commission-related features:
 * - Commission Plans
 * - Team Management  
 * - Agent Assignments
 * - Commission Audit
 * - Commission Calculations (future)
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { ArrowLeft, DollarSign, Users, UserCheck, FileCheck, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CommissionPlansManager from '@/components/CommissionPlansManager';
import TeamManager from '@/components/TeamManager';
import AgentAssignment from '@/components/AgentAssignment';
import CommissionAuditReport from '@/components/CommissionAuditReport';
import { ModeToggle } from '@/components/ModeToggle';
import { useLocation } from 'wouter';
import { DotloopRecord } from '@/lib/csvParser';
import { getRecentFiles } from '@/lib/storage';

export default function CommissionManagement() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('plans');
  const [records, setRecords] = useState<DotloopRecord[]>([]);
  const [hasData, setHasData] = useState(false);

  // Load the most recent upload data for Commission Audit
  useEffect(() => {
    const loadRecentData = async () => {
      const recentFiles = await getRecentFiles();
      if (recentFiles.length > 0) {
        const mostRecent = recentFiles[0];
        if (mostRecent.data) {
          setRecords(mostRecent.data);
          setHasData(true);
        }
      }
    };
    
    loadRecentData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Analytics
            </Button>
            <div className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Commission Management</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user && (
              <div className="text-sm text-muted-foreground hidden sm:block">
                {user.name || user.email}
              </div>
            )}
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Page Description */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Complete Commission Management System
              </h2>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Configure commission plans, manage teams, assign agents to plans, and audit commission calculations. 
                All your commission tools in one centralized location.
              </p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-6 h-auto">
            <TabsTrigger value="plans" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Commission Plans</span>
              <span className="sm:hidden">Plans</span>
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Team Management</span>
              <span className="sm:hidden">Teams</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Agent Assignments</span>
              <span className="sm:hidden">Agents</span>
            </TabsTrigger>
            <TabsTrigger 
              value="audit" 
              className="gap-2 text-red-600 data-[state=active]:text-red-700 data-[state=active]:bg-red-50 dark:data-[state=active]:bg-red-950"
            >
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Commission Audit</span>
              <span className="sm:hidden">Audit</span>
            </TabsTrigger>
            <TabsTrigger 
              value="calculate" 
              className="gap-2 opacity-50 cursor-not-allowed"
              disabled
            >
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Calculate (Coming Soon)</span>
              <span className="sm:hidden">Calculate</span>
            </TabsTrigger>
          </TabsList>

          {/* Commission Plans Tab */}
          <TabsContent value="plans" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Commission Plans</h3>
                <p className="text-sm text-muted-foreground">
                  Create and manage commission plans with custom splits, caps, and deductions.
                </p>
              </div>
              <CommissionPlansManager />
            </Card>
          </TabsContent>

          {/* Team Management Tab */}
          <TabsContent value="teams" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Team Management</h3>
                <p className="text-sm text-muted-foreground">
                  Configure teams and team lead commission splits.
                </p>
              </div>
              <TeamManager />
            </Card>
          </TabsContent>

          {/* Agent Assignments Tab */}
          <TabsContent value="assignments" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Agent Assignments</h3>
                <p className="text-sm text-muted-foreground">
                  Assign agents to commission plans and teams, and set anniversary dates for cap tracking.
                </p>
              </div>
              <AgentAssignment records={records} />
            </Card>
          </TabsContent>

          {/* Commission Audit Tab */}
          <TabsContent value="audit" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            {hasData ? (
              <Card className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2 text-red-600 dark:text-red-400">
                    Commission Audit Report
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Verify commission calculations against your uploaded data. Identifies discrepancies and tracks YTD progress.
                  </p>
                </div>
                <CommissionAuditReport records={records} />
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload transaction data from the Analytics page to run commission audits.
                </p>
                <Button onClick={() => setLocation('/')}>
                  Go to Analytics
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Calculate Tab (Coming Soon) */}
          <TabsContent value="calculate" className="space-y-4">
            <Card className="p-12 text-center">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Automatic Commission Calculation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This feature is coming soon! It will automatically calculate commissions based on your plans and transaction data.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                <span className="font-semibold">Status:</span>
                <span>In Development</span>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
