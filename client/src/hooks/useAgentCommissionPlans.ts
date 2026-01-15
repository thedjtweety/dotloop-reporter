/**
 * Hook to check which agents have commission plans assigned
 * Returns a set of agent names that don't have plans
 */

import { useMemo } from 'react';
import { AgentMetrics } from '@/lib/csvParser';

interface AgentPlanStatus {
  agentName: string;
  hasPlan: boolean;
  planId?: string;
  planName?: string;
}

export function useAgentCommissionPlans(
  agents: AgentMetrics[],
  agentAssignments?: Array<{ agentName: string; planId: string; planName?: string }>
): AgentPlanStatus[] {
  return useMemo(() => {
    const assignmentMap = new Map(
      (agentAssignments || []).map(a => [a.agentName, { planId: a.planId, planName: a.planName }])
    );

    return agents.map(agent => ({
      agentName: agent.agentName,
      hasPlan: assignmentMap.has(agent.agentName),
      planId: assignmentMap.get(agent.agentName)?.planId,
      planName: assignmentMap.get(agent.agentName)?.planName,
    }));
  }, [agents, agentAssignments]);
}

export function useAgentsWithoutPlans(
  agents: AgentMetrics[],
  agentAssignments?: Array<{ agentName: string; planId: string }>
): Set<string> {
  return useMemo(() => {
    const assignedAgents = new Set(
      (agentAssignments || []).map(a => a.agentName)
    );

    return new Set(
      agents
        .filter(agent => !assignedAgents.has(agent.agentName))
        .map(agent => agent.agentName)
    );
  }, [agents, agentAssignments]);
}
