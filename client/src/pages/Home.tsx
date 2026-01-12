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
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
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
import { validateCSVFile, ValidationResult } from '@/lib/csvValidator';
import { ValidationErrorDisplay } from '@/components/ValidationErrorDisplay';
import { UploadProgress, useUploadProgress } from '@/components/UploadProgress';
import { filterRecordsByDate, getPreviousPeriod } from '@/lib/dateUtils';
import { cleanDate, cleanNumber, cleanPercentage, cleanText } from '@/lib/dataCleaning';
import { findMatchingTemplate, saveTemplate } from '@/lib/importTemplates';
import { generateSampleData } from '@/lib/sampleData';
import { getRecentFiles, saveRecentFile, deleteRecentFile } from '@/lib/storage';
import UploadZone from '@/components/UploadZone';
import CommissionProjector from '@/components/CommissionProjector';
import RecentUploads, { RecentFile } from '@/components/RecentUploads';
import UploadHistory from '@/components/UploadHistory';
import ConnectDotloop from '@/components/ConnectDotloop';
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
import { Dialog, DialogContent } from '@/components/ui/dialog';
import OnboardingTour from '@/components/OnboardingTour';
import { useOnboardingTour, uploadTourSteps, dashboardTourSteps } from '@/hooks/useOnboardingTour';

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [location, setLocation] = useLocation();
  const { showTour, completeTour, skipTour } = useOnboardingTour();
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
  
  // CSV Validation State
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showValidationError, setShowValidationError] = useState(false);
  
  // Upload Progress State
  const [showProgress, setShowProgress] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileSize, setUploadFileSize] = useState('');
  const uploadProgress = useUploadProgress();

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
        title = `Commission Range: ${label}`;
        // Logic for commission range filtering would go here
        filtered = filteredRecords;
        break;
    }

    setDrillDownTitle(title);
    setDrillDownTransactions(filtered);
    setDrillDownOpen(true);
  };

  const [currentUploadId, setCurrentUploadId] = useState<number | undefined>();
  const utils = trpc.useUtils();

  const uploadMutation = trpc.uploads.create.useMutation({
    onSuccess: (result) => {
      // Refetch the uploads list
      utils.uploads.list.invalidate();
      // Set the current upload ID
      setCurrentUploadId(result.uploadId);
    },
  });

  const { data: uploadTransactions } = trpc.uploads.getTransactions.useQuery(
    { uploadId: currentUploadId! },
    { enabled: !!currentUploadId }
  );

  // Load transactions when uploadId changes
  useEffect(() => {
    if (uploadTransactions && uploadTransactions.length > 0) {
      setAllRecords(uploadTransactions);
      setFilteredRecords(uploadTransactions);
      setMetrics(calculateMetrics(uploadTransactions));
      setAgentMetrics(calculateAgentMetrics(uploadTransactions));
    }
  }, [uploadTransactions]);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    
    // Show progress dialog for files > 1MB
    const shouldShowProgress = file.size > 1024 * 1024; // 1MB
    if (shouldShowProgress) {
      setUploadFileName(file.name);
      setUploadFileSize(formatBytes(file.size));
      setShowProgress(true);
      uploadProgress.reset();
    }
    
    // Track performance metrics
    const performanceMetrics = {
      fileSize: file.size,
      validationTimeMs: 0,
      parsingTimeMs: 0,
      totalTimeMs: 0,
    };
    const overallStartTime = Date.now();
    
    try {
      // Step 1: Validate the CSV file
      if (shouldShowProgress) {
        uploadProgress.startStage('validation', 'Checking file format and structure...');
      }
      
      const validationStartTime = Date.now();
      const validationResult = await validateCSVFile(file, (progress, message) => {
        if (shouldShowProgress) {
          uploadProgress.updateProgress('validation', progress, message);
        }
      });
      performanceMetrics.validationTimeMs = Date.now() - validationStartTime;
      
      // If validation fails with critical errors, show error display
      if (!validationResult.isValid) {
        if (shouldShowProgress) {
          uploadProgress.errorStage('validation', 'Validation failed');
          setTimeout(() => {
            setShowProgress(false);
            setValidationResult(validationResult);
            setShowValidationError(true);
          }, 1000);
        } else {
          setValidationResult(validationResult);
          setShowValidationError(true);
        }
        setIsLoading(false);
        return;
      }
      
      if (shouldShowProgress) {
        uploadProgress.completeStage('validation', 'Validation passed');
      }
      
      // If there are warnings, show them but continue
      if (validationResult.warnings.length > 0) {
        console.warn('CSV validation warnings:', validationResult.warnings);
      }
      
      // Step 2: Parse the CSV
      if (shouldShowProgress) {
        uploadProgress.startStage('parsing', 'Reading CSV data...');
      }
      
      const parsingStartTime = Date.now();
      const text = await file.text();
      const records = parseCSV(text, (progress, message) => {
        if (shouldShowProgress) {
          uploadProgress.updateProgress('parsing', progress, message);
        }
      });
      performanceMetrics.parsingTimeMs = Date.now() - parsingStartTime;
      
      if (shouldShowProgress) {
        uploadProgress.completeStage('parsing', `Parsed ${records.length} records`);
      }
      
      // Step 3: Upload to database
      if (isAuthenticated && user) {
        if (shouldShowProgress) {
          uploadProgress.startStage('upload', 'Saving to database...');
        }
        
        performanceMetrics.totalTimeMs = Date.now() - overallStartTime;
        
        // Save to database via tRPC with performance metrics
        await uploadMutation.mutateAsync({
          fileName: file.name,
          transactions: records,
          fileSize: performanceMetrics.fileSize,
          validationTimeMs: performanceMetrics.validationTimeMs,
          parsingTimeMs: performanceMetrics.parsingTimeMs,
          totalTimeMs: performanceMetrics.totalTimeMs,
        });
        
        if (shouldShowProgress) {
          uploadProgress.completeStage('upload', 'Upload complete');
        }
      } else if (shouldShowProgress) {
        // Skip upload stage for non-authenticated users
        uploadProgress.startStage('upload', 'Skipping database upload (not logged in)');
        uploadProgress.completeStage('upload', 'Processing complete');
      }
      
      // Process the records for immediate display
      setAllRecords(records);
      setFilteredRecords(records);
      setMetrics(calculateMetrics(records));
      setAgentMetrics(calculateAgentMetrics(records));
      setIsLoading(false);
      
      // Save to recent files (localStorage fallback for non-authenticated users)
      if (!isAuthenticated) {
        await handleSaveRecent(file.name, records);
      }
      
      // Hide progress dialog after a short delay
      if (shouldShowProgress) {
        setTimeout(() => {
          setShowProgress(false);
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error parsing CSV:', error);
      
      if (shouldShowProgress) {
        const activeStage = uploadProgress.stages.find(s => s.status === 'in-progress');
        if (activeStage) {
          uploadProgress.errorStage(
            activeStage.id,
            error instanceof Error ? error.message : 'Unknown error occurred'
          );
        }
      }
      
      setIsLoading(false);
      // Show error toast
    }
  };
  
  // Helper function to format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const processWithMapping = (data: any[], mapping: FieldMapping) => {
    const processed = data.map(row => {
      const newRow: any = { ...row };
      
      // Apply mapping
      Object.entries(mapping).forEach(([standardField, csvHeader]) => {
        if (csvHeader && row[csvHeader] !== undefined) {
          newRow[standardField] = row[csvHeader];
        }
      });

      return normalizeRecord(newRow);
    }).filter((record): record is DotloopRecord => record !== null);

    setAllRecords(processed);
    setFilteredRecords(processed);
    setMetrics(calculateMetrics(processed));
    setAgentMetrics(calculateAgentMetrics(processed));
    setIsLoading(false);
    setShowMapping(false);
    setShowFieldMapper(false);
  };

  if (!metrics) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/dotloop-logo.png" alt="Dotloop Logo" className="h-8 w-auto" />
              <h1 className="text-xl font-display font-bold text-foreground hidden sm:block">
                Reporting Tool
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <ConnectDotloop variant="button" />
              <ModeToggle />
              <Button variant="outline" onClick={handleDemoMode} disabled={isLoading} data-tour="demo-button">
                {isLoading ? 'Loading...' : 'Try Demo'}
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 container flex items-center justify-center py-12">
          <div className="w-full max-w-2xl space-y-8 text-center">
            <div className="space-y-4">
              <h2 className="text-4xl font-display font-bold tracking-tight text-foreground sm:text-5xl">
                Transform Your Data into <span className="text-primary">Actionable Insights</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Upload your Dotloop export to instantly generate professional commission reports, agent leaderboards, and financial analytics.
              </p>
            </div>

            <Card className="p-8 border-dashed border-2 border-border bg-card/50 hover:bg-card/80 transition-colors" data-tour="upload-zone">
              <UploadZone onFileUpload={handleFileUpload} isLoading={isLoading} />
            </Card>
            
            {/* Show Upload History for authenticated users, RecentUploads for guests */}
            {isAuthenticated && user ? (
              <div className="mt-12 text-left">
                <UploadHistory 
                  onSelectUpload={(uploadId) => {
                    setCurrentUploadId(uploadId);
                  }}
                  currentUploadId={currentUploadId}
                />
              </div>
            ) : recentFiles.length > 0 && (
              <div className="mt-12 text-left">
                <RecentUploads 
                  files={recentFiles} 
                  onSelect={handleRecentSelect} 
                  onDelete={handleRecentDelete} 
                />
              </div>
            )}
          </div>
        </main>

        {/* Upload Progress Dialog */}
        <Dialog open={showProgress} onOpenChange={setShowProgress}>
          <DialogContent className="max-w-2xl">
            <UploadProgress
              stages={uploadProgress.stages}
              fileName={uploadFileName}
              fileSize={uploadFileSize}
              onCancel={() => {
                setShowProgress(false);
                setIsLoading(false);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* CSV Validation Error Dialog */}
        <Dialog open={showValidationError} onOpenChange={setShowValidationError}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            {validationResult && (
              <ValidationErrorDisplay
                validationResult={validationResult}
                onRetry={() => {
                  setShowValidationError(false);
                  setValidationResult(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Mapping Dialogs */}
        <AlertDialog open={showMapping} onOpenChange={setShowMapping}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Map Your CSV Columns</AlertDialogTitle>
              <AlertDialogDescription>
                We noticed some standard fields are missing. Would you like to map your CSV columns to our standard fields?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowMapping(false);
                processWithMapping(pendingFile?.data || [], {});
              }}>
                Skip (Use Defaults)
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                setShowMapping(false);
                setShowFieldMapper(true);
              }}>
                Start Mapping
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Field Mapper Dialog - Wrapped in Dialog to match props */}
        <Dialog open={showFieldMapper} onOpenChange={setShowFieldMapper}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
            <FieldMapper
              headers={csvHeaders}
              onSave={(mapping) => {
                setCustomMapping(mapping);
                localStorage.setItem('dotloop_field_mapping', JSON.stringify(mapping));
                if (pendingFile) {
                  processWithMapping(pendingFile.data, mapping);
                }
              }}
              onCancel={() => setShowFieldMapper(false)}
              initialMapping={customMapping}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Dashboard Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <MobileNav 
              onReset={() => {
                setMetrics(null);
                setAllRecords([]);
                setFilteredRecords([]);
              }}
              onOpenSettings={() => {
                // Open settings logic
              }}
              onOpenMapping={() => setShowFieldMapper(true)}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            <div className="flex items-center gap-2">
              <img src="/dotloop-logo.png" alt="Dotloop Logo" className="h-8 w-auto" />
              <h1 className="text-xl font-display font-bold text-foreground hidden md:block">
                Reporting Tool
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
            <div className="flex items-center gap-2">
              <ModeToggle />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setMetrics(null);
                  setAllRecords([]);
                  setFilteredRecords([]);
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" data-tour="metrics">
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
          <div className="mb-8" data-tour="leaderboard">
            <AgentLeaderboardWithExport agents={agentMetrics} records={filteredRecords} />
          </div>
        )}

        {/* Charts Section */}
        <div className="mb-8" data-tour="charts">
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

            <TabsContent value="pipeline" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
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

            <TabsContent value="timeline" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
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
                  <BuySellTrendChart data={filteredRecords} />
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="leadsource" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <Card className="p-6 bg-card border border-border">
                <h2 className="text-xl font-display font-bold text-foreground mb-4">
                  Lead Source Performance
                </h2>
                <LeadSourceChart 
                  data={getLeadSourceData(filteredRecords)} 
                  onSliceClick={(label) => handleChartClick('leadSource', label)}
                />
              </Card>
            </TabsContent>

            <TabsContent value="property" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <Card className="p-6 bg-card border border-border">
                <h2 className="text-xl font-display font-bold text-foreground mb-4">
                  Property Type Distribution
                </h2>
                <PropertyTypeChart 
                  data={getPropertyTypeData(filteredRecords)} 
                  onBarClick={(label) => handleChartClick('propertyType', label)}
                />
              </Card>
            </TabsContent>

            <TabsContent value="geographic" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <Card className="p-6 bg-card border border-border">
                <h2 className="text-xl font-display font-bold text-foreground mb-4">
                  Geographic Distribution
                </h2>
                <GeographicChart 
                  data={getGeographicData(filteredRecords)} 
                  onBarClick={(label) => handleChartClick('geographic', label)}
                />
              </Card>
            </TabsContent>

            {metrics?.hasFinancialData && (
              <>
                <TabsContent value="financial" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6 bg-card border border-border">
                      <h2 className="text-xl font-display font-bold text-foreground mb-4">
                        Revenue Overview
                      </h2>
                      <FinancialChart metrics={metrics} />
                    </Card>
                    <Card className="p-6 bg-card border border-border">
                      <h2 className="text-xl font-display font-bold text-foreground mb-4">
                        Commission Breakdown
                      </h2>
                      <CommissionBreakdownChart 
                        buySide={filteredRecords.reduce((sum, r) => sum + (r.buySideCommission || 0), 0)}
                        sellSide={filteredRecords.reduce((sum, r) => sum + (r.sellSideCommission || 0), 0)}
                      />
                    </Card>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6 bg-card border border-border">
                      <h2 className="text-xl font-display font-bold text-foreground mb-4">
                        Revenue Distribution
                      </h2>
                      <RevenueDistributionChart 
                        totalCommission={metrics.totalCommission}
                        companyDollar={metrics.totalCompanyDollar}
                      />
                    </Card>
                    <Card className="p-6 bg-card border border-border">
                      <h2 className="text-xl font-display font-bold text-foreground mb-4">
                        Agent Mix
                      </h2>
                      <AgentMixChart agents={agentMetrics} />
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="audit" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                  <CommissionAuditReport records={filteredRecords} />
                </TabsContent>
              </>
            )}

            <TabsContent value="insights" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 bg-card border border-border">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Market Insights
                  </h2>
                  <PropertyInsightsChart data={filteredRecords} />
                </Card>
                <Card className="p-6 bg-card border border-border">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Price Reduction Analysis
                  </h2>
                  <PriceReductionChart data={filteredRecords} />
                </Card>
              </div>
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
            </TabsContent>

            <TabsContent value="health" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <DataHealthCheck records={allRecords} />
              <DataValidationReport 
                records={allRecords} 
                onConfirm={() => {
                  // Just switch to pipeline tab as "confirm" action
                  setActiveTab('pipeline');
                }}
                onCancel={() => {
                  setMetrics(null);
                  setAllRecords([]);
                  setFilteredRecords([]);
                }}
              />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <Tabs defaultValue="commission" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                  <TabsTrigger 
                    value="commission"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                  >
                    Commission Plans
                  </TabsTrigger>
                  <TabsTrigger 
                    value="teams"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                  >
                    Team Management
                  </TabsTrigger>
                  <TabsTrigger 
                    value="assignments"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                  >
                    Agent Assignments
                  </TabsTrigger>
                </TabsList>
                
                <div className="mt-6">
                  <TabsContent value="commission">
                    <CommissionPlansManager />
                  </TabsContent>
                  <TabsContent value="teams">
                    <TeamManager />
                  </TabsContent>
                  <TabsContent value="assignments">
                    <AgentAssignment 
                      records={allRecords}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Drill Down Modal */}
      <DrillDownModal
        isOpen={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        title={drillDownTitle}
        transactions={drillDownTransactions}
      />

      {/* Field Mapper Dialog - Wrapped in Dialog to match props */}
      <Dialog open={showFieldMapper} onOpenChange={setShowFieldMapper}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
          <FieldMapper
            headers={csvHeaders}
            onSave={(mapping) => {
              setCustomMapping(mapping);
              localStorage.setItem('dotloop_field_mapping', JSON.stringify(mapping));
              if (pendingFile) {
                processWithMapping(pendingFile.data, mapping);
              }
            }}
            onCancel={() => setShowFieldMapper(false)}
            initialMapping={customMapping}
          />
        </DialogContent>
      </Dialog>

      {/* Onboarding Tour */}
      {showTour && (
        <OnboardingTour
          steps={uploadTourSteps}
          onComplete={completeTour}
          onSkip={skipTour}
        />
      )}
    </div>
  );
}
