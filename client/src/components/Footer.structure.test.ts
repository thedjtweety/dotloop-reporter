import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const footerSource = readFileSync(new URL('./Footer.tsx', import.meta.url), 'utf8');

describe('Footer navigation structure', () => {
  it('does not nest an anchor inside Wouter Link', () => {
    expect(footerSource).not.toMatch(/<Link\b[^>]*>\s*<a\b/s);
  });

  it('applies internal-link styling directly to Wouter Link', () => {
    expect(footerSource).toContain('<Link href="/privacy-policy" className=');
    expect(footerSource).toContain('<Link href="/terms" className=');
  });
});
