# OAuth Token Security Guide

**Document Version:** 1.0  
**Last Updated:** January 11, 2026  
**Author:** Manus AI

---

## Executive Summary

This document outlines the comprehensive security architecture for storing and managing OAuth tokens in the Dotloop Reporting Tool. OAuth tokens grant access to sensitive client data including transaction details, commission information, and personal client records. A security breach could expose confidential business information for multiple brokerages, making robust token protection essential.

The security strategy implements **defense in depth** through multiple layers including encryption at rest, access control, audit logging, and operational security procedures. This approach ensures that even if one security layer is compromised, additional layers continue to protect client data.

---

## Threat Model

### Primary Threats

**Database Breach**: Attackers gaining unauthorized access to the production database represent the highest risk. A successful breach could expose OAuth tokens for all tenants, allowing attackers to impersonate brokers and access their Dotloop data. The impact includes exposure of transaction details, client personal information, commission structures, and competitive business intelligence.

**SQL Injection**: Vulnerabilities in database queries could allow attackers to extract token data through malicious input. Modern ORMs provide some protection, but custom queries and edge cases remain vulnerable. The risk is amplified because tokens are high-value targets that provide immediate access to external systems.

**Insider Threats**: Employees, contractors, or compromised administrator accounts with database access could extract tokens for malicious purposes. This threat is particularly concerning because insiders have legitimate access credentials and may understand system architecture, making detection more difficult.

**Backup Exposure**: Database backups containing unencrypted tokens stored in cloud storage or backup systems could be compromised through misconfigured access controls, stolen credentials, or third-party breaches. Backups often receive less security scrutiny than production systems despite containing identical sensitive data.

**Application Vulnerabilities**: Memory dumps, log file exposure, error message leakage, and debugging interfaces could inadvertently expose tokens. Development and staging environments with weaker security controls pose additional risks if they contain production-like data.

### Attack Scenarios

**Scenario 1 - Database Compromise**: An attacker exploits a vulnerability in the application layer to gain database access. Without encryption, they execute a simple query to extract all OAuth tokens. They then use these tokens to systematically download transaction data from Dotloop for all brokerages, selling the competitive intelligence or using it for targeted phishing attacks against high-value clients.

**Scenario 2 - Stolen Backup**: A misconfigured S3 bucket containing database backups is discovered through automated scanning. The attacker downloads backups and extracts OAuth tokens. Because refresh tokens are long-lived, the attacker maintains access for months even after the backup exposure is discovered and remediated.

**Scenario 3 - Insider Exfiltration**: A disgruntled employee with database read access extracts OAuth tokens before leaving the company. They use these tokens to access competitor brokerage data, providing valuable market intelligence to their new employer. The breach goes undetected because the access patterns appear legitimate.

---

## Security Architecture

### Encryption at Rest

All OAuth tokens are encrypted using **AES-256-GCM** (Advanced Encryption Standard with Galois/Counter Mode) before storage in the database. This authenticated encryption algorithm provides both confidentiality and integrity protection, ensuring tokens cannot be read or tampered with even if the database is compromised.

The encryption process generates a unique initialization vector for each token, preventing pattern analysis across multiple encrypted values. The authentication tag ensures any tampering with encrypted data is detected during decryption attempts. Tokens are encrypted immediately upon receipt from the OAuth provider and remain encrypted throughout their lifecycle in the database.

**Key Management**: Encryption keys are stored separately from encrypted data using environment variables in production and dedicated secret management services (AWS Secrets Manager, Google Cloud Secret Manager, or HashiCorp Vault). Keys are never committed to version control or stored in application code. The system supports multiple concurrent key versions to enable zero-downtime key rotation.

**Encryption Key Rotation**: Keys are rotated every 90 days following a phased approach. New tokens are encrypted with the latest key version while existing tokens remain encrypted with their original keys. A background migration process gradually re-encrypts old tokens with new keys. The system maintains a mapping of key versions to support decryption of tokens encrypted with any active or recently retired key.

### Token Hashing

In addition to encryption, tokens are hashed using **SHA-256** to create a unique identifier for database lookups. This prevents the need to decrypt tokens for comparison operations and provides an additional security layer. Even if an attacker gains read access to the database, they cannot reverse the hash to obtain the original token.

The hash serves as the primary key for token lookups, ensuring the actual token value never appears in database queries, query logs, or slow query analyzers. This approach also prevents timing attacks based on string comparison operations.

### Secure Memory Handling

Tokens are treated as sensitive data throughout their lifecycle in application memory. A specialized `SecureToken` class wraps token strings in memory buffers that are explicitly zeroed after use, preventing tokens from lingering in memory where they could be exposed through memory dumps or swap files.

Token variables are scoped as tightly as possible, minimizing the time they remain in memory. Garbage collection alone is insufficient because it does not guarantee immediate memory clearing, and memory pages may be written to disk during swapping. The explicit zeroing approach ensures tokens are removed from memory as soon as they are no longer needed.

### Transport Security

All token transmission occurs over **HTTPS with TLS 1.3**, ensuring end-to-end encryption between clients, the application server, and external APIs. HTTP Strict Transport Security (HSTS) headers prevent protocol downgrade attacks. Certificates are managed through automated renewal systems to prevent expiration-related outages.

Session cookies containing authentication data use the `secure`, `httpOnly`, and `sameSite=strict` flags to prevent exposure through JavaScript access, transmission over unencrypted connections, or cross-site request forgery attacks.

---

## Database Schema Design

### Tenants Table

The tenants table serves as the root of the multi-tenant architecture, representing each brokerage or organization using the system. Each tenant has a unique identifier, subdomain for access, and configuration settings.

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(63) UNIQUE NOT NULL,
  custom_domain VARCHAR(255) UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_subdomain CHECK (subdomain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
  CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'deleted'))
);

CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain) WHERE custom_domain IS NOT NULL;
```

### OAuth Tokens Table

The oauth_tokens table stores encrypted access and refresh tokens with associated metadata for security monitoring and token management.

```sql
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL DEFAULT 'dotloop',
  
  -- Encrypted token data
  encrypted_access_token TEXT NOT NULL,
  encrypted_refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP NOT NULL,
  
  -- Security metadata
  encryption_key_version INTEGER NOT NULL DEFAULT 1,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  
  -- Context binding
  ip_address INET,
  user_agent TEXT,
  device_fingerprint VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP,
  last_refreshed_at TIMESTAMP,
  
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) 
    REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT valid_provider CHECK (provider IN ('dotloop'))
);

CREATE INDEX idx_oauth_tokens_tenant ON oauth_tokens(tenant_id);
CREATE INDEX idx_oauth_tokens_user ON oauth_tokens(user_id);
CREATE INDEX idx_oauth_tokens_hash ON oauth_tokens(token_hash);
CREATE INDEX idx_oauth_tokens_expires ON oauth_tokens(token_expires_at) 
  WHERE token_expires_at > NOW();
```

### Row-Level Security

PostgreSQL row-level security policies enforce tenant isolation at the database level, preventing cross-tenant data access even if application-level checks fail.

```sql
-- Enable row-level security
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access tokens for their tenant
CREATE POLICY tenant_isolation_policy ON oauth_tokens
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Policy: Superusers bypass RLS for administrative operations
CREATE POLICY superuser_access_policy ON oauth_tokens
  FOR ALL
  TO superuser_role
  USING (true);
```

Application code sets the tenant context before executing queries:

```sql
-- Set tenant context for current session
SET LOCAL app.current_tenant_id = 'tenant-uuid-here';

-- All subsequent queries automatically filter by tenant
SELECT * FROM oauth_tokens WHERE user_id = 'user-uuid';
-- Returns only tokens for the current tenant
```

### Audit Logs Table

The token_audit_logs table records all security-relevant events for forensic analysis and anomaly detection.

```sql
CREATE TABLE token_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  token_id UUID,
  
  -- Event details
  action VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  
  -- Request context
  ip_address INET NOT NULL,
  user_agent TEXT,
  request_id VARCHAR(255),
  
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) 
    REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT valid_action CHECK (action IN (
    'token_created', 'token_refreshed', 'token_used', 
    'token_revoked', 'token_decryption_failed', 
    'suspicious_access', 'rate_limit_exceeded'
  )),
  CONSTRAINT valid_status CHECK (status IN ('success', 'failure', 'warning'))
);

CREATE INDEX idx_audit_tenant_time ON token_audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_action ON token_audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_suspicious ON token_audit_logs(tenant_id, created_at DESC) 
  WHERE action = 'suspicious_access';
```

---

## Implementation Details

### Token Encryption Utilities

The encryption module provides secure token encryption and decryption with support for key rotation.

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

interface EncryptionConfig {
  keyVersion: number;
  key: Buffer;
}

class TokenEncryption {
  private keys: Map<number, Buffer> = new Map();
  private currentKeyVersion: number;
  
  constructor() {
    this.loadEncryptionKeys();
    this.currentKeyVersion = Math.max(...Array.from(this.keys.keys()));
  }
  
  private loadEncryptionKeys(): void {
    // Load current key
    const currentKey = process.env.TOKEN_ENCRYPTION_KEY;
    if (!currentKey) {
      throw new Error('TOKEN_ENCRYPTION_KEY environment variable not set');
    }
    this.keys.set(1, Buffer.from(currentKey, 'hex'));
    
    // Load previous keys for rotation support
    for (let version = 2; version <= 10; version++) {
      const key = process.env[`TOKEN_ENCRYPTION_KEY_V${version}`];
      if (key) {
        this.keys.set(version, Buffer.from(key, 'hex'));
      }
    }
  }
  
  /**
   * Encrypts a token using AES-256-GCM
   * Returns: keyVersion:iv:authTag:encryptedData
   */
  encrypt(token: string, keyVersion?: number): string {
    const version = keyVersion || this.currentKeyVersion;
    const key = this.keys.get(version);
    
    if (!key) {
      throw new Error(`Encryption key version ${version} not found`);
    }
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${version}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
  
  /**
   * Decrypts an encrypted token
   * Automatically detects key version from encrypted data
   */
  decrypt(encryptedToken: string): string {
    const parts = encryptedToken.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted token format');
    }
    
    const [versionStr, ivHex, authTagHex, encrypted] = parts;
    const version = parseInt(versionStr, 10);
    const key = this.keys.get(version);
    
    if (!key) {
      throw new Error(`Decryption key version ${version} not found`);
    }
    
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(ivHex, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    
    try {
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new Error('Token decryption failed - possible tampering detected');
    }
  }
  
  /**
   * Creates SHA-256 hash of token for database lookups
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
  
  /**
   * Re-encrypts a token with a new key version
   */
  reencrypt(encryptedToken: string, newKeyVersion: number): string {
    const decrypted = this.decrypt(encryptedToken);
    return this.encrypt(decrypted, newKeyVersion);
  }
}

export const tokenEncryption = new TokenEncryption();
```

### Secure Token Class

The SecureToken class provides memory-safe token handling with automatic cleanup.

```typescript
class SecureToken {
  private buffer: Buffer | null;
  private destroyed: boolean = false;
  
  constructor(token: string) {
    this.buffer = Buffer.from(token, 'utf8');
  }
  
  getValue(): string {
    if (this.destroyed) {
      throw new Error('Cannot access destroyed token');
    }
    if (!this.buffer) {
      throw new Error('Token buffer is null');
    }
    return this.buffer.toString('utf8');
  }
  
  destroy(): void {
    if (this.buffer) {
      // Overwrite buffer with zeros
      this.buffer.fill(0);
      this.buffer = null;
    }
    this.destroyed = true;
  }
  
  // Automatic cleanup when object is garbage collected
  [Symbol.dispose](): void {
    this.destroy();
  }
}

// Usage with automatic cleanup
async function makeSecureAPICall(encryptedToken: string) {
  using secureToken = new SecureToken(tokenEncryption.decrypt(encryptedToken));
  return await dotloopAPI.call(secureToken.getValue());
  // Token automatically destroyed when leaving scope
}
```

### Token Storage Service

The token storage service handles all token operations with encryption, validation, and audit logging.

```typescript
interface StoredToken {
  id: string;
  tenantId: string;
  userId: string;
  provider: string;
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
  tokenExpiresAt: Date;
  encryptionKeyVersion: number;
  tokenHash: string;
  ipAddress?: string;
  userAgent?: string;
  lastUsedAt?: Date;
}

class TokenStorageService {
  /**
   * Stores OAuth tokens securely
   */
  async storeTokens(params: {
    tenantId: string;
    userId: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const tokenHash = tokenEncryption.hashToken(params.accessToken);
    const encryptedAccessToken = tokenEncryption.encrypt(params.accessToken);
    const encryptedRefreshToken = tokenEncryption.encrypt(params.refreshToken);
    const tokenExpiresAt = new Date(Date.now() + params.expiresIn * 1000);
    
    await db.oauthTokens.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        provider: 'dotloop',
        encryptedAccessToken,
        encryptedRefreshToken,
        tokenExpiresAt,
        encryptionKeyVersion: 1,
        tokenHash,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
    
    await auditLog.log({
      tenantId: params.tenantId,
      userId: params.userId,
      action: 'token_created',
      status: 'success',
      ipAddress: params.ipAddress || '0.0.0.0',
      userAgent: params.userAgent,
    });
  }
  
  /**
   * Retrieves and validates access token, refreshing if needed
   */
  async getValidAccessToken(tenantId: string, userId: string): Promise<string> {
    const tokenRecord = await db.oauthTokens.findFirst({
      where: {
        tenantId,
        userId,
        provider: 'dotloop',
      },
    });
    
    if (!tokenRecord) {
      throw new Error('No OAuth token found for user');
    }
    
    // Check if token is expired or expiring soon (5 min buffer)
    const expiresAt = new Date(tokenRecord.tokenExpiresAt);
    const now = new Date();
    const bufferMs = 5 * 60 * 1000;
    
    if (expiresAt.getTime() - now.getTime() < bufferMs) {
      // Token expired - refresh it
      return await this.refreshToken(tokenRecord);
    }
    
    // Update last used timestamp
    await db.oauthTokens.update({
      where: { id: tokenRecord.id },
      data: { lastUsedAt: new Date() },
    });
    
    await auditLog.log({
      tenantId,
      userId,
      tokenId: tokenRecord.id,
      action: 'token_used',
      status: 'success',
      ipAddress: '0.0.0.0', // Get from request context
    });
    
    // Decrypt and return
    try {
      return tokenEncryption.decrypt(tokenRecord.encryptedAccessToken);
    } catch (error) {
      await auditLog.log({
        tenantId,
        userId,
        tokenId: tokenRecord.id,
        action: 'token_decryption_failed',
        status: 'failure',
        errorMessage: error.message,
        ipAddress: '0.0.0.0',
      });
      throw error;
    }
  }
  
  /**
   * Refreshes an expired access token
   */
  private async refreshToken(tokenRecord: StoredToken): Promise<string> {
    const refreshToken = tokenEncryption.decrypt(tokenRecord.encryptedRefreshToken);
    
    // Call Dotloop API to refresh token
    const newTokens = await dotloopAPI.refreshAccessToken(refreshToken);
    
    // Store new tokens
    const newTokenHash = tokenEncryption.hashToken(newTokens.accessToken);
    const encryptedAccessToken = tokenEncryption.encrypt(newTokens.accessToken);
    const encryptedRefreshToken = tokenEncryption.encrypt(newTokens.refreshToken);
    const tokenExpiresAt = new Date(Date.now() + newTokens.expiresIn * 1000);
    
    await db.oauthTokens.update({
      where: { id: tokenRecord.id },
      data: {
        encryptedAccessToken,
        encryptedRefreshToken,
        tokenExpiresAt,
        tokenHash: newTokenHash,
        lastRefreshedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    await auditLog.log({
      tenantId: tokenRecord.tenantId,
      userId: tokenRecord.userId,
      tokenId: tokenRecord.id,
      action: 'token_refreshed',
      status: 'success',
      ipAddress: '0.0.0.0',
    });
    
    return newTokens.accessToken;
  }
  
  /**
   * Revokes OAuth token
   */
  async revokeToken(tenantId: string, userId: string): Promise<void> {
    const tokenRecord = await db.oauthTokens.findFirst({
      where: { tenantId, userId, provider: 'dotloop' },
    });
    
    if (tokenRecord) {
      // Call Dotloop API to revoke token
      const accessToken = tokenEncryption.decrypt(tokenRecord.encryptedAccessToken);
      await dotloopAPI.revokeToken(accessToken);
      
      // Delete from database
      await db.oauthTokens.delete({
        where: { id: tokenRecord.id },
      });
      
      await auditLog.log({
        tenantId,
        userId,
        tokenId: tokenRecord.id,
        action: 'token_revoked',
        status: 'success',
        ipAddress: '0.0.0.0',
      });
    }
  }
}

export const tokenStorage = new TokenStorageService();
```

---

## Audit Logging & Monitoring

### Audit Log Service

The audit logging service records all security-relevant events with structured data for analysis.

```typescript
interface AuditLogEntry {
  tenantId: string;
  userId?: string;
  tokenId?: string;
  action: string;
  status: 'success' | 'failure' | 'warning';
  errorMessage?: string;
  ipAddress: string;
  userAgent?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

class AuditLogService {
  async log(entry: AuditLogEntry): Promise<void> {
    await db.tokenAuditLogs.create({
      data: {
        ...entry,
        createdAt: new Date(),
      },
    });
    
    // Check for suspicious patterns
    await this.detectAnomalies(entry);
  }
  
  /**
   * Detects suspicious access patterns
   */
  private async detectAnomalies(entry: AuditLogEntry): Promise<void> {
    // Check for high-frequency token access
    const recentLogs = await db.tokenAuditLogs.count({
      where: {
        tenantId: entry.tenantId,
        action: 'token_used',
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });
    
    if (recentLogs > 1000) {
      await this.alertSecurityTeam({
        type: 'high_frequency_access',
        tenantId: entry.tenantId,
        count: recentLogs,
        message: 'Unusually high token access frequency detected',
      });
    }
    
    // Check for failed decryption attempts
    if (entry.action === 'token_decryption_failed') {
      await this.alertSecurityTeam({
        type: 'decryption_failure',
        tenantId: entry.tenantId,
        tokenId: entry.tokenId,
        message: 'Token decryption failed - possible tampering',
      });
    }
    
    // Check for access from unusual IP addresses
    const recentIPs = await db.tokenAuditLogs.findMany({
      where: {
        tenantId: entry.tenantId,
        userId: entry.userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      select: { ipAddress: true },
      distinct: ['ipAddress'],
    });
    
    const knownIPs = new Set(recentIPs.map(log => log.ipAddress));
    if (!knownIPs.has(entry.ipAddress) && entry.action === 'token_used') {
      await this.log({
        ...entry,
        action: 'suspicious_access',
        status: 'warning',
        metadata: {
          reason: 'access_from_new_ip',
          newIP: entry.ipAddress,
          knownIPs: Array.from(knownIPs),
        },
      });
    }
  }
  
  /**
   * Sends security alerts to monitoring system
   */
  private async alertSecurityTeam(alert: {
    type: string;
    tenantId: string;
    tokenId?: string;
    count?: number;
    message: string;
  }): Promise<void> {
    // Send to monitoring system (Datadog, Sentry, PagerDuty, etc.)
    console.error('[SECURITY ALERT]', alert);
    
    // Log to database
    await db.tokenAuditLogs.create({
      data: {
        tenantId: alert.tenantId,
        tokenId: alert.tokenId,
        action: 'security_alert',
        status: 'warning',
        errorMessage: alert.message,
        ipAddress: '0.0.0.0',
        metadata: alert,
      },
    });
  }
  
  /**
   * Retrieves audit logs for a tenant
   */
  async getAuditLogs(params: {
    tenantId: string;
    startDate?: Date;
    endDate?: Date;
    action?: string;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    return await db.tokenAuditLogs.findMany({
      where: {
        tenantId: params.tenantId,
        ...(params.action && { action: params.action }),
        ...(params.startDate && {
          createdAt: { gte: params.startDate },
        }),
        ...(params.endDate && {
          createdAt: { lte: params.endDate },
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit || 100,
    });
  }
}

export const auditLog = new AuditLogService();
```

---

## Operational Security

### Key Rotation Procedure

Encryption keys should be rotated every 90 days to limit the impact of potential key compromise. The rotation process is designed to avoid service disruption while ensuring all tokens are eventually encrypted with the latest key.

**Rotation Steps:**

1. **Generate New Key**: Create a new 32-byte encryption key using a cryptographically secure random number generator.

2. **Deploy New Key**: Add the new key to the secret management system with an incremented version number. Deploy the updated configuration to all application servers without restarting services.

3. **Update Current Version**: Modify the application configuration to use the new key version for all new token encryption operations. Existing tokens remain encrypted with their original keys.

4. **Background Migration**: Run a background job that gradually re-encrypts existing tokens with the new key. The job processes tokens in batches to avoid database load spikes, prioritizing recently used tokens.

5. **Verify Migration**: Monitor the migration progress and verify that all tokens have been successfully re-encrypted. Check audit logs for any decryption failures that might indicate issues with the new key.

6. **Retire Old Key**: After all tokens have been migrated and a grace period has passed (typically 30 days), remove the old key from the system. Maintain the old key in secure offline storage for potential forensic analysis.

### Backup Security

Database backups must receive the same security attention as production systems because they contain identical sensitive data.

**Backup Encryption**: All database backups are encrypted using GPG with a dedicated backup encryption key that is stored separately from production encryption keys. Backups use a different encryption key than the token encryption keys to ensure compromise of one does not affect the other.

**Access Control**: Backup storage (S3 buckets, backup servers) is restricted to a minimal set of administrators using role-based access control. All backup access is logged and monitored. Multi-factor authentication is required for any backup restoration operations.

**Retention Policy**: Backups are retained for 30 days for operational recovery and 90 days for compliance purposes. Older backups are automatically deleted to minimize the window of exposure. Long-term archival backups (if required) undergo additional encryption and are stored in separate systems.

**Restoration Testing**: Backup restoration procedures are tested quarterly to ensure backups are valid and encryption keys are accessible. Test restorations are performed in isolated environments and all restored data is securely deleted after testing.

### Incident Response

In the event of a suspected or confirmed token compromise, the incident response team follows a structured procedure to contain the breach, assess the impact, and restore security.

**Immediate Response (0-1 hour):**

- Identify the scope of the compromise (which tenants, which tokens)
- Revoke all affected OAuth tokens through the Dotloop API
- Force re-authentication for affected users
- Enable enhanced monitoring and logging
- Preserve forensic evidence (logs, database snapshots)

**Investigation (1-24 hours):**

- Analyze audit logs to determine attack vector and timeline
- Identify any unauthorized data access or modification
- Assess whether attacker gained access to other systems
- Document all findings for legal and compliance purposes

**Containment (24-72 hours):**

- Patch vulnerabilities that enabled the breach
- Rotate all encryption keys
- Review and strengthen access controls
- Implement additional security measures to prevent recurrence

**Notification (within 72 hours):**

- Notify affected clients in accordance with data breach notification laws
- Provide guidance on securing their Dotloop accounts
- Offer credit monitoring services if personal information was exposed
- Coordinate with legal counsel on regulatory reporting requirements

**Recovery (1-2 weeks):**

- Conduct comprehensive security audit
- Update security documentation and procedures
- Provide security training to development and operations teams
- Implement lessons learned into security architecture

---

## Compliance & Best Practices

### Development Practices

**Never Log Tokens**: Tokens must never appear in application logs, error messages, or debugging output. Logging frameworks should be configured with automatic redaction rules that mask token values. Code reviews must specifically check for token logging violations.

**Parameterized Queries**: All database queries must use parameterized statements or ORM methods that automatically escape user input. Raw SQL queries are prohibited except in carefully reviewed administrative tools. This prevents SQL injection attacks that could expose token data.

**Secure Error Handling**: Error messages returned to clients must not contain sensitive information about token storage, encryption, or database structure. Detailed error information is logged server-side for debugging but sanitized before transmission to clients.

**Code Review Checklist**: Every code change touching token handling must pass a security-focused code review that specifically checks for proper encryption, audit logging, tenant isolation, and secure memory handling.

### Testing Requirements

**Unit Tests**: Encryption and decryption functions must have comprehensive unit tests covering normal operation, key rotation scenarios, and error conditions. Tests verify that decryption fails appropriately when tokens are tampered with.

**Integration Tests**: Token storage and retrieval flows must be tested end-to-end including tenant isolation, automatic token refresh, and audit logging. Tests verify that tokens for one tenant cannot be accessed by another tenant.

**Security Tests**: Penetration testing should specifically target token storage and attempt SQL injection, privilege escalation, and cross-tenant data access. Tests should be conducted by external security firms at least annually.

**Performance Tests**: Token encryption and decryption operations must be load tested to ensure they do not become performance bottlenecks. Caching strategies should be implemented where appropriate while maintaining security.

### Monitoring & Alerting

**Real-Time Alerts**: Security monitoring systems should generate immediate alerts for critical events including failed token decryption, unusual access patterns, rate limit violations, and access from new IP addresses.

**Daily Reports**: Automated daily reports summarize token usage statistics, security events, and potential anomalies. Reports are reviewed by the security team to identify trends that might indicate emerging threats.

**Quarterly Reviews**: Comprehensive security reviews are conducted quarterly to assess the effectiveness of security controls, review audit logs for patterns, and identify areas for improvement.

---

## Summary

OAuth token security is achieved through multiple complementary layers of protection. Encryption at rest ensures tokens cannot be read even if the database is compromised. Access controls and tenant isolation prevent unauthorized access to tokens. Audit logging provides visibility into token usage and enables detection of suspicious activity. Operational security procedures ensure keys are rotated, backups are secured, and incidents are handled appropriately.

No single security measure is perfect, but the combination of technical controls, operational procedures, and monitoring creates a robust security posture that protects client data even when individual components are compromised. Regular security reviews, penetration testing, and incident response drills ensure the security architecture remains effective as threats evolve.

The security architecture is designed to be transparent to end users while providing comprehensive protection for their sensitive business data. Brokers can confidently connect their Dotloop accounts knowing that their transaction data, commission information, and client details are protected by enterprise-grade security controls.

---

**Document Control**

This document should be reviewed and updated quarterly or whenever significant changes are made to the security architecture. All updates must be approved by the security team and communicated to relevant stakeholders.

**Last Review Date:** January 11, 2026  
**Next Review Date:** April 11, 2026  
**Document Owner:** Security Team  
**Classification:** Internal - Confidential
