import React, { useState, useMemo } from 'react';
import { DotloopRecord, AgentMetrics } from '../lib/csvParser';
import {
  getAgentTrendData,
  getComparisonTrendData,
  getTrendIndicator,
  getTrendColor,
  formatCurrency,
  formatPercentage,
  TimePeriod
} from '../lib/trendAnalyzer';

interface PerformanceTrendsProps {
  records: DotloopRecord[];
  agentMetrics: AgentMetrics[];
}

/**
 * PerformanceTrends Page Component
 * Displays monthly/quarterly trend analysis for agents
 */
export const PerformanceTrends: React.FC<PerformanceTrendsProps> = ({
  records,
  agentMetrics
}) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });

  const agents = agentMetrics.map(m => m.agentName);

  // Get trend data for selected agents
  const trendData = useMemo(() => {
    const agentsToAnalyze = selectedAgents.length > 0 ? selectedAgents : [agents[0]];
    
    if (agentsToAnalyze.length === 1) {
      return {
        type: 'single' as const,
        data: getAgentTrendData(records, agentsToAnalyze[0], timePeriod)
      };
    }

    return {
      type: 'comparison' as const,
      data: getComparisonTrendData(records, agentsToAnalyze, timePeriod)
    };
  }, [records, selectedAgents, timePeriod, agents]);

  const handleAgentToggle = (agentName: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentName)
        ? prev.filter(a => a !== agentName)
        : [...prev, agentName]
    );
  };

  const handleSelectAll = () => {
    if (selectedAgents.length === agents.length) {
      setSelectedAgents([]);
    } else {
      setSelectedAgents(agents);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Performance Trends</h1>
        <p className="text-gray-600 mt-1">Track agent performance over time</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Time Period Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Period
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setTimePeriod('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  timePeriod === 'monthly'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setTimePeriod('quarterly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  timePeriod === 'quarterly'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Quarterly
              </button>
            </div>
          </div>

          {/* Agent Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agents
            </label>
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition w-full"
            >
              {selectedAgents.length === agents.length ? 'Clear All' : 'Select All'}
            </button>
          </div>

          {/* Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected
            </label>
            <div className="px-4 py-2 rounded-lg bg-blue-50 text-blue-900 text-sm font-medium">
              {selectedAgents.length === 0 ? 'All agents' : `${selectedAgents.length} agent${selectedAgents.length !== 1 ? 's' : ''}`}
            </div>
          </div>
        </div>

        {/* Agent Checkboxes */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Filter by Agent:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {agents.map(agent => (
              <label key={agent} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedAgents.includes(agent)}
                  onChange={() => handleAgentToggle(agent)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 truncate">{agent}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Trends Table */}
      {trendData.type === 'single' && trendData.data.periods.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">{trendData.data.agentName} - Trends</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Period</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Deals</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">GCI</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Avg Deal</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Closing Rate</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {trendData.type === 'single' && trendData.data.periods.map((period: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">{period.period}</td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      {period.dealsClosed}
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(period.totalGCI)}
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(period.avgDealValue)}
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      {period.closingRate}%
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium">
                      <span style={{ color: getTrendColor(period.growth) }}>
                        {getTrendIndicator(period.growth)} {formatPercentage(period.growth)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      {trendData.type === 'comparison' && trendData.data.combinedMetrics.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Combined Trends</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Period</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Total Deals</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Total GCI</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Avg Deal</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Avg Closing Rate</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Avg Days</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {trendData.type === 'comparison' && trendData.data.combinedMetrics.map((metric: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">{metric.period}</td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      {metric.dealsClosed}
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(metric.totalGCI)}
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(metric.avgDealValue)}
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      {metric.closingRate}%
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      {metric.daysToClose} days
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {trendData.type === 'single' && trendData.data.periods.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No trend data available for the selected period</p>
        </div>
      )}
    </div>
  );
};

export default PerformanceTrends;
