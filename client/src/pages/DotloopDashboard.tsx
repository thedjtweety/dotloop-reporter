/**
 * Dotloop Dashboard - Displays synced Dotloop data
 * 
 * This component receives Dotloop transaction data and displays it using
 * the same charts and metrics as the CSV dashboard
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRange } from 'react-day-picker';
import {
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
import { filterRecordsByDate, getPreviousPeriod } from '@/lib/dateUtils';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/formatUtils';
import MetricCard from '@/components/MetricCard';
import { DatePickerWithRange } from '@/components/DateRangePicker';
import PipelineChart from '@/components/charts/PipelineChart';
import FinancialChart from '@/components/charts/FinancialChart';
import LeadSourceChart from '@/components/charts/LeadSourceChart';
import PropertyTypeChart from '@/components/charts/PropertyTypeChart';
import GeographicChart from '@/components/charts/GeographicChart';
import SalesTimelineChart from '@/components/charts/SalesTimelineChart';
import AgentLeaderboardWithExport from '@/components/AgentLeaderboardWithExport';
import DrillDownModal from '@/components/DrillDownModal';
import { TrendingUp, Home as HomeIcon, DollarSign, Calendar } from 'lucide-react';

interface DotloopDashboardProps {
  records: DotloopRecord[];
  onBack?: () => void;
}

export default function DotloopDashboard({ records, onBack }: DotloopDashboardProps) {
  const [allRecords] = useState<DotloopRecord[]>(records);
  const [filteredRecords, setFilteredRecords] = useState<DotloopRecord[]>(records);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [activeTab, setActiveTab] = useState('pipeline');
  
  // Drill-down state
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownTitle, setDrillDownTitle] = useState('');
  const [drillDownTransactions, setDrillDownTransactions] = useState<DotloopRecord[]>([]);

  // Update metrics when date range or records change
  useEffect(() => {
    if (allRecords.length === 0) return;

    let currentRecords = allRecords;
    let previousRecords: DotloopRecord[] | undefined;

    if (dateRange?.from && dateRange?.to) {
      currentRecords = filterRecordsByDate(allRecords, { from: dateRange.from, to: dateRange.to });
      
      const prevRange = getPreviousPeriod({ from: dateRange.from, to: dateRange.to });
      previousRecords = filterRecordsByDate(allRecords, prevRange);
    }

    setFilteredRecords(currentRecords);
    setMetrics(calculateMetrics(currentRecords, previousRecords));
    setAgentMetrics(calculateAgentMetrics(currentRecords));
  }, [allRecords, dateRange]);

  const handleMetricClick = (type: 'total' | 'volume' | 'closing' | 'days' | 'active' | 'contract' | 'closed' | 'archived') => {
    let filtered: DotloopRecord[] = [];
    let title = '';

    switch (type) {
      case 'total':
        title = 'All Transactions';
        filtered = filteredRecords;
        break;
      case 'volume':
        title = 'Sales Volume Breakdown';
        filtered = filteredRecords.filter(r => (r.salePrice || r.price) > 0).sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
        break;
      case 'closing':
        title = 'Closed Deals';
        filtered = filteredRecords.filter(r => r.loopStatus?.toLowerCase().includes('closed') || r.loopStatus?.toLowerCase().includes('sold'));
        break;
      case 'days':
        title = 'Days to Close Analysis';
        filtered = filteredRecords.filter(r => r.loopStatus?.toLowerCase().includes('closed') || r.loopStatus?.toLowerCase().includes('sold'));
        break;
      case 'active':
        title = 'Active Listings';
        filtered = filteredRecords.filter(r => r.loopStatus?.toLowerCase().includes('active'));
        break;
      case 'contract':
        title = 'Under Contract';
        filtered = filteredRecords.filter(r => r.loopStatus?.toLowerCase().includes('contract') || r.loopStatus?.toLowerCase().includes('pending'));
        break;
      case 'closed':
        title = 'Closed Deals';
        filtered = filteredRecords.filter(r => r.loopStatus?.toLowerCase().includes('closed') || r.loopStatus?.toLowerCase().includes('sold'));
        break;
      case 'archived':
        title = 'Archived Loops';
        filtered = filteredRecords.filter(r => r.loopStatus?.toLowerCase().includes('archived'));
        break;
    }

    setDrillDownTitle(title);
    setDrillDownTransactions(filtered);
    setDrillDownOpen(true);
  };

  const handleChartClick = (type: 'pipeline' | 'leadSource' | 'propertyType' | 'geographic', label: string) => {
    let filtered: DotloopRecord[] = [];
    let title = '';

    switch (type) {
      case 'pipeline':
        title = `Pipeline: ${label}`;
        filtered = filteredRecords.filter(r => r.loopStatus === label);
        break;
      case 'leadSource':
        title = `Lead Source: ${label}`;
        filtered = filteredRecords.filter(r => (r.leadSource || 'Unknown') === label);
        break;
      case 'propertyType':
        title = `Property Type: ${label}`;
        filtered = filteredRecords.filter(r => (r.transactionType || 'Unknown') === label);
        break;
      case 'geographic':
        title = `State: ${label}`;
        filtered = filteredRecords.filter(r => (r.state || 'Unknown') === label);
        break;
    }

    setDrillDownTitle(title);
    setDrillDownTransactions(filtered);
    setDrillDownOpen(true);
  };

  if (!metrics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-display font-bold text-foreground">
              Dotloop Dashboard
            </h1>
            {onBack && (
              <button
                onClick={onBack}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Transactions"
            value={metrics.totalTransactions.toString()}
            icon={<HomeIcon className="h-5 w-5" />}
            trend={metrics.trends?.totalTransactions || { value: 0, direction: 'neutral' as const }}
            onClick={() => handleMetricClick('total')}
          />
          <MetricCard
            title="Sales Volume"
            value={formatCurrency(metrics.totalSalesVolume)}
            icon={<DollarSign className="h-5 w-5" />}
            trend={{ value: 0, direction: 'neutral' as const }}
            onClick={() => handleMetricClick('volume')}
          />
          <MetricCard
            title="Avg Closing Rate"
            value={formatPercentage(metrics.closingRate)}
            icon={<TrendingUp className="h-5 w-5" />}
            trend={{ value: 0, direction: 'neutral' as const }}
            onClick={() => handleMetricClick('closing')}
          />
          <MetricCard
            title="Avg Days to Close"
            value={metrics.averageDaysToClose.toFixed(0)}
            icon={<Calendar className="h-5 w-5" />}
            trend={{ value: 0, direction: 'neutral' as const }}
            onClick={() => handleMetricClick('days')}
          />
        </div>

        {/* Charts Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="leadSource">Lead Source</TabsTrigger>
            <TabsTrigger value="propertyType">Property Type</TabsTrigger>
            <TabsTrigger value="geographic">Geographic</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-4">
            <Card className="p-6">
              <PipelineChart
                data={getPipelineData(filteredRecords)}
              />
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <Card className="p-6">
              <FinancialChart records={filteredRecords} metrics={metrics} />
            </Card>
          </TabsContent>

          <TabsContent value="leadSource" className="space-y-4">
            <Card className="p-6">
              <LeadSourceChart
                data={getLeadSourceData(filteredRecords)}
              />
            </Card>
          </TabsContent>

          <TabsContent value="propertyType" className="space-y-4">
            <Card className="p-6">
              <PropertyTypeChart
                data={getPropertyTypeData(filteredRecords)}
              />
            </Card>
          </TabsContent>

          <TabsContent value="geographic" className="space-y-4">
            <Card className="p-6">
              <GeographicChart
                data={getGeographicData(filteredRecords)}
              />
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card className="p-6">
              <SalesTimelineChart data={getSalesOverTime(filteredRecords)} />
            </Card>
          </TabsContent>
        </Tabs>

        {/* Agent Leaderboard */}
        <Card className="p-6">
          <AgentLeaderboardWithExport
            agents={agentMetrics}
            records={filteredRecords}
          />
        </Card>
      </main>

      {/* Drill Down Modal */}
      <DrillDownModal
        isOpen={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        title={drillDownTitle}
        transactions={drillDownTransactions}
      />
    </div>
  );
}
