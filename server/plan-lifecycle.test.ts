import { describe, expect, it } from 'vitest';
import { isPlanVersionEligible, latestPlanVersions } from './lib/plan-lifecycle';

describe('commission plan lifecycle eligibility', () => {
  const base = { planId: 'plan-a', planSnapshot: '{}' };

  it('uses the newest version of each plan', () => {
    const latest = latestPlanVersions([
      { ...base, versionNumber: 1, lifecycle: 'active' as const },
      { ...base, versionNumber: 2, lifecycle: 'draft' as const },
    ]);
    expect(latest.get('plan-a')?.versionNumber).toBe(2);
  });

  it('allows only active plans inside their effective-date window', () => {
    expect(isPlanVersionEligible({ ...base, versionNumber: 1, lifecycle: 'active', effectiveStartDate: '2026-01-01', effectiveEndDate: '2026-12-31' }, '2026-06-15')).toBe(true);
    expect(isPlanVersionEligible({ ...base, versionNumber: 1, lifecycle: 'draft', effectiveStartDate: '2026-01-01' }, '2026-06-15')).toBe(false);
    expect(isPlanVersionEligible({ ...base, versionNumber: 1, lifecycle: 'active', effectiveStartDate: '2026-07-01' }, '2026-06-15')).toBe(false);
  });
});
