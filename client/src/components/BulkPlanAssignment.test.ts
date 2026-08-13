import { describe, expect, it } from 'vitest';
import { buildBulkPlanReplacements } from '@/lib/bulkPlanAssignments';

describe('buildBulkPlanReplacements', () => {
  it('replaces only selected agents while retaining their existing assignment identity and metadata', () => {
    const result = buildBulkPlanReplacements(
      new Set(['Sarah Miller']),
      'plan-growth',
      [{ id: 'assignment-1', agentName: 'Sarah Miller', planId: 'plan-old', teamId: 'team-a', anniversaryDate: '05-01' }],
      '2026-08-13',
    );
    expect(result).toEqual([{
      id: 'assignment-1',
      agentName: 'Sarah Miller',
      planId: 'plan-growth',
      teamId: 'team-a',
      anniversaryDate: '05-01',
      startDate: '2026-08-13',
    }]);
  });

  it('creates assignments for newly selected agents without touching unselected agents', () => {
    const result = buildBulkPlanReplacements(
      ['David Martinez'],
      'plan-growth',
      [{ id: 'assignment-2', agentName: 'Other Agent', planId: 'plan-old' }],
      '2026-08-13',
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ agentName: 'David Martinez', planId: 'plan-growth', startDate: '2026-08-13' });
  });
});
