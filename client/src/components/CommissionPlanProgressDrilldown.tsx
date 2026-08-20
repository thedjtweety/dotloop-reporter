import { ArrowLeft, CircleDollarSign, FileText, Flag, Landmark, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatUtils';
import type { DotloopRecord } from '@/lib/csvParser';

export interface CommissionPlanProgressDrilldownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName: string;
  planName?: string | null;
  capAmount?: number | null;
  companyDollar: number;
  currentSplit?: number | null;
  postCapSplit?: number | null;
  grossCommission?: number | null;
  netCommission?: number | null;
  transactionCount?: number | null;
  records?: DotloopRecord[];
  agentScoped?: boolean;
}

export function getCommissionCapProgress(capAmount?: number | null, companyDollar = 0) {
  const cap = Number(capAmount) || 0;
  const paid = Math.max(0, Number(companyDollar) || 0);
  const isCapped = cap > 0 && paid >= cap;
  return {
    cap,
    paid,
    isCapped,
    percent: cap > 0 ? Math.min(100, Math.round((paid / cap) * 1000) / 10) : 0,
    remaining: cap > 0 ? Math.max(0, cap - paid) : null,
  };
}

export function getTransactionDetailKey(record: Pick<DotloopRecord, 'loopId' | 'loopName' | 'closingDate' | 'salePrice' | 'price'>) {
  if (record.loopId) return record.loopId;
  return `${record.loopName || ''}|${record.closingDate || ''}|${String(record.salePrice ?? record.price ?? '')}`;
}

export default function CommissionPlanProgressDrilldown({
  open,
  onOpenChange,
  agentName,
  planName,
  capAmount,
  companyDollar,
  currentSplit,
  postCapSplit,
  grossCommission,
  netCommission,
  transactionCount,
  records = [],
  agentScoped = false,
}: CommissionPlanProgressDrilldownProps) {
  const [, setLocation] = useLocation();
  const [selectedRecord, setSelectedRecord] = useState<DotloopRecord | null>(null);
  const progress = getCommissionCapProgress(capAmount, companyDollar);
  const planLabel = planName || 'No commission plan assigned';
  const visibleRecords = records.slice(0, 100);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setSelectedRecord(null);
    onOpenChange(nextOpen);
  };

  const openTransaction = (record: DotloopRecord) => {
    if (agentScoped) {
      setSelectedRecord(record);
      return;
    }

    handleOpenChange(false);
    setLocation(`/transaction/${encodeURIComponent(getTransactionDetailKey(record))}`);
  };

  const displayDetailView = Boolean(selectedRecord);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="flex h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:h-[calc(100dvh-2rem)] sm:w-[calc(100dvw-2rem)] sm:max-w-[1600px] sm:rounded-2xl">
        <DialogHeader className="shrink-0 border-b border-border bg-card px-5 py-4 text-left sm:px-7 sm:py-5">
          <div className="flex items-center justify-between gap-3 pr-8">
            <div className="min-w-0">
              {displayDetailView ? (
                <Button variant="ghost" size="sm" className="-ml-2 mb-1 h-7 px-2 text-muted-foreground" onClick={() => setSelectedRecord(null)}>
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to cap progress
                </Button>
              ) : null}
              <DialogTitle className="truncate text-lg sm:text-xl">
                {displayDetailView ? (selectedRecord?.address || selectedRecord?.loopName || 'Transaction details') : `${agentName}'s commission plan progress`}
              </DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {displayDetailView ? 'Complete information available for this shared transaction.' : planLabel}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {!displayDetailView && progress.cap > 0 && (
                <Badge className={`hidden sm:inline-flex ${progress.isCapped ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-primary hover:bg-primary'}`}>
                  {progress.isCapped ? 'Cap reached' : `${progress.percent}% to cap`}
                </Badge>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="border-primary/60 bg-primary/10 font-semibold text-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
              >
                <X className="mr-1.5 h-4 w-4" />
                <span className="sm:hidden">Close</span>
                <span className="hidden sm:inline">Close &amp; return</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {displayDetailView && selectedRecord ? (
          <ScopedTransactionDetails record={selectedRecord} />
        ) : (
          <div className="grid min-h-0 flex-1 grid-rows-[auto_auto_minmax(0,1fr)] gap-4 overflow-hidden px-4 py-4 sm:gap-5 sm:px-7 sm:py-6">
            {progress.cap > 0 ? (
              <section className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">Company dollar toward annual cap</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {progress.isCapped
                        ? 'The cap has been reached. The post-cap split applies to eligible new transactions.'
                        : 'Progress is calculated from transactions in the current shared dataset or reporting period.'}
                    </p>
                  </div>
                  <p className="text-right text-2xl font-bold text-primary">{progress.percent}%</p>
                </div>
                <Progress value={progress.percent} className="h-3" indicatorClassName={progress.isCapped ? 'bg-emerald-500' : 'bg-primary'} />
                <div className="mt-3 grid gap-3 text-sm xl:grid-cols-3">
                  <SummaryItem label="Company dollar paid" value={formatCurrency(progress.paid)} icon={<Landmark className="h-4 w-4" />} />
                  <SummaryItem label="Annual cap" value={formatCurrency(progress.cap)} icon={<Flag className="h-4 w-4" />} />
                  <SummaryItem label={progress.isCapped ? 'Status' : 'Remaining before cap'} value={progress.isCapped ? 'Cap reached' : formatCurrency(progress.remaining || 0)} icon={<TrendingUp className="h-4 w-4" />} />
                </div>
              </section>
            ) : (
              <section className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
                <p className="font-semibold">This plan does not use a company-dollar cap.</p>
                <p className="mt-1 text-sm text-muted-foreground">Your commission is calculated from the current plan split for each eligible transaction.</p>
              </section>
            )}

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryItem label="Current agent split" value={currentSplit === null || currentSplit === undefined ? '—' : `${currentSplit}%`} icon={<CircleDollarSign className="h-4 w-4" />} />
              <SummaryItem label="Post-cap agent split" value={postCapSplit === null || postCapSplit === undefined ? '—' : `${postCapSplit}%`} icon={<TrendingUp className="h-4 w-4" />} />
              <SummaryItem label="Gross commission" value={grossCommission === null || grossCommission === undefined ? '—' : formatCurrency(grossCommission)} icon={<CircleDollarSign className="h-4 w-4" />} />
              <SummaryItem label="Net commission" value={netCommission === null || netCommission === undefined ? '—' : formatCurrency(netCommission)} icon={<CircleDollarSign className="h-4 w-4" />} />
            </section>

            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5 sm:py-4">
                <div>
                  <h3 className="font-semibold">Transactions behind this progress</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {agentScoped ? 'Select a transaction to see its full shared deal details.' : 'Select a transaction to open its complete deal details.'}
                  </p>
                </div>
                <Badge variant="outline">{transactionCount ?? records.length} transactions</Badge>
              </div>
              {visibleRecords.length ? (
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-card text-left text-xs text-muted-foreground shadow-sm">
                      <tr>
                        <th className="px-4 py-3 font-medium sm:px-5">Transaction</th>
                        <th className="hidden px-3 py-3 font-medium sm:table-cell">Status</th>
                        <th className="px-3 py-3 text-right font-medium">Price</th>
                        <th className="px-4 py-3 text-right font-medium sm:px-5">GCI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRecords.map((record, index) => (
                        <tr
                          key={`${getTransactionDetailKey(record)}-${index}`}
                          className="cursor-pointer border-t border-border transition-colors hover:bg-muted/60 focus-within:bg-muted/60"
                          onClick={() => openTransaction(record)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              openTransaction(record);
                            }
                          }}
                          tabIndex={0}
                          role="button"
                          aria-label={`Open details for ${record.loopName || record.address || 'transaction'}`}
                        >
                          <td className="max-w-[340px] truncate px-4 py-3 font-medium sm:px-5" title={record.loopName || record.address || undefined}>{record.loopName || record.address || 'Transaction'}</td>
                          <td className="hidden px-3 py-3 text-muted-foreground sm:table-cell">{record.loopStatus || '—'}</td>
                          <td className="px-3 py-3 text-right">{formatCurrency(record.salePrice || record.price || 0)}</td>
                          <td className="px-4 py-3 text-right text-emerald-500 sm:px-5">{formatCurrency(record.commissionTotal || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center px-5 py-10 text-center text-sm text-muted-foreground"><span><FileText className="mx-auto mb-2 h-5 w-5" />No transaction detail is available in this view.</span></div>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SummaryItem({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}<span>{label}</span></div>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function ScopedTransactionDetails({ record }: { record: DotloopRecord }) {
  const details = Object.entries(record).filter(([, value]) => value !== undefined && value !== null && value !== '');

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
      <section className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-semibold">Shared deal details</h3>
          <p className="mt-1 text-sm text-muted-foreground">All available information for this transaction is shown below.</p>
        </div>
        <dl className="grid gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {details.map(([key, value]) => (
            <div key={key} className="min-w-0">
              <dt className="text-xs font-medium text-muted-foreground">{formatFieldLabel(key)}</dt>
              <dd className="mt-1 break-words text-sm font-medium">{formatFieldValue(value)}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function formatFieldLabel(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase());
}

function formatFieldValue(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value.toLocaleString() : '—';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
