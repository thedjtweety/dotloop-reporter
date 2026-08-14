export type PlanAssignmentCountInput = {
  agentName?: string | null;
  planId?: string | null;
};

/**
 * Returns the number of distinct assigned agents for each plan. A set is used
 * deliberately so duplicate or retried assignments cannot inflate a plan card.
 */
export function countAssignedAgentsByPlan(
  assignments: PlanAssignmentCountInput[],
  allowedAgentNames?: Iterable<string>,
): Record<string, number> {
  const agentNamesByPlan = new Map<string, Set<string>>();
  const allowedAgents = allowedAgentNames
    ? new Set(Array.from(allowedAgentNames, (name) => name.trim().toLocaleLowerCase()))
    : undefined;

  assignments.forEach(({ agentName, planId }) => {
    const normalizedPlanId = planId?.trim();
    const normalizedAgentName = agentName?.trim().toLocaleLowerCase();
    if (!normalizedPlanId || !normalizedAgentName) return;
    if (allowedAgents && !allowedAgents.has(normalizedAgentName)) return;

    const planAgents = agentNamesByPlan.get(normalizedPlanId) ?? new Set<string>();
    planAgents.add(normalizedAgentName);
    agentNamesByPlan.set(normalizedPlanId, planAgents);
  });

  return Object.fromEntries(
    Array.from(agentNamesByPlan, ([planId, agentNames]) => [planId, agentNames.size]),
  );
}
