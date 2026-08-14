import { ChangeEvent, useMemo, useState } from 'react';
import Papa from 'papaparse';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileCheck2,
  FileSpreadsheet,
  FolderArchive,
  Loader2,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';

type ManifestRow = {
  sourceTransactionId?: string | null;
  transactionName: string;
  propertyAddress?: string | null;
  primaryAgent?: string | null;
  closingDate?: string | null;
  sourceFolderReference?: string | null;
  expectedFileCount?: number | null;
  notes?: string | null;
};

type ReconciliationDraft = {
  destinationLoopId: string;
  destinationLoopName: string;
  reconciledFileCount: string;
  notes: string;
};

const TEMPLATE_HEADERS = [
  'sourceTransactionId',
  'transactionName',
  'propertyAddress',
  'primaryAgent',
  'closingDate',
  'sourceFolderReference',
  'expectedFileCount',
  'notes',
];

const WORKFLOW_STEPS = [
  ['1', 'Export archived files', 'A brokerage administrator downloads complete SkySlope archive packages. Keep the original ZIPs unchanged.'],
  ['2', 'Stage in brokerage storage', 'Place one folder per transaction in the brokerage-owned Google Drive or Dropbox location.'],
  ['3', 'Create the manifest', 'List each transaction, its source-folder reference, and its expected document count in the provided CSV template.'],
  ['4', 'Validate before upload', 'The Transition Center detects duplicate transactions, missing folder references, malformed dates, and missing file counts.'],
  ['5', 'Reconcile Dotloop archives', 'Create or identify the target Dotloop archive loop, upload the staged files, and compare the file count.'],
  ['6', 'Close out defensibly', 'Resolve every blocking exception, export the audit record, and then mark the migration complete.'],
] as const;

function normalizeRow(raw: Record<string, unknown>): ManifestRow {
  const read = (key: string) => String(raw[key] ?? raw[key.toLowerCase()] ?? '').trim();
  const expected = Number(read('expectedFileCount'));
  return {
    sourceTransactionId: read('sourceTransactionId') || null,
    transactionName: read('transactionName'),
    propertyAddress: read('propertyAddress') || null,
    primaryAgent: read('primaryAgent') || null,
    closingDate: read('closingDate') || null,
    sourceFolderReference: read('sourceFolderReference') || null,
    expectedFileCount: Number.isFinite(expected) ? expected : 0,
    notes: read('notes') || null,
  };
}

async function fingerprint(text: string) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function downloadCsv(fileName: string, headers: string[], rows: Array<Record<string, unknown>>) {
  const csv = Papa.unparse({ fields: headers, data: rows });
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function SkySlopeTransitionCenterPage() {
  const utils = trpc.useUtils();
  const { data: template } = trpc.migrationCenter.template.useQuery();
  const { data: runs = [], isLoading: runsLoading } = trpc.migrationCenter.listRuns.useQuery();
  const createRun = trpc.migrationCenter.createRun.useMutation();
  const reconcileItem = trpc.migrationCenter.reconcileItem.useMutation();
  const resolveException = trpc.migrationCenter.resolveException.useMutation();
  const completeRun = trpc.migrationCenter.completeRun.useMutation();
  const archiveRun = trpc.migrationCenter.archiveRun.useMutation();

  const [runName, setRunName] = useState('SkySlope archive transition');
  const [storageProvider, setStorageProvider] = useState<'google_drive' | 'dropbox' | 'local' | 'other'>('google_drive');
  const [storageReference, setStorageReference] = useState('');
  const [manifestRows, setManifestRows] = useState<ManifestRow[]>([]);
  const [manifestText, setManifestText] = useState('');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [reconciliation, setReconciliation] = useState<Record<string, ReconciliationDraft>>({});
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const { data: selectedRun, isLoading: selectedRunLoading } = trpc.migrationCenter.getRun.useQuery(
    { runId: selectedRunId! },
    { enabled: Boolean(selectedRunId) },
  );

  const selectedExceptions = selectedRun?.exceptions ?? [];
  const blockingExceptions = selectedExceptions.filter((exception) => exception.status === 'open' && exception.severity === 'blocking').length;
  const selectedItems = selectedRun?.items ?? [];
  const readyRows = useMemo(() => manifestRows.filter((row) => row.transactionName && row.sourceFolderReference && (row.expectedFileCount ?? 0) > 0).length, [manifestRows]);

  const handleManifestFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Use the Transition Center CSV manifest template.');
      return;
    }
    try {
      const text = await file.text();
      const parsed = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: 'greedy' });
      if (parsed.errors.length) throw new Error(parsed.errors[0].message);
      const rows = parsed.data.map(normalizeRow).filter((row) => Object.values(row).some(Boolean));
      if (!rows.length) throw new Error('No transaction rows were found in the manifest.');
      setManifestText(text);
      setManifestRows(rows);
      if (!runName || runName === 'SkySlope archive transition') setRunName(file.name.replace(/\.csv$/i, ''));
      toast.success(`${rows.length} transaction row${rows.length === 1 ? '' : 's'} loaded for validation.`);
    } catch (error) {
      toast.error(error instanceof Error ? `Could not read manifest: ${error.message}` : 'Could not read the manifest.');
    }
  };

  const saveRun = async () => {
    if (!manifestRows.length || !manifestText) {
      toast.error('Download and complete the manifest template, then load it here.');
      return;
    }
    try {
      const result = await createRun.mutateAsync({
        name: runName.trim() || 'SkySlope archive transition',
        storageProvider,
        storageReference: storageReference.trim() || null,
        manifestChecksum: await fingerprint(manifestText),
        rows: manifestRows,
      });
      await utils.migrationCenter.listRuns.invalidate();
      setSelectedRunId(result.run.id);
      toast.success(result.duplicate ? 'Matching active migration run already exists; it was opened instead.' : 'Migration run created. Review exceptions before reconciling files.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create the migration run.');
    }
  };

  const reconcile = async (item: typeof selectedItems[number]) => {
    const draft = reconciliation[item.id] ?? {
      destinationLoopId: item.destinationLoopId || '',
      destinationLoopName: item.destinationLoopName || '',
      reconciledFileCount: String(item.reconciledFileCount || ''),
      notes: item.notes || '',
    };
    const count = Number(draft.reconciledFileCount);
    if (!draft.destinationLoopId.trim() || !draft.destinationLoopName.trim() || !Number.isInteger(count) || count < 0) {
      toast.error('Provide the target Dotloop loop ID, loop name, and reconciled file count.');
      return;
    }
    try {
      const result = await reconcileItem.mutateAsync({
        itemId: item.id,
        destinationLoopId: draft.destinationLoopId.trim(),
        destinationLoopName: draft.destinationLoopName.trim(),
        reconciledFileCount: count,
        notes: draft.notes.trim() || null,
      });
      await utils.migrationCenter.getRun.invalidate({ runId: item.runId });
      toast.success(result.matched ? 'Transaction reconciled. File counts match.' : 'Saved as an exception because file counts do not match.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not reconcile this transaction.');
    }
  };

  const resolve = async (exceptionId: string, action: 'resolved' | 'waived') => {
    const note = resolutionNotes[exceptionId]?.trim();
    if (!note) {
      toast.error('Add a resolution or waiver note for the audit record.');
      return;
    }
    try {
      await resolveException.mutateAsync({ exceptionId, action, resolutionNote: note });
      if (selectedRunId) await utils.migrationCenter.getRun.invalidate({ runId: selectedRunId });
      toast.success(action === 'resolved' ? 'Exception resolved.' : 'Exception waived and retained in the audit trail.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update the exception.');
    }
  };

  const complete = async () => {
    if (!selectedRunId) return;
    try {
      await completeRun.mutateAsync({ runId: selectedRunId });
      await Promise.all([utils.migrationCenter.getRun.invalidate({ runId: selectedRunId }), utils.migrationCenter.listRuns.invalidate()]);
      toast.success('Migration marked complete. Export the audit record for brokerage retention.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'This migration is not ready to complete.');
    }
  };

  const exportAudit = () => {
    if (!selectedRun) return;
    const rows = selectedRun.items.map((item) => ({
      migrationRun: selectedRun.run.name,
      sourceTransactionId: item.sourceTransactionId || '',
      transactionName: item.transactionName,
      propertyAddress: item.propertyAddress || '',
      sourceFolderReference: item.sourceFolderReference || '',
      expectedFileCount: item.expectedFileCount,
      reconciledFileCount: item.reconciledFileCount,
      destinationLoopId: item.destinationLoopId || '',
      destinationLoopName: item.destinationLoopName || '',
      reconciliationStatus: item.status,
      openExceptions: selectedRun.exceptions.filter((exception) => exception.manifestItemId === item.id && exception.status === 'open').map((exception) => exception.details).join(' | '),
      notes: item.notes || '',
    }));
    downloadCsv(`${selectedRun.run.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-audit.csv`, ['migrationRun', 'sourceTransactionId', 'transactionName', 'propertyAddress', 'sourceFolderReference', 'expectedFileCount', 'reconciledFileCount', 'destinationLoopId', 'destinationLoopName', 'reconciliationStatus', 'openExceptions', 'notes'], rows);
    toast.success('Migration audit CSV downloaded.');
  };

  return (
    <div className="min-h-full bg-background p-4 text-foreground md:p-7">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">One-time records transition</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">SkySlope Transition Center</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">A credential-free broker-admin workflow for moving complete SkySlope archive packages into searchable, reconciled Dotloop archive loops. This center never accesses vendor accounts or moves source files automatically.</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => downloadCsv('skyslope-migration-manifest-template.csv', template?.columns ?? TEMPLATE_HEADERS, [])}><Download className="h-4 w-4" /> Download manifest template</Button>
        </header>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {WORKFLOW_STEPS.map(([number, title, description]) => <Card key={number} className="border-border bg-card text-card-foreground"><CardHeader className="pb-2"><CardDescription>Step {number}</CardDescription><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{description}</CardContent></Card>)}
        </div>

        <Card className="border-primary/25 bg-primary/5 text-card-foreground">
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Compliance boundary</CardTitle><CardDescription>Keep original SkySlope ZIP packages and the brokerage-owned Drive or Dropbox staging area unchanged until the reconciliation audit is complete. This tool records manifest evidence and Dotloop archive outcomes; it does not scrape SkySlope or use vendor credentials.</CardDescription></CardHeader>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-primary" /> Create migration run</CardTitle><CardDescription>Upload a completed manifest after the brokerage administrator exports and stages the transaction packages.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><label htmlFor="migration-name" className="text-sm font-medium">Migration name</label><Input id="migration-name" value={runName} onChange={(event) => setRunName(event.target.value)} /></div><div className="space-y-2"><label htmlFor="storage-provider" className="text-sm font-medium">Staging provider</label><select id="storage-provider" value={storageProvider} onChange={(event) => setStorageProvider(event.target.value as typeof storageProvider)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="google_drive">Google Drive</option><option value="dropbox">Dropbox</option><option value="local">Local archive drive</option><option value="other">Other brokerage storage</option></select></div></div>
              <div className="space-y-2"><label htmlFor="storage-reference" className="text-sm font-medium">Staging location reference <span className="font-normal text-muted-foreground">(recommended)</span></label><Input id="storage-reference" value={storageReference} onChange={(event) => setStorageReference(event.target.value)} placeholder="Drive folder URL, Dropbox path, or internal archive reference" /></div>
              <div className="rounded-lg border border-dashed border-primary/40 bg-background/70 p-5"><label htmlFor="manifest-file" className="flex cursor-pointer flex-col items-center gap-2 text-center"><Upload className="h-6 w-6 text-primary" /><span className="font-medium">Choose completed migration manifest</span><span className="text-xs text-muted-foreground">CSV only. Required: transactionName, sourceFolderReference, expectedFileCount.</span><Input id="manifest-file" type="file" accept=".csv,text/csv" className="sr-only" onChange={handleManifestFile} /></label></div>
              {manifestRows.length > 0 && <div className="rounded-lg border bg-background p-3 text-sm"><div className="flex items-center justify-between"><span className="font-medium">Manifest preview</span><span className="text-primary">{readyRows}/{manifestRows.length} rows structurally ready</span></div><p className="mt-1 text-xs text-muted-foreground">Server validation will identify duplicates and every compliance-blocking exception before this run can be completed.</p></div>}
              <Button className="w-full gap-2" onClick={saveRun} disabled={!manifestRows.length || createRun.isPending}>{createRun.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderArchive className="h-4 w-4" />} Validate & create migration run</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" /> Migration runs</CardTitle><CardDescription>Open a run to resolve exceptions, reconcile file counts with target Dotloop loops, and retain the final audit export.</CardDescription></CardHeader>
            <CardContent className="space-y-3">{runsLoading ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading migration runs…</p> : runs.length === 0 ? <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">No migration runs yet. Download the template, stage the export, and create the first run.</p> : runs.map((run) => <button key={run.id} onClick={() => setSelectedRunId(run.id)} className={`w-full rounded-lg border p-4 text-left transition-colors ${selectedRunId === run.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-muted/50'}`}><div className="flex items-start justify-between gap-4"><div><p className="font-medium">{run.name}</p><p className="mt-1 text-xs text-muted-foreground">{run.storageProvider.replace('_', ' ')} · {run.recordsImported}/{run.recordsExpected} rows · {run.recordsReconciled} reconciled</p></div><span className="rounded-full bg-muted px-2 py-1 text-[11px] font-medium capitalize">{run.status.replace('_', ' ')}</span></div>{run.openExceptionCount > 0 && <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">{run.openExceptionCount} open validation or reconciliation item{run.openExceptionCount === 1 ? '' : 's'}</p>}</button>)}</CardContent>
          </Card>
        </div>

        {selectedRunLoading && <Card><CardContent className="flex items-center gap-2 p-6 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading migration detail…</CardContent></Card>}
        {selectedRun && <>
          <div className="grid gap-4 md:grid-cols-4"><Card><CardHeader className="pb-2"><CardDescription>Manifest rows</CardDescription><CardTitle>{selectedRun.closeout.includedCount}</CardTitle></CardHeader></Card><Card><CardHeader className="pb-2"><CardDescription>Reconciled</CardDescription><CardTitle className="text-primary">{selectedRun.closeout.reconciledCount}</CardTitle></CardHeader></Card><Card><CardHeader className="pb-2"><CardDescription>File mismatches</CardDescription><CardTitle className={selectedRun.closeout.fileMismatchCount ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}>{selectedRun.closeout.fileMismatchCount}</CardTitle></CardHeader></Card><Card><CardHeader className="pb-2"><CardDescription>Blocking exceptions</CardDescription><CardTitle className={blockingExceptions ? 'text-destructive' : 'text-primary'}>{blockingExceptions}</CardTitle></CardHeader></Card></div>

          <Card><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> Exceptions</CardTitle><CardDescription>Blocking items must be resolved or formally waived with an audit note before closeout.</CardDescription></CardHeader><CardContent className="space-y-3">{selectedExceptions.length === 0 ? <p className="rounded-lg bg-primary/10 p-4 text-sm text-primary">No exceptions. This manifest is ready for transaction reconciliation.</p> : selectedExceptions.map((exception) => <div key={exception.id} className="rounded-lg border border-border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium"><span className={exception.severity === 'blocking' ? 'text-destructive' : 'text-amber-600 dark:text-amber-400'}>{exception.severity === 'blocking' ? 'Blocking' : 'Warning'}</span> · {exception.category.replaceAll('_', ' ')}</p><p className="mt-1 text-sm text-muted-foreground">{exception.details}</p></div><span className="rounded-full bg-muted px-2 py-1 text-xs capitalize">{exception.status}</span></div>{exception.status === 'open' && <div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input value={resolutionNotes[exception.id] ?? ''} onChange={(event) => setResolutionNotes((current) => ({ ...current, [exception.id]: event.target.value }))} placeholder="Required resolution or waiver note" /><Button size="sm" variant="outline" onClick={() => resolve(exception.id, 'resolved')}>Resolve</Button><Button size="sm" variant="ghost" onClick={() => resolve(exception.id, 'waived')}>Waive</Button></div>}{exception.resolutionNote && <p className="mt-3 text-xs text-muted-foreground">Resolution: {exception.resolutionNote}</p>}</div>)}</CardContent></Card>

          <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileCheck2 className="h-5 w-5 text-primary" /> Dotloop reconciliation</CardTitle><CardDescription>After a broker administrator creates or identifies the target Dotloop archive loop and uploads the staged transaction files, compare the exact count recorded in the manifest.</CardDescription></CardHeader><CardContent className="space-y-3">{selectedItems.map((item) => { const draft = reconciliation[item.id] ?? { destinationLoopId: item.destinationLoopId || '', destinationLoopName: item.destinationLoopName || '', reconciledFileCount: item.reconciledFileCount ? String(item.reconciledFileCount) : '', notes: item.notes || '' }; return <div key={item.id} className="rounded-lg border border-border bg-card p-4"><div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between"><div><p className="font-medium">{item.transactionName}</p><p className="text-xs text-muted-foreground">Expected files: {item.expectedFileCount} · Current status: <span className="capitalize">{item.status.replace('_', ' ')}</span></p><p className="mt-1 break-all text-xs text-muted-foreground">Source: {item.sourceFolderReference || 'Missing source reference'}</p></div>{item.status === 'reconciled' && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}</div><div className="mt-3 grid gap-2 md:grid-cols-4"><Input value={draft.destinationLoopId} onChange={(event) => setReconciliation((current) => ({ ...current, [item.id]: { ...draft, destinationLoopId: event.target.value } }))} placeholder="Dotloop loop ID" /><Input value={draft.destinationLoopName} onChange={(event) => setReconciliation((current) => ({ ...current, [item.id]: { ...draft, destinationLoopName: event.target.value } }))} placeholder="Dotloop loop name" /><Input type="number" min="0" value={draft.reconciledFileCount} onChange={(event) => setReconciliation((current) => ({ ...current, [item.id]: { ...draft, reconciledFileCount: event.target.value } }))} placeholder="Files uploaded" /><Button variant={item.status === 'reconciled' ? 'secondary' : 'outline'} onClick={() => reconcile(item)} disabled={reconcileItem.isPending}>{reconcileItem.isPending ? 'Saving…' : item.status === 'reconciled' ? 'Update reconciliation' : 'Reconcile'}</Button></div><Input className="mt-2" value={draft.notes} onChange={(event) => setReconciliation((current) => ({ ...current, [item.id]: { ...draft, notes: event.target.value } }))} placeholder="Optional reconciliation note" /></div>})}</CardContent></Card>

          <Card className="border-primary/30 bg-primary/5"><CardContent className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-semibold">Migration closeout</p><p className="mt-1 text-sm text-muted-foreground">Completion requires each included transaction to reconcile with a matching file count and no blocking exceptions.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" className="gap-2" onClick={exportAudit}><Download className="h-4 w-4" /> Export audit CSV</Button><Button variant="outline" onClick={async () => { await archiveRun.mutateAsync({ runId: selectedRun.run.id }); await utils.migrationCenter.listRuns.invalidate(); await utils.migrationCenter.getRun.invalidate({ runId: selectedRun.run.id }); toast.success('Migration run archived.'); }} disabled={archiveRun.isPending || selectedRun.run.status === 'archived'}><Archive className="mr-2 h-4 w-4" /> Archive</Button><Button onClick={complete} disabled={!selectedRun.closeout.isReadyToComplete || completeRun.isPending}>{completeRun.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}{selectedRun.closeout.isReadyToComplete ? 'Complete migration' : 'Closeout blocked'}</Button></div></CardContent></Card>
        </>}
      </div>
    </div>
  );
}
