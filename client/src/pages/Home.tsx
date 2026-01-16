/**
 * Dotloop Reporting Tool - Home Page
 * 
 * Handles OAuth authentication flow and displays dashboard when connected
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import DotloopDashboard from './DotloopDashboard';
import AccountSwitcher from '@/components/AccountSwitcher';
import {
  hasAccounts,
  getActiveAccount,
  handleOAuthCallback,
  getAuthorizationUrl,
  type DotloopAccount,
} from '@/lib/dotloopAuth';
import { DotloopRecord } from '@/lib/csvParser';

// Mock Dotloop data for testing (will be replaced with real API data later)
const mockDotloopData = [
  {
    loopName: '123 Main St - Smith Purchase',
    loopStatus: 'Closed',
    price: 450000,
    salePrice: 450000,
    closingDate: '2024-01-15',
    listingDate: '2023-12-01',
    contractDate: '2024-01-05',
    transactionType: 'Purchase',
    propertyAddress: '123 Main St',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    agentName: 'Drew Bryant',
    agentEmail: 'drewbr@zillowgroup.com',
    leadSource: 'Referral',
    commission: 13500,
    commissionRate: 0.03,
    createdDate: '2023-12-01',
  },
  {
    loopName: '456 Oak Ave - Johnson Sale',
    loopStatus: 'Active',
    price: 550000,
    salePrice: 0,
    listingDate: '2024-01-20',
    transactionType: 'Listing',
    propertyAddress: '456 Oak Ave',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75201',
    agentName: 'Drew Bryant',
    agentEmail: 'drewbr@zillowgroup.com',
    leadSource: 'Website',
    commission: 0,
    commissionRate: 0.03,
    createdDate: '2024-01-20',
  },
  {
    loopName: '789 Pine Rd - Williams Purchase',
    loopStatus: 'Under Contract',
    price: 375000,
    salePrice: 375000,
    contractDate: '2024-01-25',
    transactionType: 'Purchase',
    propertyAddress: '789 Pine Rd',
    city: 'Houston',
    state: 'TX',
    zipCode: '77001',
    agentName: 'Sarah Chen',
    agentEmail: 'sarah@example.com',
    leadSource: 'Zillow',
    commission: 11250,
    commissionRate: 0.03,
    createdDate: '2024-01-10',
  },
  {
    loopName: '321 Elm St - Davis Sale',
    loopStatus: 'Closed',
    price: 625000,
    salePrice: 615000,
    closingDate: '2024-01-10',
    listingDate: '2023-11-15',
    contractDate: '2023-12-20',
    transactionType: 'Listing',
    propertyAddress: '321 Elm St',
    city: 'Austin',
    state: 'TX',
    zipCode: '78702',
    agentName: 'Sarah Chen',
    agentEmail: 'sarah@example.com',
    leadSource: 'Open House',
    commission: 18450,
    commissionRate: 0.03,
    createdDate: '2023-11-15',
  },
  {
    loopName: '555 Maple Dr - Brown Purchase',
    loopStatus: 'Closed',
    price: 425000,
    salePrice: 425000,
    closingDate: '2024-01-12',
    listingDate: '2023-12-10',
    contractDate: '2024-01-02',
    transactionType: 'Purchase',
    propertyAddress: '555 Maple Dr',
    city: 'San Antonio',
    state: 'TX',
    zipCode: '78201',
    agentName: 'Mike Rodriguez',
    agentEmail: 'mike@example.com',
    leadSource: 'Referral',
    commission: 12750,
    commissionRate: 0.03,
    createdDate: '2023-12-10',
  },
];

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [activeAccount, setActiveAccount] = useState<DotloopAccount | null>(null);

  useEffect(() => {
    // Check for OAuth callback
    const account = handleOAuthCallback();
    if (account) {
      setActiveAccount(account);
      setIsConnected(true);
      return;
    }

    // Check if user has any connected accounts
    if (hasAccounts()) {
      const active = getActiveAccount();
      setActiveAccount(active);
      setIsConnected(true);
    }
  }, []);

  const handleAccountChange = (account: DotloopAccount | null) => {
    setActiveAccount(account);
    setIsConnected(account !== null);
  };

  const handleLogout = () => {
    setActiveAccount(null);
    setIsConnected(false);
  };

  const handleConnect = () => {
    window.location.href = getAuthorizationUrl();
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
            </div>
            <div className="flex items-center gap-4">
              <AccountSwitcher 
                onAccountChange={handleAccountChange}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </header>
        
        <main className="container py-6">
          <DotloopDashboard records={mockDotloopData as unknown as DotloopRecord[]} />
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
