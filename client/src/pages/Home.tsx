/**
 * Dotloop Reporting Tool - Home Page
 * 
 * Two-column layout:
 * - Left: CSV Upload (primary method)
 * - Right: Dotloop Connection (secondary method)
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, FileSpreadsheet, Link2 } from 'lucide-react';
import DotloopDashboard from './DotloopDashboard';
import AccountSwitcher from '@/components/AccountSwitcher';
import UploadZone from '@/components/UploadZone';
import RecentUploads from '@/components/RecentUploads';
import {
  hasAccounts,
  getActiveAccount,
  handleOAuthCallback,
  getAuthorizationUrl,
  type DotloopAccount,
} from '@/lib/dotloopAuth';
import { fetchAndTransformLoops } from '@/lib/dotloopApi';
import { DotloopRecord, parseCSV, normalizeRecord } from '@/lib/csvParser';
import { getRecentFiles, saveRecentFile, type RecentFile } from '@/lib/storage';

export default function Home() {
  const [dataSource, setDataSource] = useState<'none' | 'csv' | 'dotloop'>('none');
  const [activeAccount, setActiveAccount] = useState<DotloopAccount | null>(null);
  const [transactions, setTransactions] = useState<DotloopRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  // Load data on mount
  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async () => {
    console.log('[Home] loadInitialData called');
    
    // Load recent CSV files
    setRecentFiles(getRecentFiles());
    
    // Check for OAuth callback
    const account = handleOAuthCallback();
    if (account) {
      console.log('[Home] OAuth callback processed, account:', account.email);
      setActiveAccount(account);
      setDataSource('dotloop');
      await syncTransactions(account);
      return;
    }

    // Check if user has any connected Dotloop accounts
    const hasAnyAccounts = hasAccounts();
    console.log('[Home] Has Dotloop accounts:', hasAnyAccounts);
    
    if (hasAnyAccounts) {
      const active = getActiveAccount();
      console.log('[Home] Active Dotloop account:', active?.email);
      setActiveAccount(active);
      if (active) {
        setDataSource('dotloop');
        await syncTransactions(active);
      }
    }
  };

  const syncTransactions = async (account: DotloopAccount) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[Home] Syncing transactions for account:', account.email);
      const data = await fetchAndTransformLoops(account);
      console.log('[Home] Fetched', data.length, 'transactions');
      setTransactions(data);
      setLastSyncTime(new Date());
      setDataSource('dotloop');
    } catch (err) {
      console.error('[Home] Error syncing transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const text = await file.text();
      const result = parseCSV(text);
      
      const processed = result.data
        .map(row => normalizeRecord(row))
        .filter((record): record is DotloopRecord => record !== null);
      
      console.log('[Home] Processed', processed.length, 'records from CSV');
      
      setTransactions(processed);
      setDataSource('csv');
      setLastSyncTime(new Date());
      
      // Save to recent files
      await saveRecentFile(file.name, processed);
      setRecentFiles(getRecentFiles());
      
    } catch (err) {
      console.error('[Home] Error processing CSV:', err);
      setError(err instanceof Error ? err.message : 'Failed to process CSV file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecentFileSelect = (file: RecentFile) => {
    setTransactions(file.data);
    setDataSource('csv');
    setLastSyncTime(new Date(file.uploadedAt));
  };

  const handleAccountChange = async (account: DotloopAccount | null) => {
    setActiveAccount(account);
    if (account) {
      await syncTransactions(account);
    }
  };

  const handleLogout = () => {
    setActiveAccount(null);
    setTransactions([]);
    setDataSource('none');
    setLastSyncTime(null);
  };

  // Show dashboard if we have data
  if (dataSource !== 'none' && transactions.length >= 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-display font-bold text-foreground">
                Dotloop Reporting Tool
              </h1>
              {dataSource === 'csv' && (
                <span className="text-sm text-muted-foreground">CSV Data</span>
              )}
              {dataSource === 'dotloop' && activeAccount && (
                <AccountSwitcher 
                  onAccountChange={handleAccountChange}
                  onLogout={handleLogout}
                />
              )}
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDataSource('none');
                  setTransactions([]);
                }}
              >
                Back to Home
              </Button>
            </div>
          </div>
        </header>

        <main className="container py-8">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-lg">Loading data...</span>
            </div>
          )}
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!isLoading && (
            <DotloopDashboard 
              transactions={transactions}
              lastSyncTime={lastSyncTime}
            />
          )}
        </main>
      </div>
    );
  }

  // Show two-column landing page
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-xl font-display font-bold text-foreground">
            Dotloop Reporting Tool
          </h1>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-display font-bold tracking-tight text-foreground sm:text-5xl">
              Transform Your Data into <span className="text-primary">Actionable Insights</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload your Dotloop CSV export or connect your account directly to generate professional commission reports, agent leaderboards, and financial analytics.
            </p>
          </div>

          {/* Two-Column Layout */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column: CSV Upload */}
            <Card className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Upload CSV File</h3>
                  <p className="text-sm text-muted-foreground">Quick and easy data import</p>
                </div>
              </div>

              <UploadZone 
                onFileUpload={handleFileUpload}
                isLoading={isLoading}
              />

              {recentFiles.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <RecentUploads 
                    files={recentFiles}
                    onSelect={handleRecentFileSelect}
                    onDelete={(id) => {
                      // Handle delete
                      setRecentFiles(getRecentFiles());
                    }}
                  />
                </div>
              )}
            </Card>

            {/* Right Column: Dotloop Connection */}
            <Card className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Link2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Connect to Dotloop</h3>
                  <p className="text-sm text-muted-foreground">Live data sync with OAuth 2.0</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Benefits of Connecting:</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Automatic data synchronization</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Real-time transaction updates</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Multi-account support</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Secure OAuth authentication</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => window.location.href = getAuthorizationUrl()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect to Dotloop
                    </>
                  )}
                </Button>

                {hasAccounts() && (
                  <div className="text-center text-sm text-muted-foreground">
                    Already connected? <button 
                      onClick={() => {
                        const account = getActiveAccount();
                        if (account) {
                          setActiveAccount(account);
                          syncTransactions(account);
                        }
                      }}
                      className="text-primary hover:underline"
                    >
                      View your data
                    </button>
                  </div>
                )}

                <p className="text-xs text-center text-muted-foreground">
                  🔒 Your credentials are never stored. We use secure OAuth authentication.
                </p>
              </div>
            </Card>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </main>
    </div>
  );
}
