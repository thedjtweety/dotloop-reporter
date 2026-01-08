export interface CommissionPlan {
  id: string;
  name: string;
  splitPercentage: number; // Agent's share (e.g., 80 for 80/20)
  capAmount: number; // Annual cap on Company Dollar (e.g., 20000)
  postCapSplit: number; // Agent's share after cap (usually 100)
  royaltyPercentage?: number; // Optional franchise fee (e.g., 6%)
  royaltyCap?: number; // Optional cap on royalty (e.g., 3000)
}

export interface AgentPlanAssignment {
  agentName: string;
  planId: string;
  startDate?: string; // Optional: when did they start this plan?
}

// Default Plans
export const DEFAULT_PLANS: CommissionPlan[] = [
  {
    id: 'standard-80-20',
    name: 'Standard Capped (80/20)',
    splitPercentage: 80,
    capAmount: 18000,
    postCapSplit: 100,
  },
  {
    id: 'team-50-50',
    name: 'Team Member (50/50)',
    splitPercentage: 50,
    capAmount: 0, // No cap
    postCapSplit: 50,
  },
  {
    id: 'referral-only',
    name: 'Referral Only (90/10)',
    splitPercentage: 90,
    capAmount: 500,
    postCapSplit: 100,
  }
];

// Storage Keys
const PLANS_KEY = 'dotloop_commission_plans';
const ASSIGNMENTS_KEY = 'dotloop_agent_assignments';

// Helpers
export function getCommissionPlans(): CommissionPlan[] {
  const stored = localStorage.getItem(PLANS_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_PLANS;
}

export function saveCommissionPlans(plans: CommissionPlan[]) {
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

export function getAgentAssignments(): AgentPlanAssignment[] {
  const stored = localStorage.getItem(ASSIGNMENTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveAgentAssignments(assignments: AgentPlanAssignment[]) {
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
}

export function getPlanForAgent(agentName: string): CommissionPlan | undefined {
  const assignments = getAgentAssignments();
  const plans = getCommissionPlans();
  
  const assignment = assignments.find(a => a.agentName === agentName);
  if (!assignment) return undefined;
  
  return plans.find(p => p.id === assignment.planId);
}
