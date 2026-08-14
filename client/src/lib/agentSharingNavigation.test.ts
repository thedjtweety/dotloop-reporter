import { describe, expect, it } from 'vitest';
import { getAgentSharingPath, getPreselectedAgent } from './agentSharingNavigation';

describe('agent sharing navigation', () => {
  it('encodes an agent name in the sharing workspace path', () => {
    expect(getAgentSharingPath('Avery & Stone')).toBe('/preview-agent?agent=Avery%20%26%20Stone');
  });

  it('preselects only an agent present in the current dataset', () => {
    expect(getPreselectedAgent('?agent=Sarah%20Miller', ['Sarah Miller', 'David Nguyen'])).toBe('Sarah Miller');
    expect(getPreselectedAgent('?agent=Unknown', ['Sarah Miller', 'David Nguyen'])).toBe('');
  });
});
