import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface CSVPreviewProps {
  file: File;
  onValidationComplete: (data: {
    preview: string[][];
    headers: string[];
    rowCount: number;
    issues: Array<{ type: string; message: string; suggestion?: string }>;
  }) => void;
}

/**
 * CSV Preview Component
 * Shows file preview and pre-upload validation
 */
export function CSVPreview({ file, onValidationComplete }: CSVPreviewProps) {
  const [preview, setPreview] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowCount, setRowCount] = useState(0);

  useEffect(() => {
    const readFile = async () => {
      try {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length === 0) {
          setIssues([{ type: 'error', message: 'CSV file is empty' }]);
          setLoading(false);
          return;
        }

        // Parse headers
        const headerLine = lines[0];
        const parsedHeaders = parseCSVLine(headerLine);
        setHeaders(parsedHeaders);

        // Check for duplicate headers
        const headerSet = new Set<string>();
        const duplicateIssues: any[] = [];
        parsedHeaders.forEach((h, i) => {
          const normalized = h.toLowerCase().trim();
          if (headerSet.has(normalized)) {
            duplicateIssues.push({
              type: 'warning',
              message: `Duplicate column header: "${h}"`,
              suggestion: 'Remove or rename duplicate columns',
            });
          }
          headerSet.add(normalized);
        });

        // Parse first 5 data rows for preview
        const previewRows: string[][] = [];
        const dataIssues: any[] = [...duplicateIssues];

        for (let i = 1; i < Math.min(6, lines.length); i++) {
          const row = parseCSVLine(lines[i]);
          previewRows.push(row);

          // Check for empty rows
          if (row.every(cell => !cell.trim())) {
            dataIssues.push({
              type: 'warning',
              message: `Row ${i} is empty`,
            });
          }

          // Check for mismatched column count
          if (row.length !== parsedHeaders.length) {
            dataIssues.push({
              type: 'warning',
              message: `Row ${i} has ${row.length} columns but header has ${parsedHeaders.length}`,
              suggestion: 'Ensure all rows have the same number of columns as the header',
            });
          }
        }

        // Check for required fields (Loop Name, Address)
        const requiredFields = ['Loop Name', 'Address', 'loopname', 'address', 'property_address'];
        const hasRequired = parsedHeaders.some(h => 
          requiredFields.some(rf => rf.toLowerCase() === h.toLowerCase())
        );

        if (!hasRequired) {
          dataIssues.push({
            type: 'error',
            message: 'Missing required columns: "Loop Name" and "Address"',
            suggestion: 'Your CSV must include Loop Name and Address columns',
          });
        }

        // Check for encoding issues
        if (text.includes('\ufffd')) {
          dataIssues.push({
            type: 'warning',
            message: 'File may have encoding issues',
            suggestion: 'Save your CSV as UTF-8 encoding',
          });
        }

        setPreview(previewRows);
        setRowCount(lines.length - 1);
        setIssues(dataIssues);
        setLoading(false);

        onValidationComplete({
          preview: previewRows,
          headers: parsedHeaders,
          rowCount: lines.length - 1,
          issues: dataIssues,
        });
      } catch (error) {
        setIssues([{
          type: 'error',
          message: `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }]);
        setLoading(false);
      }
    };

    readFile();
  }, [file, onValidationComplete]);

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  const infoCount = issues.filter(i => i.type === 'info').length;

  return (
    <div className="space-y-6">
      {/* File Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">File Summary</h3>
            <p className="text-sm text-blue-800 mt-1">
              {rowCount} rows, {headers.length} columns
            </p>
          </div>
        </div>
      </div>

      {/* Issues Summary */}
      {issues.length > 0 && (
        <div className="space-y-3">
          {errorCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">{errorCount} Error{errorCount !== 1 ? 's' : ''}</h3>
                  <div className="text-sm text-red-800 mt-2 space-y-1">
                    {issues.filter(i => i.type === 'error').map((issue, idx) => (
                      <div key={idx}>
                        <p>{issue.message}</p>
                        {issue.suggestion && <p className="text-xs italic mt-1">💡 {issue.suggestion}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {warningCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900">{warningCount} Warning{warningCount !== 1 ? 's' : ''}</h3>
                  <div className="text-sm text-yellow-800 mt-2 space-y-1">
                    {issues.filter(i => i.type === 'warning').map((issue, idx) => (
                      <div key={idx}>
                        <p>{issue.message}</p>
                        {issue.suggestion && <p className="text-xs italic mt-1">💡 {issue.suggestion}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Data Preview */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900">Data Preview (First 5 rows)</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-2 text-left font-semibold text-gray-700 whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, rowIdx) => (
                <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className="px-4 py-2 text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis max-w-xs"
                      title={cell}
                    >
                      {cell || '(empty)'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ready to Upload */}
      {errorCount === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">Ready to Upload</h3>
              <p className="text-sm text-green-800 mt-1">
                This file is ready to be processed. {warningCount > 0 && `${warningCount} warning(s) will be handled gracefully.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
