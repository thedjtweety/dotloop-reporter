import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { matchHeaders, MatchingResult, getFormatSignature } from '@/lib/header-matcher';
import { ColumnMappingSelector } from './ColumnMappingSelector';
import { getMappingBySignature, saveMappingProfile } from '@/lib/mapping-cache';

interface CSVPreviewIntegratedProps {
  onUpload: (data: any[], mappings: Record<string, string | null>) => void;
  onCancel?: () => void;
}

export const CSVPreviewIntegrated: React.FC<CSVPreviewIntegratedProps> = ({
  onUpload,
  onCancel,
}) => {
  const [csvData, setCsvData] = useState<any[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [headerMatch, setHeaderMatch] = useState<MatchingResult | null>(null);
  const [userMappings, setUserMappings] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formatSignature, setFormatSignature] = useState<string | null>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        try {
          if (results.data.length === 0) {
            setError('CSV file is empty');
            setLoading(false);
            return;
          }

          const extractedHeaders = Object.keys(results.data[0] || {});
          setHeaders(extractedHeaders);
          setCsvData(results.data);

          // Run header matcher
          const match = matchHeaders(extractedHeaders);
          setHeaderMatch(match);

          // Generate format signature
          const signature = getFormatSignature(extractedHeaders);
          setFormatSignature(signature);

          // Check for cached mapping
          const cachedMapping = getMappingBySignature(signature);
          if (cachedMapping) {
            setUserMappings(cachedMapping.mappings);
          } else {
            setUserMappings({});
          }

          setLoading(false);
        } catch (err) {
          setError(`Error parsing CSV: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setLoading(false);
        }
      },
      error: (error: any) => {
        setError(`Error reading file: ${error.message}`);
        setLoading(false);
      },
    });
  }, []);

  const handleMappingChange = useCallback(
    (originalHeader: string, mappedField: string | null) => {
      setUserMappings(prev => ({
        ...prev,
        [originalHeader]: mappedField,
      }));
    },
    []
  );

  const handleConfirmMapping = useCallback(() => {
    if (!csvData || !headerMatch || !formatSignature) return;

    // Save mapping to cache
    saveMappingProfile(formatSignature, userMappings);

    // Call onUpload with data and mappings
    onUpload(csvData, userMappings);
  }, [csvData, headerMatch, formatSignature, userMappings, onUpload]);

  const handleUpload = useCallback(() => {
    if (!csvData || !headerMatch) return;

    // If mapping is needed but not confirmed, show error
    if (headerMatch.needsUserMapping && Object.keys(userMappings).length === 0) {
      setError('Please map the required columns before uploading');
      return;
    }

    handleConfirmMapping();
  }, [csvData, headerMatch, userMappings, handleConfirmMapping]);

  return (
    <div className="space-y-4">
      {/* File Input */}
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 dark:border-gray-600">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          disabled={loading}
          className="w-full cursor-pointer"
        />
        {loading && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Processing file...</p>}
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Confidence Score */}
      {headerMatch && (
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Format Confidence: {headerMatch.overallConfidence}%
              </h3>
              {headerMatch.overallConfidence === 100 ? (
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ✓ Perfect match! No mapping needed.
                </p>
              ) : headerMatch.overallConfidence >= 90 ? (
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ✓ Good match! Ready to process.
                </p>
              ) : (
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ⚠ Some columns need clarification below.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conditional Mapping UI */}
      {headerMatch && headerMatch.needsUserMapping && (
        <ColumnMappingSelector
          matches={headerMatch.matches}
          onMappingChange={handleMappingChange}
          onConfirm={handleConfirmMapping}
          confidence={headerMatch.overallConfidence}
        />
      )}

      {/* Preview Table */}
      {csvData && csvData.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                {headers.map(header => (
                  <th
                    key={header}
                    className="border-b border-gray-200 px-4 py-2 text-left font-semibold dark:border-gray-700"
                  >
                    <div className="flex flex-col">
                      <span>{header}</span>
                      {headerMatch && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {headerMatch.matches.find(m => m.originalHeader === header)?.matchedField
                            ? `→ ${headerMatch.matches.find(m => m.originalHeader === header)?.matchedField}`
                            : ''}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {csvData.slice(0, 5).map((row, idx) => (
                <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                  {headers.map(header => (
                    <td
                      key={`${idx}-${header}`}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300"
                    >
                      {String(row[header] || '').substring(0, 50)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {csvData.length > 5 && (
            <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-400">
              Showing 5 of {csvData.length} rows
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {csvData && (
        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            disabled={loading}
            className="flex-1 rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-800"
          >
            Upload CSV
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="rounded border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
};
