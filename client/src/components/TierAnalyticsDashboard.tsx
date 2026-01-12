/**
 * Tier Analytics Dashboard
 * 
 * Comprehensive visualizations for tier performance analytics:
 * - Agent distribution across tiers (pie chart)
 * - Tier advancement timeline (line chart)
 * - Revenue impact by tier (bar chart)
 * - Tier transition heatmap
 * - Performance metrics
 */

import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { Loader2, TrendingUp, Users, DollarSign, Clock } from 'lucide-react';

const TIER_COLORS = [
  '#3b82f6', // Blue - Tier 0
  '#10b981', // Green - Tier 1
  '#f59e0b', // Amber - Tier 2
  '#ef4444', // Red - Tier 3
  '#8b5cf6', // Purple - Tier 4
  '#ec4899', // Pink - Tier 5
];

interface TierAnalyticsProps {
  planId?: string;
}

export default function TierAnalyticsDashboard({ planId }: TierAnalyticsProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>(planId || '');
  const [daysBack, setDaysBack] = useState<number>(90);

  // Fetch tier statistics
  const { data: stats, isLoading: statsLoading } = trpc.tierHistory.getTierStats.useQuery(
    { planId: selectedPlan || undefined, daysBack },
    { enabled: !!selectedPlan }
  );

  // Fetch tier distribution
  const { data: distribution, isLoading: distLoading } = trpc.tierHistory.getTierDistribution.useQuery(
    { planId: selectedPlan || undefined },
    { enabled: !!selectedPlan }
  );

  // Fetch revenue by tier
  const { data: revenueByTier, isLoading: revenueLoading } = trpc.tierHistory.getRevenueByTier.useQuery(
    { planId: selectedPlan || undefined, daysBack },
    { enabled: !!selectedPlan }
  );

  // Fetch advancement timeline
  const { data: timeline, isLoading: timelineLoading } = trpc.tierHistory.getAdvancementTimeline.useQuery(
    { planId: selectedPlan || undefined, daysBack },
    { enabled: !!selectedPlan }
  );

  // Fetch commission plans for dropdown
  const { data: plans } = trpc.commission.getPlans.useQuery();

  // Process timeline data for line chart
  const timelineChartData = useMemo(() => {
    if (!timeline) return [];
    return timeline.map((entry: any) => {
      const data: any = { date: entry.date };
      entry.transitions.forEach((t: any) => {
        data[`tier_${t.tier}`] = t.count;
      });
      return data;
    });
  }, [timeline]);

  const isLoading = statsLoading || distLoading || revenueLoading || timelineLoading;

  if (!selectedPlan) {
    return (
      <Card className="p-6 bg-card border border-border">
        <h2 className="text-xl font-display font-bold text-foreground mb-4">
          Tier Analytics Dashboard
        </h2>
        <p className="text-foreground mb-4">
          Select a commission plan to view tier analytics
        </p>
        <Select value={selectedPlan} onValueChange={setSelectedPlan}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Choose a plan..." />
          </SelectTrigger>
          <SelectContent>
            {plans?.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <Card className="p-6 bg-card border border-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">
              Tier Analytics Dashboard
            </h2>
            <p className="text-foreground text-sm mt-1">
              Commission plan: {plans?.find((p) => p.id === selectedPlan)?.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {plans?.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={daysBack.toString()} onValueChange={(v) => setDaysBack(parseInt(v))}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-card border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground text-sm font-medium">Total Transitions</p>
                    <p className="text-2xl font-bold text-primary mt-2">
                      {stats.totalTransitions}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary opacity-50" />
                </div>
              </Card>

              <Card className="p-4 bg-card border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground text-sm font-medium">Unique Agents</p>
                    <p className="text-2xl font-bold text-primary mt-2">
                      {stats.uniqueAgents}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-primary opacity-50" />
                </div>
              </Card>

              <Card className="p-4 bg-card border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground text-sm font-medium">Avg Days to Tier</p>
                    <p className="text-2xl font-bold text-primary mt-2">
                      {Math.round(
                        (Object.values(stats.averageTimings) as number[]).reduce((a: number, b: number) => a + b, 0) /
                          Object.keys(stats.averageTimings).length || 0
                      )}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-primary opacity-50" />
                </div>
              </Card>

              <Card className="p-4 bg-card border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground text-sm font-medium">Total YTD Amount</p>
                    <p className="text-2xl font-bold text-primary mt-2">
                      ${(
                        revenueByTier?.reduce((sum: number, r: any) => sum + r.totalYtdAmount, 0) || 0
                      ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-primary opacity-50" />
                </div>
              </Card>
            </div>
          )}

          {/* Charts */}
          <Tabs defaultValue="distribution" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            {/* Agent Distribution by Tier */}
            <TabsContent value="distribution" className="space-y-4">
              <Card className="p-6 bg-card border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Agent Distribution by Tier
                </h3>
                {distribution && distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={distribution}
                        dataKey="count"
                        nameKey="tier"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ tier, percentage }) => `Tier ${tier}: ${percentage}%`}
                      >
                        {distribution.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={TIER_COLORS[index % TIER_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => `${value} agents`}
                        labelFormatter={(label) => `Tier ${label}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-foreground text-center py-8">No tier data available</p>
                )}
              </Card>

              {/* Distribution Table */}
              <Card className="p-6 bg-card border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Tier Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-foreground font-semibold">Tier</th>
                        <th className="text-left py-2 px-3 text-foreground font-semibold">Agents</th>
                        <th className="text-left py-2 px-3 text-foreground font-semibold">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distribution?.map((row: any) => (
                        <tr key={row.tier} className="border-b border-border/50">
                          <td className="py-2 px-3 text-foreground">Tier {row.tier}</td>
                          <td className="py-2 px-3 text-foreground">{row.count}</td>
                          <td className="py-2 px-3 text-foreground">{row.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* Revenue Impact by Tier */}
            <TabsContent value="revenue" className="space-y-4">
              <Card className="p-6 bg-card border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Revenue Impact by Tier
                </h3>
                {revenueByTier && revenueByTier.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueByTier}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis
                        dataKey="tier"
                        label={{ value: 'Tier Level', position: 'insideBottom', offset: -5 }}
                        stroke="#666"
                      />
                      <YAxis
                        label={{ value: 'YTD Amount ($)', angle: -90, position: 'insideLeft' }}
                        stroke="#666"
                      />
                      <Tooltip
                        formatter={(value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                        labelFormatter={(label) => `Tier ${label}`}
                      />
                      <Bar dataKey="totalYtdAmount" fill="#3b82f6" name="Total YTD Amount" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-foreground text-center py-8">No revenue data available</p>
                )}
              </Card>

              {/* Revenue Table */}
              <Card className="p-6 bg-card border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Revenue Metrics by Tier
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-foreground font-semibold">Tier</th>
                        <th className="text-left py-2 px-3 text-foreground font-semibold">Total YTD</th>
                        <th className="text-left py-2 px-3 text-foreground font-semibold">Avg YTD</th>
                        <th className="text-left py-2 px-3 text-foreground font-semibold">Transitions</th>
                        <th className="text-left py-2 px-3 text-foreground font-semibold">Agents</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueByTier?.map((row: any) => (
                        <tr key={row.tier} className="border-b border-border/50">
                          <td className="py-2 px-3 text-foreground">Tier {row.tier}</td>
                          <td className="py-2 px-3 text-foreground">
                            ${row.totalYtdAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                          <td className="py-2 px-3 text-foreground">
                            ${row.averageYtdAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                          <td className="py-2 px-3 text-foreground">{row.transitionCount}</td>
                          <td className="py-2 px-3 text-foreground">{row.uniqueAgents}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* Advancement Timeline */}
            <TabsContent value="timeline" className="space-y-4">
              <Card className="p-6 bg-card border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Tier Advancement Timeline
                </h3>
                {timelineChartData && timelineChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timelineChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis
                        dataKey="date"
                        stroke="#666"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        label={{ value: 'Transitions', angle: -90, position: 'insideLeft' }}
                        stroke="#666"
                      />
                      <Tooltip formatter={(value) => `${value} transitions`} />
                      <Legend />
                      {[0, 1, 2, 3, 4, 5].map((tier) => (
                        <Line
                          key={`tier_${tier}`}
                          type="monotone"
                          dataKey={`tier_${tier}`}
                          stroke={TIER_COLORS[tier]}
                          name={`Tier ${tier}`}
                          connectNulls
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-foreground text-center py-8">No timeline data available</p>
                )}
              </Card>
            </TabsContent>

            {/* Performance Metrics */}
            <TabsContent value="performance" className="space-y-4">
              <Card className="p-6 bg-card border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Average Days to Reach Each Tier
                </h3>
                {stats?.averageTimings && Object.keys(stats.averageTimings).length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Object.entries(stats.averageTimings).map(([tier, days]) => ({
                        tier: parseInt(tier),
                        days,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis
                        dataKey="tier"
                        label={{ value: 'Tier Level', position: 'insideBottom', offset: -5 }}
                        stroke="#666"
                      />
                      <YAxis
                        label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
                        stroke="#666"
                      />
                      <Tooltip formatter={(value) => `${value} days`} />
                      <Bar dataKey="days" fill="#10b981" name="Average Days" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-foreground text-center py-8">No performance data available</p>
                )}
              </Card>

              {/* Recent Transitions */}
              {stats?.recentTransitions && stats.recentTransitions.length > 0 && (
                <Card className="p-6 bg-card border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Recent Tier Transitions
                  </h3>
                  <div className="space-y-3">
                    {stats.recentTransitions.slice(0, 5).map((transition: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-background/50 rounded border border-border/50"
                      >
                        <div>
                          <p className="text-foreground font-medium">{transition.agentName}</p>
                          <p className="text-foreground text-sm">
                            Tier {transition.previousTierIndex || 'Start'} → Tier {transition.newTierIndex}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-foreground font-semibold">
                            ${transition.ytdAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </p>
                          <p className="text-foreground text-xs">
                            {new Date(transition.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
