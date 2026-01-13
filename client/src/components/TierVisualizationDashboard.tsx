import React from 'react';
import { CommissionPlan, CommissionTier } from '@/lib/commission';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface TierVisualizationDashboardProps {
  plan: CommissionPlan;
  currentYTD: number;
  projectedYTDEnd: number; // Projected YTD at end of year
}

export function TierVisualizationDashboard({
  plan,
  currentYTD,
  projectedYTDEnd,
}: TierVisualizationDashboardProps) {
  if (!plan.useSliding || !plan.tiers || plan.tiers.length === 0) {
    return null;
  }

  const sortedTiers = [...plan.tiers].sort((a, b) => a.threshold - b.threshold);
  
  // Find current tier
  let currentTierIndex = 0;
  for (let i = 0; i < sortedTiers.length; i++) {
    if (currentYTD >= sortedTiers[i].threshold) {
      currentTierIndex = i;
    } else {
      break;
    }
  }

  const currentTier = sortedTiers[currentTierIndex];
  const nextTier = sortedTiers[currentTierIndex + 1];

  // Calculate progress to next tier
  let progressPercent = 0;
  let amountToNextTier = 0;
  if (nextTier) {
    const tierRange = nextTier.threshold - currentTier.threshold;
    const amountInTier = currentYTD - currentTier.threshold;
    progressPercent = (amountInTier / tierRange) * 100;
    amountToNextTier = nextTier.threshold - currentYTD;
  } else {
    progressPercent = 100; // In highest tier
  }

  // Calculate projected tier at year end
  let projectedTierIndex = currentTierIndex;
  for (let i = 0; i < sortedTiers.length; i++) {
    if (projectedYTDEnd >= sortedTiers[i].threshold) {
      projectedTierIndex = i;
    } else {
      break;
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  return (
    <div className="space-y-4">
      {/* Current Tier Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div>
                <CardTitle>Current Tier Status</CardTitle>
                <CardDescription>Your performance and tier progression</CardDescription>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              Tier {currentTierIndex + 1} of {sortedTiers.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Tier Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-4">
              <p className="text-xs text-foreground/70 mb-1">Current YTD</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(currentYTD)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg p-4">
              <p className="text-xs text-foreground/70 mb-1">Current Split</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {currentTier.splitPercentage}%
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg p-4">
              <p className="text-xs text-foreground/70 mb-1">Tier Threshold</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(currentTier.threshold)}
              </p>
            </div>
          </div>

          {/* Progress to Next Tier */}
          {nextTier && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Progress to Next Tier</span>
                <span className="text-sm text-foreground/70">
                  {formatCurrency(amountToNextTier)} remaining
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <div className="flex justify-between text-xs text-foreground/60">
                <span>{formatCurrency(currentYTD)}</span>
                <span>{formatCurrency(nextTier.threshold)}</span>
              </div>
            </div>
          )}

          {!nextTier && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                🏆 You're in the highest tier! Keep up the great performance.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tier Roadmap */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Tier Roadmap</CardTitle>
              <CardDescription>All available tiers and their requirements</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedTiers.map((tier, index) => {
              const isCurrentTier = index === currentTierIndex;
              const isFutureTier = index > currentTierIndex;
              const isPastTier = index < currentTierIndex;

              return (
                <div
                  key={tier.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isCurrentTier
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50'
                      : isPastTier
                      ? 'border-green-300 bg-green-50/50 dark:bg-green-950/30'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold">
                          Tier {index + 1}
                        </span>
                        {isCurrentTier && (
                          <Badge className="bg-blue-600 text-white">Current</Badge>
                        )}
                        {isPastTier && (
                          <Badge className="bg-green-600 text-white">Achieved</Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground/70 mb-2">
                        {tier.description}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-foreground/60">YTD Threshold</p>
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(tier.threshold)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-foreground/60">Agent Split</p>
                          <p className="font-semibold text-blue-600 dark:text-blue-400">
                            {tier.splitPercentage}%
                          </p>
                        </div>
                      </div>
                    </div>
                    {isFutureTier && (
                      <div className="text-right">
                        <p className="text-xs text-foreground/60 mb-1">To Unlock</p>
                        <p className="font-bold text-amber-600 dark:text-amber-400">
                          {formatCurrency(tier.threshold - currentYTD)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Projected Year-End Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <div>
              <CardTitle>Projected Year-End</CardTitle>
              <CardDescription>Based on current pace</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 rounded-lg p-4">
              <p className="text-xs text-foreground/70 mb-1">Projected YTD</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(projectedYTDEnd)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950 dark:to-rose-900 rounded-lg p-4">
              <p className="text-xs text-foreground/70 mb-1">Projected Tier</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                Tier {projectedTierIndex + 1}
              </p>
            </div>
          </div>

          {projectedTierIndex > currentTierIndex && (
            <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg p-3 border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                ✨ On track to reach Tier {projectedTierIndex + 1}! Keep the momentum going.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
