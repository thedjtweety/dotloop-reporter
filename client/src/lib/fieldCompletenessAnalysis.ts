import { DotloopRecord } from './csvParser';

export interface FieldCompleteness {
  fieldName: string;
  displayName: string;
  totalRecords: number;
  completedRecords: number;
  completenessPercentage: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  /** What this field unlocks in the tool */
  impact: string;
  /** Specific dotloop steps to populate this field */
  howToFix: string;
  /** Which features are degraded when this field is missing */
  affectedFeatures: string[];
}

export interface CompletenessReport {
  fields: FieldCompleteness[];
  overallCompleteness: number;
  totalRecords: number;
}

interface FieldDefinition {
  key: string;
  displayName: string;
  impact: string;
  howToFix: string;
  affectedFeatures: string[];
}

const CRITICAL_FIELDS: FieldDefinition[] = [
  {
    key: 'loopName',
    displayName: 'Loop Name',
    impact: 'Used as the primary identifier for every transaction in drill-down views.',
    howToFix: 'In Dotloop, every loop must have a name. Go to the loop and set the Loop Name field before exporting.',
    affectedFeatures: ['Drill-down modals', 'Agent Leaderboard', 'CDA Builder'],
  },
  {
    key: 'loopStatus',
    displayName: 'Status',
    impact: 'Drives pipeline breakdown, closing rate, and all status-based charts.',
    howToFix: 'In Dotloop, open each loop and set the Loop Status (Active, Under Contract, Closed, Archived). Include the "Loop Status" column when exporting.',
    affectedFeatures: ['Pipeline Chart', 'Closing Rate metric', 'Status Overview cards'],
  },
  {
    key: 'price',
    displayName: 'Sale Price',
    impact: 'Required for Total Sales Volume, Average Price, and all financial metrics.',
    howToFix: 'In Dotloop, open the loop → Financials section → set "Purchase/Sale Price". Include "Financials / Purchase/Sale Price" in your export columns.',
    affectedFeatures: ['Sales Volume metric', 'Average Price metric', 'Financial tab', 'Revenue charts'],
  },
  {
    key: 'closingDate',
    displayName: 'Closing Date',
    impact: 'Required for Days-to-Close calculation, Sales Timeline chart, and date filtering.',
    howToFix: 'In Dotloop, open the loop → Contract Dates section → set "Closing Date". Include "Contract Dates / Closing Date" in your export.',
    affectedFeatures: ['Days to Close metric', 'Sales Timeline chart', 'Date range filter'],
  },
  {
    key: 'agents',
    displayName: 'Agent Name(s)',
    impact: 'Required for Agent Leaderboard, commission assignment, and per-agent analytics.',
    howToFix: 'In Dotloop, open the loop → Parties section → add agents. Use comma-separated names for co-agents. Include "Agents" in your export columns.',
    affectedFeatures: ['Agent Leaderboard', 'Commission Assignment', 'Net Commission Report', 'Agent performance charts'],
  },
  {
    key: 'commissionTotal',
    displayName: 'Total Commission',
    impact: 'Required for the Financial tab, Commission Breakdown chart, and Net Commission Report.',
    howToFix: 'In Dotloop, open the loop → Financials → set "Sale Commission Total" or "Sale Commission Rate". Include "Financials / Sale Commission Total" in your export.',
    affectedFeatures: ['Financial tab', 'Commission Breakdown chart', 'Net Commission Report', 'Revenue Distribution chart'],
  },
  {
    key: 'commissionRate',
    displayName: 'Commission Rate (%)',
    impact: 'Used to calculate GCI and commission projections in the CDA Builder.',
    howToFix: 'In Dotloop, open the loop → Financials → set "Sale Commission Rate" as a percentage (e.g. 3%). Include "Financials / Sale Commission Rate" in your export.',
    affectedFeatures: ['CDA Builder', 'Commission Calculator', 'Net Commission Report'],
  },
  {
    key: 'leadSource',
    displayName: 'Lead Source',
    impact: 'Powers the Lead Source chart and referral analysis.',
    howToFix: 'In Dotloop, open the loop → Lead Source section → set the source. Include "Lead Source / Lead Source" in your export columns.',
    affectedFeatures: ['Lead Source chart', 'Referral analysis'],
  },
  {
    key: 'address',
    displayName: 'Property Address',
    impact: 'Used in drill-down tables and Geographic chart.',
    howToFix: 'In Dotloop, open the loop → Property Address section → fill in the full address. Include "Property Address / Full Address" in your export.',
    affectedFeatures: ['Geographic chart', 'Transaction drill-down tables'],
  },
  {
    key: 'state',
    displayName: 'State',
    impact: 'Required for the Geographic Distribution chart.',
    howToFix: 'In Dotloop, open the loop → Property Address → set State/Province. Include "Property Address / State/Prov" in your export.',
    affectedFeatures: ['Geographic chart'],
  },
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
      impact: field.impact,
      howToFix: field.howToFix,
      affectedFeatures: field.affectedFeatures,
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

/**
 * Returns a quick summary of which features are degraded given the current records.
 * Used to show inline banners on metric cards and charts.
 */
export function getDegradedFeatures(records: DotloopRecord[]): Map<string, { percentage: number; howToFix: string }> {
  const degraded = new Map<string, { percentage: number; howToFix: string }>();
  if (records.length === 0) return degraded;

  for (const field of CRITICAL_FIELDS) {
    const completedRecords = records.filter((r) => isFieldPopulated(r[field.key as keyof DotloopRecord])).length;
    const pct = Math.round((completedRecords / records.length) * 100);
    if (pct < 70) {
      for (const feature of field.affectedFeatures) {
        // Keep the worst (lowest) percentage for each feature
        const existing = degraded.get(feature);
        if (!existing || pct < existing.percentage) {
          degraded.set(feature, { percentage: pct, howToFix: field.howToFix });
        }
      }
    }
  }

  return degraded;
}
