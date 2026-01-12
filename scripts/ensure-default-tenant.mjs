/**
 * Ensure Default Tenant Script
 * Creates the default tenant if it doesn't exist
 */

import { drizzle } from 'drizzle-orm/mysql2';
import { tenants } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

const DEFAULT_TENANT_ID = 1;

async function main() {
  const db = drizzle(process.env.DATABASE_URL);
  
  console.log('Checking for default tenant...');
  const [existing] = await db.select()
    .from(tenants)
    .where(eq(tenants.id, DEFAULT_TENANT_ID))
    .limit(1);

  if (existing) {
    console.log('✅ Default tenant already exists:');
    console.log(JSON.stringify(existing, null, 2));
  } else {
    console.log('Creating default tenant...');
    await db.insert(tenants).values({
      id: DEFAULT_TENANT_ID,
      name: 'Demo Brokerage',
      subdomain: 'demo',
      status: 'active',
      subscriptionTier: 'professional',
    });
    console.log('✅ Default tenant created successfully');
  }
}

main().catch(console.error);
