import { describe, expect, it } from 'vitest';
import { fieldCompletenessMap, inferReportingPeriod } from './importRunHelpers';

describe('import run helpers', () => {
  it('infers a stable reporting window from valid CSV record dates', () => {
    expect(inferReportingPeriod([
      { closingDate: '2026-03-18' },
      { createdDate: '2026-01-03' },
      { listingDate: '2026-02-11' },
    ] as any)).toEqual({
      label: '2026-01-03 to 2026-03-18', periodStart: '2026-01-03', periodEnd: '2026-03-18',
    });
  });

  it('retains only data-quality fields and percentages for an import run', () => {
    expect(fieldCompletenessMap([
      { fieldName: 'agents', completenessPercentage: 94 },
      { fieldName: 'closingDate', completenessPercentage: 71 },
    ])).toEqual({ agents: 94, closingDate: 71 });
  });
});
