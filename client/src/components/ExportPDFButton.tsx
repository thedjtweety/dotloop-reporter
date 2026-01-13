/**
 * Export PDF Button Component
 * 
 * Provides UI for exporting commission reports as PDF files
 * Includes options for report customization and download
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileDown, Loader2, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { downloadHTMLAsPDF, previewHTMLInNewTab } from '@/lib/pdf-utils';

interface ExportPDFButtonProps {
  breakdowns: any[];
  ytdSummaries: any[];
  brokerageName?: string;
  disabled?: boolean;
}

export default function ExportPDFButton({
  breakdowns,
  ytdSummaries,
  brokerageName = 'Brokerage',
  disabled = false,
}: ExportPDFButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [reportTitle, setReportTitle] = useState('Commission Report');
  const [includeTransactionDetails, setIncludeTransactionDetails] = useState(true);
  const [includeAgentSummaries, setIncludeAgentSummaries] = useState(true);
  const [groupByAgent, setGroupByAgent] = useState(true);

  const exportMutation = trpc.commission.exportPDF.useMutation();

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the export endpoint
      const response = await exportMutation.mutateAsync({
        breakdowns,
        ytdSummaries,
        brokerageName,
        reportTitle,
        options: {
          includeTransactionDetails,
          includeAgentSummaries,
          groupByAgent,
          pageSize: 'letter',
        },
      });

      if (response.success && response.html) {
        // Open print dialog for PDF export
        await downloadHTMLAsPDF(response.html, response.fileName);
        setOpen(false);
      }
    } catch (err) {
      setError(`Failed to export PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };



  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || breakdowns.length === 0}
          className="gap-2"
        >
          <FileDown className="h-4 w-4" />
          Export PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Commission Report</DialogTitle>
          <DialogDescription>
            Customize your report and download as PDF
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="report-title">Report Title</Label>
            <Input
              id="report-title"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Commission Report"
              disabled={loading}
            />
          </div>

          <div className="space-y-3">
            <Label>Report Contents</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-summaries"
                checked={includeAgentSummaries}
                onCheckedChange={(checked) => setIncludeAgentSummaries(checked as boolean)}
                disabled={loading}
              />
              <Label htmlFor="include-summaries" className="font-normal cursor-pointer">
                Include Agent Summaries
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-details"
                checked={includeTransactionDetails}
                onCheckedChange={(checked) => setIncludeTransactionDetails(checked as boolean)}
                disabled={loading}
              />
              <Label htmlFor="include-details" className="font-normal cursor-pointer">
                Include Transaction Details
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="group-by-agent"
                checked={groupByAgent}
                onCheckedChange={(checked) => setGroupByAgent(checked as boolean)}
                disabled={loading || !includeTransactionDetails}
              />
              <Label htmlFor="group-by-agent" className="font-normal cursor-pointer">
                Group Transactions by Agent
              </Label>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              {breakdowns.length} transactions from {new Set(breakdowns.map((b: any) => b.agentName)).size} agents
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={loading}
              className="flex-1 gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
