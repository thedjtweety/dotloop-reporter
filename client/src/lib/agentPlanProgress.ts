import { formatCurrency } from './formatUtils';

export type AgentPlanProgressInput = {
  splitPercentage: number;
  capAmount?: number | null;
  postCapSplit?: number | null;
};

export function getAgentPlanProgress(plan: AgentPlanProgressInput | undefined, companyDollar: number) {
  if (!plan) return { percent: 0, primary: 'No plan assigned', detail: 'Assign an active plan', capped: false };
  const cap = Number(plan.capAmount) || 0;
  if (!cap) return { percent: 0, primary: `${plan.splitPercentage}% agent split`, detail: 'No company-dollar cap', capped: false };

  const progress = Math.min(100, Math.round((Math.max(0, companyDollar) / cap) * 100));
  const capped = companyDollar >= cap;
  return {
    percent: progress,
    primary: capped ? `Capped · ${plan.postCapSplit ?? plan.splitPercentage}% split` : `${formatCurrency(companyDollar)} of ${formatCurrency(cap)}`,
    detail: capped ? 'Post-cap split active' : `${formatCurrency(Math.max(0, cap - companyDollar))} to cap`,
    capped,
  };
}
