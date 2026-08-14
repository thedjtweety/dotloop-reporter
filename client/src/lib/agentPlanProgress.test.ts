import { describe, expect, it } from 'vitest';
import { getAgentPlanProgress } from './agentPlanProgress';

describe('getAgentPlanProgress', () => {
  it('reports an unassigned agent clearly', () => {
    expect(getAgentPlanProgress(undefined, 0)).toMatchObject({ percent: 0, capped: false, primary: 'No plan assigned' });
  });

  it('tracks company-dollar progress toward a plan cap', () => {
    expect(getAgentPlanProgress({ splitPercentage: 70, capAmount: 20_000, postCapSplit: 100 }, 5_000)).toMatchObject({ percent: 25, capped: false, detail: '$15,000.00 to cap' });
  });

  it('marks the post-cap stage after the cap is reached', () => {
    expect(getAgentPlanProgress({ splitPercentage: 70, capAmount: 20_000, postCapSplit: 100 }, 22_000)).toMatchObject({ percent: 100, capped: true, primary: 'Capped · 100% split' });
  });
});
