import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Map as MapIcon, Layout, Users, Activity, TrendingUp, DollarSign, Home as HomeIcon } from 'lucide-react';
import { DotloopRecord, DashboardMetrics, AgentMetrics, calculateMetrics, calculateAgentMetrics } from '@/lib/csvParser';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { MapView } from '@/components/Map';
import { formatCurrency, formatNumber } from '@/lib/formatUtils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- Performance Matrix Component ---
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell } from 'recharts';

const PerformanceMatrix = ({ agents }: { agents: AgentMetrics[] }) => {
  // Filter out agents with 0 volume or 0 days to close to keep chart clean
  const data = agents
    .filter(a => a.totalSalesVolume > 0 && a.averageDaysToClose > 0)
    .map(a => ({
      name: a.agentName,
      x: a.averageDaysToClose,
      y: a.totalSalesVolume,
      z: a.totalTransactions, // Bubble size
    }));

  return (
    <div className="h-[600px] w-full rounded-xl bg-card border border-border p-6 shadow-sm">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h3 className="text-xl font-display font-bold">Consultant Efficiency Matrix</h3>
          <p className="text-muted-foreground">Comparing Deal Velocity (Speed) vs. Total Volume</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span>High Volume, Fast</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>High Volume, Slow</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Days to Close" 
            unit=" days" 
            label={{ value: 'Avg Days to Close (Lower is Faster)', position: 'bottom', offset: 0 }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Volume" 
            unit="$" 
            tickFormatter={(value) => `$${value / 1000}k`}
            label={{ value: 'Total Volume', angle: -90, position: 'left' }}
          />
          <ZAxis type="number" dataKey="z" range={[50, 400]} name="Transactions" />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-popover border border-border p-3 rounded shadow-lg">
                    <p className="font-bold mb-1">{data.name}</p>
                    <p className="text-sm text-muted-foreground">Volume: {formatCurrency(data.y)}</p>
                    <p className="text-sm text-muted-foreground">Speed: {data.x} days</p>
                    <p className="text-sm text-muted-foreground">Deals: {data.z}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter name="Consultants" data={data} fill="#8884d8">
            {data.map((entry, index) => {
              // Color logic: 
              // Fast (< 30 days) = Green
              // Slow (> 60 days) = Red
              // High Volume (> $1M) = Gold
              let color = '#3b82f6'; // Default Blue
              if (entry.x < 30) color = '#10b981'; // Fast (Green)
              else if (entry.x > 60) color = '#f59e0b'; // Slow (Amber)
              
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- Kanban View Component ---
const KanbanBoard = ({ records }: { records: DotloopRecord[] }) => {
  const columns = [
    { id: 'active', title: 'Active Listings', color: 'bg-blue-500/10 border-blue-500/20 text-blue-500' },
    { id: 'contract', title: 'Under Contract', color: 'bg-amber-500/10 border-amber-500/20 text-amber-500' },
    { id: 'closed', title: 'Closed Deals', color: 'bg-green-500/10 border-green-500/20 text-green-500' },
  ];

  const getColumnRecords = (statusId: string) => {
    return records.filter(r => {
      const status = (r.loopStatus || '').toLowerCase();
      if (statusId === 'active') return status.includes('active');
      if (statusId === 'contract') return status.includes('contract') || status.includes('pending');
      if (statusId === 'closed') return status.includes('closed') || status.includes('sold');
      return false;
    }).slice(0, 10); // Limit for display
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
      {columns.map(col => (
        <div key={col.id} className={`rounded-xl border ${col.color.split(' ')[1]} bg-card/50 flex flex-col h-full`}>
          <div className={`p-4 border-b ${col.color.split(' ')[1]} ${col.color.split(' ')[0]}`}>
            <h3 className={`font-display font-bold ${col.color.split(' ')[2]}`}>{col.title}</h3>
            <span className="text-xs opacity-70">{getColumnRecords(col.id).length} recent items</span>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {getColumnRecords(col.id).map((record, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-[10px]">{record.propertyType || 'Residential'}</Badge>
                      <span className="text-xs font-mono text-muted-foreground">{record.closingDate || record.listingDate}</span>
                    </div>
                    <h4 className="font-semibold text-sm line-clamp-1 mb-1">{record.address}</h4>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{record.agents.split(',')[0]}</span>
                      <span className="font-medium text-foreground">{formatCurrency(record.price)}</span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
};

// --- Agent Cards Component ---
const AgentCards = ({ agents }: { agents: AgentMetrics[] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {agents.slice(0, 12).map((agent, i) => (
        <motion.div
          key={agent.agentName}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="w-16 h-16 border-4 border-background shadow-lg">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {agent.agentName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-display font-bold text-lg leading-tight">{agent.agentName}</h3>
                  <Badge variant="secondary" className="mt-1">Rank #{i + 1}</Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 py-4 border-t border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Efficiency</p>
                  <p className={`font-bold text-lg ${agent.averageDaysToClose < 30 ? 'text-emerald-500' : 'text-foreground'}`}>
                    {agent.averageDaysToClose} days
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Deals</p>
                  <p className="font-bold text-lg">{agent.totalTransactions}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Volume</p>
                  <p className="font-medium">{formatCurrency(agent.totalSalesVolume)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Deal</p>
                  <p className="font-medium">{formatCurrency(agent.averageSalesPrice)}</p>
                </div>
              </div>
            </div>
            <div className="bg-muted/30 p-3 text-center text-xs font-medium text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-colors">
              View Full Profile →
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

// --- Activity Heatmap Component ---
const ActivityTimeline = ({ records }: { records: DotloopRecord[] }) => {
  // Group by month
  const monthlyData = records.reduce((acc, record) => {
    const date = new Date(record.closingDate || record.listingDate);
    if (!isNaN(date.getTime())) {
      const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!acc[key]) acc[key] = { count: 0, volume: 0 };
      acc[key].count++;
      acc[key].volume += record.price || 0;
    }
    return acc;
  }, {} as Record<string, { count: number, volume: number }>);

  const sortedMonths = Object.entries(monthlyData).sort((a, b) => {
    // Simple sort assuming 'MMM YY' format
    return new Date(`01 ${a[0]}`).getTime() - new Date(`01 ${b[0]}`).getTime();
  });

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <h3 className="text-lg font-display font-bold mb-2">Peak Performance</h3>
          <div className="text-4xl font-bold text-primary mb-1">
            {sortedMonths.reduce((max, curr) => curr[1].count > max.count ? curr[1] : max, { count: 0 }).count} Deals
          </div>
          <p className="text-muted-foreground">Best month on record</p>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
          <h3 className="text-lg font-display font-bold mb-2">Total Volume</h3>
          <div className="text-4xl font-bold text-accent mb-1">
            {formatCurrency(records.reduce((sum, r) => sum + (r.price || 0), 0))}
          </div>
          <p className="text-muted-foreground">Cumulative sales volume</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-display font-bold mb-6">Monthly Transaction Velocity</h3>
        <div className="relative h-64 flex items-end gap-2">
          {sortedMonths.map(([month, data], i) => {
            const maxCount = Math.max(...sortedMonths.map(m => m[1].count));
            const height = (data.count / maxCount) * 100;
            
            return (
              <div key={month} className="flex-1 flex flex-col items-center group relative">
                <div 
                  className="w-full bg-primary/20 rounded-t-sm group-hover:bg-primary transition-colors relative"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs py-1 px-2 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {data.count} deals<br/>{formatCurrency(data.volume)}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground mt-2 rotate-45 origin-left translate-y-2">{month}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default function CreativeDashboard() {
  const [location, setLocation] = useLocation();
  const [records, setRecords] = useState<DotloopRecord[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics[]>([]);
  const [activeTab, setActiveTab] = useState('map');

  useEffect(() => {
    // Load data from localStorage (passed from Home)
    const storedData = localStorage.getItem('creative_dashboard_data');
    if (storedData) {
      try {
        const parsedRecords = JSON.parse(storedData);
        setRecords(parsedRecords);
        setMetrics(calculateMetrics(parsedRecords));
        setAgentMetrics(calculateAgentMetrics(parsedRecords));
      } catch (e) {
        console.error('Failed to load data', e);
      }
    } else {
      // Redirect back if no data
      setLocation('/');
    }
  }, [setLocation]);

  if (!metrics) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Consultant Performance Hub
            </h1>
            <p className="text-muted-foreground">
              Visualizing {metrics.totalTransactions} transactions across your market
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation('/')}>
            Switch to Standard Report
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4 mx-auto bg-muted/50 p-1 rounded-full">
          <TabsTrigger value="performance" className="rounded-full data-[state=active]:bg-background">
            <TrendingUp className="w-4 h-4 mr-2" /> Performance
          </TabsTrigger>
          <TabsTrigger value="kanban" className="rounded-full data-[state=active]:bg-background">
            <Layout className="w-4 h-4 mr-2" /> Pipeline
          </TabsTrigger>
          <TabsTrigger value="consultants" className="rounded-full data-[state=active]:bg-background">
            <Users className="w-4 h-4 mr-2" /> Consultants
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-full data-[state=active]:bg-background">
            <Activity className="w-4 h-4 mr-2" /> Activity
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 gap-6">
          <TabsContent value="performance" className="mt-0">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <PerformanceMatrix agents={agentMetrics} />
            </motion.div>
          </TabsContent>

          <TabsContent value="kanban" className="mt-0">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <KanbanBoard records={records} />
            </motion.div>
          </TabsContent>

          <TabsContent value="consultants" className="mt-0">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <AgentCards agents={agentMetrics} />
            </motion.div>
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <ActivityTimeline records={records} />
            </motion.div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
