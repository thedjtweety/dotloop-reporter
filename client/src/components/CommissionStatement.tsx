import { AuditResult } from '@/lib/commissionCalculator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
      <Card className="w-full max-w-2xl shadow-lg border-2 border-[#1E90FF]/20">
        <CardHeader className="flex flex-row items-start justify-between pb-2 bg-[#1e3a5f] text-white rounded-t-lg">
          <div>
            <CardTitle className="text-2xl font-bold">Commission Statement</CardTitle>
            <CardDescription className="text-blue-200">Transaction Breakdown</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
            <span className="sr-only">Close</span>
            <span className="text-lg">×</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-6" id="commission-statement-content">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-foreground">Agent</p>
              <p className="font-medium text-lg text-[#1e3a5f]">{agentName}</p>
            </div>
            <div className="text-right">
              <p className="text-foreground">Closing Date</p>
              <p className="font-medium">{closingDate}</p>
            </div>
            <div className="col-span-2">
              <p className="text-foreground">Property / Loop</p>
              <p className="font-medium text-[#1e3a5f]">{loopName}</p>
            </div>
          </div>

          <Separator className="bg-slate-200" />

          {/* Financial Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-700">Gross Commission Income (GCI)</span>
              <span className="font-bold text-lg text-[#1e3a5f]">{formatCurrency(snapshot.grossCommission)}</span>
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
                <Badge variant="outline" className="ml-2 text-xs border-red-200 text-red-600">
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

            <Separator className="my-2 bg-slate-200" />

            <div className="flex justify-between items-center bg-[#f0f9ff] p-3 rounded-md border border-[#1E90FF]/20">
              <span className="font-bold text-lg text-[#1e3a5f]">Net Agent Commission</span>
              <span className="font-bold text-xl text-[#1E90FF]">{formatCurrency(snapshot.agentNetCommission)}</span>
            </div>
          </div>

          {/* YTD Context */}
          <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-sm space-y-2">
            <h4 className="font-semibold text-[#1e3a5f]">Year-to-Date (YTD) Context</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Company Dollar Before Deal:</span>
                <span className="font-medium">{formatCurrency(snapshot.ytdBefore)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Company Dollar After Deal:</span>
                <span className="font-medium">{formatCurrency(snapshot.ytdAfter)}</span>
              </div>
            </div>
            {snapshot.isCapped && (
              <div className="mt-2 text-center font-medium text-[#1E90FF] bg-[#1E90FF]/10 py-1 rounded border border-[#1E90FF]/20">
                🎉 Agent has CAPPED for this cycle!
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" className="border-[#1E90FF] text-[#1E90FF] hover:bg-[#1E90FF]/10" onClick={async () => {
              const element = document.getElementById('commission-statement-content');
              if (element) {
                const canvas = await html2canvas(element, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`Statement_${agentName}_${closingDate}.pdf`);
              }
            }}>
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
            <Button onClick={onClose} className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">Close</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
