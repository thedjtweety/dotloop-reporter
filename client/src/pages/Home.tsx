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
import { Upload, TrendingUp, Home as HomeIcon, DollarSign, Calendar, Percent, Settings, ArrowLeft, AlertCircle, Trophy } from 'lucide-react';
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
import { applyPlansToAllAgents } from '@/lib/commissionCalculator';
import { ValidationErrorDisplay } from '@/components/ValidationErrorDisplay';
import { UploadProgress, useUploadProgress } from '@/components/UploadProgress';
import { filterRecordsByDate, getPreviousPeriod } from '@/lib/dateUtils';
import { generateDashboardSparklineTrends } from '@/lib/sparklineTrendGenerator';
import { cleanDate, cleanNumber, cleanPercentage, cleanText } from '@/lib/dataCleaning';
import { findMatchingTemplate, saveTemplate } from '@/lib/importTemplates';
import { generateDemoData } from '@/lib/demoGenerator';
import { setupDemoPlanData } from '@/lib/demoPlanSetup';
import { getRecentFiles, saveRecentFile, deleteRecentFile } from '@/lib/storage';
import UploadZone from '@/components/UploadZone';
import CommissionProjector from '@/components/CommissionProjector';
import RecentUploads, { RecentFile } from '@/components/RecentUploads';
import UploadHistory from '@/components/UploadHistory';
import ConnectDotloop from '@/components/ConnectDotloop';
import MetricCard from '@/components/MetricCard';
import ProjectedToCloseCard from '@/components/ProjectedToCloseCard';
import ColumnMapping from '@/components/ColumnMapping';
import FieldMapper, { ColumnMapping as FieldMapping } from '@/components/FieldMapper';
import { DatePickerWithRange } from '@/components/DateRangePicker';
import { normalizeRecord } from '@/lib/csvParser';
import InteractivePipelineChart from '@/components/charts/InteractivePipelineChart';
import ConversionTrendsChart from '@/components/charts/ConversionTrendsChart';
import PipelineChartDrillDown from '@/components/PipelineChartDrillDown';
import ChartDrillDown from '@/components/ChartDrillDown';
import FinancialChart from '@/components/charts/FinancialChart';
import CommissionBreakdownChart from '@/components/CommissionBreakdownChart';
import RevenueDistributionChart from '@/components/charts/RevenueDistributionChart';
import BuySellTrendChart from '@/components/charts/BuySellTrendChart';
import AgentMixChart from '@/components/charts/AgentMixChart';
import ComplianceChart from '@/components/charts/ComplianceChart';
import TagsChart from '@/components/charts/TagsChart';
import EnhancedPriceVsYearBuiltChart from '@/components/charts/EnhancedPriceVsYearBuiltChart';
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
import CommissionManagementPanel from '@/components/CommissionManagementPanel';
import DataValidationReport from '@/components/DataValidationReport';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ModeToggle } from '@/components/ModeToggle';
import MobileNav from '@/components/MobileNav';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import OnboardingTour from '@/components/OnboardingTour';
import { useOnboardingTour, uploadTourSteps, dashboardTourSteps } from '@/hooks/useOnboardingTour';
import { FilterProvider, useFilters } from '@/contexts/FilterContext';
import FilterBadge from '@/components/FilterBadge';
import toast, { Toaster } from 'react-hot-toast';
// import SectionNav from '@/components/SectionNav'; // Removed floating navigation
import BackToTop from '@/components/BackToTop';
import CollapsibleSection from '@/components/CollapsibleSection';

function HomeContent() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();
  const { filters, addFilter } = useFilters();

  const [location, setLocation] = useLocation();
  const { showTour, completeTour, skipTour } = useOnboardingTour();
  const [allRecords, setAllRecords] = useState<DotloopRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<DotloopRecord[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sparklineTrends, setSparklineTrends] = useState<any>(null);
  
  // Drill-down state
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownTitle, setDrillDownTitle] = useState('');
  const [drillDownTransactions, setDrillDownTransactions] = useState<DotloopRecord[]>([]);
  
  // Pipeline chart drill-down state
  const [pipelineDrillDownOpen, setPipelineDrillDownOpen] = useState(false);
  const [pipelineDrillDownStatus, setPipelineDrillDownStatus] = useState('');
  const [pipelineFullDetailsOpen, setPipelineFullDetailsOpen] = useState(false);
  
  // Helper function to open full details view from pipeline drill-down
  const openPipelineFullDetails = () => {
    setPipelineDrillDownOpen(false);
    setPipelineFullDetailsOpen(true);
  };
  
  // Generic chart drill-down state
  const [chartDrillDownOpen, setChartDrillDownOpen] = useState(false);
  const [chartDrillDownType, setChartDrillDownType] = useState<'leadSource' | 'propertyType' | 'geographic' | 'commission'>('leadSource');
  const [chartDrillDownValue, setChartDrillDownValue] = useState('');
  const [chartDrillDownTitle, setChartDrillDownTitle] = useState('');
  const [chartFullDetailsOpen, setChartFullDetailsOpen] = useState(false);
  
  // Helper function to open chart drill-down
  const openChartDrillDown = (type: 'leadSource' | 'propertyType' | 'geographic' | 'commission', value: string, title: string) => {
    setChartDrillDownType(type);
    setChartDrillDownValue(value);
    setChartDrillDownTitle(title);
    setChartDrillDownOpen(true);
  };
  
  // Helper function to open full details view from chart drill-down
  const openChartFullDetails = () => {
    setChartDrillDownOpen(false);
    setChartFullDetailsOpen(true);
  };

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

  // Commission Management Panel State
  const [commissionManagementTab, setCommissionManagementTab] = useState('plans');
  const [commissionManagementHighlightAgent, setCommissionManagementHighlightAgent] = useState<string | undefined>();

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
    const metrics1 = calculateAgentMetrics(file.data);
    setAgentMetrics(applyPlansToAllAgents(metrics1, file.data));
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
      const { data: sampleData, stats } = generateDemoData({ complexity: 'random' });
      
      // Store demo data in localStorage so CommissionCalculator can access it
      localStorage.setItem('dotloop_demo_data', JSON.stringify(sampleData));
      
      // Setup demo commission plans and agent assignments
      const { plans, assignments } = setupDemoPlanData(sampleData);
      console.log(`✅ Demo setup: ${plans.length} plans, ${assignments.length} agents assigned`);
      console.log(`🎯 Demo Generated [${stats.complexity}]:\n  📊 ${stats.agentCount} agents | ${stats.transactionCount} transactions\n  💰 $${stats.totalGCI.toLocaleString()} GCI | $${stats.totalVolume.toLocaleString()} volume\n  🌎 ${stats.stateCount} states | ${stats.propertyTypeCount} property types\n  📅 ${stats.dateRange.earliest} to ${stats.dateRange.latest}`);
      setAllRecords(sampleData);
      setFilteredRecords(sampleData);
      setMetrics(calculateMetrics(sampleData));
      const metrics2 = calculateAgentMetrics(sampleData);
      setAgentMetrics(applyPlansToAllAgents(metrics2, sampleData));
      setIsLoading(false);
    }, 1500);
  };

  // Update metrics when date range, records, or filters change
  useEffect(() => {
    if (allRecords.length === 0) return;

    let currentRecords = allRecords;
    let previousRecords: DotloopRecord[] | undefined;

    // Apply date range filter
    if (dateRange?.from && dateRange?.to) {
      currentRecords = filterRecordsByDate(allRecords, { from: dateRange.from, to: dateRange.to });
      
      const prevRange = getPreviousPeriod({ from: dateRange.from, to: dateRange.to });
      previousRecords = filterRecordsByDate(allRecords, prevRange);
    }

    // Apply chart drill-down filters
    filters.forEach(filter => {
      switch (filter.type) {
        case 'pipeline':
          currentRecords = currentRecords.filter(r => r.loopStatus === filter.value);
          break;
        case 'leadSource':
          currentRecords = currentRecords.filter(r => (r.leadSource || 'Unknown') === filter.value);
          break;
        case 'propertyType':
          currentRecords = currentRecords.filter(r => (r.transactionType || 'Unknown') === filter.value);
          break;
        case 'geographic':
          currentRecords = currentRecords.filter(r => (r.state || 'Unknown') === filter.value);
          break;
      }
    });

    setFilteredRecords(currentRecords);
    setMetrics(calculateMetrics(currentRecords, previousRecords));
    // Calculate agent metrics and apply commission plans for recalculation
    const baseMetrics = calculateAgentMetrics(currentRecords);
    const metricsWithPlans = applyPlansToAllAgents(baseMetrics, currentRecords);
    setAgentMetrics(metricsWithPlans);
    setSparklineTrends(generateDashboardSparklineTrends(currentRecords, dateRange));
  }, [allRecords, dateRange, filters]);

  // Handle metric card clicks - opens modal with deal details
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

  // Handle chart segment clicks - applies drill-down filters
  const handleChartClick = (type: 'pipeline' | 'leadSource' | 'propertyType' | 'geographic' | 'commission', label: string) => {
    let title = '';

    switch (type) {
      case 'pipeline':
        title = `Pipeline: ${label}`;
        addFilter({ type: 'pipeline', label: title, value: label });
        toast.success(`🔍 Now filtering by: ${label}`, {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#3b82f6',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '16px',
          },
        });
        break;
      case 'leadSource':
        title = `Lead Source: ${label}`;
        addFilter({ type: 'leadSource', label: title, value: label });
        toast.success(`🔍 Now filtering by lead source: ${label}`, {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#3b82f6',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '16px',
          },
        });
        break;
      case 'propertyType':
        title = `Property Type: ${label}`;
        addFilter({ type: 'propertyType', label: title, value: label });
        toast.success(`🔍 Now filtering by property type: ${label}`, {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#3b82f6',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '16px',
          },
        });
        break;
      case 'geographic':
        title = `State: ${label}`;
        addFilter({ type: 'geographic', label: title, value: label });
        toast.success(`🔍 Now filtering by state: ${label}`, {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#3b82f6',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '16px',
          },
        });
        break;
      case 'commission':
        title = `Commission Range: ${label}`;
        // Logic for commission range filtering would go here
        break;
    }
  };

  // Client-side only - no database persistence needed

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
      
      // Step 3: Complete - no database upload needed for MVP
      if (shouldShowProgress) {
        uploadProgress.startStage('upload', 'Processing complete');
        uploadProgress.completeStage('upload', 'Ready to analyze');
      }
      
      performanceMetrics.totalTimeMs = Date.now() - overallStartTime;
      
      // Process the records for immediate display
      setAllRecords(records);
      setFilteredRecords(records);
      setMetrics(calculateMetrics(records));
      const metrics3 = calculateAgentMetrics(records);
      setAgentMetrics(applyPlansToAllAgents(metrics3, records));
      setIsLoading(false);
      
      // Save to recent files (localStorage)
      await handleSaveRecent(file.name, records);
      
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
    const metrics4 = calculateAgentMetrics(processed);
    setAgentMetrics(applyPlansToAllAgents(metrics4, processed));
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

              {isAuthenticated && user?.role === 'admin' && (
                <Button variant="ghost" onClick={() => setLocation('/admin')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              {isAuthenticated && (
                <Button variant="ghost" onClick={() => setLocation('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              )}
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
              <p className="text-lg text-foreground max-w-xl mx-auto">
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
                  onSelectUpload={(file) => {
                    handleRecentSelect(file);
                  }}
                  currentUploadId={recentFiles.find(f => f.data === allRecords)?.id}
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
      <Toaster />
      {/* <SectionNav /> - Removed floating navigation */}
      <BackToTop />
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
              {isAuthenticated && user?.role === 'admin' && (
                <Button variant="ghost" size="sm" onClick={() => setLocation('/admin')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              {isAuthenticated && (
                <Button variant="ghost" size="sm" onClick={() => setLocation('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              )}
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
        {/* Filter Badge */}
        <FilterBadge />
        
        {/* Top Metrics Row */}
        <div data-section="metrics" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-tour="metrics">
            <MetricCard
              title="Total Transactions"
              value={metrics.totalTransactions}
              icon={<HomeIcon className="w-5 h-5" />}
              color="primary"
              trend={metrics.trends?.totalTransactions}
              sparklineTrend={sparklineTrends?.totalTransactions}
              onClick={() => handleMetricClick('total')}
            />
            <MetricCard
              title="Total Sales Volume"
              value={formatCurrency(metrics.totalSalesVolume)}
              subtitle={`Avg: ${formatCurrency(metrics.averagePrice)}`}
              icon={<DollarSign className="w-5 h-5" />}
              color="accent"
              trend={metrics.trends?.totalVolume}
              sparklineTrend={sparklineTrends?.totalVolume}
              onClick={() => handleMetricClick('volume')}
            />
            <MetricCard
              title="Closing Rate"
              value={formatPercentage(metrics.closingRate)}
              subtitle={`${metrics.closed} closed deals`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="accent"
              trend={metrics.trends?.closingRate}
              sparklineTrend={sparklineTrends?.closingRate}
              onClick={() => handleMetricClick('closing')}
            />
            <MetricCard
              title="Avg Days to Close"
              value={metrics.averageDaysToClose}
              icon={<Calendar className="w-5 h-5" />}
              color="primary"
              trend={metrics.trends?.avgDaysToClose}
              sparklineTrend={sparklineTrends?.avgDaysToClose}
              onClick={() => handleMetricClick('days')}
            />
        </div>

        {/* Projected to Close Card */}
        {filteredRecords.length > 0 && (
          <div className="mb-8">
            <ProjectedToCloseCard records={filteredRecords} />
          </div>
        )}

        {/* Status Overview Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card 
            className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50 active:scale-[0.99]"
            onClick={() => handleMetricClick('active')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground font-medium">Active Listings</p>
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
                <p className="text-sm text-foreground font-medium">Under Contract</p>
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
                <p className="text-sm text-foreground dark:text-white font-medium">Closed</p>
                <p className="text-2xl font-display font-bold text-foreground dark:text-white">
                  {metrics.closed}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500/20 dark:bg-green-500/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card 
            className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-gray-400/50 active:scale-[0.99]"
            onClick={() => handleMetricClick('archived')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground dark:text-white font-medium">Archived</p>
                <p className="text-2xl font-display font-bold text-foreground dark:text-white">
                  {metrics.archived}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <HomeIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div data-section="charts" data-tour="charts">
          <CollapsibleSection title="Analytics Charts" icon={<TrendingUp className="w-6 h-6" />}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-10 mb-6 h-auto">
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="leadsource">Lead Source</TabsTrigger>
              <TabsTrigger value="property">Property Type</TabsTrigger>
              <TabsTrigger value="geographic">Geographic</TabsTrigger>
              {metrics?.hasFinancialData && (
                <TabsTrigger value="financial">Financial</TabsTrigger>
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
                <InteractivePipelineChart 
                  data={allRecords}
                />
              </Card>
              
              <Card className="p-6 bg-card border border-border">
                <ConversionTrendsChart data={allRecords} />
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
                  data={getLeadSourceData(allRecords)} 
                  onSliceClick={(label) => openChartDrillDown('leadSource', label, `Lead Source: ${label}`)}
                />
              </Card>
            </TabsContent>

            <TabsContent value="property" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <Card className="p-6 bg-card border border-border">
                <h2 className="text-xl font-display font-bold text-foreground mb-4">
                  Property Type Distribution
                </h2>
                <PropertyTypeChart 
                  data={getPropertyTypeData(allRecords)} 
                  onBarClick={(label) => openChartDrillDown('propertyType', label, `Property Type: ${label}`)}
                />
              </Card>
            </TabsContent>

            <TabsContent value="geographic" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <Card className="p-6 bg-card border border-border">
                <h2 className="text-xl font-display font-bold text-foreground mb-4">
                  Geographic Distribution
                </h2>
                <GeographicChart 
                  data={getGeographicData(allRecords)}
                  transactions={filteredRecords}
                  onBarClick={(label) => openChartDrillDown('geographic', label, `Location: ${label}`)}
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
                        onSliceClick={(type: string) => openChartDrillDown('commission', type, `Commission: ${type}`)}
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

              </>
            )}

            <TabsContent value="insights" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 bg-card border border-border">
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">
                    Market Insights
                  </h2>
                  <EnhancedPriceVsYearBuiltChart data={filteredRecords} />
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
              <Card className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Settings</h3>
                  <p className="text-sm text-muted-foreground">Manage your account and application settings.</p>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Settings functionality coming soon</p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
          </CollapsibleSection>
        </div>

        {/* Agent Leaderboard Section */}
        {agentMetrics.length > 0 && (
          <div data-section="leaderboard" data-tour="leaderboard">
            <CollapsibleSection title="Agent Performance Leaderboard" icon={<Trophy className="w-6 h-6" />}>
              <AgentLeaderboardWithExport 
                agents={agentMetrics} 
                records={filteredRecords}
                onNavigateToAssignAgent={(agentName) => {
                  setCommissionManagementTab('assignments');
                  setCommissionManagementHighlightAgent(agentName);
                  const element = document.querySelector('[data-section="commission-management"]');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              />
            </CollapsibleSection>
          </div>
        )}

        {/* Commission Management Panel */}
        <div data-section="commission-management">
          <CommissionManagementPanel 
            records={filteredRecords} 
            hasData={filteredRecords.length > 0}
            initialTab={commissionManagementTab}
            highlightAgent={commissionManagementHighlightAgent}
            onTabChange={setCommissionManagementTab}
            onAssignmentChange={() => {
              setMetrics(calculateMetrics(filteredRecords));
              const metrics5 = calculateAgentMetrics(filteredRecords);
              setAgentMetrics(applyPlansToAllAgents(metrics5, filteredRecords));
            }}
          />
        </div>

        {/* Commission Projector Section */}
        {metrics?.hasFinancialData && (
          <div data-section="projector">
            <CollapsibleSection title="Commission Projector" icon={<DollarSign className="w-6 h-6" />}>
              <CommissionProjector records={filteredRecords} />
            </CollapsibleSection>
          </div>
        )}
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
      
      {/* Pipeline Chart Drill-Down Modal */}
      <PipelineChartDrillDown
        isOpen={pipelineDrillDownOpen}
        onClose={() => setPipelineDrillDownOpen(false)}
        status={pipelineDrillDownStatus}
        records={allRecords}
        onViewFullDetails={openPipelineFullDetails}
      />
      
      {/* Pipeline Full Details Modal */}
      {pipelineFullDetailsOpen && (
        <DrillDownModal
          isOpen={pipelineFullDetailsOpen}
          onClose={() => setPipelineFullDetailsOpen(false)}
          title={`Pipeline: ${pipelineDrillDownStatus}`}
          transactions={filteredRecords}
        />
      )}
      
      {/* Generic Chart Drill-Down Modal */}
      <ChartDrillDown
        isOpen={chartDrillDownOpen}
        onClose={() => setChartDrillDownOpen(false)}
        title={chartDrillDownTitle}
        filterType={chartDrillDownType}
        filterValue={chartDrillDownValue}
        records={allRecords}
        onViewFullDetails={openChartFullDetails}
      />
      
      {/* Chart Full Details Modal */}
      {chartFullDetailsOpen && (
        <DrillDownModal
          isOpen={chartFullDetailsOpen}
          onClose={() => setChartFullDetailsOpen(false)}
          title={chartDrillDownTitle}
          transactions={filteredRecords}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <FilterProvider>
      <HomeContent />
    </FilterProvider>
  );
}
