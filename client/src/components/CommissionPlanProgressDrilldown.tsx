import { CircleDollarSign, FileText, Flag, Landmark, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatUtils';

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
  records?: Array<{
    loopName?: string | null;
    address?: string | null;
    loopStatus?: string | null;
    closingDate?: string | null;
    salePrice?: number | null;
    price?: number | null;
    commissionTotal?: number | null;
  }>;
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
  const progress = getCommissionCapProgress(capAmount, companyDollar);
  const planLabel = planName || 'No commission plan assigned';
  const visibleRecords = records.slice(0, 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-6 py-5 text-left">
          <div className="flex flex-wrap items-center justify-between gap-3 pr-8">
            <div>
              <DialogTitle className="text-xl">{agentName}'s commission plan progress</DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">{planLabel}</p>
            </div>
            {progress.cap > 0 && (
              <Badge className={progress.isCapped ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-primary hover:bg-primary'}>
                {progress.isCapped ? 'Cap reached' : `${progress.percent}% to cap`}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6">
          {progress.cap > 0 ? (
            <section className="rounded-xl border border-primary/20 bg-primary/5 p-5">
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
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                <SummaryItem label="Company dollar paid" value={formatCurrency(progress.paid)} icon={<Landmark className="h-4 w-4" />} />
                <SummaryItem label="Annual cap" value={formatCurrency(progress.cap)} icon={<Flag className="h-4 w-4" />} />
                <SummaryItem label={progress.isCapped ? 'Status' : 'Remaining before cap'} value={progress.isCapped ? 'Cap reached' : formatCurrency(progress.remaining || 0)} icon={<TrendingUp className="h-4 w-4" />} />
              </div>
            </section>
          ) : (
            <section className="rounded-xl border border-border bg-muted/30 p-5">
              <p className="font-semibold">This plan does not use a company-dollar cap.</p>
              <p className="mt-1 text-sm text-muted-foreground">Your commission is calculated from the current plan split for each eligible transaction.</p>
            </section>
          )}

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryItem label="Current agent split" value={currentSplit === null || currentSplit === undefined ? '—' : `${currentSplit}%`} icon={<CircleDollarSign className="h-4 w-4" />} />
            <SummaryItem label="Post-cap agent split" value={postCapSplit === null || postCapSplit === undefined ? '—' : `${postCapSplit}%`} icon={<TrendingUp className="h-4 w-4" />} />
            <SummaryItem label="Gross commission" value={grossCommission === null || grossCommission === undefined ? '—' : formatCurrency(grossCommission)} icon={<CircleDollarSign className="h-4 w-4" />} />
            <SummaryItem label="Net commission" value={netCommission === null || netCommission === undefined ? '—' : formatCurrency(netCommission)} icon={<CircleDollarSign className="h-4 w-4" />} />
          </section>

          <section className="rounded-xl border border-border">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h3 className="font-semibold">Transactions behind this progress</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {agentScoped ? 'Only your assigned transactions are shown.' : 'Only this agent’s transactions from the active dataset are shown.'}
                </p>
              </div>
              <Badge variant="outline">{transactionCount ?? records.length} transactions</Badge>
            </div>
            {visibleRecords.length ? (
              <div className="max-h-[320px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Transaction</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 text-right font-medium">Price</th>
                      <th className="px-5 py-3 text-right font-medium">GCI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRecords.map((record, index) => (
                      <tr key={`${record.loopName || record.address || 'transaction'}-${index}`} className="border-t border-border">
                        <td className="max-w-[280px] truncate px-5 py-3 font-medium" title={record.loopName || record.address || undefined}>{record.loopName || record.address || 'Transaction'}</td>
                        <td className="px-3 py-3 text-muted-foreground">{record.loopStatus || '—'}</td>
                        <td className="px-3 py-3 text-right">{formatCurrency(record.salePrice || record.price || 0)}</td>
                        <td className="px-5 py-3 text-right text-emerald-500">{formatCurrency(record.commissionTotal || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground"><FileText className="mx-auto mb-2 h-5 w-5" />No transaction detail is available in this view.</div>
            )}
          </section>
        </div>
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
