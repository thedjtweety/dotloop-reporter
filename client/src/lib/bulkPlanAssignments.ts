import type { AgentPlanAssignment } from './commission';

export function buildBulkPlanReplacements(
  selectedAgents: Iterable<string>,
  selectedPlanId: string,
  assignments: AgentPlanAssignment[],
  createdAt: string,
): AgentPlanAssignment[] {
  return Array.from(selectedAgents).map((agentName) => {
    const existing = assignments.find((assignment) => assignment.agentName === agentName);
    return {
      id: existing?.id || `${agentName}-${selectedPlanId}-${Date.now()}`,
      agentName,
      planId: selectedPlanId,
      teamId: existing?.teamId,
      startDate: createdAt,
      anniversaryDate: existing?.anniversaryDate,
    };
  });
}
