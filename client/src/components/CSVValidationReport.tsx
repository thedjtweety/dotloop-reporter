import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export interface ValidationIssue {
  field: string;
  severity: 'error' | 'warning' | 'info';
  count: number;
  percentage: number;
  examples: string[];
  suggestion: string;
}

export interface ValidationReport {
  fileName: string;
  totalRecords: number;
  validRecords: number;
  recordsWithIssues: number;
  overallQuality: number;
  fieldCompleteness: {
    field: string;
    complete: number;
    percentage: number;
  }[];
  issues: ValidationIssue[];
  criticalIssues: number;
  warnings: number;
}

interface CSVValidationReportProps {
  report: ValidationReport;
  onProceed?: () => void;
  onReview?: () => void;
}

export default function CSVValidationReport({
  report,
  onProceed,
  onReview
}: CSVValidationReportProps) {
  const getQualityColor = (quality: number) => {
    if (quality >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (quality >= 75) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getQualityBadge = (quality: number) => {
    if (quality >= 90) return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
    if (quality >= 75) return 'bg-amber-500/10 text-amber-700 dark:text-amber-400';
    return 'bg-red-500/10 text-red-700 dark:text-red-400';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'warning':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400';
      case 'info':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      default:
        return '';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Data Quality Report</h2>
        <p className="text-foreground/70">{report.fileName}</p>
      </div>

      {/* Overall Quality Score */}
      <Card className="p-6 bg-card/50 border-border">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Overall Data Quality</h3>
              <p className="text-sm text-foreground/70">
                {report.validRecords} of {report.totalRecords} records are valid
              </p>
            </div>
            <div className={`text-3xl font-bold ${getQualityColor(report.overallQuality)}`}>
              {report.overallQuality}%
            </div>
          </div>
          <Progress value={report.overallQuality} className="h-2" />
          <div className="flex items-center gap-2">
            <Badge className={getQualityBadge(report.overallQuality)}>
              {report.overallQuality >= 90
                ? '✓ Excellent'
                : report.overallQuality >= 75
                ? '⚠ Good'
                : '✗ Needs Review'}
            </Badge>
            {report.overallQuality >= 90 && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                Ready to import with minimal issues
              </span>
            )}
            {report.overallQuality >= 75 && report.overallQuality < 90 && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Can import but review warnings
              </span>
            )}
            {report.overallQuality < 75 && (
              <span className="text-xs text-red-600 dark:text-red-400">
                Address critical issues before importing
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-card/50 border-border">
          <div className="space-y-2">
            <p className="text-xs text-foreground/60 uppercase tracking-wide">Total Records</p>
            <p className="text-2xl font-bold text-foreground">{report.totalRecords.toLocaleString()}</p>
          </div>
        </Card>
        <Card className="p-4 bg-card/50 border-border">
          <div className="space-y-2">
            <p className="text-xs text-foreground/60 uppercase tracking-wide">Valid Records</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {report.validRecords.toLocaleString()}
            </p>
          </div>
        </Card>
        <Card className="p-4 bg-card/50 border-border">
          <div className="space-y-2">
            <p className="text-xs text-foreground/60 uppercase tracking-wide">Issues Found</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {report.criticalIssues + report.warnings}
            </p>
          </div>
        </Card>
      </div>

      {/* Field Completeness */}
      <Card className="p-6 bg-card/50 border-border">
        <h3 className="font-semibold text-foreground mb-4">Field Completeness</h3>
        <div className="space-y-4">
          {report.fieldCompleteness.map((field, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">{field.field}</span>
                <span className={`text-sm font-bold ${
                  field.percentage >= 90
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : field.percentage >= 70
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {field.percentage}%
                </span>
              </div>
              <Progress value={field.percentage} className="h-1.5" />
              <p className="text-xs text-foreground/60">
                {field.complete} of {report.totalRecords} records complete
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Issues */}
      {report.issues.length > 0 && (
        <Card className="p-6 bg-card/50 border-border">
          <h3 className="font-semibold text-foreground mb-4">Data Quality Issues</h3>
          <div className="space-y-4">
            {report.issues.map((issue, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-border bg-background/50 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{issue.field}</h4>
                      <p className="text-sm text-foreground/70 mt-1">{issue.suggestion}</p>
                    </div>
                  </div>
                  <Badge className={getSeverityColor(issue.severity)}>
                    {issue.count} ({issue.percentage}%)
                  </Badge>
                </div>

                {issue.examples.length > 0 && (
                  <div className="space-y-2 pl-7">
                    <p className="text-xs font-medium text-foreground/60">Examples:</p>
                    <div className="space-y-1">
                      {issue.examples.map((example, exIdx) => (
                        <code
                          key={exIdx}
                          className="block text-xs bg-background p-2 rounded border border-border/50 text-foreground/70 font-mono"
                        >
                          {example}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {(report.criticalIssues > 0 || report.warnings > 0) && (
        <Card className="p-6 bg-amber-500/5 border-amber-500/20">
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Recommendations
            </h3>
            <ul className="space-y-2 text-sm text-foreground/70">
              {report.criticalIssues > 0 && (
                <li className="flex gap-2">
                  <span className="text-amber-600 dark:text-amber-400">•</span>
                  <span>
                    Fix the {report.criticalIssues} critical error{report.criticalIssues !== 1 ? 's' : ''} before importing
                  </span>
                </li>
              )}
              {report.warnings > 0 && (
                <li className="flex gap-2">
                  <span className="text-amber-600 dark:text-amber-400">•</span>
                  <span>
                    Review the {report.warnings} warning{report.warnings !== 1 ? 's' : ''} for potential issues
                  </span>
                </li>
              )}
              <li className="flex gap-2">
                <span className="text-amber-600 dark:text-amber-400">•</span>
                <span>
                  Aim for 90%+ field completeness for accurate reporting
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-600 dark:text-amber-400">•</span>
                <span>
                  Use the Data Health tab after import to identify specific problematic records
                </span>
              </li>
            </ul>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {onReview && (
          <Button
            variant="outline"
            onClick={onReview}
            className="flex-1"
          >
            Review CSV
          </Button>
        )}
        {onProceed && (
          <Button
            onClick={onProceed}
            disabled={report.criticalIssues > 0}
            className="flex-1"
          >
            {report.criticalIssues > 0
              ? 'Fix Issues First'
              : 'Proceed with Import'}
          </Button>
        )}
      </div>
    </div>
  );
}
