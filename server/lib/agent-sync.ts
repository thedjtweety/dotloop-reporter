/**
 * Agent Sync - Extract agents from transactions and sync to database
 */

import { getDb } from "../db";
import { agentAssignments } from "../../drizzle/schema";
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * Extract unique agent names from transactions
 */
export function extractAgentNames(transactions: any[]): string[] {
  const agentNames = new Set<string>();
  
  transactions.forEach(transaction => {
    // Extract agent name from various possible fields
    const agentName = transaction.agents || 
                     transaction.agent || 
                     transaction.agentName || 
                     transaction['Agent Name'] ||
                     transaction['Agents'] ||
                     '';
    
    if (agentName && typeof agentName === 'string' && agentName.trim()) {
      // Normalize agent name (trim whitespace, title case)
      const normalized = agentName.trim();
      if (normalized) {
        agentNames.add(normalized);
      }
    }
  });
  
  return Array.from(agentNames).sort();
}

/**
 * Sync agents from transactions to database
 * Creates new agent records and marks old ones as inactive
 */
export async function syncAgentsFromTransactions(
  tenantId: number,
  transactions: any[],
  clearExisting: boolean = true
): Promise<{
  created: number;
  updated: number;
  deactivated: number;
  agents: string[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const newAgentNames = extractAgentNames(transactions);
  
  if (newAgentNames.length === 0) {
    return { created: 0, updated: 0, deactivated: 0, agents: [] };
  }

  let createdCount = 0;
  let updatedCount = 0;
  let deactivatedCount = 0;

  // Get existing agents for this tenant
  const existingAgents = await db
    .select()
    .from(agentAssignments)
    .where(eq(agentAssignments.tenantId, tenantId));

  const existingAgentNames = new Set(existingAgents.map(a => a.agentName));
  const existingAgentIds = new Map(existingAgents.map(a => [a.agentName, a.id]));

  // If clearExisting is true, deactivate agents not in the new list
  if (clearExisting) {
    for (const agent of existingAgents) {
      if (!newAgentNames.includes(agent.agentName) && agent.isActive) {
        await db
          .update(agentAssignments)
          .set({ isActive: 0, updatedAt: new Date().toISOString() })
          .where(eq(agentAssignments.id, agent.id));
        deactivatedCount++;
      }
    }
  }

  // Create or reactivate agents
  for (const agentName of newAgentNames) {
    if (existingAgentNames.has(agentName)) {
      // Reactivate if it was deactivated
      const agent = existingAgents.find(a => a.agentName === agentName);
      if (agent && !agent.isActive) {
        await db
          .update(agentAssignments)
          .set({ isActive: 1, updatedAt: new Date().toISOString() })
          .where(eq(agentAssignments.id, agent.id));
        updatedCount++;
      }
    } else {
      // Create new agent record (without plan assignment)
      await db.insert(agentAssignments).values({
        id: nanoid(),
        tenantId,
        agentName,
        planId: '', // No plan assigned yet
        isActive: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      createdCount++;
    }
  }

  return {
    created: createdCount,
    updated: updatedCount,
    deactivated: deactivatedCount,
    agents: newAgentNames,
  };
}
