import React, { useState, useMemo } from 'react';
import { DotloopRecord, AgentMetrics } from '../lib/csvParser';
import {
  calculateBrokerageMetrics,
  compareBrokerageMetrics,
  generateRecommendations,
  identifyStrengths,
  identifyWeaknesses,
  calculateOverallPercentile,
  formatCurrency,
  formatPercentage,
  getNARBenchmarks
} from '../lib/benchmarkCalculator';

interface BenchmarkComparisonProps {
  records: DotloopRecord[];
  agentMetrics: AgentMetrics[];
}

/**
 * BenchmarkComparison Page Component
 * Displays brokerage metrics vs NAR 2024 benchmarks
 */
export const BenchmarkComparison: React.FC<BenchmarkComparisonProps> = ({
  records,
  agentMetrics
}) => {
  const [comparisonMode] = useState<'brokerage'>('brokerage');

  const benchmarkData = useMemo(() => {
    const brokerageMetrics = calculateBrokerageMetrics(records, agentMetrics);
    const comparisons = compareBrokerageMetrics(brokerageMetrics, agentMetrics);
    const strengths = identifyStrengths(comparisons);
    const weaknesses = identifyWeaknesses(comparisons);
    const recommendations = generateRecommendations(comparisons);
    const overallPercentile = calculateOverallPercentile(comparisons);
    const narBenchmarks = getNARBenchmarks();

    return {
      brokerageMetrics,
      comparisons,
      strengths,
      weaknesses,
      recommendations,
      overallPercentile,
      narBenchmarks
    };
  }, [records, agentMetrics]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Benchmark Comparison</h1>
        <p className="text-gray-600 mt-1">Compare your brokerage against NAR 2024 industry standards</p>
      </div>

      {/* Overall Percentile Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-8 text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-blue-100 text-sm font-medium mb-2">Overall Ranking</p>
            <div className="text-5xl font-bold">{benchmarkData.overallPercentile}%</div>
            <p className="text-blue-100 mt-2">
              {benchmarkData.overallPercentile >= 75
                ? 'Top Performer'
                : benchmarkData.overallPercentile >= 50
                ? 'Above Average'
                : 'Below Average'}
            </p>
          </div>
          <div>
            <p className="text-blue-100 text-sm font-medium mb-2">Agents</p>
            <div className="text-5xl font-bold">{agentMetrics.length}</div>
            <p className="text-blue-100 mt-2">
              Avg {benchmarkData.brokerageMetrics.avgTransactions} deals/agent
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {benchmarkData.comparisons.map((comparison, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderColor: comparison.color }}>
            <p className="text-sm font-medium text-gray-600 mb-2">{comparison.metric}</p>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Your Performance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {comparison.metric.includes('Rate') || comparison.metric.includes('Days')
                    ? `${comparison.userValue}${comparison.metric.includes('Rate') ? '%' : ' days'}`
                    : comparison.metric.includes('GCI')
                    ? formatCurrency(comparison.userValue)
                    : comparison.userValue}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">NAR Benchmark</p>
                <p className="text-sm font-medium text-gray-700">
                  {comparison.metric.includes('Rate') || comparison.metric.includes('Days')
                    ? `${comparison.benchmarkValue}${comparison.metric.includes('Rate') ? '%' : ' days'}`
                    : comparison.metric.includes('GCI')
                    ? formatCurrency(comparison.benchmarkValue)
                    : comparison.benchmarkValue}
                </p>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">{comparison.percentileRank}</span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: comparison.isAboveBenchmark ? '#10b981' : '#ef4444' }}
                  >
                    {comparison.isAboveBenchmark ? '+' : ''}{comparison.differencePercent}%
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-600 italic">{comparison.insight}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">✓</span> Strengths
          </h3>
          <ul className="space-y-2">
            {benchmarkData.strengths.length > 0 ? (
              benchmarkData.strengths.map((strength, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-500 font-bold mt-0.5">•</span>
                  <span>{strength}</span>
                </li>
              ))
            ) : (
              <p className="text-sm text-gray-500">No significant strengths identified</p>
            )}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-red-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">!</span> Areas for Improvement
          </h3>
          <ul className="space-y-2">
            {benchmarkData.weaknesses.length > 0 ? (
              benchmarkData.weaknesses.map((weakness, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">•</span>
                  <span>{weakness}</span>
                </li>
              ))
            ) : (
              <p className="text-sm text-gray-500">No significant weaknesses identified</p>
            )}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
        <ul className="space-y-3">
          {benchmarkData.recommendations.length > 0 ? (
            benchmarkData.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  {idx + 1}
                </span>
                <span>{rec}</span>
              </li>
            ))
          ) : (
            <p className="text-sm text-gray-500">No recommendations at this time</p>
          )}
        </ul>
      </div>

      {/* Detailed Metrics Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Metric</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Your Value</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Benchmark</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Difference</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Percentile</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {benchmarkData.comparisons.map((comparison, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{comparison.metric}</td>
                  <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    {comparison.metric.includes('Rate') || comparison.metric.includes('Days')
                      ? `${comparison.userValue}${comparison.metric.includes('Rate') ? '%' : ' days'}`
                      : comparison.metric.includes('GCI')
                      ? formatCurrency(comparison.userValue)
                      : comparison.userValue}
                  </td>
                  <td className="px-6 py-3 text-right text-sm text-gray-700">
                    {comparison.metric.includes('Rate') || comparison.metric.includes('Days')
                      ? `${comparison.benchmarkValue}${comparison.metric.includes('Rate') ? '%' : ' days'}`
                      : comparison.metric.includes('GCI')
                      ? formatCurrency(comparison.benchmarkValue)
                      : comparison.benchmarkValue}
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-semibold" style={{ color: comparison.color }}>
                    {comparison.isAboveBenchmark ? '+' : ''}{comparison.differencePercent}%
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    {comparison.percentileRank}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Note */}
      <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
        <p className="font-medium mb-1">Data Source</p>
        <p>Benchmarks based on NAR 2024 Member Profile and industry standards. Your data is calculated from uploaded transactions.</p>
      </div>
    </div>
  );
};

export default BenchmarkComparison;
