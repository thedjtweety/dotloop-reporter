# Multi-Tenant Architecture Design

**Document Version:** 1.0  
**Last Updated:** January 11, 2026  
**Author:** Manus AI

---

## Overview

The Dotloop Reporting Tool implements a **multi-tenant architecture** that allows multiple brokerages (tenants) to use a single shared application instance while maintaining complete data isolation and security. Each brokerage accesses the system through a unique subdomain or custom domain, with all data scoped to their tenant context.

This architecture enables efficient resource utilization, simplified maintenance, and rapid onboarding of new clients while ensuring that each brokerage's sensitive transaction data remains completely isolated from other tenants.

---

## Architecture Principles

### Data Isolation

Every piece of data in the system is associated with a specific tenant through a `tenant_id` foreign key. Database queries automatically filter by the current tenant context, preventing accidental or malicious cross-tenant data access. Row-level security policies enforce isolation at the database level, providing defense in depth even if application-level checks fail.

### Tenant Identification

Tenants are identified through their access URL. Each tenant receives a subdomain (e.g., `keller-williams.dotloop-reporter.com`) or can configure a custom domain (e.g., `analytics.kellerwilliams.com`). The application extracts the tenant identifier from the request hostname and establishes the tenant context for all subsequent operations.

### Shared Infrastructure

All tenants share the same application servers, database instance, and infrastructure resources. This approach maximizes resource efficiency and simplifies deployment compared to dedicated instances per tenant. Resource quotas and rate limiting prevent any single tenant from monopolizing shared resources.

### Tenant Independence

Despite sharing infrastructure, each tenant operates independently with their own user accounts, OAuth connections, data, and configuration settings. Tenants cannot see or interact with other tenants' data. Administrative operations are scoped to the tenant level, allowing brokerage administrators to manage their own users without affecting other tenants.

---

## System Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
    ┌────▼─────┐                   ┌────▼─────┐
    │ Tenant A │                   │ Tenant B │
    │ Subdomain│                   │ Subdomain│
    │ kw.app   │                   │ re.app   │
    └────┬─────┘                   └────┬─────┘
         │                               │
         └───────────────┬───────────────┘
                         │
                ┌────────▼────────┐
                │  Load Balancer  │
                │   (HTTPS/TLS)   │
                └────────┬────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
    ┌────▼─────┐                   ┌────▼─────┐
    │   App    │                   │   App    │
    │ Server 1 │                   │ Server 2 │
    └────┬─────┘                   └────┬─────┘
         │                               │
         └───────────────┬───────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
    ┌────▼────────┐              ┌──────▼──────┐
    │  PostgreSQL │              │   Redis     │
    │  (Primary)  │◄────────────►│   Cache     │
    └─────────────┘              └─────────────┘
         │
    ┌────▼────────┐
    │  PostgreSQL │
    │  (Replica)  │
    └─────────────┘
```

### Request Flow

**Step 1 - Tenant Identification**: When a user accesses `keller-williams.dotloop-reporter.com`, the load balancer routes the request to an application server. The application extracts `keller-williams` from the hostname and queries the database to retrieve the corresponding tenant record.

**Step 2 - Authentication**: The user's session cookie is validated to ensure they are authenticated. The system verifies that the authenticated user belongs to the tenant identified in Step 1, preventing users from accessing other tenants' subdomains.

**Step 3 - Tenant Context Establishment**: The application sets the tenant context for the current request by storing the `tenant_id` in request-scoped storage. All subsequent database queries and operations automatically include this tenant context.

**Step 4 - Request Processing**: The application processes the request (e.g., fetching transaction data, generating reports) with all database queries automatically filtered by the tenant context. Row-level security policies provide an additional layer of enforcement.

**Step 5 - Response**: The application returns the response to the user, ensuring all data is scoped to their tenant. Response caching (if implemented) includes the tenant ID in cache keys to prevent cross-tenant cache pollution.

---

## Database Schema

### Core Tables

**Tenants Table**: The root of the multi-tenant hierarchy, representing each brokerage organization.

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(63) UNIQUE NOT NULL,
  custom_domain VARCHAR(255) UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_subdomain CHECK (subdomain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
  CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'deleted'))
);
```

**Users Table**: User accounts scoped to specific tenants. Users can only belong to one tenant.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP,
  
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) 
    REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT valid_role CHECK (role IN ('admin', 'user', 'viewer')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'suspended')),
  CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email)
);
```

**Dotloop Records Table**: Transaction data imported from Dotloop, scoped to tenants.

```sql
CREATE TABLE dotloop_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Dotloop data fields
  loop_id VARCHAR(255) NOT NULL,
  loop_name VARCHAR(255) NOT NULL,
  loop_status VARCHAR(100),
  address TEXT,
  price DECIMAL(12, 2),
  commission_total DECIMAL(12, 2),
  agents TEXT,
  created_date TIMESTAMP,
  closing_date TIMESTAMP,
  
  -- Metadata
  imported_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) 
    REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT unique_loop_per_tenant UNIQUE (tenant_id, loop_id)
);
```

### Tenant Isolation Pattern

Every data table follows the same pattern:

1. Includes a `tenant_id` column as a foreign key to the tenants table
2. Uses `ON DELETE CASCADE` to automatically clean up data when a tenant is deleted
3. Includes tenant_id in unique constraints to allow duplicate data across tenants
4. Has row-level security policies that filter by tenant_id

This consistent pattern ensures complete data isolation and simplifies development by making tenant scoping automatic.

---

## Tenant Context Management

### Middleware Implementation

The tenant context middleware runs early in the request processing pipeline to establish the tenant for all subsequent operations.

```typescript
import { Request, Response, NextFunction } from 'express';
import { db } from './database';

interface TenantContext {
  tenantId: string;
  subdomain: string;
  customDomain?: string;
}

// Store tenant context in async local storage for request-scoped access
import { AsyncLocalStorage } from 'async_hooks';
const tenantContext = new AsyncLocalStorage<TenantContext>();

export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Extract subdomain or custom domain from hostname
    const hostname = req.hostname;
    const tenant = await identifyTenant(hostname);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    if (tenant.status !== 'active') {
      return res.status(403).json({ error: 'Tenant account is suspended' });
    }
    
    // Store tenant context for this request
    tenantContext.run(
      {
        tenantId: tenant.id,
        subdomain: tenant.subdomain,
        customDomain: tenant.customDomain,
      },
      () => next()
    );
  } catch (error) {
    console.error('Tenant middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function identifyTenant(hostname: string): Promise<Tenant | null> {
  // Check if hostname is a custom domain
  let tenant = await db.tenants.findUnique({
    where: { customDomain: hostname },
  });
  
  if (tenant) return tenant;
  
  // Extract subdomain (e.g., "keller-williams" from "keller-williams.app.com")
  const parts = hostname.split('.');
  if (parts.length < 3) {
    return null; // Not a valid subdomain
  }
  
  const subdomain = parts[0];
  tenant = await db.tenants.findUnique({
    where: { subdomain },
  });
  
  return tenant;
}

// Helper to get current tenant context
export function getCurrentTenant(): TenantContext {
  const context = tenantContext.getStore();
  if (!context) {
    throw new Error('No tenant context available');
  }
  return context;
}
```

### Database Query Scoping

All database queries automatically include tenant filtering using the established context.

```typescript
import { getCurrentTenant } from './tenant-middleware';

class TenantScopedDatabase {
  /**
   * Wraps Prisma client to automatically inject tenant_id
   */
  async findMany<T>(model: string, query: any): Promise<T[]> {
    const { tenantId } = getCurrentTenant();
    
    return await db[model].findMany({
      ...query,
      where: {
        ...query.where,
        tenant_id: tenantId,
      },
    });
  }
  
  async create<T>(model: string, data: any): Promise<T> {
    const { tenantId } = getCurrentTenant();
    
    return await db[model].create({
      data: {
        ...data,
        tenant_id: tenantId,
      },
    });
  }
  
  async update<T>(model: string, id: string, data: any): Promise<T> {
    const { tenantId } = getCurrentTenant();
    
    // Verify record belongs to current tenant
    const existing = await db[model].findUnique({
      where: { id },
      select: { tenant_id: true },
    });
    
    if (!existing || existing.tenant_id !== tenantId) {
      throw new Error('Record not found or access denied');
    }
    
    return await db[model].update({
      where: { id },
      data,
    });
  }
  
  async delete(model: string, id: string): Promise<void> {
    const { tenantId } = getCurrentTenant();
    
    // Verify record belongs to current tenant
    const existing = await db[model].findUnique({
      where: { id },
      select: { tenant_id: true },
    });
    
    if (!existing || existing.tenant_id !== tenantId) {
      throw new Error('Record not found or access denied');
    }
    
    await db[model].delete({
      where: { id },
    });
  }
}

export const tenantDb = new TenantScopedDatabase();
```

---

## Tenant Onboarding

### Self-Service Registration

New tenants can sign up through a self-service registration flow that creates their tenant account, subdomain, and initial admin user.

```typescript
interface TenantRegistration {
  companyName: string;
  subdomain: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
}

async function registerTenant(registration: TenantRegistration): Promise<Tenant> {
  // Validate subdomain availability
  const existing = await db.tenants.findUnique({
    where: { subdomain: registration.subdomain },
  });
  
  if (existing) {
    throw new Error('Subdomain already taken');
  }
  
  // Validate subdomain format (lowercase alphanumeric and hyphens)
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(registration.subdomain)) {
    throw new Error('Invalid subdomain format');
  }
  
  // Create tenant
  const tenant = await db.tenants.create({
    data: {
      name: registration.companyName,
      subdomain: registration.subdomain,
      status: 'active',
      subscription_tier: 'free',
    },
  });
  
  // Create admin user
  const passwordHash = await bcrypt.hash(registration.adminPassword, 12);
  await db.users.create({
    data: {
      tenant_id: tenant.id,
      email: registration.adminEmail,
      password_hash: passwordHash,
      name: registration.adminName,
      role: 'admin',
      status: 'active',
    },
  });
  
  // Send welcome email
  await sendWelcomeEmail(registration.adminEmail, {
    companyName: registration.companyName,
    subdomain: registration.subdomain,
    dashboardUrl: `https://${registration.subdomain}.dotloop-reporter.com`,
  });
  
  return tenant;
}
```

### Custom Domain Configuration

Tenants on paid plans can configure custom domains for white-label branding.

```typescript
async function configureCustomDomain(
  tenantId: string,
  customDomain: string
): Promise<void> {
  // Verify tenant has appropriate subscription tier
  const tenant = await db.tenants.findUnique({
    where: { id: tenantId },
  });
  
  if (tenant.subscription_tier === 'free') {
    throw new Error('Custom domains require a paid subscription');
  }
  
  // Verify domain is not already in use
  const existing = await db.tenants.findUnique({
    where: { customDomain },
  });
  
  if (existing && existing.id !== tenantId) {
    throw new Error('Domain already in use');
  }
  
  // Update tenant record
  await db.tenants.update({
    where: { id: tenantId },
    data: { customDomain },
  });
  
  // Provide DNS configuration instructions
  const dnsInstructions = {
    recordType: 'CNAME',
    hostname: customDomain,
    value: 'dotloop-reporter.com',
    ttl: 3600,
  };
  
  // Wait for DNS propagation and verify
  await verifyDNSConfiguration(customDomain);
  
  // Configure SSL certificate (Let's Encrypt)
  await provisionSSLCertificate(customDomain);
}
```

---

## Resource Management

### Rate Limiting

Rate limits are applied per tenant to prevent resource monopolization and abuse.

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getCurrentTenant } from './tenant-middleware';

const apiRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: async (req) => {
    const { tenantId } = getCurrentTenant();
    const tenant = await db.tenants.findUnique({
      where: { id: tenantId },
    });
    
    // Different limits based on subscription tier
    const limits = {
      free: 100,
      basic: 500,
      professional: 2000,
      enterprise: 10000,
    };
    
    return limits[tenant.subscription_tier] || 100;
  },
  keyGenerator: (req) => {
    const { tenantId } = getCurrentTenant();
    return tenantId;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
    });
  },
});
```

### Storage Quotas

Tenants have storage limits based on their subscription tier to manage database growth.

```typescript
async function checkStorageQuota(tenantId: string): Promise<boolean> {
  const tenant = await db.tenants.findUnique({
    where: { id: tenantId },
  });
  
  // Get current storage usage
  const recordCount = await db.dotloopRecords.count({
    where: { tenant_id: tenantId },
  });
  
  // Define quotas by tier
  const quotas = {
    free: 1000,
    basic: 10000,
    professional: 100000,
    enterprise: Infinity,
  };
  
  const quota = quotas[tenant.subscription_tier] || 1000;
  
  return recordCount < quota;
}

async function enforceStorageQuota(tenantId: string): Promise<void> {
  const withinQuota = await checkStorageQuota(tenantId);
  
  if (!withinQuota) {
    throw new Error(
      'Storage quota exceeded. Please upgrade your subscription or delete old records.'
    );
  }
}
```

---

## Security Considerations

### Tenant Isolation Verification

Regular automated tests verify that tenant isolation is functioning correctly.

```typescript
describe('Tenant Isolation', () => {
  it('should not allow cross-tenant data access', async () => {
    // Create two tenants
    const tenant1 = await createTestTenant('tenant1');
    const tenant2 = await createTestTenant('tenant2');
    
    // Create data for tenant1
    const record1 = await createTestRecord(tenant1.id, { name: 'Tenant 1 Data' });
    
    // Try to access tenant1's data as tenant2
    setCurrentTenant(tenant2.id);
    const result = await db.dotloopRecords.findUnique({
      where: { id: record1.id },
    });
    
    // Should return null due to tenant filtering
    expect(result).toBeNull();
  });
  
  it('should enforce row-level security', async () => {
    const tenant1 = await createTestTenant('tenant1');
    const tenant2 = await createTestTenant('tenant2');
    
    // Create data for both tenants
    await createTestRecord(tenant1.id, { name: 'Tenant 1 Data' });
    await createTestRecord(tenant2.id, { name: 'Tenant 2 Data' });
    
    // Query as tenant1
    setCurrentTenant(tenant1.id);
    const records = await db.dotloopRecords.findMany();
    
    // Should only see tenant1's data
    expect(records).toHaveLength(1);
    expect(records[0].tenant_id).toBe(tenant1.id);
  });
});
```

### Admin Access Controls

Platform administrators can access all tenants for support purposes, but all actions are logged.

```typescript
async function adminAccessTenant(
  adminUserId: string,
  targetTenantId: string,
  reason: string
): Promise<void> {
  // Verify admin has platform admin role
  const admin = await db.users.findUnique({
    where: { id: adminUserId },
  });
  
  if (admin.role !== 'platform_admin') {
    throw new Error('Unauthorized: Platform admin access required');
  }
  
  // Log admin access
  await db.adminAuditLogs.create({
    data: {
      admin_user_id: adminUserId,
      tenant_id: targetTenantId,
      action: 'admin_tenant_access',
      reason,
      timestamp: new Date(),
    },
  });
  
  // Set tenant context for admin
  setCurrentTenant(targetTenantId);
}
```

---

## Scalability

### Horizontal Scaling

The multi-tenant architecture supports horizontal scaling by adding more application servers behind the load balancer. All servers share the same database and cache, ensuring consistent tenant context across the cluster.

**Session Management**: User sessions are stored in Redis rather than in-memory to support multiple application servers. Session data includes the tenant ID to prevent session hijacking across tenants.

**Stateless Design**: Application servers are stateless, with all state stored in the database or cache. This allows requests from the same user to be handled by different servers without issues.

### Database Scaling

As the number of tenants grows, database performance is maintained through several strategies.

**Indexing**: All tenant_id columns are indexed to ensure fast filtering. Composite indexes on (tenant_id, created_at) support common query patterns.

**Partitioning**: For very large deployments, tables can be partitioned by tenant_id to improve query performance and enable tenant-specific backup and recovery.

**Read Replicas**: Read-heavy queries (reports, analytics) are directed to read replicas while writes go to the primary database. Tenant context is maintained across primary and replica connections.

**Caching**: Frequently accessed tenant data (settings, user lists) is cached in Redis with tenant-scoped cache keys. Cache invalidation includes the tenant ID to prevent stale data across tenants.

---

## Migration Strategy

### From Single-Tenant to Multi-Tenant

If the application was initially built as single-tenant, migration to multi-tenant architecture follows these steps:

**Phase 1 - Schema Migration**: Add tenant_id columns to all tables and create the tenants table. Existing data is assigned to a default tenant representing the original customer.

**Phase 2 - Application Updates**: Update all database queries to include tenant filtering. Deploy tenant middleware and context management. Test thoroughly to ensure no cross-tenant data leaks.

**Phase 3 - Tenant Onboarding**: Enable new tenant registration and onboarding flows. Migrate additional customers from separate instances to the multi-tenant platform.

**Phase 4 - Optimization**: Implement row-level security, caching, and performance optimizations. Monitor for tenant isolation issues and performance bottlenecks.

---

## Summary

The multi-tenant architecture provides a scalable, secure foundation for serving multiple brokerages from a single application instance. Tenant isolation is enforced through multiple layers including application-level filtering, row-level security policies, and comprehensive audit logging. The architecture supports self-service onboarding, custom domains, and flexible resource management while maintaining complete data separation between tenants.

This design enables rapid growth by allowing new customers to be onboarded instantly without infrastructure provisioning, while maintaining the security and isolation that each brokerage requires for their sensitive transaction data.

---

**Document Control**

**Last Review Date:** January 11, 2026  
**Next Review Date:** April 11, 2026  
**Document Owner:** Engineering Team  
**Classification:** Internal - Confidential
