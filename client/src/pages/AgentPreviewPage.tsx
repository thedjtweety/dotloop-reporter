/**
 * Broker-facing Agent Preview & Sharing Center.
 * Preview uses in-memory CSV/demo data. Publishing creates a durable, broker-owned
 * dataset; individual high-entropy share links expose only one named agent's rows.
 */

import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Copy, Database, ExternalLink, Eye, Link2, RefreshCcw, ShieldCheck, UploadCloud, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AgentDetailsPanel from '@/components/AgentDetailsPanel';
import { useTransactionData } from '@/contexts/TransactionDataContext';
import { calculateAgentMetrics, DotloopRecord } from '@/lib/csvParser';
import { trpc } from '@/lib/trpc';

const OWNER_SESSION_KEY = 'dotloop_agent_sharing_owner_session_v1';

type OwnerSession = {
  datasetId: string;
  ownerSecret: string;
  fileName: string;
  recordCount: number;
  fingerprint: string;
};

function getAgentNames(records: DotloopRecord[]) {
  const names = new Set<string>();
  records.forEach((record) => {
    (record.agents || '').split(',').forEach((name) => {
      const normalized = name.trim();
      if (normalized) names.add(normalized);
    });
  });
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

function onlyThisAgent(records: DotloopRecord[], agentName: string) {
  const normalized = agentName.trim().toLocaleLowerCase();
  return records.filter((record) =>
    (record.agents || '')
      .split(',')
      .map((name) => name.trim().toLocaleLowerCase())
      .includes(normalized),
  );
}

function buildFingerprint(records: DotloopRecord[]) {
  const first = records[0];
  const last = records[records.length - 1];
  return [
    records.length,
    first?.loopId ?? first?.loopName ?? '',
    last?.loopId ?? last?.loopName ?? '',
  ].join(':');
}

function readOwnerSession(): OwnerSession | null {
  try {
    const value = window.localStorage.getItem(OWNER_SESSION_KEY);
    return value ? JSON.parse(value) as OwnerSession : null;
  } catch {
    return null;
  }
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const input = document.createElement('textarea');
    input.value = value;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }
}

export default function AgentPreviewPage() {
  const [, setLocation] = useLocation();
  const { allRecords, agentMetrics, activeDataSetName, hasData, activateDemoMode } = useTransactionData();
  const agentNames = useMemo(() => getAgentNames(allRecords), [allRecords]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [ownerSession, setOwnerSession] = useState<OwnerSession | null>(() =>
    typeof window === 'undefined' ? null : readOwnerSession(),
  );
  const [generatedLink, setGeneratedLink] = useState<{ agentName: string; url: string; expiresAt: string } | null>(null);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const utils = trpc.useUtils();

  const fingerprint = useMemo(() => buildFingerprint(allRecords), [allRecords]);
  const currentOwnerSession = ownerSession?.fingerprint === fingerprint ? ownerSession : null;
  const selectedTransactions = useMemo(
    () => onlyThisAgent(allRecords, selectedAgent),
    [allRecords, selectedAgent],
  );
  const selectedMetrics = useMemo(
    () => agentMetrics.find((metric) => metric.agentName === selectedAgent)
      ?? calculateAgentMetrics(selectedTransactions).find((metric) => metric.agentName === selectedAgent),
    [agentMetrics, selectedAgent, selectedTransactions],
  );

  useEffect(() => {
    if (!selectedAgent || !agentNames.includes(selectedAgent)) {
      setSelectedAgent(agentNames[0] ?? '');
    }
  }, [agentNames, selectedAgent]);

  const publishDataset = trpc.agentSharing.publishDataset.useMutation({
    onSuccess: (result) => {
      const session: OwnerSession = {
        ...result,
        fileName: activeDataSetName || 'Broker CSV upload',
        fingerprint,
      };
      window.localStorage.setItem(OWNER_SESSION_KEY, JSON.stringify(session));
      setOwnerSession(session);
      toast.success('Current data is ready for private agent links.');
    },
    onError: (error) => toast.error(error.message || 'Unable to prepare this dataset for sharing.'),
  });

  const ownerLinks = trpc.agentSharing.listOwnerLinks.useQuery(
    ownerSession
      ? { datasetId: ownerSession.datasetId, ownerSecret: ownerSession.ownerSecret }
      : { datasetId: '00000000-0000-0000-0000-000000000000', ownerSecret: 'x'.repeat(32) },
    { enabled: Boolean(ownerSession) },
  );

  const createLink = trpc.agentSharing.createAgentLink.useMutation({
    onSuccess: async (result) => {
      const url = `${window.location.origin}/agent-portal/${encodeURIComponent(result.token)}`;
      setGeneratedLink({ agentName: result.agentName, url, expiresAt: result.expiresAt });
      await utils.agentSharing.listOwnerLinks.invalidate();
      toast.success(`Private link created for ${result.agentName}.`);
    },
    onError: (error) => toast.error(error.message || 'Unable to create a private agent link.'),
  });

  const revokeLink = trpc.agentSharing.revokeAgentLink.useMutation({
    onSuccess: async () => {
      await utils.agentSharing.listOwnerLinks.invalidate();
      toast.success('Agent link revoked immediately.');
    },
    onError: (error) => toast.error(error.message || 'Unable to revoke this link.'),
  });

  const revokeDataset = trpc.agentSharing.revokeDataset.useMutation({
    onSuccess: () => {
      window.localStorage.removeItem(OWNER_SESSION_KEY);
      setOwnerSession(null);
      setGeneratedLink(null);
      toast.success('All agent links for this dataset have been revoked.');
    },
    onError: (error) => toast.error(error.message || 'Unable to revoke this dataset.'),
  });

  const handlePublish = () => {
    if (!hasData || allRecords.length === 0) {
      toast.error('Upload a CSV or load demo data before creating agent links.');
      return;
    }
    if (agentNames.length === 0) {
      toast.error('This CSV has no populated Agent field. Add agent names before creating agent-specific links.');
      return;
    }
    publishDataset.mutate({ fileName: activeDataSetName || 'Broker CSV upload', records: allRecords });
  };

  const handleCreateLink = () => {
    if (!currentOwnerSession || !selectedAgent) {
      toast.error('Prepare the current dataset and select an agent first.');
      return;
    }
    createLink.mutate({
      datasetId: currentOwnerSession.datasetId,
      ownerSecret: currentOwnerSession.ownerSecret,
      agentName: selectedAgent,
      expiresInDays,
    });
  };

  if (!hasData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <Card className="max-w-xl p-8 text-center space-y-5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Preview as an Agent</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              First, load a broker CSV so this preview can show an agent only the transactions assigned to them.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setLocation('/')}>Back to Dashboard</Button>
            <Button onClick={activateDemoMode}>Load Demo Data</Button>
          </div>
          {ownerSession && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-left space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Existing sharing session</div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Your browser still holds the owner credential for <strong>{ownerSession.fileName}</strong>. You can revoke its links now, even after clearing or replacing the local dashboard data.
              </p>
              <p className="text-xs text-muted-foreground">{ownerLinks.data?.links.length ?? 0} issued link(s) found.</p>
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
                disabled={revokeDataset.isPending}
                onClick={() => revokeDataset.mutate({ datasetId: ownerSession.datasetId, ownerSecret: ownerSession.ownerSecret })}
              >
                <RefreshCcw className="mr-2 h-4 w-4" /> Revoke all existing links
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold leading-tight">Agent Preview & Sharing</p>
              <p className="text-xs text-muted-foreground">Broker control center · {activeDataSetName || 'Current dataset'}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation('/')}>Back to Broker Dashboard</Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <Card className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><Eye className="h-4 w-4" /></div>
              <div>
                <h1 className="font-semibold">Preview one agent</h1>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  This is the exact data boundary agents receive: only rows whose Agent field includes their name.
                </p>
              </div>
            </div>
            <label className="block text-sm font-medium" htmlFor="agent-preview-selector">Agent</label>
            <select
              id="agent-preview-selector"
              value={selectedAgent}
              onChange={(event) => setSelectedAgent(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {agentNames.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
            <div className="rounded-md border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-emerald-500" />
              Agent preview never includes other agents’ rows, brokerage-wide reports, commission plans, or admin tools.
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Private sharing</h2>
            </div>
            {!currentOwnerSession ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Prepare this exact upload to create revocable, agent-specific links that work on an agent’s own device.
                </p>
                {ownerSession && (
                  <p className="rounded-md bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                    The currently loaded dataset differs from the one previously prepared. Create a new sharing session for this upload.
                  </p>
                )}
                <Button className="w-full" onClick={handlePublish} disabled={publishDataset.isPending}>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  {publishDataset.isPending ? 'Preparing secure dataset…' : 'Prepare current data for sharing'}
                </Button>
              </>
            ) : (
              <>
                <div className="rounded-md bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
                  {currentOwnerSession.recordCount.toLocaleString()} transactions are ready for private agent links.
                </div>
                <label className="block text-sm font-medium" htmlFor="agent-link-expiry">Link expiry</label>
                <select
                  id="agent-link-expiry"
                  value={expiresInDays}
                  onChange={(event) => setExpiresInDays(Number(event.target.value))}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={365}>1 year</option>
                </select>
                <Button className="w-full" onClick={handleCreateLink} disabled={createLink.isPending || !selectedAgent}>
                  <Link2 className="mr-2 h-4 w-4" />
                  {createLink.isPending ? 'Creating private link…' : `Create link for ${selectedAgent || 'agent'}`}
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => revokeDataset.mutate({
                    datasetId: currentOwnerSession.datasetId,
                    ownerSecret: currentOwnerSession.ownerSecret,
                  })}
                  disabled={revokeDataset.isPending}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" /> Revoke all links for this upload
                </Button>
              </>
            )}
          </Card>

          {generatedLink && (
            <Card className="border-primary/40 p-5 space-y-3">
              <h2 className="font-semibold">New link for {generatedLink.agentName}</h2>
              <p className="text-xs text-muted-foreground">Expires {new Date(generatedLink.expiresAt).toLocaleDateString()}.</p>
              <div className="flex gap-2">
                <input readOnly value={generatedLink.url} className="min-w-0 flex-1 rounded-md border border-input bg-muted/40 px-2 text-xs" />
                <Button size="icon" variant="outline" title="Copy private link" onClick={async () => { await copyText(generatedLink.url); toast.success('Private link copied.'); }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" className="w-full" onClick={() => window.open(generatedLink.url, '_blank', 'noopener,noreferrer')}>
                <ExternalLink className="mr-2 h-4 w-4" /> Open agent portal
              </Button>
            </Card>
          )}

          {currentOwnerSession && ownerLinks.data && (
            <Card className="p-5 space-y-3">
              <h2 className="font-semibold">Issued links</h2>
              {ownerLinks.data.links.length === 0 ? (
                <p className="text-sm text-muted-foreground">No links have been issued for this upload yet.</p>
              ) : (
                <div className="space-y-2">
                  {ownerLinks.data.links.map((link) => (
                    <div key={link.id} className="rounded-md border border-border p-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{link.agentName}</span>
                        <span className={link.isRevoked ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}>
                          {link.isRevoked ? 'Revoked' : 'Active'}
                        </span>
                      </div>
                      <p className="mt-1 text-muted-foreground">Expires {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : '—'}</p>
                      {!link.isRevoked && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-7 px-0 text-destructive hover:text-destructive"
                          disabled={revokeLink.isPending}
                          onClick={() => revokeLink.mutate({
                            datasetId: currentOwnerSession.datasetId,
                            ownerSecret: currentOwnerSession.ownerSecret,
                            linkId: link.id,
                          })}
                        >
                          Revoke link
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </aside>

        <section className="min-w-0">
          {selectedMetrics ? (
            <Card className="p-5 lg:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-primary">Agent-scoped preview</p>
                  <h2 className="mt-1 text-2xl font-semibold">{selectedAgent}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedTransactions.length.toLocaleString()} accessible transactions</p>
                </div>
                <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  Privacy boundary active
                </div>
              </div>
              <AgentDetailsPanel agent={selectedMetrics} transactions={selectedTransactions} />
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground" />
              <h2 className="mt-3 font-semibold">No scoped data for this agent</h2>
              <p className="mt-1 text-sm text-muted-foreground">Choose an agent present in the current upload.</p>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
