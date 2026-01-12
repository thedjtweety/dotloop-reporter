/**
 * Tenant Context Helper
 * 
 * Provides tenant context for multi-tenant operations.
 * For now, uses a default tenant until subdomain routing is implemented.
 */

import { getDb } from '../db';
import { tenants, users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Default tenant ID for single-tenant mode
 * This will be used until subdomain routing is implemented
 */
const DEFAULT_TENANT_ID = 1;

/**
 * Get tenant ID from context
 * 
 * In the future, this will:
 * 1. Extract subdomain from request
 * 2. Look up tenant by subdomain
 * 3. Return tenant ID
 * 
 * For now, returns the default tenant ID
 */
export async function getTenantId(subdomain?: string): Promise<number> {
  // TODO: Implement subdomain-based tenant lookup
  // For now, always return default tenant
  return DEFAULT_TENANT_ID;
}

/**
 * Get tenant ID from user context
 * 
 * @param userId - The user's ID
 * @returns The tenant ID associated with the user
 */
export async function getTenantIdFromUser(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn('[TenantContext] Database not available, using default tenant');
    return DEFAULT_TENANT_ID;
  }

  try {
    const [user] = await db.select({ tenantId: users.tenantId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      console.warn(`[TenantContext] User ${userId} not found, using default tenant`);
      return DEFAULT_TENANT_ID;
    }

    return user.tenantId;
  } catch (error) {
    console.error('[TenantContext] Error fetching user tenant:', error);
    return DEFAULT_TENANT_ID;
  }
}

/**
 * Ensure default tenant exists
 * Creates the default tenant if it doesn't exist
 */
export async function ensureDefaultTenant(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn('[TenantContext] Database not available, cannot ensure default tenant');
    return;
  }

  try {
    const [existing] = await db.select()
      .from(tenants)
      .where(eq(tenants.id, DEFAULT_TENANT_ID))
      .limit(1);

    if (!existing) {
      console.log('[TenantContext] Creating default tenant...');
      await db.insert(tenants).values({
        id: DEFAULT_TENANT_ID,
        name: 'Demo Brokerage',
        subdomain: 'demo',
        status: 'active',
        subscriptionTier: 'professional',
      });
      console.log('[TenantContext] Default tenant created');
    }
  } catch (error) {
    console.error('[TenantContext] Error ensuring default tenant:', error);
  }
}

/**
 * Get current tenant context
 * Returns tenant information for the current request
 */
export async function getCurrentTenant(tenantId?: number) {
  const id = tenantId || DEFAULT_TENANT_ID;
  const db = await getDb();
  
  if (!db) {
    return null;
  }

  try {
    const [tenant] = await db.select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);
    return tenant || null;
  } catch (error) {
    console.error('[TenantContext] Error fetching tenant:', error);
    return null;
  }
}
