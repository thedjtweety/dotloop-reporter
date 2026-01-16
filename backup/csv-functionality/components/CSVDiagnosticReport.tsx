import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, Download } from 'lucide-react';

interface Issue {
  rowNumber: number;
  type: string;
  field: string;
  message: string;
  suggestion?: string;
}

interface DiagnosticReportProps {
  validRows: number;
  skippedRows: number;
  totalRows: number;
  dataQualityScore: number;
  issues: Issue[];
  suggestions: string[];
  warnings: string[];
}

/**
 * CSV Diagnostic Report Component
 * Shows detailed analysis of uploaded CSV data
 */
export function CSVDiagnosticReport({
  validRows,
  skippedRows,
  totalRows,
  dataQualityScore,
  issues,
  suggestions,
  warnings,
}: DiagnosticReportProps) {
  const errorIssues = issues.filter(i => i.type === 'error');
  const warningIssues = issues.filter(i => i.type === 'warning');

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const downloadReport = () => {
    const reportContent = generatePlainTextReport();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportContent));
    element.setAttribute('download', `csv-diagnostic-report-${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generatePlainTextReport = () => {
    const lines: string[] = [];
    lines.push('=== CSV DIAGNOSTIC REPORT ===\n');
    lines.push(`Generated: ${new Date().toLocaleString()}\n`);
    lines.push('--- SUMMARY ---');
    lines.push(`Total Rows: ${totalRows}`);
    lines.push(`Valid Rows: ${validRows}`);
    lines.push(`Skipped Rows: ${skippedRows}`);
    lines.push(`Data Quality Score: ${dataQualityScore}%\n`);

    if (errorIssues.length > 0) {
      lines.push('--- ERRORS ---');
      errorIssues.forEach(issue => {
        lines.push(`Row ${issue.rowNumber}: ${issue.field} - ${issue.message}`);
        if (issue.suggestion) lines.push(`  Suggestion: ${issue.suggestion}`);
      });
      lines.push('');
    }

    if (warningIssues.length > 0) {
      lines.push('--- WARNINGS ---');
      warningIssues.forEach(issue => {
        lines.push(`Row ${issue.rowNumber}: ${issue.field} - ${issue.message}`);
        if (issue.suggestion) lines.push(`  Suggestion: ${issue.suggestion}`);
      });
      lines.push('');
    }

    if (suggestions.length > 0) {
      lines.push('--- SUGGESTIONS ---');
      suggestions.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
      lines.push('');
    }

    if (warnings.length > 0) {
      lines.push('--- WARNINGS ---');
      warnings.forEach((w, i) => lines.push(`${i + 1}. ${w}`));
    }

    return lines.join('\n');
  };

  return (
    <div className="space-y-6">
      {/* Header with Download Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Diagnostic Report</h2>
        <button
          onClick={downloadReport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Report
        </button>
      </div>

      {/* Quality Score */}
      <div className={`rounded-lg p-6 ${getScoreBgColor(dataQualityScore)}`}>
        <div className="flex items-center gap-4">
          <div className={`text-5xl font-bold ${getScoreColor(dataQualityScore)}`}>
            {dataQualityScore}%
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Data Quality Score</h3>
            <p className="text-sm text-gray-600 mt-1">
              {dataQualityScore >= 90
                ? 'Excellent data quality'
                : dataQualityScore >= 70
                  ? 'Good data quality with some issues'
                  : 'Poor data quality - review issues below'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-3xl font-bold text-green-600">{validRows}</div>
          <p className="text-sm text-gray-600 mt-1">Valid Rows</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-3xl font-bold text-red-600">{skippedRows}</div>
          <p className="text-sm text-gray-600 mt-1">Skipped Rows</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-600">{totalRows}</div>
          <p className="text-sm text-gray-600 mt-1">Total Rows</p>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Warnings</h3>
              <ul className="text-sm text-red-800 mt-2 space-y-1">
                {warnings.map((warning, idx) => (
                  <li key={idx}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Suggestions for Better Data</h3>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                {suggestions.map((suggestion, idx) => (
                  <li key={idx}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Error Issues */}
      {errorIssues.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Errors ({errorIssues.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {errorIssues.map((issue, idx) => (
              <div key={idx} className="bg-red-50 border border-red-200 rounded p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900">
                      Row {issue.rowNumber}: {issue.field}
                    </p>
                    <p className="text-sm text-red-800 mt-1">{issue.message}</p>
                    {issue.suggestion && (
                      <p className="text-xs text-red-700 italic mt-1">💡 {issue.suggestion}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning Issues */}
      {warningIssues.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Warnings ({warningIssues.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {warningIssues.slice(0, 10).map((issue, idx) => (
              <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-900">
                      Row {issue.rowNumber}: {issue.field}
                    </p>
                    <p className="text-sm text-yellow-800 mt-1">{issue.message}</p>
                    {issue.suggestion && (
                      <p className="text-xs text-yellow-700 italic mt-1">💡 {issue.suggestion}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {warningIssues.length > 10 && (
              <p className="text-sm text-gray-600 text-center py-2">
                ... and {warningIssues.length - 10} more warnings
              </p>
            )}
          </div>
        </div>
      )}

      {/* Success Message */}
      {errorIssues.length === 0 && validRows > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">Upload Successful</h3>
              <p className="text-sm text-green-800 mt-1">
                {validRows} rows have been processed and added to your report.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
