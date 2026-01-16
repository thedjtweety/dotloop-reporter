/**
 * Simplified Dotloop Reporting Tool Homepage
 * 
 * Uses localStorage for OAuth token management with multi-account support
 * No Manus authentication required
 * Updated with correct Dotloop OAuth client ID
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import {
  handleOAuthCallback,
  getAllAccounts,
  getActiveAccount,
  removeAccount,
  clearAllAccounts,
  type DotloopAccount,
} from '@/lib/dotloopMultiAuth';

export default function HomeSimple() {
  const [account, setAccount] = useState<DotloopAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loops, setLoops] = useState<any[]>([]);
  const [isLoadingLoops, setIsLoadingLoops] = useState(false);

  // Handle OAuth callback and check for existing tokens
  useEffect(() => {
    const initAuth = async () => {
      console.log('[HomeSimple] Initializing auth...');
      
      // Check if this is an OAuth callback
      const hasNewTokens = handleOAuthCallback();
      console.log('[HomeSimple] handleOAuthCallback result:', hasNewTokens);
      
      // Get the active account from localStorage
      const activeAccount = getActiveAccount();
      console.log('[HomeSimple] Active account:', activeAccount);
      
      if (activeAccount) {
        setAccount(activeAccount);
        if (hasNewTokens) {
          toast.success(`Successfully connected as ${activeAccount.email}!`);
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const handleLogin = () => {
    console.log('[OAuth] Redirecting to Dotloop OAuth...');
    
    // Generate authorization URL
    const clientId = import.meta.env.VITE_DOTLOOP_CLIENT_ID || '';
    const redirectUri = import.meta.env.VITE_DOTLOOP_REDIRECT_URI || `${window.location.origin}/api/dotloop/callback`;
    const state = Math.random().toString(36).substring(2, 15);
    
    console.log('[OAuth Debug] Client ID:', clientId);
    console.log('[OAuth Debug] Redirect URI:', redirectUri);
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      prompt: 'login', // Force re-authentication to allow account switching
    });
    
    const authUrl = `https://auth.dotloop.com/oauth/authorize?${params.toString()}`;
    window.location.href = authUrl;
  };

  const handleLogout = () => {
    console.log('[HomeSimple] Logging out...');
    clearAllAccounts();
    setAccount(null);
    setLoops([]);
    toast.success('Logged out successfully');
  };

  const handleRemoveAccount = (email: string) => {
    console.log('[HomeSimple] Removing account:', email);
    removeAccount(email);
    
    // Get the next active account if available
    const accounts = getAllAccounts();
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      toast.success(`Switched to ${accounts[0].email}`);
    } else {
      setAccount(null);
      toast.success('Account removed');
    }
  };

  const handleFetchLoops = async () => {
    if (!account) return;
    
    setIsLoadingLoops(true);
    try {
      // Fetch loops from Dotloop API via backend proxy
      const response = await fetch(`/api/dotloop-proxy/profile/${account.defaultProfileId}/loop`, {
        headers: {
          'Authorization': `Bearer ${account.accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setLoops(data.data || []);
      toast.success(`Loaded ${data.data?.length || 0} loops`);
    } catch (error) {
      console.error('[Dotloop API] Failed to fetch loops:', error);
      toast.error('Failed to fetch loops from Dotloop');
    } finally {
      setIsLoadingLoops(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const allAccounts = getAllAccounts();

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/dotloop-logo.png" alt="Dotloop Logo" className="h-8 w-auto" />
            <h1 className="text-xl font-bold text-foreground">
              Reporting Tool
            </h1>
          </div>
          
          {account && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-muted-foreground">{account.email}</span>
              </div>
              
              {allAccounts.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {allAccounts.length} accounts
                  </span>
                </div>
              )}
              
              <Button variant="outline" onClick={handleLogout} size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        {!account ? (
          // Not logged in - show login prompt
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold tracking-tight text-foreground">
                Transform Your Data into <span className="text-primary">Actionable Insights</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Connect your Dotloop account to access real-time transaction data and generate professional reports.
              </p>
            </div>

            <Card className="p-8 border-2">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Login with Dotloop</h3>
                  <p className="text-muted-foreground">
                    Connect your Dotloop account for real-time data sync and automatic updates
                  </p>
                </div>

                <Button 
                  onClick={handleLogin}
                  size="lg"
                  className="w-full"
                >
                  Connect to Dotloop
                </Button>

                <div className="space-y-2 text-sm text-muted-foreground text-left">
                  <p className="font-semibold">Key Benefits:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Real-time transaction data sync</li>
                    <li>Automatic commission calculations</li>
                    <li>No manual CSV uploads needed</li>
                    <li>Always current and up-to-date</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          // Logged in - show data
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Your Dotloop Data</h2>
                <p className="text-muted-foreground">
                  Connected as {account.firstName} {account.lastName}
                </p>
              </div>
              <Button 
                onClick={handleFetchLoops}
                disabled={isLoadingLoops}
              >
                {isLoadingLoops ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Fetch Loops'
                )}
              </Button>
            </div>

            {/* Multi-account selector */}
            {allAccounts.length > 1 && (
              <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Connected Accounts ({allAccounts.length})</h3>
                  <div className="space-y-2">
                    {allAccounts.map((acc) => (
                      <div key={acc.email} className="flex items-center justify-between p-2 bg-background rounded border border-border">
                        <div className="flex items-center gap-2">
                          {acc.email === account.email && (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                          <span className="text-sm">{acc.email}</span>
                        </div>
                        {acc.email !== account.email && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setAccount(acc);
                              toast.success(`Switched to ${acc.email}`);
                            }}
                          >
                            Switch
                          </Button>
                        )}
                        {allAccounts.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveAccount(acc.email)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={handleLogin}
                  >
                    Add Another Account
                  </Button>
                </div>
              </Card>
            )}

            {loops.length > 0 ? (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Loops ({loops.length})</h3>
                <div className="space-y-2">
                  {loops.slice(0, 10).map((loop: any, index: number) => (
                    <div key={index} className="p-4 border border-border rounded-lg">
                      <div className="font-semibold">{loop.loopName || 'Unnamed Loop'}</div>
                      <div className="text-sm text-muted-foreground">
                        Status: {loop.status || 'Unknown'} | 
                        Created: {loop.created ? new Date(loop.created).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  ))}
                  {loops.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center pt-4">
                      Showing 10 of {loops.length} loops
                    </p>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">No Data Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Click "Fetch Loops" to load your Dotloop data
                </p>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
