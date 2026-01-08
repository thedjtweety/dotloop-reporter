import { useMemo } from 'react';
import { DotloopRecord } from '@/lib/csvParser';
import { analyzeDataHealth, DataIssue } from '@/lib/dataHealth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataHealthCheckProps {
  records: DotloopRecord[];
}

export default function DataHealthCheck({ records }: DataHealthCheckProps) {
  const report = useMemo(() => analyzeDataHealth(records), [records]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-4xl font-bold ${getScoreColor(report.score)}`}>
                {report.score}%
              </span>
              {report.score >= 90 ? (
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              ) : report.score >= 70 ? (
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500" />
              )}
            </div>
            <Progress value={report.score} className="h-2" indicatorClassName={getScoreProgressColor(report.score)} />
            <p className="text-xs text-muted-foreground mt-2">
              Based on completeness of critical fields
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Records Analyzed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{report.totalRecords}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 bg-emerald-500/10">
                {report.healthyRecords} Healthy
              </Badge>
              <Badge variant="outline" className="border-red-500/20 text-red-500 bg-red-500/10">
                {report.issues.length} Issues
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Missing Fields
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(report.missingFieldCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([field, count]) => (
                  count > 0 && (
                    <div key={field} className="flex justify-between items-center text-sm">
                      <span className="capitalize text-muted-foreground">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="font-medium text-foreground">{count}</span>
                    </div>
                  )
                ))}
              {Object.values(report.missingFieldCounts).every(c => c === 0) && (
                <div className="text-sm text-muted-foreground italic">No missing fields found</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Issues List */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Data Quality Issues</CardTitle>
          <CardDescription>
            Review transactions with missing information to improve report accuracy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {report.issues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-lg font-medium text-foreground">All Clear!</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                Your data looks great. All critical and recommended fields are populated.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Missing Fields</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.issues.map((issue) => (
                    <TableRow key={issue.recordId}>
                      <TableCell className="font-medium text-foreground">
                        {issue.loopName}
                      </TableCell>
                      <TableCell>
                        {issue.severity === 'critical' ? (
                          <Badge variant="destructive" className="flex w-fit items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Critical
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex w-fit items-center gap-1 text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20">
                            <AlertTriangle className="h-3 w-3" /> Warning
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {issue.missingFields.map((field) => (
                            <Badge key={field} variant="outline" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
