import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Archive, CalendarDays, CheckCircle2, ClipboardCopy, FileClock, FileUp, Layers3, Loader2, RefreshCw, Save, Sparkles, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTransactionData } from '@/contexts/TransactionDataContext';
import { trpc } from '@/lib/trpc';
import { analyzeFieldCompleteness } from '@/lib/fieldCompletenessAnalysis';
import { fieldCompletenessMap, importFingerprint, inferReportingPeriod } from '@/lib/importRunHelpers';
import toast from 'react-hot-toast';

export default function ImportCenterPage() {
  const [, setLocation] = useLocation();
  const { allRecords, activeDataSetName, hasData } = useTransactionData();
  const utils = trpc.useUtils();
  const { data: importRuns = [], isLoading: runsLoading } = trpc.brokerOperations.listImportRuns.useQuery();
  const { data: mappingTemplates = [] } = trpc.brokerOperations.listMappingTemplates.useQuery();
  const createRun = trpc.brokerOperations.createImportRun.useMutation();
  const activateRun = trpc.brokerOperations.activateImportRun.useMutation();
  const archiveRun = trpc.brokerOperations.archiveImportRun.useMutation();
  const saveTemplate = trpc.brokerOperations.saveMappingTemplate.useMutation();
  const deleteTemplate = trpc.brokerOperations.deleteMappingTemplate.useMutation();
  const setDefaultTemplate = trpc.brokerOperations.setDefaultMappingTemplate.useMutation();

  const quality = useMemo(() => analyzeFieldCompleteness(allRecords), [allRecords]);
  const inferredPeriod = useMemo(() => inferReportingPeriod(allRecords), [allRecords]);
  const [periodLabel, setPeriodLabel] = useState(inferredPeriod.label);
  const [templateName, setTemplateName] = useState('Dotloop standard export');

  const persistCurrentImport = async () => {
    if (!hasData || !allRecords.length) {
      toast.error('Load a CSV or demo dataset before registering an import run.');
      return;
    }
    try {
      const run = await createRun.mutateAsync({
        fileName: activeDataSetName || 'Current CSV import',
        reportingPeriodLabel: periodLabel.trim() || inferredPeriod.label,
        periodStart: inferredPeriod.periodStart,
        periodEnd: inferredPeriod.periodEnd,
        recordCount: allRecords.length,
        dataQuality: quality.overallCompleteness,
        fieldCompleteness: fieldCompletenessMap(quality.fields),
        warnings: quality.fields
          .filter((field) => field.completenessPercentage < 70)
          .map((field) => `${field.displayName}: ${field.completenessPercentage}% complete`),
        sourceChecksum: importFingerprint(allRecords),
      });
      localStorage.setItem('dotloop_active_import_run_id', run.id);
      await utils.brokerOperations.listImportRuns.invalidate();
      toast.success(run.duplicate ? 'Matching import run already exists; its record was reused.' : 'Import run saved. It is ready to activate or reference in commission audits.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the import run.');
    }
  };

  const activate = async (id: string) => {
    try {
      await activateRun.mutateAsync({ importRunId: id });
      localStorage.setItem('dotloop_active_import_run_id', id);
      await utils.brokerOperations.listImportRuns.invalidate();
      toast.success('This reporting period is now active.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not activate the import run.');
    }
  };

  const archive = async (id: string) => {
    try {
      await archiveRun.mutateAsync({ importRunId: id });
      if (localStorage.getItem('dotloop_active_import_run_id') === id) localStorage.removeItem('dotloop_active_import_run_id');
      await utils.brokerOperations.listImportRuns.invalidate();
      toast.success('Import run archived. Historical audit snapshots remain intact.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not archive the import run.');
    }
  };

  const saveCurrentMapping = async () => {
    const stored = localStorage.getItem('dotloop_field_mapping');
    if (!stored) {
      toast.error('No custom mapping is currently saved. Map CSV fields during upload first.');
      return;
    }
    try {
      const mapping = JSON.parse(stored) as Record<string, string>;
      await saveTemplate.mutateAsync({
        name: templateName.trim() || 'Untitled mapping',
        headers: Array.from(new Set(Object.values(mapping).filter(Boolean))),
        mapping,
        isDefault: mappingTemplates.length === 0,
      });
      await utils.brokerOperations.listMappingTemplates.invalidate();
      toast.success('Reusable CSV mapping saved.');
    } catch {
      toast.error('Could not save the current mapping.');
    }
  };

  const applyMapping = (mapping: Record<string, string>) => {
    localStorage.setItem('dotloop_field_mapping', JSON.stringify(mapping));
    window.dispatchEvent(new CustomEvent('import-mapping-template-selected'));
    toast.success('Mapping template selected for the next CSV import.');
    setLocation('/');
  };

  return (
    <div className="min-h-full bg-background p-4 md:p-7 text-foreground">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Broker operations</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Import Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Register reporting periods, review data readiness, and reuse the mapping that makes each Dotloop export consistent.</p>
          </div>
          <Button onClick={() => setLocation('/')} variant="outline">Return to dashboard</Button>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-primary/30 bg-primary/5 text-card-foreground">
            <CardHeader className="pb-2"><CardDescription>Current dataset</CardDescription><CardTitle className="text-lg">{hasData ? activeDataSetName || 'Loaded CSV' : 'No CSV loaded'}</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">{hasData ? `${allRecords.length.toLocaleString()} transactions available for a new import run.` : 'Upload a CSV from the dashboard to begin.'}</CardContent>
          </Card>
          <Card><CardHeader className="pb-2"><CardDescription>Data quality</CardDescription><CardTitle className="text-3xl text-primary">{hasData ? `${quality.overallCompleteness}%` : '—'}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Average completeness across key transaction fields.</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Saved reporting periods</CardDescription><CardTitle className="text-3xl">{importRuns.length}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">One active period can anchor commission snapshots and agent delivery.</CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileUp className="h-5 w-5 text-primary" /> Register current import</CardTitle><CardDescription>Save metadata and quality evidence for the CSV currently loaded in the dashboard. Raw transaction rows remain in the active dataset.</CardDescription></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2"><label className="text-sm font-medium" htmlFor="period-label">Reporting period label</label><Input id="period-label" value={periodLabel} onChange={(event) => setPeriodLabel(event.target.value)} placeholder="e.g. Q1 2026 Closed Transactions" /><p className="text-xs text-muted-foreground">Detected period: {inferredPeriod.periodStart && inferredPeriod.periodEnd ? `${inferredPeriod.periodStart} → ${inferredPeriod.periodEnd}` : 'No reliable dates found'}</p></div>
            <Button onClick={persistCurrentImport} disabled={!hasData || createRun.isPending} className="gap-2">{createRun.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save import run</Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileClock className="h-5 w-5 text-primary" /> Import history</CardTitle><CardDescription>Activate the period used as the current management and commission reference.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {runsLoading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading import runs…</div> : importRuns.length === 0 ? <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">No import runs saved yet. Register the CSV currently loaded above.</div> : importRuns.map((run) => (
                <div key={run.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><div className="flex items-center gap-2 font-medium">{run.status === 'active' && <CheckCircle2 className="h-4 w-4 text-primary" />}{run.reportingPeriodLabel}</div><p className="mt-1 text-xs text-muted-foreground">{run.fileName} · {run.recordCount.toLocaleString()} records · {run.dataQuality}% quality · {new Date(run.createdAt).toLocaleString()}</p>{run.warnings.length > 0 && <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{run.warnings.length} data-quality warning{run.warnings.length === 1 ? '' : 's'}</p>}</div>
                  <div className="flex gap-2"><Button size="sm" variant={run.status === 'active' ? 'secondary' : 'outline'} onClick={() => activate(run.id)} disabled={run.status === 'active' || run.status === 'archived' || activateRun.isPending}>{run.status === 'active' ? 'Active period' : run.status === 'archived' ? 'Archived' : 'Set active'}</Button><Button size="icon" variant="ghost" title="Archive import run" onClick={() => archive(run.id)} disabled={run.status === 'archived' || archiveRun.isPending}><Archive className="h-4 w-4" /></Button></div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Layers3 className="h-5 w-5 text-primary" /> Mapping library</CardTitle><CardDescription>Save your current Field Mapper choices so later uploads need less setup.</CardDescription></CardHeader>
            <CardContent className="space-y-4"><div className="space-y-2"><label className="text-sm font-medium" htmlFor="mapping-name">Template name</label><Input id="mapping-name" value={templateName} onChange={(event) => setTemplateName(event.target.value)} /><Button className="w-full gap-2" variant="outline" onClick={saveCurrentMapping} disabled={saveTemplate.isPending}><Save className="h-4 w-4" /> Save current mapping</Button></div><div className="space-y-2 border-t pt-4">{mappingTemplates.length === 0 ? <p className="text-sm text-muted-foreground">No saved mappings yet.</p> : mappingTemplates.map((template) => <div key={template.id} className="rounded-md border p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-medium">{template.name}{template.isDefault === 1 && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">Default</span>}</p><p className="text-xs text-muted-foreground">Used {template.useCount} time{template.useCount === 1 ? '' : 's'} · {template.headers.length} mapped headers</p></div><div className="flex gap-1"><Button size="icon" variant="ghost" title="Use this mapping" onClick={() => applyMapping(template.mapping)}><ClipboardCopy className="h-4 w-4" /></Button><Button size="icon" variant="ghost" title="Set as default mapping" disabled={template.isDefault === 1 || setDefaultTemplate.isPending} onClick={async () => { await setDefaultTemplate.mutateAsync({ id: template.id }); await utils.brokerOperations.listMappingTemplates.invalidate(); toast.success('Default mapping updated.'); }}><Star className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="text-destructive" title="Delete mapping" onClick={async () => { await deleteTemplate.mutateAsync({ id: template.id }); await utils.brokerOperations.listMappingTemplates.invalidate(); }}><Trash2 className="h-4 w-4" /></Button></div></div></div>)}</div><div className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground"><Sparkles className="mr-1 inline h-3.5 w-3.5 text-primary" /> Applying a template saves it for the next upload; you can still adjust individual fields in the mapper.</div></CardContent>
          </Card>
        </div>

        {hasData && <Card><CardHeader><CardTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5 text-primary" /> Current data readiness</CardTitle><CardDescription>Fields below 70% completeness should be reviewed before payout or agent reporting.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{quality.fields.map((field) => <div key={field.fieldName} className="rounded-lg border border-border p-3"><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">{field.displayName}</span><span className={field.completenessPercentage >= 70 ? 'text-primary font-semibold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>{field.completenessPercentage}%</span></div><p className="mt-1 text-xs text-muted-foreground">{field.impact}</p></div>)}</CardContent></Card>}
      </div>
    </div>
  );
}
