/**
 * Commission Variance Report Component
 * Displays comparison between CSV-provided and calculated commissions
 */

import React, { useState, useMemo } from 'react';
import { DotloopRecord } from '@/lib/csvParser';
import {
  calculateCommissionVariance,
  filterVarianceByAgent,
  filterVarianceByCategory,
  sortVarianceByAmount,
  sortVarianceByPercentage,
  getVarianceByAgent,
  exportVarianceAsCSV,
  CommissionVarianceItem,
  CommissionVarianceSummary,
} from '@/lib/commissionVariance';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Download, TrendingDown, TrendingUp, CheckCircle } from 'lucide-react';

interface CommissionVarianceReportProps {
  records: DotloopRecord[];
}

export default function CommissionVarianceReport({ records }: CommissionVarianceReportProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'exact' | 'minor' | 'major'>('all');
  const [sortBy, setSortBy] = useState<'amount' | 'percentage'>('amount');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate variance
  const { items: allItems, summary } = useMemo(() => calculateCommissionVariance(records), [records]);

  // Get unique agents
  const uniqueAgents = useMemo(
    () => Array.from(new Set(allItems.map((v) => v.agentName))).sort(),
    [allItems]
  );

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let filtered = [...allItems];

    // Filter by agent
    if (selectedAgent !== 'all') {
      filtered = filterVarianceByAgent(filtered, selectedAgent);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filterVarianceByCategory(filtered, selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (v) =>
          v.loopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.agentName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'amount') {
      filtered = sortVarianceByAmount(filtered);
    } else {
      filtered = sortVarianceByPercentage(filtered);
    }

    return filtered;
  }, [allItems, selectedAgent, selectedCategory, searchTerm, sortBy]);

  // Get agent variance stats
  const agentStats = useMemo(() => getVarianceByAgent(allItems), [allItems]);

  // Export function
  const handleExport = () => {
    const csv = exportVarianceAsCSV(filteredItems, summary);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commission-variance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getVarianceBadgeColor = (category: 'exact' | 'minor' | 'major') => {
    switch (category) {
      case 'exact':
        return 'bg-green-100 text-green-800';
      case 'minor':
        return 'bg-yellow-100 text-yellow-800';
      case 'major':
        return 'bg-red-100 text-red-800';
    }
  };

  const getVarianceIcon = (category: 'exact' | 'minor' | 'major') => {
    switch (category) {
      case 'exact':
        return <CheckCircle className="w-4 h-4" />;
      case 'minor':
        return <TrendingDown className="w-4 h-4" />;
      case 'major':
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground font-medium">Total Items</div>
          <div className="text-2xl font-bold text-foreground mt-1">{summary.totalItems}</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-muted-foreground font-medium">Exact Matches</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{summary.exactMatches}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {summary.totalItems > 0 ? ((summary.exactMatches / summary.totalItems) * 100).toFixed(1) : 0}%
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-muted-foreground font-medium">Minor Variance</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{summary.minorVariances}</div>
          <div className="text-xs text-muted-foreground mt-1">&lt; 5%</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-muted-foreground font-medium">Major Variance</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{summary.majorVariances}</div>
          <div className="text-xs text-muted-foreground mt-1">&ge; 5%</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-muted-foreground font-medium">Overall Variance</div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {summary.overallVariancePercentage.toFixed(2)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            ${summary.totalVarianceAmount.toFixed(2)}
          </div>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Search</label>
            <Input
              placeholder="Search by loop name or agent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">All Agents</option>
              {uniqueAgents.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Variance Type</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">All Types</option>
              <option value="exact">Exact Matches</option>
              <option value="minor">Minor (&lt; 5%)</option>
              <option value="major">Major (≥ 5%)</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="amount">Variance Amount</option>
              <option value="percentage">Variance Percentage</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </Card>

      {/* Agent Summary */}
      {agentStats.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Agent Variance Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-2 px-4 font-semibold text-foreground">Agent Name</th>
                  <th className="text-right py-2 px-4 font-semibold text-foreground">Transactions</th>
                  <th className="text-right py-2 px-4 font-semibold text-foreground">Total Variance</th>
                  <th className="text-right py-2 px-4 font-semibold text-foreground">Avg Variance %</th>
                  <th className="text-right py-2 px-4 font-semibold text-foreground">Major Issues</th>
                </tr>
              </thead>
              <tbody>
                {agentStats.map((stat) => (
                  <tr key={stat.agentName} className="border-b hover:bg-muted/50 last:border-b-0">
                    <td className="py-2 px-4 text-foreground font-medium">{stat.agentName}</td>
                    <td className="text-right py-2 px-4 text-foreground">{stat.itemCount}</td>
                    <td className="text-right py-2 px-4 text-foreground">
                      ${stat.totalVariance.toFixed(2)}
                    </td>
                    <td className="text-right py-2 px-4 text-foreground">
                      {stat.averageVariancePercentage.toFixed(2)}%
                    </td>
                    <td className="text-right py-2 px-4">
                      {stat.majorVarianceCount > 0 ? (
                        <Badge variant="destructive">{stat.majorVarianceCount}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Variance Details Table */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Variance Details ({filteredItems.length} items)
        </h3>
        {filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-2 px-4 font-semibold text-foreground">Loop Name</th>
                  <th className="text-left py-2 px-4 font-semibold text-foreground">Agent</th>
                  <th className="text-left py-2 px-4 font-semibold text-foreground">Closing Date</th>
                  <th className="text-right py-2 px-4 font-semibold text-foreground">CSV $</th>
                  <th className="text-right py-2 px-4 font-semibold text-foreground">Calculated $</th>
                  <th className="text-right py-2 px-4 font-semibold text-foreground">Variance $</th>
                  <th className="text-right py-2 px-4 font-semibold text-foreground">Variance %</th>
                  <th className="text-center py-2 px-4 font-semibold text-foreground">Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.recordId} className="border-b hover:bg-muted/50 last:border-b-0">
                    <td className="py-2 px-4 text-foreground">{item.loopName}</td>
                    <td className="py-2 px-4 text-foreground">{item.agentName}</td>
                    <td className="py-2 px-4 text-foreground">
                      {new Date(item.closingDate).toLocaleDateString()}
                    </td>
                    <td className="text-right py-2 px-4 text-foreground">
                      ${item.csvCompanyDollar.toFixed(2)}
                    </td>
                    <td className="text-right py-2 px-4 text-foreground">
                      ${item.calculatedCompanyDollar.toFixed(2)}
                    </td>
                    <td className="text-right py-2 px-4 text-foreground">
                      ${item.varianceAmount.toFixed(2)}
                    </td>
                    <td className="text-right py-2 px-4 text-foreground">
                      {item.variancePercentage.toFixed(2)}%
                    </td>
                    <td className="text-center py-2 px-4">
                      <Badge className={`flex items-center gap-1 justify-center ${getVarianceBadgeColor(item.varianceCategory)}`}>
                        {getVarianceIcon(item.varianceCategory)}
                        <span className="capitalize">{item.varianceCategory}</span>
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No variance items found matching your filters.
          </div>
        )}
      </Card>
    </div>
  );
}
