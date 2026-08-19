import { describe, expect, it } from 'vitest';
import { getCommissionCapProgress, getTransactionDetailKey } from './CommissionPlanProgressDrilldown';

describe('getCommissionCapProgress', () => {
  it('calculates remaining cap progress before the cap is reached', () => {
    expect(getCommissionCapProgress(25_000, 10_000)).toEqual({
      cap: 25_000,
      paid: 10_000,
      isCapped: false,
      percent: 40,
      remaining: 15_000,
    });
  });

  it('caps progress at 100 percent without reporting a negative remainder', () => {
    expect(getCommissionCapProgress(25_000, 30_000)).toMatchObject({
      isCapped: true,
      percent: 100,
      remaining: 0,
    });
  });

  it('handles plans without a cap', () => {
    expect(getCommissionCapProgress(null, 10_000)).toMatchObject({
      cap: 0,
      isCapped: false,
      percent: 0,
      remaining: null,
    });
  });

  it('uses a loop ID for a direct transaction-detail route when available', () => {
    expect(getTransactionDetailKey({ loopId: 'loop-123', loopName: '123 Main St' })).toBe('loop-123');
  });

  it('uses the detail page composite-key fallback when a loop ID is unavailable', () => {
    expect(getTransactionDetailKey({
      loopName: '123 Main St',
      closingDate: '2026-08-19',
      salePrice: 550000,
    })).toBe('123 Main St|2026-08-19|550000');
  });
});
