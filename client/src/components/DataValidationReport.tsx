import { DotloopRecord } from '@/lib/csvParser';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataValidationReportProps {
  records: DotloopRecord[];
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DataValidationReport({ records, onConfirm, onCancel }: DataValidationReportProps) {
  // 1. Analyze Data Health
  const totalRows = records.length;
  const missingDates = records.filter(r => !r.closingDate).length;
  const missingPrices = records.filter(r => !r.salePrice && !r.price).length;
  const missingAgents = records.filter(r => !r.agents).length;
  
  // 2. Determine Overall Status
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (missingDates > 0 || missingPrices > 0) status = 'warning';
  if (missingDates > totalRows * 0.5) status = 'critical'; // If >50% missing dates, it's bad

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Data Validation Report</CardTitle>
          <CardDescription>We analyzed your file before generating reports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Status Banner */}
          <div className={`p-4 rounded-lg flex items-center gap-4 ${
            status === 'healthy' ? 'bg-emerald-100 text-emerald-800' :
            status === 'warning' ? 'bg-amber-100 text-amber-800' :
            'bg-red-100 text-red-800'
          }`}>
            {status === 'healthy' && <CheckCircle className="w-8 h-8" />}
            {status === 'warning' && <AlertTriangle className="w-8 h-8" />}
            {status === 'critical' && <XCircle className="w-8 h-8" />}
            <div>
              <h3 className="font-bold text-lg">
                {status === 'healthy' ? 'File Looks Good!' :
                 status === 'warning' ? 'Some Issues Detected' :
                 'Critical Data Missing'}
              </h3>
              <p>
                {status === 'healthy' ? 'We successfully mapped all critical fields.' :
                 status === 'warning' ? 'We can proceed, but some charts may be incomplete.' :
                 'We recommend fixing your CSV before proceeding.'}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded bg-background">
              <div className="text-sm text-foreground">Total Records</div>
              <div className="text-2xl font-bold">{totalRows}</div>
            </div>
            <div className="p-4 border rounded bg-background">
              <div className="text-sm text-foreground">Missing Dates</div>
              <div className={`text-2xl font-bold ${missingDates > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {missingDates}
              </div>
            </div>
            <div className="p-4 border rounded bg-background">
              <div className="text-sm text-foreground">Missing Prices</div>
              <div className={`text-2xl font-bold ${missingPrices > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {missingPrices}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" onClick={onCancel}>Upload Different File</Button>
            <Button 
              onClick={onConfirm} 
              variant={status === 'critical' ? 'destructive' : 'default'}
            >
              {status === 'critical' ? 'Proceed Anyway' : 'Generate Reports'}
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
