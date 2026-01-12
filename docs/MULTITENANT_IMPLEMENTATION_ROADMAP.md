# Multi-Tenant Implementation Roadmap

## Current Status (Jan 12, 2026 - 11:30 PM)

### ✅ Completed
1. **Database Schema** - All 8 tables created with tenant isolation
2. **Token Encryption** - AES-256-GCM encryption utilities implemented
3. **Security Documentation** - Comprehensive OAuth security guide created
4. **Architecture Documentation** - Multi-tenant architecture documented
5. **Data Migration** - Old data backed up, new schema deployed
6. **Demo Data** - Seeded with 1 tenant, 1 user, 100 transactions

### ⚠️ In Progress
- **Application Code Refactoring** - Needs tenant context throughout

### ❌ Not Started
- OAuth integration with Dotloop API
- Tenant management UI
- Tenant context middleware
- Row-level security enforcement

---

## Phase 1: Fix TypeScript Errors & Add Tenant Context (Priority: CRITICAL)

### Problem
The application code still uses the old single-tenant schema. All database operations need to include `tenantId`.

### TypeScript Errors to Fix
```
Property 'tenantId' is missing in type '{ adminId: any; adminName: any; adminEmail: any; action: "upload_deleted"; ... }'
```

### Files That Need Updates

#### 1. **server/uploadDb.ts** (Line 119-128)
**Current:**
```typescript
await db.insert(auditLogs).values({
  adminId: adminUser.id,
  adminName: adminUser.name || 'Unknown Admin',
  adminEmail: adminUser.email || undefined,
  action: 'upload_deleted',
  targetType: 'upload',
  targetId: uploadId,
  targetName: upload.fileName,
  details: JSON.stringify({ uploadedBy: userId, recordCount: upload.recordCount }),
});
```

**Needs:**
```typescript
await db.insert(auditLogs).values({
  tenantId: adminUser.tenantId, // Get from user record
  adminId: adminUser.id,
  adminName: adminUser.name || 'Unknown Admin',
  adminEmail: adminUser.email || undefined,
  action: 'upload_deleted',
  targetType: 'upload',
  targetId: uploadId,
  targetName: upload.fileName,
  details: JSON.stringify({ uploadedBy: userId, recordCount: upload.recordCount }),
});
```

#### 2. **server/adminRouter.ts** (Lines 171-177, 217-223)
Same pattern - add `tenantId: ctx.user.tenantId` to audit log inserts

#### 3. **server/auditLogRouter.ts** (Lines 040-046)
Same pattern - add `tenantId: user.tenantId` to audit log inserts

#### 4. **server/auth.ts** (User upsert operations)
**Current Error:**
```
Field 'tenantId' doesn't have a default value
```

**Problem:** When syncing users from OAuth, we're not providing tenantId

**Solution:** Need to determine tenant from:
- Subdomain in request URL
- Custom domain mapping
- Default tenant for first-time users

---

## Phase 2: Implement Tenant Context System (Priority: HIGH)

### Goal
Every request should automatically know which tenant it belongs to.

### Implementation Steps

#### 1. Create Tenant Context Middleware
**File:** `server/middleware/tenantContext.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db';
import { tenants } from '../../drizzle/schema';
import { eq, or } from 'drizzle-orm';

export interface TenantContext {
  tenantId: number;
  tenant: typeof tenants.$inferSelect;
}

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}

export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const db = await getDb();
  if (!db) {
    return res.status(500).json({ error: 'Database not available' });
  }

  // Extract tenant identifier from request
  const host = req.hostname;
  const subdomain = extractSubdomain(host);
  const customDomain = host;

  // Find tenant by subdomain or custom domain
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(
      or(
        eq(tenants.subdomain, subdomain),
        eq(tenants.customDomain, customDomain)
      )
    )
    .limit(1);

  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  if (tenant.status !== 'active') {
    return res.status(403).json({ error: 'Tenant account is suspended' });
  }

  req.tenant = {
    tenantId: tenant.id,
    tenant,
  };

  next();
}

function extractSubdomain(host: string): string {
  // Extract subdomain from host
  // e.g., "demo.manus.space" -> "demo"
  const parts = host.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }
  return 'demo'; // Default for development
}
```

#### 2. Update Auth Middleware
**File:** `server/middleware/auth.ts`

Add tenant context to user sync:
```typescript
// When upserting user, include tenantId from request
await db.insert(users).values({
  tenantId: req.tenant!.tenantId, // From tenant middleware
  openId: profile.openId,
  name: profile.name,
  email: profile.email,
  loginMethod: 'oauth',
  role: 'user',
}).onDuplicateKeyUpdate({
  set: {
    name: profile.name,
    email: profile.email,
    lastSignedIn: new Date(),
  },
});
```

#### 3. Apply Middleware to All Routes
**File:** `server/index.ts`

```typescript
import { tenantMiddleware } from './middleware/tenantContext';

// Apply tenant middleware to all routes (except health check)
app.use('/api', tenantMiddleware);
```

---

## Phase 3: Add Row-Level Security (Priority: HIGH)

### Goal
Ensure all database queries automatically filter by tenantId.

### Implementation Options

#### Option A: Query Helpers
Create wrapper functions that automatically add tenant filters:

```typescript
// server/lib/tenantQueries.ts
export function tenantQuery<T>(
  db: Database,
  table: Table,
  tenantId: number
) {
  return db.select().from(table).where(eq(table.tenantId, tenantId));
}
```

#### Option B: Drizzle RLS (Recommended)
Use Drizzle's row-level security features:

```typescript
// Set tenant context for all queries in a request
export async function withTenantContext<T>(
  tenantId: number,
  callback: () => Promise<T>
): Promise<T> {
  // All queries within callback automatically filter by tenantId
  return callback();
}
```

### Files to Update
- `server/uploadRouter.ts` - Add tenant filters to all queries
- `server/transactionRouter.ts` - Add tenant filters
- `server/adminRouter.ts` - Add tenant filters
- `server/auditLogRouter.ts` - Add tenant filters

---

## Phase 4: Implement OAuth Token Management (Priority: MEDIUM)

### Goal
Securely store and manage Dotloop OAuth tokens per tenant.

### Components Needed

#### 1. OAuth Flow Handler
**File:** `server/oauth/dotloopOAuth.ts`

```typescript
import { encryptToken, decryptToken } from '../lib/token-encryption';
import { oauthTokens } from '../../drizzle/schema';

export async function handleOAuthCallback(
  code: string,
  tenantId: number,
  userId: number
) {
  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code);
  
  // Encrypt tokens
  const encryptedAccess = await encryptToken(tokens.access_token);
  const encryptedRefresh = await encryptToken(tokens.refresh_token);
  
  // Store in database
  await db.insert(oauthTokens).values({
    tenantId,
    userId,
    provider: 'dotloop',
    encryptedAccessToken: encryptedAccess.encrypted,
    encryptedRefreshToken: encryptedRefresh.encrypted,
    tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    encryptionKeyVersion: 1,
    tokenHash: encryptedAccess.hash,
  });
}
```

#### 2. Token Refresh Service
**File:** `server/oauth/tokenRefresh.ts`

```typescript
export async function refreshTokenIfNeeded(
  tenantId: number,
  userId: number
): Promise<string> {
  const [tokenRecord] = await db
    .select()
    .from(oauthTokens)
    .where(
      and(
        eq(oauthTokens.tenantId, tenantId),
        eq(oauthTokens.userId, userId),
        eq(oauthTokens.provider, 'dotloop')
      )
    )
    .limit(1);

  if (!tokenRecord) {
    throw new Error('No OAuth token found');
  }

  // Check if token is expired
  if (new Date() >= tokenRecord.tokenExpiresAt) {
    // Refresh token
    const refreshToken = await decryptToken(tokenRecord.encryptedRefreshToken);
    const newTokens = await refreshAccessToken(refreshToken);
    
    // Update database
    const encryptedAccess = await encryptToken(newTokens.access_token);
    await db
      .update(oauthTokens)
      .set({
        encryptedAccessToken: encryptedAccess.encrypted,
        tokenExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
        lastRefreshedAt: new Date(),
      })
      .where(eq(oauthTokens.id, tokenRecord.id));
    
    return newTokens.access_token;
  }

  // Decrypt and return existing token
  return await decryptToken(tokenRecord.encryptedAccessToken);
}
```

#### 3. Dotloop API Client
**File:** `server/lib/dotloopClient.ts`

```typescript
export class DotloopClient {
  constructor(
    private tenantId: number,
    private userId: number
  ) {}

  async getLoops() {
    const accessToken = await refreshTokenIfNeeded(this.tenantId, this.userId);
    
    const response = await fetch('https://api.dotloop.com/v2/loops', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    return response.json();
  }
}
```

---

## Phase 5: Build Tenant Management UI (Priority: MEDIUM)

### Components Needed

#### 1. Tenant Settings Page
- View tenant information
- Update tenant name
- Manage custom domain
- View subscription tier
- Connect/disconnect Dotloop OAuth

#### 2. OAuth Connection Flow
- "Connect to Dotloop" button
- OAuth redirect to Dotloop
- Callback handler
- Success/error feedback
- Token status indicator

#### 3. Multi-Tenant Admin Panel (Platform Level)
- List all tenants
- View tenant details
- Suspend/activate tenants
- View platform-wide analytics

---

## Phase 6: Testing & Validation (Priority: HIGH)

### Test Cases

#### 1. Tenant Isolation Tests
- ✅ User from Tenant A cannot see Tenant B's data
- ✅ Uploads are scoped to correct tenant
- ✅ Transactions are scoped to correct tenant
- ✅ Audit logs are scoped to correct tenant

#### 2. OAuth Token Tests
- ✅ Tokens are encrypted at rest
- ✅ Tokens are decrypted correctly
- ✅ Token refresh works automatically
- ✅ Expired tokens are refreshed
- ✅ Token audit logs are created

#### 3. Security Tests
- ✅ Cannot access other tenant's OAuth tokens
- ✅ Cannot bypass tenant context
- ✅ Subdomain routing works correctly
- ✅ Custom domain routing works correctly

---

## Environment Variables Needed

Add to `.env`:

```bash
# Encryption
ENCRYPTION_KEY=<generate-32-byte-hex-key>
ENCRYPTION_KEY_V2=<for-key-rotation>

# Dotloop OAuth
DOTLOOP_CLIENT_ID=<from-dotloop-developer-portal>
DOTLOOP_CLIENT_SECRET=<from-dotloop-developer-portal>
DOTLOOP_REDIRECT_URI=https://yourdomain.com/api/oauth/dotloop/callback

# Multi-Tenant
DEFAULT_TENANT_SUBDOMAIN=demo
PLATFORM_ADMIN_EMAILS=admin@example.com
```

---

## Database Migrations Needed

### Migration: Add Indexes for Performance

```sql
-- Add composite indexes for tenant-scoped queries
CREATE INDEX idx_transactions_tenant_status ON transactions(tenantId, loopStatus);
CREATE INDEX idx_transactions_tenant_created ON transactions(tenantId, createdDate);
CREATE INDEX idx_uploads_tenant_user ON uploads(tenantId, userId);
CREATE INDEX idx_oauth_tokens_tenant_user ON oauth_tokens(tenantId, userId);
```

---

## Documentation Updates Needed

1. **README.md** - Add multi-tenant setup instructions
2. **DEPLOYMENT.md** - Add environment variable requirements
3. **API.md** - Document tenant context in API requests
4. **OAUTH.md** - Document OAuth connection flow for brokers

---

## Estimated Time to Complete

| Phase | Estimated Time | Priority |
|-------|---------------|----------|
| Phase 1: Fix TypeScript Errors | 1-2 hours | CRITICAL |
| Phase 2: Tenant Context System | 2-3 hours | HIGH |
| Phase 3: Row-Level Security | 2-3 hours | HIGH |
| Phase 4: OAuth Token Management | 4-5 hours | MEDIUM |
| Phase 5: Tenant Management UI | 3-4 hours | MEDIUM |
| Phase 6: Testing & Validation | 2-3 hours | HIGH |
| **Total** | **14-20 hours** | |

---

## Next Session Action Plan

1. **Start with Phase 1** - Fix all TypeScript errors (1-2 hours)
2. **Implement Phase 2** - Add tenant context middleware (2-3 hours)
3. **Test basic multi-tenancy** - Verify tenant isolation works
4. **Move to Phase 4** - Implement OAuth flow (if time permits)

---

## Notes

- All security documentation is in `/docs/SECURITY.md`
- Architecture details are in `/docs/ARCHITECTURE.md`
- Data backup is in `/backups/pre-multitenant-2026-01-12T04-23-24/`
- Token encryption utilities are in `/server/lib/token-encryption.ts`
- Multi-tenant schema is in `/drizzle/schema.ts`

---

## Questions to Resolve

1. **Subdomain Strategy**: What subdomain format? `{brokerage}.manus.space` or `{brokerage}.dotloop-reporter.com`?
2. **Default Tenant**: How should first-time users be assigned to a tenant?
3. **Tenant Creation**: Self-service signup or admin-only?
4. **Pricing Tiers**: What features are included in each subscription tier?
5. **Data Migration**: Should we migrate the 50K backed-up transactions or start fresh?

---

*Last Updated: Jan 12, 2026 11:30 PM*
*Status: Multi-tenant schema deployed, demo data seeded, application code needs refactoring*
