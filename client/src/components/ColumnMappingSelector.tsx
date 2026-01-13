import React, { useState } from 'react';
import { HeaderMatch, STANDARD_FIELDS } from '@/lib/header-matcher';

interface ColumnMappingSelectorProps {
  matches: HeaderMatch[];
  onMappingChange: (originalHeader: string, mappedField: string | null) => void;
  onConfirm: () => void;
  confidence: number;
}

export const ColumnMappingSelector: React.FC<ColumnMappingSelectorProps> = ({
  matches,
  onMappingChange,
  onConfirm,
  confidence,
}) => {
  const [userMappings, setUserMappings] = useState<Record<string, string | null>>({});

  // Filter to only show columns that need mapping
  const needsMappingColumns = matches.filter(m => m.needsMapping);

  if (needsMappingColumns.length === 0) {
    return null;
  }

  const handleMappingChange = (originalHeader: string, field: string | null) => {
    setUserMappings(prev => ({
      ...prev,
      [originalHeader]: field,
    }));
    onMappingChange(originalHeader, field);
  };

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
      <div className="mb-4">
        <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
          Column Mapping Needed
        </h3>
        <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-200">
          We detected {needsMappingColumns.length} column{needsMappingColumns.length !== 1 ? 's' : ''} that need clarification.
          Please map them to the correct fields:
        </p>
      </div>

      <div className="space-y-3">
        {needsMappingColumns.map(match => (
          <div key={match.originalHeader} className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {match.originalHeader}
              </div>
              {match.confidence > 0 && match.confidence < 90 && (
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Suggested: {match.matchedField} ({match.confidence}% confidence)
                </div>
              )}
            </div>

            <select
              value={userMappings[match.originalHeader] ?? match.matchedField ?? ''}
              onChange={e =>
                handleMappingChange(match.originalHeader, e.target.value || null)
              }
              className="rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">-- Skip this column --</option>
              {Object.entries(STANDARD_FIELDS).map(([fieldKey, fieldDef]) => (
                <option key={fieldKey} value={fieldKey}>
                  {fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1)}
                  {fieldDef.required ? ' (Required)' : ''}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onConfirm}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          Confirm Mapping
        </button>
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
          Overall Confidence: {confidence}%
        </div>
      </div>
    </div>
  );
};
