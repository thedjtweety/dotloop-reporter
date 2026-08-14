import { describe, expect, it } from 'vitest';
import { nextPlanVersionNumber } from './routers/brokerOperations';

describe('broker operations audit helpers', () => {
  it('starts a new plan at immutable version one', () => {
    expect(nextPlanVersionNumber([])).toBe(1);
  });

  it('always increments from the highest saved version rather than the last array entry', () => {
    expect(nextPlanVersionNumber([{ versionNumber: 1 }, { versionNumber: 4 }, { versionNumber: 2 }])).toBe(5);
  });
});
