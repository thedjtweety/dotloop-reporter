import { describe, expect, it } from 'vitest';
import { getAppliedCdaCommissionPlan } from './cdaCommissionPlan';

describe('getAppliedCdaCommissionPlan', () => {
  const plans = [{ id: 'plan-1', name: 'Performance Tier', splitPercentage: 75, postCapSplit: 100 }];
  const assignments = [{ agentName: 'Alex Morgan', planId: 'plan-1' }];

  it('finds the first assigned plan for a transaction agent without case sensitivity', () => {
    expect(getAppliedCdaCommissionPlan({ agents: '  alex morgan, Jordan Lee' }, plans, assignments)).toEqual({
      agentName: 'alex morgan',
      planId: 'plan-1',
      planName: 'Performance Tier',
      splitPercentage: 75,
      postCapSplit: 100,
    });
  });

  it('returns null when no agent on the transaction has an active assignment', () => {
    expect(getAppliedCdaCommissionPlan({ agents: 'Jordan Lee' }, plans, assignments)).toBeNull();
  });
});
