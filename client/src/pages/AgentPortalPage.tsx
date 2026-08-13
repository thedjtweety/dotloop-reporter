/** Public, token-scoped portal used by a broker-issued agent link. */

import { useMemo } from 'react';
import { useLocation, useRoute } from 'wouter';
import { AlertTriangle, BarChart3, CalendarDays, LockKeyhole, LogOut, ShieldCheck, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TransactionTable from '@/components/TransactionTable';
import { calculateAgentMetrics, DotloopRecord } from '@/lib/csvParser';
import { formatCurrency } from '@/lib/formatUtils';
import { trpc } from '@/lib/trpc';

function isClosed(status: string) {
  const normalized = status.toLocaleLowerCase();
  return normalized.includes('closed') || normalized.includes('sold');
}

export default function AgentPortalPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/agent-portal/:token');
  const token = params?.token ? decodeURIComponent(params.token) : '';
  const sharedData = trpc.agentSharing.getSharedAgentData.useQuery(
    { token: token || 'x'.repeat(32) },
    { enabled: Boolean(token) },
  );

  const records = (sharedData.data?.records ?? []) as DotloopRecord[];
  const metrics = useMemo(() => {
    if (!sharedData.data?.agentName) return null;
    return calculateAgentMetrics(records).find((metric) => metric.agentName === sharedData.data?.agentName) ?? null;
  }, [records, sharedData.data?.agentName]);
  const closedCount = useMemo(() => records.filter((record) => isClosed(record.loopStatus || '')).length, [records]);

  if (!token) {
    return <PortalIssue title="Invalid link" detail="This agent analytics link is incomplete." onExit={() => setLocation('/')} />;
  }

  if (sharedData.isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <Card className="p-8 text-center"><BarChart3 className="mx-auto h-7 w-7 animate-pulse text-primary" /><p className="mt-3 text-sm text-muted-foreground">Opening your private analytics…</p></Card>
      </div>
    );
  }

  if (sharedData.isError || !sharedData.data) {
    return (
      <PortalIssue
        title="This analytics link is unavailable"
        detail={sharedData.error?.message || 'The link may be expired or revoked. Ask your broker for a new link.'}
        onExit={() => setLocation('/')}
      />
    );
  }

  const cards = [
    { label: 'My Transactions', value: records.length.toLocaleString(), color: 'text-foreground' },
    { label: 'Closed Deals', value: closedCount.toLocaleString(), color: 'text-emerald-500' },
    { label: 'My GCI', value: formatCurrency(metrics?.totalCommission ?? 0), color: 'text-primary' },
    { label: 'Sales Volume', value: formatCurrency(metrics?.totalSalesVolume ?? 0), color: 'text-blue-500' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><BarChart3 className="h-5 w-5" /></div>
            <div>
              <p className="font-semibold">My Real Estate Analytics</p>
              <p className="text-xs text-muted-foreground">Shared by your brokerage · {sharedData.data.datasetName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <LockKeyhole className="h-3.5 w-3.5 text-emerald-500" /> Private agent view
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-6">
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">Welcome back</p>
              <h1 className="mt-1 text-3xl font-bold">{sharedData.data.agentName}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                This portal contains only the transactions your broker assigned to you. It does not display brokerage-wide or other-agent data.
              </p>
            </div>
            {sharedData.data.expiresAt && <div className="flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> Link expires {new Date(sharedData.data.expiresAt).toLocaleDateString()}</div>}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.label} className="p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{card.label}</p>
              <p className={`mt-2 text-2xl font-bold ${card.color}`}>{card.value}</p>
            </Card>
          ))}
        </section>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <div><h2 className="font-semibold">My transactions</h2><p className="text-xs text-muted-foreground">Search, sort, and track your assigned pipeline.</p></div>
          </div>
          {records.length ? <TransactionTable transactions={records} agentScopedReadOnly /> : <p className="py-10 text-center text-sm text-muted-foreground">No transactions have been assigned to this agent in the shared upload.</p>}
        </Card>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> This view is restricted to the agent named in the broker-issued link.</p>
      </main>
    </div>
  );
}

function PortalIssue({ title, detail, onExit }: { title: string; detail: string; onExit: () => void }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <Card className="max-w-lg p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"><AlertTriangle className="h-6 w-6" /></div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{detail}</p>
        <Button variant="outline" onClick={onExit}><LogOut className="mr-2 h-4 w-4" /> Exit</Button>
      </Card>
    </div>
  );
}
