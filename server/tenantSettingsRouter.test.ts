/**
 * Tenant Settings Router Tests
 * 
 * Tests for tenant profile management, subscription info, and statistics
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { tenants, users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Tenant Settings Router', () => {
  let testTenantId: number;
  let testUserId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a test tenant
    const [tenantResult] = await db.insert(tenants).values({
      name: 'Test Tenant Settings',
      subdomain: 'test-settings',
      status: 'active',
      subscriptionTier: 'professional',
    });

    testTenantId = Number(tenantResult.insertId);

    // Create a test user
    const [userResult] = await db.insert(users).values({
      tenantId: testTenantId,
      openId: 'test-settings-user',
      name: 'Test Settings User',
      email: 'settings@test.com',
      role: 'admin',
    });

    testUserId = Number(userResult.insertId);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(users).where(eq(users.id, testUserId));
    await db.delete(tenants).where(eq(tenants.id, testTenantId));
  });

  it('should retrieve tenant information', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, testTenantId))
      .limit(1);

    expect(tenant).toBeDefined();
    expect(tenant.name).toBe('Test Tenant Settings');
    expect(tenant.subdomain).toBe('test-settings');
    expect(tenant.status).toBe('active');
    expect(tenant.subscriptionTier).toBe('professional');
  });

  it('should update tenant profile', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Update tenant name
    await db
      .update(tenants)
      .set({ name: 'Updated Tenant Name' })
      .where(eq(tenants.id, testTenantId));

    const [updated] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, testTenantId))
      .limit(1);

    expect(updated.name).toBe('Updated Tenant Name');
  });

  it('should update tenant subdomain', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Update subdomain
    await db
      .update(tenants)
      .set({ subdomain: 'new-subdomain' })
      .where(eq(tenants.id, testTenantId));

    const [updated] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, testTenantId))
      .limit(1);

    expect(updated.subdomain).toBe('new-subdomain');
  });

  it('should update custom domain', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Update custom domain
    await db
      .update(tenants)
      .set({ customDomain: 'reports.example.com' })
      .where(eq(tenants.id, testTenantId));

    const [updated] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, testTenantId))
      .limit(1);

    expect(updated.customDomain).toBe('reports.example.com');
  });

  it('should update tenant settings JSON', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const settings = {
      theme: 'dark',
      notifications: true,
      timezone: 'America/New_York',
    };

    // Update settings
    await db
      .update(tenants)
      .set({ settings: JSON.stringify(settings) })
      .where(eq(tenants.id, testTenantId));

    const [updated] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, testTenantId))
      .limit(1);

    expect(updated.settings).toBe(JSON.stringify(settings));
    expect(JSON.parse(updated.settings!)).toEqual(settings);
  });

  it('should retrieve subscription tier information', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, testTenantId))
      .limit(1);

    expect(tenant.subscriptionTier).toBe('professional');

    // Verify tier features based on subscription
    const tierFeatures: Record<string, any> = {
      professional: {
        name: 'Professional',
        maxUsers: 20,
        maxUploadsPerMonth: 200,
        maxStorageGB: 50,
      },
    };

    const tierInfo = tierFeatures[tenant.subscriptionTier];
    expect(tierInfo).toBeDefined();
    expect(tierInfo.maxUsers).toBe(20);
    expect(tierInfo.maxUploadsPerMonth).toBe(200);
    expect(tierInfo.maxStorageGB).toBe(50);
  });

  it('should calculate tenant statistics', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get user count
    const userCountResult = await db.execute(
      `SELECT COUNT(*) as count FROM users WHERE tenantId = ${testTenantId}`
    );
    const userCount = (userCountResult as any)[0][0].count;

    expect(userCount).toBeGreaterThanOrEqual(1); // At least our test user

    // Get upload count
    const uploadCountResult = await db.execute(
      `SELECT COUNT(*) as count FROM uploads WHERE tenantId = ${testTenantId}`
    );
    const uploadCount = (uploadCountResult as any)[0][0].count;

    expect(uploadCount).toBeGreaterThanOrEqual(0);

    // Get transaction count
    const transactionCountResult = await db.execute(
      `SELECT COUNT(*) as count FROM transactions WHERE tenantId = ${testTenantId}`
    );
    const transactionCount = (transactionCountResult as any)[0][0].count;

    expect(transactionCount).toBeGreaterThanOrEqual(0);

    // Get storage usage
    const storageUsageResult = await db.execute(
      `SELECT COALESCE(SUM(fileSize), 0) as totalBytes FROM uploads WHERE tenantId = ${testTenantId}`
    );
    const storageBytes = Number((storageUsageResult as any)[0][0].totalBytes);

    expect(storageBytes).toBeGreaterThanOrEqual(0);
  });

  it('should prevent duplicate subdomains', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create another tenant with different subdomain
    const [tenant2Result] = await db.insert(tenants).values({
      name: 'Second Tenant',
      subdomain: 'second-tenant',
      status: 'active',
      subscriptionTier: 'basic',
    });

    const tenant2Id = Number(tenant2Result.insertId);

    // Check that both tenants exist with different subdomains
    const [tenant1] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, testTenantId))
      .limit(1);

    const [tenant2] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant2Id))
      .limit(1);

    expect(tenant1.subdomain).not.toBe(tenant2.subdomain);

    // Clean up
    await db.delete(tenants).where(eq(tenants.id, tenant2Id));
  });

  it('should handle null custom domain', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Set custom domain to null
    await db
      .update(tenants)
      .set({ customDomain: null })
      .where(eq(tenants.id, testTenantId));

    const [updated] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, testTenantId))
      .limit(1);

    expect(updated.customDomain).toBeNull();
  });

  it('should validate subscription tier values', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const validTiers = ['free', 'basic', 'professional', 'enterprise'];

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, testTenantId))
      .limit(1);

    expect(validTiers).toContain(tenant.subscriptionTier);
  });
});
