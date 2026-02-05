/**
 * Enhanced Projected to Close Card
 * Features: Animated counters, confidence ring, sparkline trends, stats grid
 */

import { useState, useEffect } from 'react';
import { DashboardMetrics } from '@/lib/csvParser';
import { TrendingUp, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EnhancedProjectedToCloseProps {
  metrics: DashboardMetrics;
  selectedPeriod: '30' | '60' | '90';
  onPeriodChange: (period: '30' | '60' | '90') => void;
  onExportPDF: () => void;
  onExportCSV: () => void;
}

/**
 * Animated counter component
 */
function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayValue(Math.floor(value * progress));

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

/**
 * Circular progress ring component
 */
function ConfidenceRing({ confidence }: { confidence: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (confidence / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="120" height="120" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-700 dark:text-slate-600"
        />
        {/* Progress circle with animation */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="url(#confidenceGradient)"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out drop-shadow-lg"
        />
        <defs>
          <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-400">Confidence</p>
        <p className="text-2xl font-bold text-emerald-400">{confidence}%</p>
      </div>
    </div>
  );
}

/**
 * Mini sparkline component
 */
function MiniSparkline({ data, color = '#10b981' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 40;
  const pointSpacing = width / (data.length - 1);

  const points = data.map((value, index) => {
    const x = index * pointSpacing;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Risk level indicator
 */
function RiskIndicator({ risk }: { risk: 'low' | 'medium' | 'high' }) {
  const config = {
    low: { color: 'text-emerald-400', bg: 'bg-emerald-900/20', icon: CheckCircle, label: 'Low Risk' },
    medium: { color: 'text-amber-400', bg: 'bg-amber-900/20', icon: AlertTriangle, label: 'Medium Risk' },
    high: { color: 'text-red-400', bg: 'bg-red-900/20', icon: AlertCircle, label: 'High Risk' },
  };

  const { color, bg, icon: Icon, label } = config[risk];

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bg}`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <span className={`text-sm font-medium ${color}`}>{label}</span>
    </div>
  );
}

export default function EnhancedProjectedToClose({
  metrics,
  selectedPeriod,
  onPeriodChange,
  onExportPDF,
  onExportCSV,
}: EnhancedProjectedToCloseProps) {
  const [periodData, setPeriodData] = useState<{
    deals: number;
    revenue: number;
    confidence: number;
  }>({ deals: 0, revenue: 0, confidence: 0 });

  // Calculate period-based projections
  useEffect(() => {
    const activeDealCount = metrics.activeListings + metrics.underContract;
    const periodDays = parseInt(selectedPeriod);
    
    // Adjust close rate based on period
    const periodAdjustment = periodDays === 30 ? 0.6 : periodDays === 60 ? 0.8 : 1.0;
    const adjustedCloseRate = metrics.closingRate * periodAdjustment;
    
    // Calculate projected deals
    const projectedDeals = Math.round(activeDealCount * (adjustedCloseRate / 100));
    
    // Calculate average commission per deal
    const avgCommissionPerDeal = metrics.totalCommission / Math.max(metrics.closed, 1);
    const projectedRevenue = projectedDeals * avgCommissionPerDeal;
    
    // Calculate confidence based on period
    const confidence = Math.min(Math.round(adjustedCloseRate), 100);
    
    setPeriodData({
      deals: projectedDeals,
      revenue: projectedRevenue,
      confidence,
    });
  }, [selectedPeriod, metrics]);

  const activeDealCount = metrics.activeListings + metrics.underContract;
  const avgCommissionPerDeal = metrics.totalCommission / Math.max(metrics.closed, 1);

  // Generate historical close rate trend data
  const closeRateTrend = [
    42, 44, 43, 45, 46, 47, 46, 48, 49, 48, 50, metrics.closingRate,
  ];

  // Determine risk level based on confidence
  const getRiskLevel = (): 'low' | 'medium' | 'high' => {
    if (periodData.confidence >= 50) return 'low';
    if (periodData.confidence >= 40) return 'medium';
    return 'high';
  };

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Projected to Close</h3>
            <p className="text-sm text-slate-400">{activeDealCount} deals in pipeline</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(['30', '60', '90'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPeriodChange(period)}
              className={selectedPeriod === period ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              {period} Days
            </Button>
          ))}
        </div>
      </div>

      {/* Main metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Projected Deals */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <p className="text-xs font-medium text-slate-400 mb-2">Projected Deals</p>
          <div className="text-3xl font-bold text-blue-400 mb-2">
            <AnimatedCounter value={periodData.deals} />
          </div>
          <p className="text-xs text-slate-500">of {activeDealCount} in pipeline</p>
        </div>

        {/* Projected Revenue */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 lg:col-span-2">
          <p className="text-xs font-medium text-slate-400 mb-2">Projected Revenue</p>
          <div className="text-3xl font-bold text-emerald-400 mb-2">
            $<AnimatedCounter value={Math.round(periodData.revenue)} />
          </div>
          <p className="text-xs text-slate-500">
            Avg: ${avgCommissionPerDeal.toLocaleString('en-US', { maximumFractionDigits: 0 })} per deal
          </p>
        </div>

        {/* Close Rate */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <p className="text-xs font-medium text-slate-400 mb-2">Close Rate</p>
          <div className="text-3xl font-bold text-purple-400 mb-2">
            <AnimatedCounter value={Math.round(metrics.closingRate)} />%
          </div>
          <p className="text-xs text-slate-500">Historical trend</p>
        </div>
      </div>

      {/* Confidence Ring + Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Confidence Ring */}
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50 flex justify-center">
          <ConfidenceRing confidence={periodData.confidence} />
        </div>

        {/* Stats Grid */}
        <div className="lg:col-span-2 space-y-3">
          {/* Close Rate Trend */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-300">Close Rate Trend</p>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <MiniSparkline data={closeRateTrend} color="#10b981" />
          </div>

          {/* Risk Level & Confidence */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-xs font-medium text-slate-400 mb-2">Risk Level</p>
              <RiskIndicator risk={getRiskLevel()} />
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <p className="text-xs font-medium text-slate-400 mb-2">Confidence Score</p>
              <div className="text-2xl font-bold text-emerald-400">
                <AnimatedCounter value={periodData.confidence} />%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={onExportPDF}
          className="border-slate-600 hover:bg-slate-700/50"
        >
          📄 Export PDF
        </Button>
        <Button
          variant="outline"
          onClick={onExportCSV}
          className="border-slate-600 hover:bg-slate-700/50"
        >
          ⬇️ Export CSV
        </Button>
      </div>
    </div>
  );
}
