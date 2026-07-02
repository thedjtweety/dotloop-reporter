/**
 * Tests for the sparse-data failsafe and data hygiene system.
 * Verifies that fieldCompletenessAnalysis correctly scores fields,
 * surfaces hygiene recommendations, and identifies degraded features.
 */

import { describe, it, expect } from 'vitest';
import { analyzeFieldCompleteness, getDegradedFeatures } from '../client/src/lib/fieldCompletenessAnalysis';
import type { DotloopRecord } from '../client/src/lib/csvParser';

// Helper to create a minimal sparse record
function makeRecord(overrides: Partial<DotloopRecord> = {}): DotloopRecord {
  return {
    loopId: '',
    loopViewUrl: '',
    loopName: '',
    loopStatus: '',
    createdDate: '',
    closingDate: '',
    listingDate: '',
    offerDate: '',
    address: '',
    price: 0,
    propertyType: '',
    bedrooms: 0,
    bathrooms: 0,
    squareFootage: 0,
    city: '',
    state: '',
    county: '',
    leadSource: '',
    earnestMoney: 0,
    salePrice: 0,
    commissionRate: 0,
    commissionTotal: 0,
    agents: '',
    createdBy: '',
    buySideCommission: 0,
    sellSideCommission: 0,
    companyDollar: 0,
    referralSource: '',
    referralPercentage: 0,
    complianceStatus: '',
    tags: [],
    originalPrice: 0,
    yearBuilt: 0,
    lotSize: 0,
    subdivision: '',
    ...overrides,
  };
}

describe('analyzeFieldCompleteness', () => {
  it('returns zero completeness for empty records array', () => {
    const report = analyzeFieldCompleteness([]);
    expect(report.overallCompleteness).toBe(0);
    expect(report.totalRecords).toBe(0);
    expect(report.fields).toHaveLength(0);
  });

  it('returns 100% completeness when all critical fields are populated', () => {
    const records: DotloopRecord[] = [
      makeRecord({
        loopName: 'Test Loop',
        loopStatus: 'Closed',
        price: 500000,
        closingDate: '2024-01-15',
        agents: 'John Smith',
        address: '123 Main St',
        city: 'Austin',
        state: 'TX',
        commissionTotal: 15000,
        commissionRate: 3,
        leadSource: 'Referral',
      }),
    ];
    const report = analyzeFieldCompleteness(records);
    expect(report.overallCompleteness).toBe(100);
    report.fields.forEach(f => {
      expect(f.completenessPercentage).toBe(100);
      expect(f.status).toBe('excellent');
    });
  });

  it('marks commission as critical when all records have zero commission', () => {
    const records: DotloopRecord[] = Array.from({ length: 10 }, () =>
      makeRecord({ loopName: 'Test', loopStatus: 'Closed', price: 500000, agents: 'Agent A', commissionTotal: 0 })
    );
    const report = analyzeFieldCompleteness(records);
    const commissionField = report.fields.find(f => f.fieldName === 'commissionTotal');
    expect(commissionField).toBeDefined();
    expect(commissionField!.completenessPercentage).toBe(0);
    expect(commissionField!.status).toBe('critical');
  });

  it('marks lead source as warning when only 60% of records have it', () => {
    const records: DotloopRecord[] = [
      ...Array.from({ length: 6 }, () => makeRecord({ leadSource: 'Referral' })),
      ...Array.from({ length: 4 }, () => makeRecord({ leadSource: '' })),
    ];
    const report = analyzeFieldCompleteness(records);
    const leadField = report.fields.find(f => f.fieldName === 'leadSource');
    expect(leadField).toBeDefined();
    expect(leadField!.completenessPercentage).toBe(60);
    expect(leadField!.status).toBe('warning');
  });

  it('includes impact and howToFix for every field', () => {
    const records = [makeRecord({ loopName: 'Test' })];
    const report = analyzeFieldCompleteness(records);
    report.fields.forEach(f => {
      expect(f.impact).toBeTruthy();
      expect(f.howToFix).toBeTruthy();
      expect(f.affectedFeatures.length).toBeGreaterThan(0);
    });
  });

  it('calculates overall completeness as average of all field percentages', () => {
    // 5 records: all have loopName, none have anything else
    const records = Array.from({ length: 5 }, () => makeRecord({ loopName: 'Test' }));
    const report = analyzeFieldCompleteness(records);
    // loopName = 100%, all others = 0% → average = 100/10 = 10%
    expect(report.overallCompleteness).toBe(10);
  });
});

describe('getDegradedFeatures', () => {
  it('returns empty map when all fields are complete', () => {
    const records: DotloopRecord[] = [
      makeRecord({
        loopName: 'Test',
        loopStatus: 'Closed',
        price: 500000,
        closingDate: '2024-01-15',
        agents: 'John Smith',
        address: '123 Main St',
        city: 'Austin',
        state: 'TX',
        commissionTotal: 15000,
        commissionRate: 3,
        leadSource: 'Referral',
      }),
    ];
    const degraded = getDegradedFeatures(records);
    expect(degraded.size).toBe(0);
  });

  it('returns degraded features when commission data is missing', () => {
    const records = Array.from({ length: 10 }, () =>
      makeRecord({ loopName: 'Test', loopStatus: 'Closed', commissionTotal: 0 })
    );
    const degraded = getDegradedFeatures(records);
    // Commission affects: Financial tab, Commission Breakdown, Net Commission Report, Revenue Distribution
    expect(degraded.has('Financial tab')).toBe(true);
    expect(degraded.has('Net Commission Report')).toBe(true);
  });

  it('returns degraded features when state data is missing', () => {
    const records = Array.from({ length: 10 }, () =>
      makeRecord({ loopName: 'Test', state: '' })
    );
    const degraded = getDegradedFeatures(records);
    expect(degraded.has('Geographic chart')).toBe(true);
  });

  it('returns empty map for empty records', () => {
    const degraded = getDegradedFeatures([]);
    expect(degraded.size).toBe(0);
  });

  it('does not flag features as degraded when completeness is 70% or above', () => {
    // 7 of 10 records have lead source → 70% → should NOT be flagged
    const records: DotloopRecord[] = [
      ...Array.from({ length: 7 }, () => makeRecord({ leadSource: 'Referral' })),
      ...Array.from({ length: 3 }, () => makeRecord({ leadSource: '' })),
    ];
    const degraded = getDegradedFeatures(records);
    expect(degraded.has('Lead Source chart')).toBe(false);
  });
});
