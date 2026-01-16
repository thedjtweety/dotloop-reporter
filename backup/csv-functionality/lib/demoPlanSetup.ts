/**
 * Demo Plan Setup - Creates default commission plans and agent assignments for demo mode
 * 
 * This utility automatically creates commission plans and assigns all demo agents
 * to plans so that commission calculations work in demo mode.
 */

import { DotloopRecord } from './csvParser';

export interface DemoPlan {
  id: string;
  name: string;
  splitPercentage: number;
  capAmount: number;
  postCapSplit: number;
  deductions?: any[];
  royaltyPercentage?: number;
  royaltyCap?: number;
  useSliding: boolean;
  tiers?: any[];
}

export interface DemoAssignment {
  id: string;
  agentName: string;
  planId: string;
  teamId?: string;
  startDate?: string;
  anniversaryDate?: string;
}

const DEMO_PLANS_KEY = 'dotloop_demo_plans';
const DEMO_ASSIGNMENTS_KEY = 'dotloop_demo_assignments';

/**
 * Create default demo commission plans
 */
function createDemoPlan(name: string, splitPercentage: number, capAmount: number): DemoPlan {
  return {
    id: `demo-plan-${Math.random().toString(36).substr(2, 9)}`,
    name,
    splitPercentage,
    capAmount,
    postCapSplit: 100,
    useSliding: false,
  };
}

/**
 * Setup demo commission plans and agent assignments
 * Extracts unique agents from demo data and assigns them to plans
 */
export function setupDemoPlanData(demoRecords: DotloopRecord[]): { plans: DemoPlan[]; assignments: DemoAssignment[] } {
  // Create default plans
  const plans: DemoPlan[] = [
    createDemoPlan('Standard 50/50', 50, 0),
    createDemoPlan('High Volume 60/40', 60, 50000),
    createDemoPlan('New Agent 70/30', 70, 0),
    createDemoPlan('Premium 40/60', 40, 100000),
  ];

  // Save plans to localStorage
  localStorage.setItem(DEMO_PLANS_KEY, JSON.stringify(plans));

  // Extract unique agent names from demo data
  const uniqueAgents = Array.from(new Set(
    demoRecords.flatMap((record: DotloopRecord) => {
      const agents = record.agents?.split(',').map((a: string) => a.trim()).filter(Boolean) || [];
      return agents;
    })
  ));

  // Create assignments for all agents (distribute evenly across plans)
  const assignments: DemoAssignment[] = uniqueAgents.map((agentName, index) => {
    const planIndex = index % plans.length;
    const plan = plans[planIndex];
    
    return {
      id: `demo-assignment-${Math.random().toString(36).substr(2, 9)}`,
      agentName,
      planId: plan.id,
      teamId: undefined,
      startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      anniversaryDate: undefined,
    };
  });

  // Save assignments to localStorage
  localStorage.setItem(DEMO_ASSIGNMENTS_KEY, JSON.stringify(assignments));

  console.log(`✅ Demo setup complete: ${plans.length} plans, ${assignments.length} agent assignments`);

  return { plans, assignments };
}

/**
 * Get demo plans from localStorage
 */
export function getDemoPlan(): DemoPlan[] {
  try {
    const stored = localStorage.getItem(DEMO_PLANS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('Failed to get demo plans:', err);
    return [];
  }
}

/**
 * Get demo assignments from localStorage
 */
export function getDemoAssignments(): DemoAssignment[] {
  try {
    const stored = localStorage.getItem(DEMO_ASSIGNMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('Failed to get demo assignments:', err);
    return [];
  }
}

/**
 * Clear demo plan data
 */
export function clearDemoPlanData(): void {
  localStorage.removeItem(DEMO_PLANS_KEY);
  localStorage.removeItem(DEMO_ASSIGNMENTS_KEY);
}
