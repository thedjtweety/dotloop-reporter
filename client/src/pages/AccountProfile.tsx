/**
 * Account Profile Settings Page
 * 
 * Displays connected Dotloop account details and management options
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, UserCircle, Mail, Calendar, RefreshCw, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import {
  getAllAccounts,
  getActiveAccount,
  removeAccount,
  setActiveAccount,
  revokeToken,
  type DotloopAccount,
} from '@/lib/dotloopAuth';

export default function AccountProfile() {
  const [, setLocation] = useLocation();
  const [accounts, setAccounts] = useState<DotloopAccount[]>(getAllAccounts());
  const [activeAccount, setActiveAccountState] = useState<DotloopAccount | null>(getActiveAccount());
  const [accountToRemove, setAccountToRemove] = useState<DotloopAccount | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleBack = () => {
    setLocation('/');
  };

  const handleSwitchAccount = (accountId: string) => {
    setActiveAccount(accountId);
    const newActive = accounts.find(acc => acc.id === accountId) || null;
    setActiveAccountState(newActive);
    setLocation('/');
  };

  const handleRemoveAccount = async (account: DotloopAccount) => {
    // Revoke token on backend
    await revokeToken(account.accessToken);
    
    // Remove from localStorage
    removeAccount(account.id);
    
    // Update state
    const remainingAccounts = getAllAccounts();
    setAccounts(remainingAccounts);
    
    const newActive = getActiveAccount();
    setActiveAccountState(newActive);
    
    // Close dialog
    setAccountToRemove(null);
    
    // If no accounts left, go to connection screen
    if (remainingAccounts.length === 0) {
      setLocation('/');
    }
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    setRefreshStatus('idle');
    
    try {
      // Trigger a page reload to refresh data
      window.location.href = '/';
    } catch (error) {
      setRefreshStatus('error');
      setTimeout(() => setRefreshStatus('idle'), 5000);
      setIsRefreshing(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-display font-bold text-foreground">
              Account Settings
            </h1>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Active Account Card */}
          {activeAccount && (
            <Card>
              <CardHeader>
                <CardTitle>Active Account</CardTitle>
                <CardDescription>
                  Currently viewing data from this Dotloop account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCircle className="h-10 w-10 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {activeAccount.firstName} {activeAccount.lastName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                      <Mail className="h-4 w-4" />
                      {activeAccount.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                      <Calendar className="h-4 w-4" />
                      Connected on {formatDate(activeAccount.connectedAt)}
                    </div>
                    <div className="text-xs text-foreground/60">
                      Profile ID: {activeAccount.profileId}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleRefreshData}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Syncing...' : 'Refresh Data'}
                  </Button>
                </div>

                {refreshStatus === 'success' && (
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-500">
                      Data synced successfully!
                    </AlertDescription>
                  </Alert>
                )}

                {refreshStatus === 'error' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Failed to sync data. Please try again.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* All Connected Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Manage all your connected Dotloop accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      activeAccount?.id === account.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCircle className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {account.firstName} {account.lastName}
                          {activeAccount?.id === account.id && (
                            <span className="ml-2 text-xs text-primary">(Active)</span>
                          )}
                        </div>
                        <div className="text-sm text-foreground/70">{account.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeAccount?.id !== account.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSwitchAccount(account.id)}
                        >
                          Switch
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAccountToRemove(account)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>About OAuth Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-foreground/70">
              <p>
                🔒 Your Dotloop credentials are never stored on our servers. We use OAuth 2.0 
                for secure authentication.
              </p>
              <p>
                🔄 Access tokens are stored locally in your browser and can be revoked at any time 
                by removing your account.
              </p>
              <p>
                📊 Data is synced directly from Dotloop's API and processed in your browser for 
                maximum privacy.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Remove Account Confirmation Dialog */}
      <AlertDialog open={!!accountToRemove} onOpenChange={() => setAccountToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <strong>
                {accountToRemove?.firstName} {accountToRemove?.lastName}
              </strong>{' '}
              ({accountToRemove?.email})? This will revoke the access token and clear all local data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => accountToRemove && handleRemoveAccount(accountToRemove)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
