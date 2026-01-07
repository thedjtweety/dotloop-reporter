/**
 * Dotloop Reporting Tool - Main Dashboard
 * 
 * Design: Modern Data-Driven Dashboard with Real Estate Focus
 * - Deep slate blue (#1e3a5f) for trust and professionalism
 * - Emerald green (#10b981) for positive metrics
 * - Clean, hierarchical layout with prominent metrics at top
 * - Interactive charts for pipeline, financial, and geographic analysis
 */

import { useState } from 'react';
import { Upload, TrendingUp, Home as HomeIcon, DollarSign, Calendar, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  parseCSV,
  calculateMetrics,
  getPipelineData,
  getLeadSourceData,
  getPropertyTypeData,
  getGeographicData,
  getSalesOverTime,
  calculateAgentMetrics,
  DotloopRecord,
  DashboardMetrics,
  AgentMetrics,
} from '@/lib/csvParser';
import UploadZone from '@/components/UploadZone';
import MetricCard from '@/components/MetricCard';
import PipelineChart from '@/components/charts/PipelineChart';
import FinancialChart from '@/components/charts/FinancialChart';
import LeadSourceChart from '@/components/charts/LeadSourceChart';
import PropertyTypeChart from '@/components/charts/PropertyTypeChart';
import GeographicChart from '@/components/charts/GeographicChart';
import SalesTimelineChart from '@/components/charts/SalesTimelineChart';
import AgentLeaderboardWithExport from '@/components/AgentLeaderboardWithExport';

export default function Home() {
  const [records, setRecords] = useState<DotloopRecord[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const text = await file.text();
      const parsedRecords = parseCSV(text);
      setRecords(parsedRecords);
      const calculatedMetrics = calculateMetrics(parsedRecords);
      setMetrics(calculatedMetrics);
      const agents = calculateAgentMetrics(parsedRecords);
      setAgentMetrics(agents);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Error parsing CSV file. Please ensure it is a valid Dotloop export.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!metrics) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container py-6">
            <div className="flex items-center gap-3 mb-2">
              <HomeIcon className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-display font-bold text-foreground">
                Dotloop Reporting Tool
              </h1>
            </div>
            <p className="text-muted-foreground">
              Upload your Dotloop CSV export to generate comprehensive transaction reports and analytics
            </p>
          </div>
        </header>

        {/* Upload Section */}
        <main className="container py-12">
          <div className="max-w-2xl mx-auto">
            <UploadZone onFileUpload={handleFileUpload} isLoading={isLoading} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HomeIcon className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                Dotloop Reporting Tool
              </h1>
              <p className="text-sm text-muted-foreground">
                {records.length} transactions analyzed
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setRecords([]);
              setMetrics(null);
            }}
          >
              <HomeIcon className="w-4 h-4 mr-2" />
            Upload New File
          </Button>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="container py-8">
        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total Transactions"
            value={metrics.totalTransactions}
            icon={<HomeIcon className="w-5 h-5" />}
            color="primary"
          />
          <MetricCard
            title="Total Sales Volume"
            value={`$${(metrics.totalSalesVolume / 1000000).toFixed(2)}M`}
            subtitle={`Avg: $${metrics.averagePrice.toLocaleString()}`}
            icon={<DollarSign className="w-5 h-5" />}
            color="accent"
          />
          <MetricCard
            title="Closing Rate"
            value={`${metrics.closingRate}%`}
            subtitle={`${metrics.closed} closed deals`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="accent"
          />
          <MetricCard
            title="Avg Days to Close"
            value={metrics.averageDaysToClose}
            icon={<Calendar className="w-5 h-5" />}
            color="primary"
          />
        </div>

        {/* Status Overview Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Active Listings</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {metrics.activeListings}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <HomeIcon className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Under Contract</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {metrics.underContract}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
                <Percent className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Closed</p>
                <p className="text-2xl font-display font-bold text-accent">
                  {metrics.closed}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Archived</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {metrics.archived}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <HomeIcon className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          </Card>
        </div>

        {/* Agent Leaderboard Section */}
        {agentMetrics.length > 0 && (
          <div className="mb-8">
            <AgentLeaderboardWithExport agents={agentMetrics} records={records} />
          </div>
        )}

        {/* Charts Section */}
        <div className="mb-8">
          <Tabs defaultValue="pipeline" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6">
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="leadsource">Lead Source</TabsTrigger>
              <TabsTrigger value="property">Property Type</TabsTrigger>
              <TabsTrigger value="geographic">Geographic</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
            </TabsList>

            <TabsContent value="pipeline" className="space-y-4">
              <Card className="p-6 bg-card border border-border">
                <h2 className="text-xl font-display font-bold text-foreground mb-4">
                  Pipeline Breakdown
                </h2>
                <PipelineChart data={getPipelineData(records)} />
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card className="p-6 bg-card border border-border">
                <h2 className="text-xl font-display font-bold text-foreground mb-4">
                  Sales Timeline
                </h2>
                <SalesTimelineChart data={getSalesOverTime(records)} />
              </Card>
            </TabsContent>

            <TabsContent value="leadsource" className="space-y-4">
              <Card className="p-6 bg-card border border-border">
                <h2 className="text-xl font-display font-bold text-foreground mb-4">
                  Lead Source Distribution
                </h2>
                <LeadSourceChart data={getLeadSourceData(records)} />
              </Card>
            </TabsContent>

            <TabsContent value="property" className="space-y-4">
              <Card className="p-6 bg-card border border-border">
                <h2 className="text-xl font-display font-bold text-foreground mb-4">
                  Property Type Breakdown
                </h2>
                <PropertyTypeChart data={getPropertyTypeData(records)} />
              </Card>
            </TabsContent>

            <TabsContent value="geographic" className="space-y-4">
              <Card className="p-6 bg-card border border-border">
                <h2 className="text-xl font-display font-bold text-foreground mb-4">
                  Geographic Performance
                </h2>
                <GeographicChart data={getGeographicData(records)} />
              </Card>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <Card className="p-6 bg-card border border-border">
                <h2 className="text-xl font-display font-bold text-foreground mb-4">
                  Financial Summary
                </h2>
                <FinancialChart metrics={metrics} />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
