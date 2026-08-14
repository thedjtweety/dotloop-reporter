import { describe, expect, it } from 'vitest';
import { isTransactionColumnAllowed } from './TransactionTable';

describe('TransactionTable agent portal privacy policy', () => {
  it('hides broker-only actions in the agent portal', () => {
    expect(isTransactionColumnAllowed('actions', true)).toBe(false);
  });

  it('hides the co-agent name column in the agent portal', () => {
    expect(isTransactionColumnAllowed('agent', true)).toBe(false);
  });

  it('keeps agent-relevant transaction columns visible in the agent portal', () => {
    expect(isTransactionColumnAllowed('status', true)).toBe(true);
    expect(isTransactionColumnAllowed('property', true)).toBe(true);
    expect(isTransactionColumnAllowed('price', true)).toBe(true);
    expect(isTransactionColumnAllowed('commission', true)).toBe(true);
    expect(isTransactionColumnAllowed('date', true)).toBe(true);
  });

  it('leaves every column available for broker-facing tables', () => {
    for (const column of ['status', 'property', 'agent', 'price', 'commission', 'date', 'actions'] as const) {
      expect(isTransactionColumnAllowed(column, false)).toBe(true);
    }
  });
});
