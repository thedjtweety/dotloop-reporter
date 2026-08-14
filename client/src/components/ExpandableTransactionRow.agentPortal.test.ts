import { describe, expect, it } from 'vitest';
import { canShowExternalTransactionLink } from './ExpandableTransactionRow';

describe('ExpandableTransactionRow agent portal privacy policy', () => {
  it('never shows a direct Dotloop link in a token-scoped agent portal', () => {
    expect(canShowExternalTransactionLink(true, 'https://www.dotloop.com/loop/123')).toBe(false);
  });

  it('keeps direct Dotloop links available in broker transaction tables when supplied', () => {
    expect(canShowExternalTransactionLink(false, 'https://www.dotloop.com/loop/123')).toBe(true);
  });

  it('does not show an external link when no URL is available', () => {
    expect(canShowExternalTransactionLink(false, '')).toBe(false);
  });
});
