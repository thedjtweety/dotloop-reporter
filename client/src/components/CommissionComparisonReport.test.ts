import { describe, expect, it } from 'vitest';
import { resolveComparisonPlan } from './CommissionComparisonReport';

describe('resolveComparisonPlan', () => {
  const plans = [{ id: 'standard', name: 'Standard' }, { id: 'cap', name: 'Cap plan' }];
  const assignments = [{ agentName: 'David Martinez', planId: 'cap' }];

  it('resolves the commission plan from the current agent assignment', () => {
    expect(resolveComparisonPlan('David Martinez', plans, assignments)).toEqual({ id: 'cap', name: 'Cap plan' });
  });

  it('returns undefined without a matching live assignment or plan', () => {
    expect(resolveComparisonPlan('Sarah Miller', plans, assignments)).toBeUndefined();
    expect(resolveComparisonPlan('David Martinez', plans, [{ agentName: 'David Martinez', planId: 'missing' }])).toBeUndefined();
  });
});
