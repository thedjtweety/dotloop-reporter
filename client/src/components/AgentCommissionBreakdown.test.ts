import { describe, expect, it } from 'vitest';
import { resolveAgentPlan } from './AgentCommissionBreakdown';

describe('resolveAgentPlan', () => {
  const plans = [{ id: 'starter', name: 'Starter' }, { id: 'growth', name: 'Growth' }];
  const assignments = [{ agentName: 'Sarah Miller', planId: 'growth' }];

  it('uses the live assignment and plan identifiers to find the assigned plan', () => {
    expect(resolveAgentPlan('Sarah Miller', plans, assignments)).toEqual({ id: 'growth', name: 'Growth' });
  });

  it('does not fabricate a plan when an agent has no live assignment', () => {
    expect(resolveAgentPlan('David Martinez', plans, assignments)).toBeUndefined();
  });

  it('does not return a plan when a stale assignment points to a missing plan', () => {
    expect(resolveAgentPlan('Sarah Miller', plans, [{ agentName: 'Sarah Miller', planId: 'missing' }])).toBeUndefined();
  });
});
