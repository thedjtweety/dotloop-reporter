import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ValidationReport, ValidationIssue } from '@/lib/csvValidation';

interface CSVValidationReportModalProps {
  isOpen: boolean;
  report: ValidationReport | null;
  onClose: () => void;
  onProceed: () => void;
  isLoading?: boolean;
}

export function CSVValidationReportModal({
  isOpen,
  report,
  onClose,
  onProceed,
  isLoading = false,
}: CSVValidationReportModalProps) {
  const [expandedIssues, setExpandedIssues] = useState<string[]>([]);

  if (!isOpen || !report) return null;

  const toggleIssue = (field: string) => {
    setExpandedIssues(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 90) return 'text-emerald-500';
    if (quality >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getQualityBgColor = (quality: number) => {
    if (quality >= 90) return 'bg-emerald-500/10';
    if (quality >= 70) return 'bg-yellow-500/10';
    return 'bg-red-500/10';
  };

  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const canProceed = report.overallQuality >= 70 || report.criticalIssues === 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Data Quality Report</h2>
            <p className="text-sm text-foreground/70 mt-1">{report.fileName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-foreground/50 hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Overall Quality Summary */}
          <div className={`${getQualityBgColor(report.overallQuality)} border border-border rounded-lg p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Overall Data Quality</h3>
              <div className={`text-4xl font-bold ${getQualityColor(report.overallQuality)}`}>
                {report.overallQuality.toFixed(0)}%
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-foreground/70">Total Records</p>
                <p className="text-xl font-semibold text-foreground">{report.totalRecords}</p>
              </div>
              <div>
                <p className="text-foreground/70">Valid Records</p>
                <p className="text-xl font-semibold text-emerald-500">{report.validRecords}</p>
              </div>
              <div>
                <p className="text-foreground/70">With Issues</p>
                <p className="text-xl font-semibold text-yellow-500">{report.recordsWithIssues}</p>
              </div>
            </div>
          </div>

          {/* Field Completeness */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Field Completeness</h3>
            <div className="space-y-3">
              {report.fieldCompleteness.map((field) => (
                <div key={field.field}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{field.field}</span>
                    <span className={`text-sm font-semibold ${getQualityColor(field.percentage)}`}>
                      {field.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        field.percentage >= 90
                          ? 'bg-emerald-500'
                          : field.percentage >= 70
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${field.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues and Suggestions */}
          {report.issues.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Issues Found ({report.criticalIssues} critical, {report.warnings} warnings)
              </h3>
              <div className="space-y-3">
                {report.issues.map((issue) => (
                  <Card
                    key={issue.field}
                    className="border-border bg-card/50 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleIssue(issue.field)}
                      className="w-full p-4 flex items-center justify-between hover:bg-card/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {getSeverityIcon(issue.severity)}
                        <div className="text-left">
                          <p className="font-semibold text-foreground">{issue.field}</p>
                          <p className="text-sm text-foreground/70">
                            {issue.count} record{issue.count !== 1 ? 's' : ''} affected ({issue.percentage.toFixed(0)}%)
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-foreground/50 transition-transform ${
                          expandedIssues.includes(issue.field) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {expandedIssues.includes(issue.field) && (
                      <div className="border-t border-border bg-background/50 p-4 space-y-3">
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Suggestion:</p>
                          <p className="text-sm text-foreground/70">{issue.suggestion}</p>
                        </div>
                        {issue.examples.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-foreground mb-2">Examples:</p>
                            <div className="bg-muted rounded p-2 text-xs text-foreground/70 space-y-1 max-h-24 overflow-y-auto">
                              {issue.examples.map((example, idx) => (
                                <div key={idx}>• {example}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Success Message */}
          {report.issues.length === 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-600">Perfect! Your data looks great</p>
                <p className="text-sm text-emerald-600/70">No issues detected. Ready to proceed with analysis.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border p-6 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={onProceed}
            disabled={isLoading || (!canProceed && report.criticalIssues > 0)}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? 'Processing...' : canProceed ? 'Proceed with Analysis' : 'Fix Issues First'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CSVValidationReportModal;
