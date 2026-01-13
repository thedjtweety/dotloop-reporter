/**
 * Tier Analytics Page
 * 
 * Full-page view for tier performance analytics and agent distribution
 */

import React from 'react';
import { useUser } from '@/lib/user';
import TierAnalyticsDashboard from '@/components/TierAnalyticsDashboard';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function TierAnalyticsPage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 bg-card border border-border">
          <p className="text-foreground">Please log in to view tier analytics</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Tier Performance Analytics
          </h1>
          <p className="text-foreground">
            Track agent progression through commission tiers and analyze performance metrics
          </p>
        </div>

        <TierAnalyticsDashboard />
      </div>
    </div>
  );
}
