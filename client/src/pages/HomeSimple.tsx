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
      
      // Check if we've already processed this OAuth callback to prevent infinite loops
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const hasOAuthParams = urlParams.has('dotloop_connected') && accessToken;
      
      // Use sessionStorage to track if we've already processed this specific token
      // This prevents re-processing the same OAuth callback after logout
      const processedTokensKey = 'oauth_processed_tokens';
      const processedTokens = new Set(JSON.parse(sessionStorage.getItem(processedTokensKey) || '[]'));
      
      if (hasOAuthParams && processedTokens.has(accessToken)) {
        console.log('[HomeSimple] OAuth token already processed, skipping callback...');
        // Don't process the callback again
      } else if (hasOAuthParams && accessToken) {
        console.log('[HomeSimple] Processing new OAuth callback with token:', accessToken.substring(0, 10) + '...');
        // Mark this token as processed
        processedTokens.add(accessToken);
        sessionStorage.setItem(processedTokensKey, JSON.stringify(Array.from(processedTokens)));
        
        // Process the callback
        const hasNewTokens = handleOAuthCallback();
        console.log('[HomeSimple] handleOAuthCallback result:', hasNewTokens);
        
        // Get the active account from localStorage
        const activeAccount = getActiveAccount();
        console.log('[HomeSimple] Active account:', activeAccount);
        
        if (activeAccount) {
          setAccount(activeAccount);
          if (hasNewTokens) {
            toast.success(`Successfully connected as ${activeAccount.email}!`);
            // Clean URL after successful OAuth callback
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      } else {
        // No OAuth callback, just check for existing account
        const activeAccount = getActiveAccount();
        console.log('[HomeSimple] Active account:', activeAccount);
        
        if (activeAccount) {
          setAccount(activeAccount);
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
    
    const authUrl = `https://auth.dotloop.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&state=${state}`;
    window.location.href = authUrl;
  };

  const handleLogout = () => {
    console.log('[HomeSimple] Logging out...');
    console.log('[HomeSimple] Current account before logout:', account);
    console.log('[HomeSimple] All accounts before logout:', getAllAccounts());
    
    // Clear all accounts and state
    clearAllAccounts();
    setAccount(null);
    setLoops([]);
    
    // Clear the processed tokens to allow re-authentication
    sessionStorage.removeItem('oauth_processed_tokens');
    
    // Clean URL using replaceState (doesn't reload page)
    window.history.replaceState({}, document.title, window.location.pathname);
    
    console.log('[HomeSimple] All accounts after logout:', getAllAccounts());
    console.log('[HomeSimple] Active account after logout:', getActiveAccount());
    
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
      // This is a placeholder - implement actual Dotloop API call here
      console.log('[HomeSimple] Fetching loops for account:', account.email);
      toast.success('Loops fetched successfully!');
    } catch (error) {
      console.error('[HomeSimple] Error fetching loops:', error);
      toast.error('Failed to fetch loops');
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
                    Fetching...
                  </>
                ) : (
                  'Fetch Loops'
                )}
              </Button>
            </div>

            {/* Data Display */}
            <Card className="p-8">
              <div className="text-center space-y-4">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">No Data Yet</h3>
                <p className="text-muted-foreground">
                  Click "Fetch Loops" to load your Dotloop data
                </p>
              </div>
            </Card>

            {/* Multi-Account Management */}
            {allAccounts.length > 1 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Connected Accounts ({allAccounts.length})</h3>
                <div className="space-y-2">
                  {allAccounts.map((acc) => (
                    <div key={acc.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <span className="text-sm">{acc.email}</span>
                        </div>
                        <div className="flex gap-2">
                          {acc.email === account.email ? (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleLogout()}
                            >
                              Logout
                            </Button>
                          ) : (
                            <>
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
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveAccount(acc.email)}
                              >
                                Remove
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full mt-4"
                  onClick={handleLogin}
                >
                  Add Another Account
                </Button>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
