/**
 * Sample Data Seed Script
 * 
 * Creates test commission plans with sliding scale tiers and agent assignments
 * Run with: node scripts/seed-sample-data.mjs
 */

import mysql from 'mysql2/promise';
import { nanoid } from 'nanoid';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dotloop_reporter',
});

const TENANT_ID = 1; // Default tenant

// Sample commission plans with sliding scale tiers
const samplePlans = [
  {
    id: `plan-${nanoid()}`,
    name: 'Standard Sliding Scale',
    description: 'Progressive commission structure based on YTD performance',
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
  },
  {
    id: `plan-${nanoid()}`,
    name: 'Aggressive Growth Plan',
    description: 'Steep tier progression to incentivize high volume',
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
  },
  {
    id: `plan-${nanoid()}`,
    name: 'Conservative Plan',
    description: 'Modest tier progression with lower splits',
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
  },
];

// Sample agents to assign to plans
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

async function seedData() {
  try {
    console.log('🌱 Starting sample data seed...\n');

    // Insert commission plans
    console.log('📋 Creating commission plans...');
    const planIds = [];
    
    for (const plan of samplePlans) {
      const query = `
        INSERT INTO commissionPlans 
        (id, tenantId, name, splitPercentage, capAmount, postCapSplit, useSliding, tiers, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      await connection.execute(query, [
        plan.id,
        TENANT_ID,
        plan.name,
        plan.splitPercentage,
        plan.capAmount,
        plan.postCapSplit,
        plan.useSliding,
        plan.tiers,
      ]);
      
      planIds.push(plan.id);
      console.log(`  ✓ Created plan: ${plan.name}`);
    }

    // Insert agent assignments
    console.log('\n👥 Creating agent assignments...');
    let assignmentCount = 0;
    
    for (let planIdx = 0; planIdx < planIds.length; planIdx++) {
      const planId = planIds[planIdx];
      
      // Assign different agents to each plan
      const agentsForPlan = sampleAgents.slice(
        (planIdx * 3) % sampleAgents.length,
        ((planIdx * 3) + 3) % sampleAgents.length || sampleAgents.length
      );
      
      for (const agentName of agentsForPlan) {
        const assignmentId = nanoid();
        const query = `
          INSERT INTO agentAssignments
          (id, tenantId, agentName, planId, startDate, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL 90 DAY), NOW(), NOW())
        `;
        
        await connection.execute(query, [
          assignmentId,
          TENANT_ID,
          agentName,
          planId,
        ]);
        
        assignmentCount++;
      }
      
      console.log(`  ✓ Assigned ${agentsForPlan.length} agents to ${samplePlans[planIdx].name}`);
    }

    console.log(`\n✅ Seed completed successfully!`);
    console.log(`   - ${samplePlans.length} commission plans created`);
    console.log(`   - ${assignmentCount} agent assignments created`);
    console.log(`\n📊 Sample Plans:`);
    
    samplePlans.forEach((plan, idx) => {
      const tiers = JSON.parse(plan.tiers);
      console.log(`\n   ${idx + 1}. ${plan.name}`);
      console.log(`      Cap: $${plan.capAmount.toLocaleString()}`);
      console.log(`      Tiers:`);
      tiers.forEach((tier) => {
        console.log(`        - ${tier.description}`);
      });
    });

    console.log(`\n🎯 Next Steps:`);
    console.log(`   1. Log in to the application`);
    console.log(`   2. Go to the Commission Calculator page`);
    console.log(`   3. Select one of the sample plans from the dropdown`);
    console.log(`   4. Upload a CSV file with transaction data`);
    console.log(`   5. View the calculated commissions with tier progression`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

// Run the seed
await seedData();
