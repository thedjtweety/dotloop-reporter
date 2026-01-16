/**
 * Dotloop Reporting Tool - Home Page
 * 
 * Handles OAuth authentication flow and displays dashboard with real Dotloop data
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import DotloopDashboard from './DotloopDashboard';
import AccountSwitcher from '@/components/AccountSwitcher';
import {
  hasAccounts,
  getActiveAccount,
  handleOAuthCallback,
  getAuthorizationUrl,
  type DotloopAccount,
} from '@/lib/dotloopAuth';
import { fetchAndTransformLoops } from '@/lib/dotloopApi';
import { DotloopRecord } from '@/lib/csvParser';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [activeAccount, setActiveAccount] = useState<DotloopAccount | null>(null);
  const [transactions, setTransactions] = useState<DotloopRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Load data on mount
  useEffect(() => {
    loadAccountData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAccountData = async () => {
    console.log('[Home] loadAccountData called');
    
    // Check for OAuth callback
    const account = handleOAuthCallback();
    if (account) {
      console.log('[Home] OAuth callback processed, account:', account.email);
      setActiveAccount(account);
      setIsConnected(true);
      await syncTransactions(account);
      return;
    }

    // Check if user has any connected accounts
    const hasAnyAccounts = hasAccounts();
    console.log('[Home] Has accounts in localStorage:', hasAnyAccounts);
    
    if (hasAnyAccounts) {
      const active = getActiveAccount();
      console.log('[Home] Active account:', active?.email);
      setActiveAccount(active);
      setIsConnected(true);
      if (active) {
        await syncTransactions(active);
      }
    } else {
      console.log('[Home] No accounts found, showing connection screen');
      setActiveAccount(null);
      setIsConnected(false);
      setTransactions([]);
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
    } catch (err) {
      console.error('[Home] Error syncing transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountChange = async (account: DotloopAccount | null) => {
    setActiveAccount(account);
    setIsConnected(account !== null);
    
    if (account) {
      await syncTransactions(account);
    } else {
      setTransactions([]);
    }
  };

  const handleLogout = () => {
    console.log('[Home] handleLogout called');
    setActiveAccount(null);
    setIsConnected(false);
    setTransactions([]);
    setLastSyncTime(null);
    setError(null);
  };

  const handleConnect = () => {
    window.location.href = getAuthorizationUrl();
  };

  const handleRefresh = async () => {
    if (activeAccount) {
      await syncTransactions(activeAccount);
    }
  };

  // Show dashboard if connected
  if (isConnected && activeAccount) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display font-bold text-foreground">
                Dotloop Dashboard
              </h1>
              {lastSyncTime && (
                <span className="text-xs text-foreground/60">
                  Last synced: {lastSyncTime.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  'Refresh Data'
                )}
              </Button>
              <AccountSwitcher 
                onAccountChange={handleAccountChange}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </header>
        
        <main className="container py-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isLoading && transactions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-foreground/70">Loading your Dotloop transactions...</p>
              </div>
            </div>
          ) : transactions.length > 0 ? (
            <DotloopDashboard records={transactions} />
          ) : (
            <Card className="p-8 text-center">
              <p className="text-foreground/70 mb-4">
                No transactions found in your Dotloop account.
              </p>
              <Button onClick={handleRefresh} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Refresh'
                )}
              </Button>
            </Card>
          )}
        </main>
      </div>
    );
  }

  // Show connection screen if not connected
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-display font-bold text-foreground">
              Dotloop Reporting Tool
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 container flex items-center justify-center py-12">
        <div className="w-full max-w-2xl space-y-8 text-center">
          <div className="space-y-4">
            <h2 className="text-4xl font-display font-bold tracking-tight text-foreground sm:text-5xl">
              Connect Your <span className="text-primary">Dotloop Account</span>
            </h2>
            <p className="text-lg text-foreground/70 max-w-xl mx-auto">
              Sync your Dotloop transactions and generate professional commission reports, 
              agent leaderboards, and financial analytics automatically.
            </p>
          </div>

          <Card className="p-8 bg-card/50">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  Get Started
                </h3>
                <p className="text-foreground/70">
                  Click the button below to connect your Dotloop account securely using OAuth 2.0
                </p>
              </div>
              
              <Button 
                size="lg" 
                onClick={handleConnect}
                className="w-full sm:w-auto"
              >
                Connect to Dotloop
              </Button>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-foreground/60">
                  🔒 Your credentials are never stored. We use secure OAuth authentication.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
            <div className="space-y-2">
              <div className="text-3xl">📊</div>
              <h4 className="font-semibold text-foreground">Real-Time Sync</h4>
              <p className="text-sm text-foreground/70">
                Automatically sync your Dotloop transactions
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">📈</div>
              <h4 className="font-semibold text-foreground">Analytics</h4>
              <p className="text-sm text-foreground/70">
                Visualize your pipeline and performance metrics
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">👥</div>
              <h4 className="font-semibold text-foreground">Multi-Account</h4>
              <p className="text-sm text-foreground/70">
                Manage multiple Dotloop accounts easily
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
