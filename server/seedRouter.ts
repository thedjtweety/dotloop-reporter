/**
 * Seed Router
 * 
 * Provides endpoints for seeding sample data into the database
 * Used for testing and demonstration purposes
 */

import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { commissionPlans, agentAssignments } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const seedRouter = router({
  /**
   * Seed sample commission plans and agent assignments
   * Only available to authenticated users
   */
  seedSampleData: protectedProcedure.mutation(async ({ ctx }: any) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection not available');
      }

      const tenantId = ctx.user.tenantId;

      // Sample commission plans
      const samplePlans = [
        {
          id: `plan-${nanoid()}`,
          tenantId,
          name: 'Standard Sliding Scale',
          splitPercentage: 60,
          capAmount: 500000,
          postCapSplit: 100,
          useSliding: 1,
          tiers: JSON.stringify([
            {
              id: `tier-${nanoid()}`,
              threshold: 0,
              splitPercentage: 60,
              description: '$0 - $50K: 60/40 split',
            },
            {
              id: `tier-${nanoid()}`,
              threshold: 50000,
              splitPercentage: 65,
              description: '$50K - $100K: 65/35 split',
            },
            {
              id: `tier-${nanoid()}`,
              threshold: 100000,
              splitPercentage: 70,
              description: '$100K - $200K: 70/30 split',
            },
            {
              id: `tier-${nanoid()}`,
              threshold: 200000,
              splitPercentage: 75,
              description: '$200K+: 75/25 split',
            },
          ]),
          deductions: JSON.stringify([]),
          royaltyPercentage: 0,
          royaltyCap: 0,
        },
        {
          id: `plan-${nanoid()}`,
          tenantId,
          name: 'Aggressive Growth Plan',
          splitPercentage: 55,
          capAmount: 750000,
          postCapSplit: 100,
          useSliding: 1,
          tiers: JSON.stringify([
            {
              id: `tier-${nanoid()}`,
              threshold: 0,
              splitPercentage: 55,
              description: '$0 - $75K: 55/45 split',
            },
            {
              id: `tier-${nanoid()}`,
              threshold: 75000,
              splitPercentage: 65,
              description: '$75K - $150K: 65/35 split',
            },
            {
              id: `tier-${nanoid()}`,
              threshold: 150000,
              splitPercentage: 75,
              description: '$150K - $300K: 75/25 split',
            },
            {
              id: `tier-${nanoid()}`,
              threshold: 300000,
              splitPercentage: 85,
              description: '$300K+: 85/15 split',
            },
          ]),
          deductions: JSON.stringify([]),
          royaltyPercentage: 0,
          royaltyCap: 0,
        },
        {
          id: `plan-${nanoid()}`,
          tenantId,
          name: 'Conservative Plan',
          splitPercentage: 70,
          capAmount: 300000,
          postCapSplit: 100,
          useSliding: 1,
          tiers: JSON.stringify([
            {
              id: `tier-${nanoid()}`,
              threshold: 0,
              splitPercentage: 70,
              description: '$0 - $30K: 70/30 split',
            },
            {
              id: `tier-${nanoid()}`,
              threshold: 30000,
              splitPercentage: 72,
              description: '$30K - $75K: 72/28 split',
            },
            {
              id: `tier-${nanoid()}`,
              threshold: 75000,
              splitPercentage: 74,
              description: '$75K+: 74/26 split',
            },
          ]),
          deductions: JSON.stringify([]),
          royaltyPercentage: 0,
          royaltyCap: 0,
        },
      ];

      // Sample agents
      const sampleAgents = [
        'Alice Johnson',
        'Bob Smith',
        'Carol Williams',
        'David Brown',
        'Emma Davis',
        'Frank Miller',
        'Grace Wilson',
        'Henry Moore',
        'Iris Taylor',
        'Jack Anderson',
      ];

      // Insert plans
      const insertedPlans = [];
      for (const plan of samplePlans) {
        try {
          await db.insert(commissionPlans).values(plan);
          insertedPlans.push(plan);
        } catch (error) {
          console.error(`Error inserting plan ${plan.name}:`, error);
        }
      }

      // Insert agent assignments
      let assignmentCount = 0;
      for (let planIdx = 0; planIdx < insertedPlans.length; planIdx++) {
        const planId = insertedPlans[planIdx].id;
        
        // Assign different agents to each plan
        const agentsForPlan = sampleAgents.slice(
          (planIdx * 3) % sampleAgents.length,
          ((planIdx * 3) + 3) % sampleAgents.length || sampleAgents.length
        );
        
        for (const agentName of agentsForPlan) {
          try {
            const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            const dateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            await db.insert(agentAssignments).values({
              id: nanoid(),
              tenantId,
              agentName,
              planId,
              startDate: dateStr,
            });
            assignmentCount++;
          } catch (error) {
            console.error(`Error assigning agent ${agentName}:`, error);
          }
        }
      }

      return {
        success: true,
        message: `Seeded ${insertedPlans.length} plans and ${assignmentCount} agent assignments`,
        plansCreated: insertedPlans.length,
        assignmentsCreated: assignmentCount,
      };
    } catch (error) {
      console.error('Error seeding data:', error);
      throw new Error(`Failed to seed data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }),

  /**
   * Clear all sample data for the current tenant
   */
  clearSampleData: protectedProcedure.mutation(async ({ ctx }: any) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection not available');
      }

      const tenantId = ctx.user.tenantId;

      // Delete agent assignments first (foreign key constraint)
      await db
        .delete(agentAssignments)
        .where(eq(agentAssignments.tenantId, tenantId));

      // Delete commission plans
      await db
        .delete(commissionPlans)
        .where(eq(commissionPlans.tenantId, tenantId));

      return {
        success: true,
        message: 'Cleared all sample data',
      };
    } catch (error) {
      console.error('Error clearing data:', error);
      throw new Error(`Failed to clear data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }),
});
