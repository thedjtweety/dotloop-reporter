import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { DotloopRecord } from '@/lib/csvParser';
import { TrendingUp, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ConversionTrendsChartProps {
  data: DotloopRecord[];
}

interface MonthlyConversionData {
  month: string;
  monthKey: string;
  activeCount: number;
  contractCount: number;
  closedCount: number;
  activeToContractRate: number;
  contractToClosedRate: number;
  overallClosedRate: number;
}

export default function ConversionTrendsChart({ data }: ConversionTrendsChartProps) {
  const [chartType, setChartType] = useState<'line' | 'area'>('line');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownMonth, setDrillDownMonth] = useState<string>('');
  const [drillDownDeals, setDrillDownDeals] = useState<{ 
    active: DotloopRecord[]; 
    contract: DotloopRecord[]; 
    closed: DotloopRecord[] 
  }>({ active: [], contract: [], closed: [] });

  // Get unique agents for filter
  const agents = useMemo(() => {
    const agentSet = new Set<string>();
    data.forEach(record => {
      if (record.agents) {
        record.agents.split(',').forEach(agent => {
          agentSet.add(agent.trim());
        });
      }
    });
    return Array.from(agentSet).sort();
  }, [data]);

  // Filter data by selected agent
  const filteredData = useMemo(() => {
    if (selectedAgent === 'all') return data;
    return data.filter(record => 
      record.agents?.split(',').some(agent => agent.trim() === selectedAgent)
    );
  }, [data, selectedAgent]);

  const chartData = useMemo(() => {
    if (filteredData.length === 0) return [];

    // Group transactions by their listing month (when they entered the pipeline)
    const monthlyData: { [key: string]: DotloopRecord[] } = {};

    filteredData.forEach(record => {
      let date: Date | null = null;

      // Use listing date as the start of the pipeline
      if (record.listingDate) {
        date = new Date(record.listingDate);
      } else if (record.contractDate) {
        date = new Date(record.contractDate);
      } else if (record.closingDate) {
        date = new Date(record.closingDate);
      }

      if (date && !isNaN(date.getTime())) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = [];
        }
        monthlyData[monthKey].push(record);
      }
    });

    // Calculate conversion rates for each month
    const sortedMonths = Object.keys(monthlyData).sort();
    const conversionData: MonthlyConversionData[] = sortedMonths.map(monthKey => {
      const monthTransactions = monthlyData[monthKey];

      // Count transactions by their CURRENT status
      // These are deals that STARTED in this month
      const activeCount = monthTransactions.filter(
        t => t.loopStatus?.toLowerCase().includes('active')
      ).length;

      const contractCount = monthTransactions.filter(
        t => t.loopStatus?.toLowerCase().includes('contract') || t.loopStatus?.toLowerCase().includes('pending')
      ).length;

      const closedCount = monthTransactions.filter(
        t => t.loopStatus?.toLowerCase().includes('closed') || t.loopStatus?.toLowerCase().includes('sold')
      ).length;

      const totalDeals = monthTransactions.length;

      // Calculate conversion rates
      // Active → Contract: of all deals that started, how many are now in contract or closed?
      const activeToContractRate = totalDeals > 0 ? ((contractCount + closedCount) / totalDeals) * 100 : 0;

      // Contract → Closed: of all deals that reached contract, how many closed?
      const contractedDeals = contractCount + closedCount;
      const contractToClosedRate = contractedDeals > 0 ? (closedCount / contractedDeals) * 100 : 0;

      // Overall Closed Rate: of all deals that started, how many closed?
      const overallClosedRate = totalDeals > 0 ? (closedCount / totalDeals) * 100 : 0;

      // Format month for display
      const [year, monthNum] = monthKey.split('-');
      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', {
        month: 'short',
        year: '2-digit',
      });

      return {
        month: monthName,
        monthKey,
        activeCount,
        contractCount,
        closedCount,
        activeToContractRate: Math.round(activeToContractRate * 100) / 100,
        contractToClosedRate: Math.round(contractToClosedRate * 100) / 100,
        overallClosedRate: Math.round(overallClosedRate * 100) / 100,
      };
    });

    return conversionData;
  }, [filteredData]);

  // Handle drill-down click
  const handleDrillDown = (monthKey: string) => {
    const monthRecords = filteredData.filter(record => {
      let date: Date | null = null;
      if (record.listingDate) {
        date = new Date(record.listingDate);
      } else if (record.contractDate) {
        date = new Date(record.contractDate);
      } else if (record.closingDate) {
        date = new Date(record.closingDate);
      }
      if (!date || isNaN(date.getTime())) return false;
      const recordMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return recordMonth === monthKey;
    });

    const active = monthRecords.filter(t => t.loopStatus?.toLowerCase().includes('active'));
    const contract = monthRecords.filter(t => 
      t.loopStatus?.toLowerCase().includes('contract') || t.loopStatus?.toLowerCase().includes('pending')
    );
    const closed = monthRecords.filter(t => 
      t.loopStatus?.toLowerCase().includes('closed') || t.loopStatus?.toLowerCase().includes('sold')
    );

    setDrillDownMonth(monthKey);
    setDrillDownDeals({ active, contract, closed });
    setDrillDownOpen(true);
  };

  if (chartData.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Conversion Trends Over Time</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No data available to display conversion trends
        </div>
      </Card>
    );
  }

  const avgActiveToContract = chartData.length > 0
    ? (chartData.reduce((sum, d) => sum + d.activeToContractRate, 0) / chartData.length).toFixed(1)
    : '0';

  const avgContractToClosed = chartData.length > 0
    ? (chartData.reduce((sum, d) => sum + d.contractToClosedRate, 0) / chartData.length).toFixed(1)
    : '0';

  const avgOverallClosed = chartData.length > 0
    ? (chartData.reduce((sum, d) => sum + d.overallClosedRate, 0) / chartData.length).toFixed(1)
    : '0';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleDrillDown(data.monthKey)}>
          <p className="font-semibold text-foreground text-sm mb-2">{data.month}</p>
          <p className="text-xs text-blue-400 mb-1">
            Active → Contract: <span className="font-bold">{data.activeToContractRate.toFixed(1)}%</span>
          </p>
          <p className="text-xs text-green-400 mb-1">
            Contract → Closed: <span className="font-bold">{data.contractToClosedRate.toFixed(1)}%</span>
          </p>
          <p className="text-xs text-amber-400">
            Overall Closed: <span className="font-bold">{data.overallClosedRate.toFixed(1)}%</span>
          </p>
          <div className="mt-2 pt-2 border-t border-border text-xs text-foreground/70">
            <p>Active: {data.activeCount} | Contract: {data.contractCount} | Closed: {data.closedCount}</p>
          </div>
          <p className="mt-2 text-xs text-primary font-medium">Click to view deals →</p>
        </div>
      );
    }
    return null;
  };

  // Format month name for display
  const getMonthName = (monthKey: string) => {
    const [year, monthNum] = monthKey.split('-');
    return new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Conversion Trends Over Time</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              chartType === 'line'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              chartType === 'area'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Area
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <p className="text-sm text-foreground/70 flex-1">
          Monthly pipeline progression showing how deals move from Active Listings → Under Contract → Closed
        </p>
        <div className="w-48">
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Filter by agent..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map(agent => (
                <SelectItem key={agent} value={agent}>{agent}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        {chartType === 'line' ? (
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
            <XAxis
              dataKey="month"
              stroke="var(--color-muted-foreground)"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="var(--color-muted-foreground)"
              label={{ value: 'Conversion Rate (%)', angle: -90, position: 'insideLeft' }}
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />

            {/* Active → Contract Conversion */}
            <Line
              type="monotone"
              dataKey="activeToContractRate"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 5, cursor: 'pointer' }}
              activeDot={{ r: 7, fill: '#3b82f6' }}
              name="Active → Contract"
              isAnimationActive={true}
            />

            {/* Contract → Closed Conversion */}
            <Line
              type="monotone"
              dataKey="contractToClosedRate"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 5, cursor: 'pointer' }}
              activeDot={{ r: 7, fill: '#10b981' }}
              name="Contract → Closed"
              isAnimationActive={true}
            />

            {/* Overall Closed Rate */}
            <Line
              type="monotone"
              dataKey="overallClosedRate"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ fill: '#f59e0b', r: 5, cursor: 'pointer' }}
              activeDot={{ r: 7, fill: '#f59e0b' }}
              name="Overall Closed Rate"
              isAnimationActive={true}
            />
          </LineChart>
        ) : (
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorContract" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
            <XAxis
              dataKey="month"
              stroke="var(--color-muted-foreground)"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="var(--color-muted-foreground)"
              label={{ value: 'Conversion Rate (%)', angle: -90, position: 'insideLeft' }}
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />

            <Area
              type="monotone"
              dataKey="activeToContractRate"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorActive)"
              name="Active → Contract"
            />
            <Area
              type="monotone"
              dataKey="contractToClosedRate"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorContract)"
              name="Contract → Closed"
            />
            <Area
              type="monotone"
              dataKey="overallClosedRate"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorClosed)"
              name="Overall Closed Rate"
            />
          </AreaChart>
        )}
      </ResponsiveContainer>

      {/* Summary Statistics */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <p className="text-xs text-foreground/70 mb-2 font-medium">Avg Active → Contract</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {avgActiveToContract}%
          </p>
          <p className="text-xs text-foreground/60 mt-2">Of deals that start active, move to contract</p>
        </div>

        <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
          <p className="text-xs text-foreground/70 mb-2 font-medium">Avg Contract → Closed</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {avgContractToClosed}%
          </p>
          <p className="text-xs text-foreground/60 mt-2">Of contracted deals that actually close</p>
        </div>

        <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <p className="text-xs text-foreground/70 mb-2 font-medium">Avg Overall Closed</p>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
            {avgOverallClosed}%
          </p>
          <p className="text-xs text-foreground/60 mt-2">Of all deals that ultimately close</p>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
        <h4 className="font-semibold text-sm mb-3">How to Read This Chart</h4>
        <ul className="text-sm text-foreground/80 space-y-2">
          <li>
            <strong className="text-blue-400">Active → Contract:</strong> Percentage of deals that move from active listings to under contract status
          </li>
          <li>
            <strong className="text-green-400">Contract → Closed:</strong> Percentage of deals that successfully close from under contract status
          </li>
          <li>
            <strong className="text-amber-400">Overall Closed:</strong> Percentage of all deals (regardless of current status) that have closed
          </li>
          <li className="mt-2 text-foreground/60">
            💡 <strong>Tip:</strong> Click on any data point or hover to view specific deals for that month. Use the agent filter to compare individual performance.
          </li>
        </ul>
      </div>

      {/* Drill-Down Modal */}
      <Dialog open={drillDownOpen} onOpenChange={setDrillDownOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conversion Details - {getMonthName(drillDownMonth)}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Active Deals */}
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                Active Listings ({drillDownDeals.active.length})
              </h4>
              <div className="space-y-2">
                {drillDownDeals.active.length > 0 ? (
                  drillDownDeals.active.map((deal, idx) => (
                    <div key={idx} className="p-3 bg-blue-500/5 rounded border border-blue-500/20">
                      <p className="font-medium">{deal.loopName}</p>
                      <p className="text-sm text-foreground/70">${deal.salePrice?.toLocaleString() || 'N/A'}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-foreground/60">No active deals</p>
                )}
              </div>
            </div>

            {/* Contract Deals */}
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                Under Contract ({drillDownDeals.contract.length})
              </h4>
              <div className="space-y-2">
                {drillDownDeals.contract.length > 0 ? (
                  drillDownDeals.contract.map((deal, idx) => (
                    <div key={idx} className="p-3 bg-green-500/5 rounded border border-green-500/20">
                      <p className="font-medium">{deal.loopName}</p>
                      <p className="text-sm text-foreground/70">${deal.salePrice?.toLocaleString() || 'N/A'}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-foreground/60">No contract deals</p>
                )}
              </div>
            </div>

            {/* Closed Deals */}
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                Closed ({drillDownDeals.closed.length})
              </h4>
              <div className="space-y-2">
                {drillDownDeals.closed.length > 0 ? (
                  drillDownDeals.closed.map((deal, idx) => (
                    <div key={idx} className="p-3 bg-amber-500/5 rounded border border-amber-500/20">
                      <p className="font-medium">{deal.loopName}</p>
                      <p className="text-sm text-foreground/70">${deal.salePrice?.toLocaleString() || 'N/A'}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-foreground/60">No closed deals</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
