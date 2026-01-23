import { DotloopRecord } from './csvParser';

export interface FieldCompleteness {
  fieldName: string;
  displayName: string;
  totalRecords: number;
  completedRecords: number;
  completenessPercentage: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface CompletenessReport {
  fields: FieldCompleteness[];
  overallCompleteness: number;
  totalRecords: number;
}

const CRITICAL_FIELDS = [
  { key: 'loopName', displayName: 'Loop Name' },
  { key: 'loopStatus', displayName: 'Status' },
  { key: 'price', displayName: 'Price' },
  { key: 'closingDate', displayName: 'Closing Date' },
  { key: 'agents', displayName: 'Agent' },
  { key: 'address', displayName: 'Address' },
  { key: 'city', displayName: 'City' },
  { key: 'state', displayName: 'State' },
  { key: 'commissionTotal', displayName: 'Commission' },
  { key: 'leadSource', displayName: 'Lead Source' },
];

function getStatus(percentage: number): 'excellent' | 'good' | 'warning' | 'critical' {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 70) return 'good';
  if (percentage >= 50) return 'warning';
  return 'critical';
}

function isFieldPopulated(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return value !== 0;
  return !!value;
}

export function analyzeFieldCompleteness(records: DotloopRecord[]): CompletenessReport {
  if (records.length === 0) {
    return {
      fields: [],
      overallCompleteness: 0,
      totalRecords: 0,
    };
  }

  const fields: FieldCompleteness[] = CRITICAL_FIELDS.map((field) => {
    const completedRecords = records.filter((record) => {
      const value = record[field.key as keyof DotloopRecord];
      return isFieldPopulated(value);
    }).length;

    const completenessPercentage = Math.round((completedRecords / records.length) * 100);

    return {
      fieldName: field.key,
      displayName: field.displayName,
      totalRecords: records.length,
      completedRecords,
      completenessPercentage,
      status: getStatus(completenessPercentage),
    };
  });

  // Calculate overall completeness (average of all fields)
  const overallCompleteness = Math.round(
    fields.reduce((sum, field) => sum + field.completenessPercentage, 0) / fields.length
  );

  return {
    fields,
    overallCompleteness,
    totalRecords: records.length,
  };
}
