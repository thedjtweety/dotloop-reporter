/**
 * Risk Level Explainer Modal
 * 
 * Shows detailed breakdown of risk calculation:
 * - Deal Age: How long deals have been in contract
 * - Status Volatility: How often deals change status
 * - Market Conditions: External factors affecting close rates
 * - Risk Score: Composite risk assessment
 */

import { X, AlertTriangle, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface RiskLevelExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  riskMetrics?: {
    dealAge: number;
    statusVolatility: number;
    marketConditions: number;
    riskScore: number;
    riskLevel: 'Low' | 'Medium' | 'High';
  };
}

export default function RiskLevelExplainerModal({
  isOpen,
  onClose,
  riskMetrics = {
    dealAge: 45,
    statusVolatility: 8,
    marketConditions: 5,
    riskScore: 19,
    riskLevel: 'Low',
  },
}: RiskLevelExplainerModalProps) {
  if (!isOpen) return null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'Medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'High':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-lg border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-900/95 backdrop-blur">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Risk Level Calculation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Formula */}
          <Card className="p-4 bg-slate-800/50 border-slate-700">
            <p className="text-sm text-slate-400 mb-2">FORMULA</p>
            <p className="text-white font-mono text-sm leading-relaxed">
              Risk Score = (Deal Age × 0.4) + (Status Volatility × 0.4) + (Market Conditions × 0.2)
            </p>
            <p className="text-xs text-slate-500 mt-3">
              Lower score = Lower risk. Risk Level determined by score thresholds.
            </p>
          </Card>

          {/* Risk Factors */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">RISK FACTORS</h3>

            {/* Deal Age */}
            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-white">Deal Age</p>
                  <p className="text-xs text-slate-400 mt-1">
                    How long deals have been in contract (days)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-400">{riskMetrics.dealAge}</p>
                  <p className="text-xs text-slate-500">days avg</p>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (riskMetrics.dealAge / 120) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Deals in contract longer than 120 days increase risk. Your average is {riskMetrics.dealAge} days.
              </p>
            </Card>

            {/* Status Volatility */}
            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-white">Status Volatility</p>
                  <p className="text-xs text-slate-400 mt-1">
                    How often deals change status (changes per deal)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-400">{riskMetrics.statusVolatility}</p>
                  <p className="text-xs text-slate-500">changes avg</p>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (riskMetrics.statusVolatility / 20) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                High volatility (frequent status changes) indicates deal instability. Your average is {riskMetrics.statusVolatility} changes per deal.
              </p>
            </Card>

            {/* Market Conditions */}
            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-white">Market Conditions</p>
                  <p className="text-xs text-slate-400 mt-1">
                    External factors affecting close rates
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">{riskMetrics.marketConditions}</p>
                  <p className="text-xs text-slate-500">score</p>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (riskMetrics.marketConditions / 10) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Based on seasonal trends, interest rates, and market velocity. Lower is better.
              </p>
            </Card>
          </div>

          {/* Risk Score Calculation */}
          <Card className={`p-4 border ${getRiskColor(riskMetrics.riskLevel)}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium">Final Risk Score</p>
                <p className="text-xs opacity-75 mt-1">Composite risk assessment</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{riskMetrics.riskScore}</p>
                <p className="text-xs opacity-75 mt-1">/ 100</p>
              </div>
            </div>
            <div className="w-full bg-black/20 rounded-full h-3 mt-3">
              <div
                className={`h-3 rounded-full ${
                  riskMetrics.riskLevel === 'Low'
                    ? 'bg-green-500'
                    : riskMetrics.riskLevel === 'Medium'
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${riskMetrics.riskScore}%` }}
              />
            </div>
          </Card>

          {/* Risk Level Thresholds */}
          <Card className="p-4 bg-slate-800/50 border-slate-700">
            <p className="text-sm font-medium text-white mb-3">RISK LEVEL THRESHOLDS</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-green-400">Low Risk</span>
                <span className="text-slate-400">Score 0-30</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-amber-400">Medium Risk</span>
                <span className="text-slate-400">Score 31-60</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-red-400">High Risk</span>
                <span className="text-slate-400">Score 61-100</span>
              </div>
            </div>
          </Card>

          {/* Current Risk Level */}
          <Card className={`p-4 border ${getRiskColor(riskMetrics.riskLevel)}`}>
            <div className="flex items-center gap-3">
              <TrendingDown className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Current Risk Level</p>
                <p className="text-lg font-bold">{riskMetrics.riskLevel} Risk</p>
              </div>
            </div>
          </Card>

          {/* Interpretation */}
          <Card className="p-4 bg-slate-800/50 border-slate-700">
            <p className="text-sm font-medium text-white mb-2">INTERPRETATION</p>
            <p className="text-sm text-slate-400 leading-relaxed">
              {riskMetrics.riskLevel === 'Low'
                ? 'Your pipeline shows healthy deal progression with minimal risk factors. Deals are moving through the pipeline smoothly with stable status and reasonable contract duration.'
                : riskMetrics.riskLevel === 'Medium'
                  ? 'Your pipeline has moderate risk factors. Some deals are taking longer to close or showing status volatility. Monitor these deals closely and consider intervention if needed.'
                  : 'Your pipeline shows elevated risk. Multiple deals are either aging in contract or showing high status volatility. Immediate attention recommended to identify blockers and accelerate closes.'}
            </p>
          </Card>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/50 sticky bottom-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
