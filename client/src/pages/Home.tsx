/**
 * Dotloop Reporting Tool - Main Dashboard
 * 
 * Design: Modern Data-Driven Dashboard with Real Estate Focus
 * - Deep slate blue (#1e3a5f) for trust and professionalism
 * - Emerald green (#10b981) for positive metrics
 * - Clean, hierarchical layout with prominent metrics at top
 * - Interactive charts for pipeline, financial, and geographic analysis
 */

import { useState, useEffect } from 'react';
import { Upload, TrendingUp, Home as HomeIcon, DollarSign, Calendar, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/formatUtils';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRange } from 'react-day-picker';
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
import { filterRecordsByDate, getPreviousPeriod } from '@/lib/dateUtils';
import { cleanDate, cleanNumber, cleanPercentage, cleanText } from '@/lib/dataCleaning';
import { findMatchingTemplate, saveTemplate } from '@/lib/importTemplates';
import UploadZone from '@/components/UploadZone';
import MetricCard from '@/components/MetricCard';
import ColumnMapping from '@/components/ColumnMapping';
import { DatePickerWithRange } from '@/components/DateRangePicker';
import PipelineChart from '@/components/charts/PipelineChart';
import FinancialChart from '@/components/charts/FinancialChart';
import LeadSourceChart from '@/components/charts/LeadSourceChart';
import PropertyTypeChart from '@/components/charts/PropertyTypeChart';
import GeographicChart from '@/components/charts/GeographicChart';
import SalesTimelineChart from '@/components/charts/SalesTimelineChart';
import AgentLeaderboardWithExport from '@/components/AgentLeaderboardWithExport';
import DrillDownModal from '@/components/DrillDownModal';

export default function Home() {
  const [allRecords, setAllRecords] = useState<DotloopRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<DotloopRecord[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  // Drill-down state
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownTitle, setDrillDownTitle] = useState('');
  const [drillDownTransactions, setDrillDownTransactions] = useState<DotloopRecord[]>([]);

  // Import Wizard State
  const [showMapping, setShowMapping] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ headers: string[], data: any[][] } | null>(null);

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

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const text = await file.text();
      
      // Basic parse to check structure
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 1) throw new Error('Empty file');
      
      // Parse first line to get headers
      // Simple CSV split handling quotes
      const parseLine = (line: string) => {
        const fields = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          if (line[i] === '"') {
            if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
            else { inQuotes = !inQuotes; }
          } else if (line[i] === ',' && !inQuotes) {
            fields.push(current); current = '';
          } else { current += line[i]; }
        }
        fields.push(current);
        return fields;
      };

      const headers = parseLine(lines[0]).map(h => h.trim());
      const data = lines.slice(1).map(line => parseLine(line));

      // Check for saved template
      const template = findMatchingTemplate(headers);
      
      if (template) {
        // Auto-process with template
        processWithMapping(headers, data, template.mapping);
      } else {
        // Show mapping UI
        setPendingFile({ headers, data });
        setShowMapping(true);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Error parsing CSV file. Please ensure it is a valid CSV export.');
    } finally {
      setIsLoading(false);
    }
  };

  const processWithMapping = (headers: string[], data: any[][], mapping: Record<string, string>) => {
    const records: DotloopRecord[] = data.map(row => {
      const getValue = (key: string) => {
        const header = mapping[key];
        const index = headers.indexOf(header);
        return index >= 0 ? row[index] : '';
      };

      return {
        loopId: crypto.randomUUID(), // Generate ID if missing
        loopName: cleanText(getValue('address')), // Use address as name fallback
        loopStatus: cleanText(getValue('status')),
        createdDate: cleanDate(getValue('createdDate') || getValue('listingDate')),
        closingDate: cleanDate(getValue('closingDate')),
        listingDate: cleanDate(getValue('listingDate')),
        offerDate: '',
        address: cleanText(getValue('address')),
        price: cleanNumber(getValue('price')),
        propertyType: cleanText(getValue('propertyType')) || 'Residential',
        bedrooms: 0,
        bathrooms: 0,
        squareFootage: 0,
        yearBuilt: 0,
        city: '',
        state: '',
        county: '',
        leadSource: cleanText(getValue('leadSource')),
        earnestMoney: 0,
        salePrice: cleanNumber(getValue('price')),
        commissionRate: 0,
        commissionTotal: cleanNumber(getValue('commission')),
        agents: cleanText(getValue('agentName')),
        createdBy: cleanText(getValue('agentName')),
        buySideCommission: 0, // Could map if available
        sellSideCommission: 0,
        buySidePercentage: 0,
        sellSidePercentage: 0,
      };
    }).filter(r => r.address && r.price > 0); // Basic validation

    setAllRecords(records);
    setShowMapping(false);
    setPendingFile(null);
  };

  const handleMappingConfirm = (mapping: Record<string, string>) => {
    if (pendingFile) {
      // Save as template
      saveTemplate('Custom Import', mapping);
      processWithMapping(pendingFile.headers, pendingFile.data, mapping);
    }
  };

  if (showMapping && pendingFile) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container">
          <ColumnMapping 
            headers={pendingFile.headers} 
            sampleData={pendingFile.data.slice(0, 5)}
            onConfirm={handleMappingConfirm}
            onCancel={() => {
              setShowMapping(false);
              setPendingFile(null);
            }}
          />
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container py-6">
            <div className="flex items-center gap-3 mb-2">
              <img src="/dotloop-logo.png" alt="Dotloop Logo" className="h-10 w-auto" />
              <h1 className="text-3xl font-display font-bold text-foreground">
                Reporting Tool
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
            <img src="/dotloop-logo.png" alt="Dotloop Logo" className="h-8 w-auto" />
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                Reporting Tool
              </h1>
              <p className="text-sm text-muted-foreground">
                {filteredRecords.length} transactions analyzed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            <Button
              variant="outline"
              onClick={() => {
                setAllRecords([]);
                setMetrics(null);
                setDateRange(undefined);
              }}
            >
                <HomeIcon className="w-4 h-4 mr-2" />
              Upload New File
            </Button>
          </div>
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
            trend={metrics.trends?.totalTransactions}
          />
          <MetricCard
            title="Total Sales Volume"
            value={formatCurrency(metrics.totalSalesVolume)}
            subtitle={`Avg: ${formatCurrency(metrics.averagePrice)}`}
            icon={<DollarSign className="w-5 h-5" />}
            color="accent"
            trend={metrics.trends?.totalVolume}
          />
          <MetricCard
            title="Closing Rate"
            value={formatPercentage(metrics.closingRate)}
            subtitle={`${metrics.closed} closed deals`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="accent"
            trend={metrics.trends?.closingRate}
          />
          <MetricCard
            title="Avg Days to Close"
            value={metrics.averageDaysToClose}
            icon={<Calendar className="w-5 h-5" />}
            color="primary"
            trend={metrics.trends?.avgDaysToClose}
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
            <AgentLeaderboardWithExport agents={agentMetrics} records={filteredRecords} />
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
                <PipelineChart 
                  data={getPipelineData(filteredRecords)} 
                  onBarClick={(label) => handleChartClick('pipeline', label)}
                />
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card className="p-6 bg-card border border-border">
                <h2 className="text-xl font-display font-bold text-foreground mb-4">
                  Sales Timeline
                </h2>
                <SalesTimelineChart data={getSalesOverTime(filteredRecords)} />
              </Card>
            </TabsContent>

            <TabsContent value="leadsource" className="space-y-4">
              <Card className="p-6 bg-card border border-border">
                <h2 className="text-xl font-display font-bold text-foreground mb-4">
                  Lead Source Distribution
                </h2>
                <LeadSourceChart 
                  data={getLeadSourceData(filteredRecords)} 
                  onSliceClick={(label) => handleChartClick('leadSource', label)}
                />
              </Card>
            </TabsContent>

            <TabsContent value="property" className="space-y-4">
              <Card className="p-6 bg-card border border-border">
                <h2 className="text-xl font-display font-bold text-foreground mb-4">
                  Property Type Breakdown
                </h2>
                <PropertyTypeChart 
                  data={getPropertyTypeData(filteredRecords)} 
                  onBarClick={(label) => handleChartClick('propertyType', label)}
                />
              </Card>
            </TabsContent>

            <TabsContent value="geographic" className="space-y-4">
              <Card className="p-6 bg-card border border-border">
                <h2 className="text-xl font-display font-bold text-foreground mb-4">
                  Geographic Performance
                </h2>
                <GeographicChart 
                  data={getGeographicData(filteredRecords)} 
                  onBarClick={(label) => handleChartClick('geographic', label)}
                />
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

      <DrillDownModal
        isOpen={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        title={drillDownTitle}
        transactions={drillDownTransactions}
      />
    </div>
  );
}
