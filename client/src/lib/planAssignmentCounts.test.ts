import { describe, expect, it } from 'vitest';
import { countAssignedAgentsByPlan } from './planAssignmentCounts';

describe('countAssignedAgentsByPlan', () => {
  it('counts unique assigned agents for each plan', () => {
    expect(countAssignedAgentsByPlan([
      { planId: 'standard', agentName: 'Alex Morgan' },
      { planId: 'standard', agentName: 'Jamie Lee' },
      { planId: 'premium', agentName: 'Sam Taylor' },
    ])).toEqual({ standard: 2, premium: 1 });
  });

  it('does not inflate counts for duplicate or incomplete assignments', () => {
    expect(countAssignedAgentsByPlan([
      { planId: 'standard', agentName: 'Alex Morgan' },
      { planId: 'standard', agentName: ' alex morgan ' },
      { planId: '', agentName: 'Jamie Lee' },
      { planId: 'premium', agentName: '' },
    ])).toEqual({ standard: 1 });
  });

  it('can scope counts to the agents present in the current uploaded dataset', () => {
    expect(countAssignedAgentsByPlan([
      { planId: 'standard', agentName: 'Alex Morgan' },
      { planId: 'standard', agentName: 'Jamie Lee' },
      { planId: 'premium', agentName: 'Sam Taylor' },
    ], ['Alex Morgan', 'Sam Taylor'])).toEqual({ standard: 1, premium: 1 });
  });
});
