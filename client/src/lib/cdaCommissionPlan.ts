import type { DotloopRecord } from '@/lib/csvParser';

type CommissionPlanLike = {
  id: string;
  name: string;
  splitPercentage: number;
  postCapSplit?: number;
};

type AgentAssignmentLike = {
  agentName: string;
  planId: string;
};

export type AppliedCdaCommissionPlan = {
  agentName: string;
  planId: string;
  planName: string;
  splitPercentage: number;
  postCapSplit?: number;
};

export function getAppliedCdaCommissionPlan(
  transaction: Pick<DotloopRecord, 'agents'>,
  plans: CommissionPlanLike[],
  assignments: AgentAssignmentLike[],
): AppliedCdaCommissionPlan | null {
  const agentNames = (transaction.agents || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  for (const agentName of agentNames) {
    const assignment = assignments.find((item) => item.agentName.trim().toLocaleLowerCase() === agentName.toLocaleLowerCase());
    if (!assignment) continue;
    const plan = plans.find((item) => item.id === assignment.planId);
    if (!plan) continue;
    return {
      agentName,
      planId: plan.id,
      planName: plan.name,
      splitPercentage: plan.splitPercentage,
      postCapSplit: plan.postCapSplit,
    };
  }

  return null;
}
