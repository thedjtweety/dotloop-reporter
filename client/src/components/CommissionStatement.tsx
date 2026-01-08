import { AuditResult } from '@/lib/commissionCalculator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface CommissionStatementProps {
  auditResult: AuditResult;
  onClose: () => void;
}

export default function CommissionStatement({ auditResult, onClose }: CommissionStatementProps) {
  const { snapshot, agentName, loopName, closingDate } = auditResult;

  if (!snapshot) return null;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg border-2">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">Commission Statement</CardTitle>
            <CardDescription>Transaction Breakdown</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={onClose}>
            <span className="sr-only">Close</span>
            <span className="text-lg">×</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Agent</p>
              <p className="font-medium text-lg">{agentName}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Closing Date</p>
              <p className="font-medium">{closingDate}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Property / Loop</p>
              <p className="font-medium">{loopName}</p>
            </div>
          </div>

          <Separator />

          {/* Financial Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Gross Commission Income (GCI)</span>
              <span className="font-bold text-lg">{formatCurrency(snapshot.grossCommission)}</span>
            </div>

            {snapshot.teamSplitAmount > 0 && (
              <div className="flex justify-between items-center text-red-600">
                <span>Less: Team Split</span>
                <span>- {formatCurrency(snapshot.teamSplitAmount)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-red-600">
              <span>
                Less: Brokerage Split 
                <Badge variant="outline" className="ml-2 text-xs">
                  {snapshot.splitPercentageApplied < 100 ? `${100 - snapshot.splitPercentageApplied}%` : '0% (Capped)'}
                </Badge>
              </span>
              <span>- {formatCurrency(snapshot.brokerageSplitAmount)}</span>
            </div>

            {snapshot.deductionsBreakdown && snapshot.deductionsBreakdown.length > 0 && (
              <div className="space-y-1 pt-1">
                {snapshot.deductionsBreakdown.map((d, i) => (
                  <div key={i} className="flex justify-between items-center text-red-600 text-sm">
                    <span>Less: {d.name}</span>
                    <span>- {formatCurrency(d.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            <Separator className="my-2" />

            <div className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
              <span className="font-bold text-lg">Net Agent Commission</span>
              <span className="font-bold text-xl text-emerald-600">{formatCurrency(snapshot.agentNetCommission)}</span>
            </div>
          </div>

          {/* YTD Context */}
          <div className="bg-blue-50/50 p-4 rounded-md border border-blue-100 text-sm space-y-2">
            <h4 className="font-semibold text-blue-900">Year-to-Date (YTD) Context</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between">
                <span className="text-blue-700">Company Dollar Before Deal:</span>
                <span>{formatCurrency(snapshot.ytdBefore)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Company Dollar After Deal:</span>
                <span>{formatCurrency(snapshot.ytdAfter)}</span>
              </div>
            </div>
            {snapshot.isCapped && (
              <div className="mt-2 text-center font-medium text-emerald-600 bg-emerald-100/50 py-1 rounded">
                🎉 Agent has CAPPED for this cycle!
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => window.print()}>
              <Download className="w-4 h-4 mr-2" /> Print / PDF
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
