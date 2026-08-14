import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Sidebar navigation', () => {
  it('does not expose the deferred SkySlope Transition Center in the primary navigation', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/components/SidebarLayout.tsx'), 'utf8');
    const navItemsBlock = source.match(/const navItems: NavItem\[\] = \[(.*?)\n\];/s)?.[1] ?? '';

    expect(navItemsBlock).not.toContain('SkySlope Transition');
    expect(navItemsBlock).not.toContain('/skyslope-transition');
  });
});
