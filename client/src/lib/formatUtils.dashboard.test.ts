import { describe, expect, it } from 'vitest';
import { formatCompactCurrency, formatTrendPercentage } from './formatUtils';

describe('dashboard value formatting', () => {
  it('uses compact currency for high-value dashboard cards', () => {
    expect(formatCompactCurrency(477_386_178)).toBe('$477.4M');
    expect(formatCompactCurrency(970_465)).toBe('$970.5K');
  });

  it('preserves small currency values without unnecessary decimals', () => {
    expect(formatCompactCurrency(875)).toBe('$875');
  });

  it('rounds trend percentages to a readable precision', () => {
    expect(formatTrendPercentage(42.031686859273066)).toBe('+42%');
    expect(formatTrendPercentage(-3.456)).toBe('-3.5%');
  });
});
