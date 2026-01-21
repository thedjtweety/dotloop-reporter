import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { DotloopRecord } from '@/lib/csvParser';
import { formatPercentage } from '@/lib/formatUtils';

interface ConversionTrendsChartProps {
  data: DotloopRecord[];
}

interface MonthlyConversionData {
  month: string;
  activeToContract: number;
  contractToClosed: number;
  closedRate: number;
}

export default function ConversionTrendsChart({ data }: ConversionTrendsChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    // Group transactions by month
    const monthlyData: { [key: string]: DotloopRecord[] } = {};

    data.forEach(record => {
      let date: Date | null = null;

      // Try to parse closing date first, then listing date
      if (record.closingDate) {
        date = new Date(record.closingDate);
      } else if (record.listingDate) {
        date = new Date(record.listingDate);
      } else if (record.contractDate) {
        date = new Date(record.contractDate);
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
    const conversionData: MonthlyConversionData[] = sortedMonths.map(month => {
      const monthTransactions = monthlyData[month];

      // Count transactions by status
      const activeListing = monthTransactions.filter(
        t => t.loopStatus?.toLowerCase().includes('active')
      ).length;

      const underContract = monthTransactions.filter(
        t => t.loopStatus?.toLowerCase().includes('contract') || t.loopStatus?.toLowerCase().includes('pending')
      ).length;

      const closed = monthTransactions.filter(
        t => t.loopStatus?.toLowerCase().includes('closed') || t.loopStatus?.toLowerCase().includes('sold')
      ).length;

      // Calculate conversion rates
      const activeToContractRate = activeListing > 0 ? (underContract / activeListing) * 100 : 0;
      const contractToClosedRate = underContract > 0 ? (closed / underContract) * 100 : 0;
      const closedRate = monthTransactions.length > 0 ? (closed / monthTransactions.length) * 100 : 0;

      // Format month for display
      const [year, monthNum] = month.split('-');
      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', {
        month: 'short',
        year: '2-digit',
      });

      return {
        month: monthName,
        activeToContract: Math.round(activeToContractRate * 100) / 100,
        contractToClosed: Math.round(contractToClosedRate * 100) / 100,
        closedRate: Math.round(closedRate * 100) / 100,
      };
    });

    return conversionData;
  }, [data]);

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

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Conversion Trends Over Time</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Monthly conversion rates showing pipeline progression from Active Listings → Under Contract → Closed
      </p>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
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
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
            }}
            formatter={(value: number) => `${value.toFixed(1)}%`}
            labelStyle={{ color: 'var(--color-foreground)' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />

          {/* Active → Contract Conversion */}
          <Line
            type="monotone"
            dataKey="activeToContract"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Active → Contract"
            isAnimationActive={true}
          />

          {/* Contract → Closed Conversion */}
          <Line
            type="monotone"
            dataKey="contractToClosed"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Contract → Closed"
            isAnimationActive={true}
          />

          {/* Overall Closed Rate */}
          <Line
            type="monotone"
            dataKey="closedRate"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', r: 4 }}
            activeDot={{ r: 6 }}
            name="Overall Closed Rate"
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <p className="text-xs text-muted-foreground mb-1">Avg Active → Contract</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {chartData.length > 0
              ? (chartData.reduce((sum, d) => sum + d.activeToContract, 0) / chartData.length).toFixed(1)
              : '0'}
            %
          </p>
        </div>

        <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
          <p className="text-xs text-muted-foreground mb-1">Avg Contract → Closed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {chartData.length > 0
              ? (chartData.reduce((sum, d) => sum + d.contractToClosed, 0) / chartData.length).toFixed(1)
              : '0'}
            %
          </p>
        </div>

        <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <p className="text-xs text-muted-foreground mb-1">Avg Closed Rate</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {chartData.length > 0
              ? (chartData.reduce((sum, d) => sum + d.closedRate, 0) / chartData.length).toFixed(1)
              : '0'}
            %
          </p>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
        <h4 className="font-semibold text-sm mb-2">Insights</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            • <strong>Active → Contract:</strong> Shows what percentage of active listings move to under contract each month
          </li>
          <li>
            • <strong>Contract → Closed:</strong> Shows what percentage of under contract deals actually close
          </li>
          <li>
            • <strong>Overall Closed Rate:</strong> Shows the percentage of all transactions that close each month
          </li>
          <li>
            • <strong>Trend Analysis:</strong> Use these trends to identify seasonal patterns and optimize your pipeline strategy
          </li>
        </ul>
      </div>
    </Card>
  );
}
