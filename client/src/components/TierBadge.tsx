import React from 'react';
import { PerformanceTier, getTierDefinition } from '../lib/tierAnalyzer';

interface TierBadgeProps {
  tier: PerformanceTier;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * TierBadge Component
 * Displays agent performance tier with color coding
 */
export const TierBadge: React.FC<TierBadgeProps> = ({
  tier,
  showLabel = true,
  size = 'md',
  className = ''
}) => {
  const tierDef = getTierDefinition(tier);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full font-semibold ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: tierDef.bgColor,
        color: tierDef.textColor,
        border: `2px solid ${tierDef.color}`
      }}
      title={tierDef.description}
    >
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tierDef.color }} />
      {showLabel && <span>{tierDef.name}</span>}
    </div>
  );
};

interface TierBadgeWithPercentileProps extends TierBadgeProps {
  percentile: number;
}

/**
 * TierBadgeWithPercentile Component
 * Displays tier badge with percentile ranking
 */
export const TierBadgeWithPercentile: React.FC<TierBadgeWithPercentileProps> = ({
  tier,
  percentile,
  size = 'md',
  className = ''
}) => {
  const tierDef = getTierDefinition(tier);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full font-semibold ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: tierDef.bgColor,
        color: tierDef.textColor,
        border: `2px solid ${tierDef.color}`
      }}
      title={tierDef.description}
    >
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tierDef.color }} />
      <span>
        {tierDef.name} <span className="opacity-75">({percentile}%)</span>
      </span>
    </div>
  );
};

interface TierDistributionProps {
  tier1Count: number;
  tier2Count: number;
  tier3Count: number;
  className?: string;
}

/**
 * TierDistribution Component
 * Shows distribution of agents across tiers
 */
export const TierDistribution: React.FC<TierDistributionProps> = ({
  tier1Count,
  tier2Count,
  tier3Count,
  className = ''
}) => {
  const total = tier1Count + tier2Count + tier3Count;
  const tier1Percent = total > 0 ? Math.round((tier1Count / total) * 100) : 0;
  const tier2Percent = total > 0 ? Math.round((tier2Count / total) * 100) : 0;
  const tier3Percent = total > 0 ? Math.round((tier3Count / total) * 100) : 0;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm font-medium">Struggling</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{tier1Count}</span>
          <span className="text-xs text-gray-500">({tier1Percent}%)</span>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-red-500 h-2 rounded-full"
          style={{ width: `${tier1Percent}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-sm font-medium">Average</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{tier2Count}</span>
          <span className="text-xs text-gray-500">({tier2Percent}%)</span>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-amber-500 h-2 rounded-full"
          style={{ width: `${tier2Percent}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm font-medium">Top Producer</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{tier3Count}</span>
          <span className="text-xs text-gray-500">({tier3Percent}%)</span>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full"
          style={{ width: `${tier3Percent}%` }}
        />
      </div>
    </div>
  );
};

interface TierLegendProps {
  className?: string;
}

/**
 * TierLegend Component
 * Shows legend explaining tier definitions
 */
export const TierLegend: React.FC<TierLegendProps> = ({ className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-3 h-3 rounded-full bg-red-500 mt-1 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-900">Tier 1: Struggling</p>
          <p className="text-xs text-gray-600">Below market performance - needs support and coaching</p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-3 h-3 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-900">Tier 2: Average</p>
          <p className="text-xs text-gray-600">Market median performance - solid producer</p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-900">Tier 3: Top Producer</p>
          <p className="text-xs text-gray-600">Above market performance - elite producer</p>
        </div>
      </div>
    </div>
  );
};
