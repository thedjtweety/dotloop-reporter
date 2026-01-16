/**
 * Dotloop Reporting Tool - Home Page
 * Displays dashboard with mock Dotloop data for testing
 * Updated: 2026-01-16
 */

import { useState } from 'react';
import DotloopDashboard from './DotloopDashboard';
import { DotloopRecord } from '@/lib/csvParser';

// Mock Dotloop data for testing the dashboard
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
  const [showDashboard] = useState(true);

  if (showDashboard) {
    return <DotloopDashboard records={mockDotloopData as unknown as DotloopRecord[]} />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Dotloop Reporting Tool</h1>
        <p className="text-muted-foreground">
          Clean rebuild in progress...
        </p>
      </div>
    </div>
  );
}
