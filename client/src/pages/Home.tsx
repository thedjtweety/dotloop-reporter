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
import { useLocation } from 'wouter';
import { Upload, TrendingUp, Home as HomeIcon, DollarSign, Calendar, Percent, Settings, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { generateSampleData } from '@/lib/sampleData';
import { getRecentFiles, saveRecentFile, deleteRecentFile } from '@/lib/storage';
import UploadZone from '@/components/UploadZone';
import TrustBar from '@/components/TrustBar';
import CommissionProjector from '@/components/CommissionProjector';
import RecentUploads, { RecentFile } from '@/components/RecentUploads';
import MetricCard from '@/components/MetricCard';
import ColumnMapping from '@/components/ColumnMapping';
import FieldMapper, { ColumnMapping as FieldMapping } from '@/components/FieldMapper';
import { DatePickerWithRange } from '@/components/DateRangePicker';
import { normalizeRecord } from '@/lib/csvParser';
import PipelineChart from '@/components/charts/PipelineChart';
import FinancialChart from '@/components/charts/FinancialChart';
import CommissionBreakdownChart from '@/components/CommissionBreakdownChart';
import RevenueDistributionChart from '@/components/charts/RevenueDistributionChart';
import BuySellTrendChart from '@/components/charts/BuySellTrendChart';
import AgentMixChart from '@/components/charts/AgentMixChart';
import ComplianceChart from '@/components/charts/ComplianceChart';
import TagsChart from '@/components/charts/TagsChart';
import PropertyInsightsChart from '@/components/charts/PropertyInsightsChart';
import PriceReductionChart from '@/components/charts/PriceReductionChart';
import LeadSourceChart from '@/components/charts/LeadSourceChart';
import PropertyTypeChart from '@/components/charts/PropertyTypeChart';
import GeographicChart from '@/components/charts/GeographicChart';
import SalesTimelineChart from '@/components/charts/SalesTimelineChart';
import AgentLeaderboardWithExport from '@/components/AgentLeaderboardWithExport';
import DrillDownModal from '@/components/DrillDownModal';
import DataHealthCheck from '@/components/DataHealthCheck';
import CommissionPlansManager from '@/components/CommissionPlansManager';
import TeamManager from '@/components/TeamManager';
import AgentAssignment from '@/components/AgentAssignment';
import CommissionAuditReport from '@/components/CommissionAuditReport';
import DataValidationReport from '@/components/DataValidationReport';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ModeToggle } from '@/components/ModeToggle';
import MobileNav from '@/components/MobileNav';

export default function Home() {
  const [location, setLocation] = useLocation();
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
  const [showFieldMapper, setShowFieldMapper] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ headers: string[], data: any[][] } | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [rawCsvData, setRawCsvData] = useState<any[]>([]);
  const [customMapping, setCustomMapping] = useState<FieldMapping>({});
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [activeTab, setActiveTab] = useState('pipeline');
  const [showConsultantConfirm, setShowConsultantConfirm] = useState(false);
  const [consultantRedirectData, setConsultantRedirectData] = useState<DotloopRecord[] | null>(null);

  // Load saved mapping and recent files on mount
  useEffect(() => {
    const saved = localStorage.getItem('dotloop_field_mapping');
    if (saved) {
      try {
        setCustomMapping(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved mapping', e);
      }
    }

    // Load recent files from localStorage
    const savedFiles = localStorage.getItem('dotloop_recent_files');
    if (savedFiles) {
      try {
        setRecentFiles(JSON.parse(savedFiles));
      } catch (e) {
        console.error('Failed to parse recent files', e);
      }
    }
  }, []);



  const handleSaveRecent = async (name: string, records: DotloopRecord[]) => {
    try {
      const updated = await saveRecentFile(name, records);
      setRecentFiles(updated);
    } catch (e) {
      console.error('Failed to save recent file', e);
    }
  };

  const handleRecentSelect = (file: RecentFile) => {
    setAllRecords(file.data);
    setFilteredRecords(file.data);
    setMetrics(calculateMetrics(file.data));
    setAgentMetrics(calculateAgentMetrics(file.data));
  };

  const handleRecentDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentFiles.filter(f => f.id !== id);
    setRecentFiles(updated);
    localStorage.setItem('dotloop_recent_files', JSON.stringify(updated));
  };

  const handleDemoMode = () => {
    setIsLoading(true);
    setTimeout(() => {
      const sampleData = generateSampleData(150);
      setAllRecords(sampleData);
      setFilteredRecords(sampleData);
      setMetrics(calculateMetrics(sampleData));
      setAgentMetrics(calculateAgentMetrics(sampleData));
      setIsLoading(false);
    }, 1500);
  };

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

  const handleChartClick = (type: 'pipeline' | 'leadSource' | 'propertyType' | 'geographic' | 'commission', label: string) => {
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
      case 'commission':
        title = `Commission: ${label}`;
        // This is simplified, actual filtering would depend on how commission data is structured
        filtered = filteredRecords; 
        break;
    }

    setDrillDownTitle(title);
    setDrillDownTransactions(filtered);
    setDrillDownOpen(true);
  };

  const handleFileUpload = (file: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const { headers, data } = parseCSV(text);
        
        // Check if this is a Consultant/Volume-only report
        // Logic: Has headers but missing critical commission columns
        const hasCommissionData = headers.some(h => 
          h.toLowerCase().includes('commission') || 
          h.toLowerCase().includes('split') || 
          h.toLowerCase().includes('gross')
        );
        
        const hasVolumeData = headers.some(h => 
          h.toLowerCase().includes('price') || 
          h.toLowerCase().includes('volume')
        );

        if (!hasCommissionData && hasVolumeData) {
          // Store data temporarily and ask user
          const records = data.map(row => {
            const record: any = {};
            headers.forEach((header, index) => {
              record[header] = row[index];
            });
            return normalizeRecord(record, customMapping);
          });
          
          setConsultantRedirectData(records);
          setShowConsultantConfirm(true);
          setIsLoading(false);
          return;
        }

        // Standard flow
        setCsvHeaders(headers);
        setRawCsvData(data);
        setPendingFile({ headers, data });
        
        // Check if we have a saved template match
        const matchingTemplate = findMatchingTemplate(headers);
        
        if (matchingTemplate) {
          // Auto-apply template
          setCustomMapping(matchingTemplate.mapping);
          processWithMapping(headers, data, matchingTemplate.mapping);
        } else {
          // Show mapping wizard
          setShowMapping(true);
        }
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please check the format.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleConsultantRedirect = () => {
    if (consultantRedirectData) {
      // In a real app, we would navigate to a different route or set a "mode"
      // For now, we'll just load the data but maybe set a flag or show a toast
      setAllRecords(consultantRedirectData);
      setFilteredRecords(consultantRedirectData);
      setMetrics(calculateMetrics(consultantRedirectData));
      setAgentMetrics(calculateAgentMetrics(consultantRedirectData));
      setShowConsultantConfirm(false);
      
      // Optional: Navigate to a specific "Consultant" tab if we had one
      // setActiveTab('consultant'); 
    }
  };

  const processWithMapping = (headers: string[], data: any[][], mapping: FieldMapping) => {
    const records = data.map(row => {
      const record: any = {};
      headers.forEach((header, index) => {
        record[header] = row[index];
      });
      return normalizeRecord(record, mapping);
    });

    setAllRecords(records);
    setFilteredRecords(records);
    setMetrics(calculateMetrics(records));
    setAgentMetrics(calculateAgentMetrics(records));
    
    // Save template if it's new
    if (!findMatchingTemplate(headers)) {
      saveTemplate('Auto-Saved Template', headers, mapping);
    }
  };

  const handleMappingComplete = (mapping: FieldMapping) => {
    setCustomMapping(mapping);
    localStorage.setItem('dotloop_field_mapping', JSON.stringify(mapping));
    
    if (pendingFile) {
      processWithMapping(pendingFile.headers, pendingFile.data, mapping);
    }
    
    setShowMapping(false);
    setShowFieldMapper(false);
  };

  if (!metrics) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-card">
          <div className="container py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/dotloop-logo.png" alt="Dotloop Logo" className="h-8 w-auto" />
              <h1 className="text-2xl font-display font-bold text-foreground">
                Reporting Tool
              </h1>
            </div>
                <div className="flex items-center gap-2">
                <ModeToggle />
              </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          <div className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center">
            <UploadZone 
              onFileUpload={handleFileUpload} 
              onDemoClick={handleDemoMode}
              isLoading={isLoading} 
            />
            
            <RecentUploads 
              files={recentFiles} 
              onSelect={handleRecentSelect}
              onDelete={handleRecentDelete}
            />
          </div>
          
          <TrustBar />
        </main>

        <AlertDialog open={showConsultantConfirm} onOpenChange={setShowConsultantConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                Consultant Report Detected
              </AlertDialogTitle>
              <AlertDialogDescription>
                This file appears to be a Consultant/Volume-only report (missing commission data).
                Would you like to view it in the specialized <strong>Consultant Performance Hub</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowConsultantConfirm(false)}>
                Stay on Standard Report
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConsultantRedirect}>
                Switch to Consultant Hub
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MobileNav 
              onReset={() => {
                setAllRecords([]);
                setMetrics(null);
                setDateRange(undefined);
              }}
              onOpenSettings={() => {
                setActiveTab('settings');
                setTimeout(() => {
                  document.getElementById('commission-plans-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              onOpenMapping={() => setShowFieldMapper(true)}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            <img src="/dotloop-logo.png" alt="Dotloop Logo" className="h-8 w-auto hidden md:block" />
            <img src="/dotloop-logo.png" alt="Dotloop Logo" className="h-6 w-auto md:hidden" />
            <div>
              <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">
                Reporting Tool
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                {filteredRecords.length} transactions analyzed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 border-primary/50 hover:bg-primary/10 hover:border-primary text-primary font-medium"
                onClick={() => {
                  setActiveTab('settings');
                  setTimeout(() => {
                    document.getElementById('commission-plans-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              >
                <Settings className="w-4 h-4" />
                Commission Settings
              </Button>
              <ModeToggle />
            </div>
            <div className="hidden md:block">
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
            <div className="md:hidden">
               {/* Mobile Date Picker Trigger could go here if needed, or rely on filters in tabs */}
            </div>
            <div className="hidden md:flex gap-2">
              <Button variant="outline" onClick={() => setShowFieldMapper(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Map Fields
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAllRecords([]);
                  setMetrics(null);
                  setDateRange(undefined);
                }}
              >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Upload
              </Button>
            </div>
          </div>
        </div>
        {/* Mobile Sub-header for Date Picker */}
        <div className="md:hidden border-t border-border bg-muted/20 py-2 px-4">
           <DatePickerWithRange date={dateRange} setDate={setDateRange} className="w-full" />
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="container py-8">
        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              title="Total Transactions"
              value={metrics.totalTransactions}
              icon={<HomeIcon className="w-5 h-5" />}
              color="primary"
              trend={metrics.trends?.totalTransactions}
              onClick={() => handleMetricClick('total')}
            />
            <MetricCard
              title="Total Sales Volume"
              value={formatCurrency(metrics.totalSalesVolume)}
              subtitle={`Avg: ${formatCurrency(metrics.averagePrice)}`}
              icon={<DollarSign className="w-5 h-5" />}
              color="accent"
              trend={metrics.trends?.totalVolume}
              onClick={() => handleMetricClick('volume')}
            />
            <MetricCard
              title="Closing Rate"
              value={formatPercentage(metrics.closingRate)}
              subtitle={`${metrics.closed} closed deals`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="accent"
              trend={metrics.trends?.closingRate}
              onClick={() => handleMetricClick('closing')}
            />
            <MetricCard
              title="Avg Days to Close"
              value={metrics.averageDaysToClose}
              icon={<Calendar className="w-5 h-5" />}
              color="primary"
              trend={metrics.trends?.avgDaysToClose}
              onClick={() => handleMetricClick('days')}
            />
          </div>
          {metrics?.hasFinancialData && (
            <div className="lg:col-span-1">
              <CommissionProjector records={filteredRecords} />
            </div>
          )}
        </div>

        {/* Status Overview Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card 
            className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50 active:scale-[0.99]"
            onClick={() => handleMetricClick('active')}
          >
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

          <Card 
            className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-amber-500/50 active:scale-[0.99]"
            onClick={() => handleMetricClick('contract')}
          >
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

          <Card 
            className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-green-500/50 active:scale-[0.99]"
            onClick={() => handleMetricClick('closed')}
          >
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

          <Card 
            className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-gray-400/50 active:scale-[0.99]"
            onClick={() => handleMetricClick('archived')}
          >
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-10 mb-6 h-auto">
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="leadsource">Lead Source</TabsTrigger>
              <TabsTrigger value="property">Property Type</TabsTrigger>
              <TabsTrigger value="geographic">Geographic</TabsTrigger>
              {metrics?.hasFinancialData && (
                <>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="audit" className="text-red-600 data-[state=active]:text-red-700 data-[state=active]:bg-red-50">Commission Audit</TabsTrigger>
                </>
              )}
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="health">Data Health</TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold flex gap-1 items-center">
                <Settings className="w-3 h-3" /> Settings
              </TabsTrigger>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 bg-card border border-border">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Sales Volume Over Time
                  </h2>
                  <SalesTimelineChart 
                    data={getSalesOverTime(filteredRecords)} 
                  />
                </Card>
                <Card className="p-6 bg-card border border-border">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Buy vs Sell Trends
                  </h2>
                  <BuySellTrendChart records={filteredRecords} />
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="leadsource" className="space-y-4">
              <Card className="p-6 bg-card border border-border">
                <h2 className="text-xl font-display font-bold text-foreground mb-4">
                  Lead Source Performance
                </h2>
                <LeadSourceChart 
                  data={getLeadSourceData(filteredRecords)} 
                  onBarClick={(label) => handleChartClick('leadSource', label)}
                />
              </Card>
            </TabsContent>

            <TabsContent value="property" className="space-y-4">
              <Card className="p-6 bg-card border border-border">
                <h2 className="text-xl font-display font-bold text-foreground mb-4">
                  Property Type Distribution
                </h2>
                <PropertyTypeChart 
                  data={getPropertyTypeData(filteredRecords)} 
                  onPieClick={(label) => handleChartClick('propertyType', label)}
                />
              </Card>
            </TabsContent>

            <TabsContent value="geographic" className="space-y-4">
              <Card className="p-6 bg-card border border-border">
                <h2 className="text-xl font-display font-bold text-foreground mb-4">
                  Geographic Distribution
                </h2>
                <GeographicChart 
                  data={getGeographicData(filteredRecords)} 
                  onRegionClick={(label) => handleChartClick('geographic', label)}
                />
              </Card>
            </TabsContent>

            {metrics?.hasFinancialData && (
              <>
                <TabsContent value="financial" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6 bg-card border border-border">
                      <h2 className="text-xl font-display font-bold text-foreground mb-4">
                        Financial Overview
                      </h2>
                      <FinancialChart 
                        metrics={metrics} 
                        onBarClick={(label) => handleChartClick('commission', label)}
                      />
                    </Card>
                    <Card className="p-6 bg-card border border-border">
                      <h2 className="text-xl font-display font-bold text-foreground mb-4">
                        Commission Breakdown
                      </h2>
                      <CommissionBreakdownChart metrics={metrics} />
                    </Card>
                    <Card className="p-6 bg-card border border-border lg:col-span-2">
                      <h2 className="text-xl font-display font-bold text-foreground mb-4">
                        Revenue Distribution
                      </h2>
                      <RevenueDistributionChart records={filteredRecords} />
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="audit" className="space-y-4">
                  <CommissionAuditReport records={filteredRecords} />
                </TabsContent>
              </>
            )}

            <TabsContent value="insights" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 bg-card border border-border">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Market Insights
                  </h2>
                  <PropertyInsightsChart records={filteredRecords} />
                </Card>
                <Card className="p-6 bg-card border border-border">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Price Reduction Analysis
                  </h2>
                  <PriceReductionChart records={filteredRecords} />
                </Card>
                <Card className="p-6 bg-card border border-border">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Agent Mix
                  </h2>
                  <AgentMixChart records={filteredRecords} />
                </Card>
                <Card className="p-6 bg-card border border-border">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Compliance Status
                  </h2>
                  <ComplianceChart records={filteredRecords} />
                </Card>
                <Card className="p-6 bg-card border border-border lg:col-span-2">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Tag Analysis
                  </h2>
                  <TagsChart records={filteredRecords} />
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="health" className="space-y-4">
              <DataHealthCheck records={allRecords} />
              <DataValidationReport records={allRecords} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-8">
              <div id="commission-plans-section">
                <CommissionPlansManager />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <TeamManager />
                <AgentAssignment 
                  records={allRecords} 
                  onUpdate={(updatedRecords) => {
                    setAllRecords(updatedRecords);
                    // Trigger re-calculation
                    const newMetrics = calculateMetrics(updatedRecords);
                    setMetrics(newMetrics);
                    setAgentMetrics(calculateAgentMetrics(updatedRecords));
                  }} 
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Drill Down Modal */}
      <DrillDownModal
        open={drillDownOpen}
        onOpenChange={setDrillDownOpen}
        title={drillDownTitle}
        transactions={drillDownTransactions}
      />

      {/* Field Mapper Modal */}
      <AlertDialog open={showMapping}>
        <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Map Your CSV Columns</AlertDialogTitle>
            <AlertDialogDescription>
              We couldn't automatically match all columns. Please map your CSV headers to our standard fields.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <ColumnMapping 
            headers={csvHeaders} 
            sampleData={rawCsvData}
            onConfirm={handleMappingComplete}
            onCancel={() => setShowMapping(false)}
          />
        </AlertDialogContent>
      </AlertDialog>

      {/* Manual Field Mapper Trigger */}
      <div className="hidden">
        <FieldMapper
          headers={csvHeaders.length > 0 ? csvHeaders : Object.keys(allRecords[0] || {})}
          initialMapping={customMapping}
          onSave={handleMappingComplete}
          onCancel={() => setShowFieldMapper(false)}
        />
      </div>
      
      {/* Actual Field Mapper Dialog */}
      {showFieldMapper && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <FieldMapper
              headers={csvHeaders.length > 0 ? csvHeaders : Object.keys(allRecords[0] || {})}
              initialMapping={customMapping}
              onSave={handleMappingComplete}
              onCancel={() => setShowFieldMapper(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
