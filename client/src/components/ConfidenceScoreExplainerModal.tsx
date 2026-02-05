/**
 * Confidence Score Explainer Modal
 * 
 * Shows detailed breakdown of confidence score calculation:
 * - Data Quality: Completeness and accuracy of transaction data
 * - Historical Accuracy: How well past forecasts matched actual results
 * - Sample Size: Number of comparable historical deals
 * - Confidence Score: Overall confidence in forecast accuracy
 */

import { X, CheckCircle, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ConfidenceScoreExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  scoreMetrics?: {
    dataQuality: number;
    historicalAccuracy: number;
    sampleSize: number;
    confidenceScore: number;
  };
}

export default function ConfidenceScoreExplainerModal({
  isOpen,
  onClose,
  scoreMetrics = {
    dataQuality: 92,
    historicalAccuracy: 87,
    sampleSize: 156,
    confidenceScore: 100,
  },
}: ConfidenceScoreExplainerModalProps) {
  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (score >= 70) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-lg border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 bg-slate-900/95 backdrop-blur">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Confidence Score Calculation</h2>
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
              Confidence Score = (Data Quality × 0.35) + (Historical Accuracy × 0.40) + (Sample Size Score × 0.25)
            </p>
            <p className="text-xs text-slate-500 mt-3">
              Higher score = Higher confidence in forecast accuracy. Capped at 100%.
            </p>
          </Card>

          {/* Confidence Factors */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">CONFIDENCE FACTORS</h3>

            {/* Data Quality */}
            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-white">Data Quality</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Completeness and accuracy of transaction data
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-400">{scoreMetrics.dataQuality}%</p>
                  <p className="text-xs text-slate-500">quality score</p>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${scoreMetrics.dataQuality}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Measures completeness of required fields (agent name, dates, prices, commission). Missing or invalid data reduces quality.
              </p>
            </Card>

            {/* Historical Accuracy */}
            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-white">Historical Accuracy</p>
                  <p className="text-xs text-slate-400 mt-1">
                    How well past forecasts matched actual results
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-400">{scoreMetrics.historicalAccuracy}%</p>
                  <p className="text-xs text-slate-500">accuracy rate</p>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{ width: `${scoreMetrics.historicalAccuracy}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Compares historical forecasts to actual close rates. Tracks prediction accuracy over time to validate model reliability.
              </p>
            </Card>

            {/* Sample Size */}
            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-white">Sample Size</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Number of comparable historical deals
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">{scoreMetrics.sampleSize}</p>
                  <p className="text-xs text-slate-500">deals analyzed</p>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (scoreMetrics.sampleSize / 200) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Larger sample sizes increase confidence. Minimum recommended: 50 deals. Your sample: {scoreMetrics.sampleSize} deals.
              </p>
            </Card>
          </div>

          {/* Confidence Score Calculation */}
          <Card className={`p-4 border ${getScoreColor(scoreMetrics.confidenceScore)}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium">Final Confidence Score</p>
                <p className="text-xs opacity-75 mt-1">Overall forecast reliability</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{scoreMetrics.confidenceScore}%</p>
                <p className="text-xs opacity-75 mt-1">confidence</p>
              </div>
            </div>
            <div className="w-full bg-black/20 rounded-full h-3 mt-3">
              <div
                className={`h-3 rounded-full ${
                  scoreMetrics.confidenceScore >= 85
                    ? 'bg-green-500'
                    : scoreMetrics.confidenceScore >= 70
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${scoreMetrics.confidenceScore}%` }}
              />
            </div>
          </Card>

          {/* Confidence Level Thresholds */}
          <Card className="p-4 bg-slate-800/50 border-slate-700">
            <p className="text-sm font-medium text-white mb-3">CONFIDENCE LEVEL INTERPRETATION</p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-2 rounded bg-green-500/10 border border-green-500/20">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-400">85-100%: Very High Confidence</p>
                  <p className="text-xs text-slate-400 mt-1">Excellent data quality, strong historical accuracy, and large sample size. Forecasts are highly reliable.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-400">70-84%: Good Confidence</p>
                  <p className="text-xs text-slate-400 mt-1">Good data quality and historical accuracy. Forecasts are generally reliable with minor caveats.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded bg-red-500/10 border border-red-500/20">
                <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-400">Below 70%: Low Confidence</p>
                  <p className="text-xs text-slate-400 mt-1">Limited data quality, historical accuracy, or sample size. Use forecasts with caution and consider collecting more data.</p>
                </div>
              </div>
            </div>
          </Card>

          {/* What Affects Confidence */}
          <Card className="p-4 bg-slate-800/50 border-slate-700">
            <p className="text-sm font-medium text-white mb-3">FACTORS THAT IMPROVE CONFIDENCE</p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Complete transaction data with all required fields</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Historical forecasts that closely match actual results</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Large number of comparable historical deals (100+)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Consistent agent performance and deal patterns</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">✗</span>
                <span>Missing or incomplete data fields</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">✗</span>
                <span>Large discrepancies between forecasts and actuals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">✗</span>
                <span>Small sample size of historical deals</span>
              </li>
            </ul>
          </Card>

          {/* Recommendations */}
          <Card className="p-4 bg-slate-800/50 border-slate-700">
            <p className="text-sm font-medium text-white mb-2">RECOMMENDATIONS</p>
            <p className="text-sm text-slate-400 leading-relaxed">
              {scoreMetrics.confidenceScore >= 85
                ? 'Your confidence score is excellent. Continue maintaining data quality and monitor forecast accuracy to ensure sustained reliability.'
                : scoreMetrics.confidenceScore >= 70
                  ? 'Your confidence score is good. Consider improving data completeness and collecting more historical deals to increase accuracy.'
                  : 'Your confidence score is low. Focus on improving data quality, collecting more historical transactions, and validating forecast accuracy.'}
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
