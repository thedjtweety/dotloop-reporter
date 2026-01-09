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
        title = `Commission Type: ${label}`;
        if (label === 'Buy Side') {
          filtered = filteredRecords.filter(r => r.buySideCommission > 0);
        } else if (label === 'Sell Side') {
          filtered = filteredRecords.filter(r => r.sellSideCommission > 0);
        }
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

      let headers = parseLine(lines[0]).map(h => h.trim());
      let data = lines.slice(1).map(line => parseLine(line));

      // Detect if first row is data (headless CSV)
      // Heuristic: Check if "headers" contain dates or numbers
      // Only trigger if > 50% of columns look like data, to avoid false positives on weird headers
      const dataLikeColumns = headers.filter(h => 
        (!isNaN(parseFloat(h)) && h.length < 20) || // Is a number (and not a long ID)
        (h.includes('/') && h.length < 20) // Looks like a date
      ).length;

      const isHeadless = dataLikeColumns > headers.length * 0.5;

      if (isHeadless) {
        // Treat first row as data
        data = [headers, ...data];
        // Generate synthetic headers
        headers = headers.map((_, i) => `Column ${i + 1}`);
      }
      // Store raw data for re-mapping
      setCsvHeaders(headers);
      setRawCsvData(data);

      // Check for saved template
      const template = findMatchingTemplate(headers);

      if (template) {
        // Auto-process with template
        processWithMapping(headers, data, template.mapping, file.name);
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

  const handleFieldMappingSave = (mapping: FieldMapping) => {
    setCustomMapping(mapping);
    localStorage.setItem('dotloop_field_mapping', JSON.stringify(mapping));
    
    // Re-process data with new mapping
    if (rawCsvData.length > 0) {
      // Convert raw array data back to object for normalizeRecord if needed
      // Assuming rawCsvData is array of arrays, we need to map it to objects using headers
      const dataAsObjects = rawCsvData.map(row => {
        const obj: any = {};
        csvHeaders.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });

      const normalized = dataAsObjects.map(r => normalizeRecord(r, mapping)).filter(Boolean) as DotloopRecord[];
      setAllRecords(normalized);
      setFilteredRecords(normalized);
    }
    setShowFieldMapper(false);
  };

  const processWithMapping = (headers: string[], data: any[][], mapping: Record<string, string>, fileName: string = 'Uploaded File') => {
    const records: DotloopRecord[] = data.map(row => {
      const getValue = (key: string, fallbacks: string[] = []) => {
        // 1. Try explicit mapping
        const header = mapping[key];
        if (header) {
          const index = headers.indexOf(header);
          if (index >= 0) return row[index];
        }

        // 2. Try exact fallbacks (if no mapping or mapping failed)
        for (const fallback of fallbacks) {
          const index = headers.indexOf(fallback);
          if (index >= 0) return row[index];
        }
        
        return '';
      };

      const loopId = getValue('loopId', ['Loop ID', 'Loop View']) || crypto.randomUUID();
      return {
        loopId,
        loopViewUrl: loopId && !loopId.includes('-') ? `https://www.dotloop.com/loop/${loopId}/view` : '',
        loopName: cleanText(getValue('loopName', ['Loop Name', 'Address'])),
        loopStatus: cleanText(getValue('status', ['Loop Status', 'Status'])),
        createdDate: cleanDate(getValue('createdDate', ['Created Date', 'Listing Date'])),
        closingDate: cleanDate(getValue('closingDate', ['Closing Date', 'Contract Dates / Closing Date'])),
        listingDate: cleanDate(getValue('listingDate', ['Listing Date', 'Listing Information / Listing Date'])),
        offerDate: cleanDate(getValue('offerDate', ['Offer Date'])),
        address: cleanText(getValue('address', ['Address', 'Property Address / Full Address'])),
        price: cleanNumber(getValue('price', ['Price', 'Financials / Purchase/Sale Price', 'Listing Information / Current Price'])),
        propertyType: cleanText(getValue('propertyType', ['Property / Type', 'Property Type'])) || 'Residential',
        bedrooms: 0,
        bathrooms: 0,
        squareFootage: 0,
        city: cleanText(getValue('city', ['Property Address / City'])),
        state: cleanText(getValue('state', ['Property Address / State/Prov'])),
        county: cleanText(getValue('county', ['Property Address / County'])),
        leadSource: cleanText(getValue('leadSource', ['Lead Source / Lead Source', 'Lead Source'])),
        earnestMoney: cleanNumber(getValue('earnestMoney', ['Financials / Earnest Money Amount'])),
        salePrice: cleanNumber(getValue('price', ['Financials / Purchase/Sale Price', 'Price'])),
        commissionRate: cleanNumber(getValue('commissionRate', ['Financials / Sale Commission Rate'])),
        commissionTotal: cleanNumber(getValue('commission', ['Total Commission', 'Financials / Sale Commission Total'])),
        agents: cleanText(getValue('agentName', ['Agents', 'Agent Name'])),
        createdBy: cleanText(getValue('createdBy', ['Created By', 'Agents'])),
        buySideCommission: cleanNumber(getValue('buyCommission', ['Buy Side Commission', 'Financials / Sale Commission Split $ - Buy Side'])),
        sellSideCommission: cleanNumber(getValue('sellCommission', ['Sell Side Commission', 'Financials / Sale Commission Split $ - Sell Side'])),
        buySidePercentage: 0,
        sellSidePercentage: 0,
        companyDollar: cleanNumber(getValue('companyDollar', ['Company Dollar', 'Net to Office'])),
        referralSource: cleanText(getValue('referralSource', ['Referral / Referral Source'])),
        referralPercentage: cleanNumber(getValue('referralPercentage', ['Referral / Referral %'])),
        complianceStatus: cleanText(getValue('complianceStatus', ['Compliance Status', 'Review Status'])) || 'No Status',
        tags: (getValue('tags', ['Tags']) || '').split('|').filter((t: string) => t.trim()),
        originalPrice: cleanNumber(getValue('originalPrice', ['Listing Information / Original Price'])),
        yearBuilt: 0,
        lotSize: 0,
        subdivision: '',
      };
    }).map(r => {
      // Calculate total commission if missing but splits exist
      if (r.commissionTotal === 0 && (r.buySideCommission > 0 || r.sellSideCommission > 0)) {
        r.commissionTotal = r.buySideCommission + r.sellSideCommission;
      }
      return r;
    }).filter(r => r.address && r.price > 0); // Basic validation

    setAllRecords(records);
    setShowMapping(false);
    setPendingFile(null);
    handleSaveRecent(fileName, records);

    // Check for volume-only data (no commission) and redirect to Creative Dashboard
    // Logic: If the CSV *headers* contain commission-related keywords, it's a Real Estate report (even if values are 0).
    // If headers are completely missing commission columns, it's likely the Consultant/Volume-only report.
    const headerString = headers.join(' ').toLowerCase();
    const hasFinancialColumns = 
      headerString.includes('commission') || 
      headerString.includes('company dollar') || 
      headerString.includes('split') ||
      headerString.includes('net to office');

    if (!hasFinancialColumns) {
      setConsultantRedirectData(records);
      setShowConsultantConfirm(true);
    }
  };

  const handleConsultantRedirect = () => {
    if (consultantRedirectData) {
      localStorage.setItem('creative_dashboard_data', JSON.stringify(consultantRedirectData));
      setLocation('/creative');
    }
    setShowConsultantConfirm(false);
  };

  const handleMappingConfirm = (mapping: Record<string, string>) => {
    if (pendingFile) {
      // Save as template
      saveTemplate('Custom Import', mapping);
      processWithMapping(pendingFile.headers, pendingFile.data, mapping);
    }
  };

  if (showFieldMapper) {
    return (
      <div className="min-h-screen bg-background p-8">
        <FieldMapper 
          headers={csvHeaders}
          initialMapping={customMapping}
          onSave={handleFieldMappingSave}
          onCancel={() => setShowFieldMapper(false)}
        />
      </div>
    );
  }

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
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-card relative z-10">
          <div className="container mx-auto px-4 py-4 flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg">
              <img src="/images/dotloop-logo.png" alt="Dotloop" className="h-8 w-auto object-contain" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Reporting Tool
            </h1>
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
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden md:flex gap-2 border-primary/50 hover:bg-primary/10 hover:border-primary text-primary font-medium"
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
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
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
              <ErrorBoundary>
                <Card className="p-6 bg-card border border-border">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Sales Timeline
                  </h2>
                  <SalesTimelineChart data={getSalesOverTime(filteredRecords)} />
                </Card>
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="leadsource" className="space-y-4">
              <ErrorBoundary>
                <Card className="p-6 bg-card border border-border">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Lead Source Distribution
                  </h2>
                  <LeadSourceChart 
                    data={getLeadSourceData(filteredRecords)} 
                    onSliceClick={(label) => handleChartClick('leadSource', label)}
                  />
                </Card>
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="property" className="space-y-4">
              <ErrorBoundary>
                <Card className="p-6 bg-card border border-border">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Property Type Breakdown
                  </h2>
                  <PropertyTypeChart 
                    data={getPropertyTypeData(filteredRecords)} 
                    onBarClick={(label) => handleChartClick('propertyType', label)}
                  />
                </Card>
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="geographic" className="space-y-4">
              <ErrorBoundary>
                <Card className="p-6 bg-card border border-border">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Geographic Performance
                  </h2>
                  <GeographicChart 
                    data={getGeographicData(filteredRecords)} 
                    onBarClick={(label) => handleChartClick('geographic', label)}
                  />
                </Card>
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 bg-card border border-border lg:col-span-2">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Financial Summary
                  </h2>
                  <FinancialChart metrics={metrics} />
                </Card>
                <div className="lg:col-span-1">
                  <CommissionBreakdownChart 
                    buySide={agentMetrics.reduce((sum, agent) => sum + agent.buySideCommission, 0)}
                    sellSide={agentMetrics.reduce((sum, agent) => sum + agent.sellSideCommission, 0)}
                    onSliceClick={(label) => handleChartClick('commission', label)}
                  />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <RevenueDistributionChart 
                    totalCommission={metrics.totalCommission}
                    companyDollar={filteredRecords.reduce((sum, r) => sum + r.companyDollar, 0)}
                  />
                </div>
                <div className="lg:col-span-1">
                  <BuySellTrendChart data={filteredRecords} />
                </div>
                <div className="lg:col-span-1">
                  <AgentMixChart agents={agentMetrics} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 bg-card border border-border">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Compliance Status
                  </h2>
                  <ComplianceChart data={filteredRecords} />
                </Card>
                <Card className="p-6 bg-card border border-border">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Tag Analysis
                  </h2>
                  <TagsChart data={filteredRecords} />
                </Card>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 bg-card border border-border">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Price vs. Year Built
                  </h2>
                  <PropertyInsightsChart data={filteredRecords} />
                </Card>
                <Card className="p-6 bg-card border border-border">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    List vs. Sale Price
                  </h2>
                  <PriceReductionChart data={filteredRecords} />
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="health" className="space-y-4">
              <DataHealthCheck records={filteredRecords} />
            </TabsContent>

            <TabsContent value="audit" className="space-y-4">
              <CommissionAuditReport records={filteredRecords} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-8">
              <Card id="commission-plans-section" className="p-6 bg-card border border-border">
                <CommissionPlansManager />
              </Card>
              <Card className="p-6 bg-card border border-border">
                <TeamManager />
              </Card>
              <Card className="p-6 bg-card border border-border">
                <AgentAssignment records={allRecords} />
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
