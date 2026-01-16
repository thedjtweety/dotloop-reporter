# Dotloop Reporter - Security Documentation

**Document Version:** 1.0  
**Last Updated:** January 15, 2026  
**Classification:** Internal - Confidential

---

## Executive Summary

The Dotloop Reporting Tool implements enterprise-grade security measures across authentication, data storage, transmission, and access control. This document outlines all security implementations for review by directors, legal counsel, and development teams.

**Key Security Highlights:**
- Multi-layer encryption for sensitive data (OAuth tokens, credentials)
- Industry-standard OAuth 2.0 authentication
- Comprehensive audit logging for compliance
- Role-based access control (RBAC)
- Secure token management with automatic rotation
- HTTPS-only communication
- Regular security testing and validation

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Data Encryption](#data-encryption)
3. [OAuth Token Security](#oauth-token-security)
4. [Network Security](#network-security)
5. [Database Security](#database-security)
6. [Audit & Compliance](#audit--compliance)
7. [Access Control](#access-control)
8. [Security Testing](#security-testing)
9. [Incident Response](#incident-response)
10. [Compliance & Standards](#compliance--standards)

---

## 1. Authentication & Authorization

### 1.1 User Authentication

**Implementation:** Manus OAuth 2.0 Single Sign-On (SSO)

**Security Features:**
- Industry-standard OAuth 2.0 protocol
- Secure session management with HTTP-only cookies
- JWT (JSON Web Token) based authentication
- Automatic session expiration
- CSRF (Cross-Site Request Forgery) protection with state tokens

**Technical Details:**
```
Authentication Flow:
1. User initiates login → Redirected to Manus OAuth portal
2. User authenticates with Manus credentials
3. OAuth server issues authorization code
4. Application exchanges code for access token
5. Secure session cookie established (HTTP-only, Secure, SameSite)
```

**Session Security:**
- Session cookies signed with `JWT_SECRET` (256-bit key)
- HTTP-only flag prevents JavaScript access
- Secure flag enforces HTTPS-only transmission
- SameSite attribute prevents CSRF attacks
- Automatic expiration after inactivity

### 1.2 Dotloop API Authentication

**Implementation:** OAuth 2.0 Authorization Code Flow

**Security Features:**
- Three-legged OAuth flow for user consent
- Secure authorization code exchange
- Encrypted token storage (see Section 3)
- Automatic token refresh before expiration
- Token revocation on disconnect

**Credentials Management:**
- `DOTLOOP_CLIENT_ID`: Public application identifier
- `DOTLOOP_CLIENT_SECRET`: Private key (never exposed to client)
- `DOTLOOP_REDIRECT_URI`: Whitelisted callback URL
- All credentials stored as encrypted environment variables

---

## 2. Data Encryption

### 2.1 Encryption at Rest

**Database Encryption:**
- Platform-level encryption provided by Manus infrastructure
- MySQL/TiDB database with encryption at rest
- Encrypted backups and snapshots

**Application-Level Encryption:**
- OAuth tokens encrypted with AES-256-CBC before database storage
- Encryption key: `TOKEN_ENCRYPTION_KEY` (256-bit)
- Random Initialization Vector (IV) for each encryption operation
- Key versioning support for future key rotation

**Technical Specification:**
```
Algorithm: AES-256-CBC
Key Size: 256 bits (32 bytes)
IV: Random 16 bytes per encryption
Encoding: Base64 for storage
Hash Algorithm: SHA-256 for token lookups
```

### 2.2 Encryption in Transit

**HTTPS Enforcement:**
- All communication over HTTPS (TLS 1.2+)
- Automatic HTTP to HTTPS redirect
- HSTS (HTTP Strict Transport Security) headers
- Secure WebSocket connections (WSS)

**API Communication:**
- All Dotloop API calls over HTTPS
- TLS certificate validation enforced
- No plain-text credential transmission

---

## 3. OAuth Token Security

### 3.1 Token Storage

**Multi-Layer Security:**

**Layer 1: Application Encryption**
- Tokens encrypted with `TOKEN_ENCRYPTION_KEY` before storage
- AES-256-CBC encryption algorithm
- Random IV prevents pattern recognition
- Token hash stored for quick lookups without decryption

**Layer 2: Database Encryption**
- Platform-level database encryption at rest
- Encrypted database backups

**Layer 3: Network Encryption**
- HTTPS for all database connections
- TLS encryption for data in transit

**Database Schema:**
```sql
CREATE TABLE oauth_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  user_id INT NOT NULL,
  provider VARCHAR(50) NOT NULL,
  encrypted_access_token TEXT NOT NULL,      -- AES-256 encrypted
  encrypted_refresh_token TEXT NOT NULL,     -- AES-256 encrypted
  token_expires_at DATETIME NOT NULL,
  encryption_key_version INT NOT NULL,       -- Supports key rotation
  token_hash VARCHAR(255) NOT NULL,          -- SHA-256 hash
  ip_address VARCHAR(45),                    -- Audit trail
  user_agent TEXT,                           -- Audit trail
  last_used_at DATETIME,
  last_refreshed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant_user (tenant_id, user_id),
  INDEX idx_provider (provider),
  INDEX idx_token_hash (token_hash)
);
```

### 3.2 Token Lifecycle Management

**Automatic Token Refresh:**
- Tokens refreshed automatically before expiration
- Refresh process transparent to users
- Failed refresh triggers re-authentication

**Token Revocation:**
- Immediate revocation on user disconnect
- Revocation request sent to Dotloop API
- Local token deletion from database
- Audit log entry created

**Token Access Control:**
- Tokens accessible only to owning user
- Tenant isolation enforced
- No cross-tenant token access
- Admin users cannot access other users' tokens

### 3.3 Token Encryption Key Management

**Key Generation:**
- 256-bit random key generated using `openssl rand -hex 32`
- Cryptographically secure random number generator
- Stored as environment variable (never in code)

**Key Rotation Support:**
- `encryption_key_version` field tracks key version
- Multiple keys supported for gradual rotation
- Old keys retained for decryption during transition
- Re-encryption process for key migration

**Key Storage:**
- Environment variable: `TOKEN_ENCRYPTION_KEY`
- Managed by Manus platform secrets management
- Never logged or exposed in error messages
- Separate from application code repository

---

## 4. Network Security

### 4.1 HTTPS Configuration

**TLS/SSL Implementation:**
- TLS 1.2 and TLS 1.3 supported
- Strong cipher suites only
- Certificate validation enforced
- Automatic certificate renewal

**Security Headers:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

### 4.2 API Security

**Dotloop API Communication:**
- All requests over HTTPS
- OAuth 2.0 Bearer token authentication
- Rate limiting implemented
- Request timeout enforcement
- Error handling without credential exposure

**Internal API (tRPC):**
- Type-safe API with automatic validation
- Session-based authentication required
- Input sanitization and validation
- SQL injection prevention (parameterized queries)
- XSS prevention (output encoding)

---

## 5. Database Security

### 5.1 Access Control

**Database Authentication:**
- Unique credentials per environment
- Connection string stored as environment variable
- No hardcoded credentials in code
- Principle of least privilege applied

**Connection Security:**
- SSL/TLS encrypted connections
- Connection pooling with timeout
- Automatic reconnection handling
- Query timeout enforcement

### 5.2 Data Isolation

**Multi-Tenancy:**
- Tenant ID required for all queries
- Row-level security enforcement
- No cross-tenant data access
- Tenant context validated on every request

**User Data Separation:**
- User ID required for sensitive operations
- OAuth tokens tied to specific users
- No shared credentials between users

### 5.3 Query Security

**SQL Injection Prevention:**
- Drizzle ORM with parameterized queries
- No raw SQL string concatenation
- Input validation before database operations
- Type-safe query building

**Example Secure Query:**
```typescript
// ✅ Secure - Parameterized query
await db
  .select()
  .from(oauthTokens)
  .where(
    and(
      eq(oauthTokens.tenantId, tenantId),
      eq(oauthTokens.userId, userId),
      eq(oauthTokens.provider, 'dotloop')
    )
  );

// ❌ Insecure - Never used
// await db.execute(`SELECT * FROM oauth_tokens WHERE user_id = ${userId}`);
```

---

## 6. Audit & Compliance

### 6.1 Audit Logging

**Token Audit Log:**

All OAuth token operations are logged for compliance and security monitoring:

**Logged Events:**
- `token_created` - New token obtained
- `token_refreshed` - Token automatically refreshed
- `token_used` - Token accessed for API call
- `token_revoked` - Token explicitly revoked
- `token_decryption_failed` - Decryption error (security alert)
- `suspicious_access` - Unusual access pattern detected
- `rate_limit_exceeded` - Rate limit violation
- `security_alert` - General security concern

**Audit Log Schema:**
```sql
CREATE TABLE token_audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  user_id INT NOT NULL,
  token_id INT,
  action VARCHAR(50) NOT NULL,
  status ENUM('success', 'failure', 'warning') NOT NULL,
  error_message TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant_user (tenant_id, user_id),
  INDEX idx_action (action),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

**Audit Log Retention:**
- Minimum 90 days retention
- Configurable retention policy
- Secure archive for long-term storage
- Tamper-evident logging

### 6.2 Security Monitoring

**Real-Time Monitoring:**
- Failed authentication attempts tracked
- Unusual access patterns detected
- Rate limit violations logged
- Token decryption failures alerted

**Alerting:**
- Security alerts sent to administrators
- Suspicious activity notifications
- Failed decryption immediate alert
- Rate limit breach notifications

---

## 7. Access Control

### 7.1 Role-Based Access Control (RBAC)

**User Roles:**

**Admin Role:**
- Full system access
- User management capabilities
- Configuration management
- Audit log access
- Commission plan management
- Team management

**User Role (Standard):**
- Access to own data only
- Upload CSV files
- View reports and analytics
- Connect Dotloop account
- No access to other users' data

**Role Enforcement:**
```typescript
// Admin-only procedure
adminProcedure: protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx });
}),
```

### 7.2 Data Access Control

**Tenant Isolation:**
- All queries filtered by `tenant_id`
- Cross-tenant access blocked at application layer
- Database-level tenant separation

**User Data Access:**
- Users can only access their own OAuth tokens
- Users can only view their own uploaded data
- Admin users have read-only access for support

**API Endpoint Protection:**
- All sensitive endpoints require authentication
- Public endpoints limited to non-sensitive data
- Rate limiting on all endpoints

---

## 8. Security Testing

### 8.1 Automated Testing

**Test Coverage:**

**OAuth Configuration Tests (5 tests):**
- ✅ Valid credentials configured
- ✅ Properly formatted redirect URI
- ✅ Valid authorization URL generation
- ✅ Client ID format validation
- ✅ Client secret format validation

**Token Encryption Tests (9 tests):**
- ✅ TOKEN_ENCRYPTION_KEY configured
- ✅ Encrypt and decrypt correctly
- ✅ Consistent hash generation
- ✅ Different hashes for different tokens
- ✅ Long token handling
- ✅ Special character handling
- ✅ Key version tracking
- ✅ IV randomization (different ciphertext for same plaintext)
- ✅ Empty string encryption

**Test Execution:**
```bash
pnpm test server/dotloopOAuth.test.ts --run
pnpm test server/tokenEncryption.test.ts --run
```

**Continuous Testing:**
- Tests run on every code change
- Pre-deployment test validation
- Automated security regression testing

### 8.2 Security Validation

**Pre-Production Checklist:**
- [ ] All environment variables configured
- [ ] HTTPS enforced on all endpoints
- [ ] OAuth flow tested end-to-end
- [ ] Token encryption validated
- [ ] Audit logging verified
- [ ] Rate limiting tested
- [ ] Error handling reviewed (no credential leaks)
- [ ] Security headers configured
- [ ] Database access control verified
- [ ] Cross-tenant isolation tested

---

## 9. Incident Response

### 9.1 Security Incident Procedures

**Incident Classification:**

**Critical:**
- Unauthorized access to OAuth tokens
- Database breach
- Token encryption key compromise
- Mass data exfiltration

**High:**
- Failed token decryption (potential key issue)
- Suspicious access patterns
- Repeated authentication failures
- Rate limit abuse

**Medium:**
- Individual failed login attempts
- Token refresh failures
- API errors

**Low:**
- Normal operational errors
- User-initiated disconnections

### 9.2 Response Actions

**Immediate Actions (Critical/High):**
1. Alert security team
2. Review audit logs
3. Identify affected users/tokens
4. Revoke compromised tokens
5. Force re-authentication if needed
6. Document incident details

**Token Compromise Response:**
1. Immediately revoke affected tokens
2. Notify affected users
3. Force re-authentication
4. Review audit logs for unauthorized access
5. Rotate encryption keys if needed
6. Update security measures

**Key Compromise Response:**
1. Generate new `TOKEN_ENCRYPTION_KEY`
2. Re-encrypt all existing tokens with new key
3. Update environment variables
4. Increment key version
5. Audit all token access during compromise window
6. Document incident and remediation

---

## 10. Compliance & Standards

### 10.1 Industry Standards

**OAuth 2.0 Compliance:**
- RFC 6749 - OAuth 2.0 Authorization Framework
- RFC 6750 - OAuth 2.0 Bearer Token Usage
- Authorization Code Flow implementation
- Secure token storage and handling

**Encryption Standards:**
- AES-256-CBC (NIST approved)
- SHA-256 hashing (NIST FIPS 180-4)
- TLS 1.2+ (IETF RFC 5246, RFC 8446)
- Cryptographically secure random number generation

**Web Security Standards:**
- OWASP Top 10 mitigation
- HTTPS-only communication
- Security headers (HSTS, CSP, etc.)
- CSRF protection
- XSS prevention
- SQL injection prevention

### 10.2 Data Protection

**Data Minimization:**
- Only necessary data collected
- OAuth tokens stored with encryption
- Audit logs contain no sensitive data
- User data isolated by tenant

**Data Retention:**
- OAuth tokens: Active until revoked
- Audit logs: Minimum 90 days
- User data: Retained per user account lifecycle
- Deleted data: Secure deletion procedures

**Right to Erasure:**
- User can disconnect Dotloop account
- Token revocation and deletion
- Audit log retention for compliance
- Data export available on request

### 10.3 Privacy Considerations

**Personal Data Handling:**
- User name and email (from Manus OAuth)
- IP address (for audit logging)
- User agent (for audit logging)
- Dotloop account data (with user consent)

**Third-Party Data Sharing:**
- Dotloop API: Only with explicit user consent via OAuth
- Manus Platform: Authentication and hosting
- No other third-party data sharing

**User Consent:**
- OAuth consent screen for Dotloop access
- Clear explanation of data usage
- Ability to revoke access anytime
- Transparent privacy policy

---

## Appendix A: Security Configuration Summary

### Environment Variables (Secrets)

| Variable | Purpose | Security Level |
|----------|---------|----------------|
| `JWT_SECRET` | Session cookie signing | Critical |
| `TOKEN_ENCRYPTION_KEY` | OAuth token encryption | Critical |
| `DOTLOOP_CLIENT_ID` | Dotloop OAuth public ID | Public |
| `DOTLOOP_CLIENT_SECRET` | Dotloop OAuth private key | Critical |
| `DOTLOOP_REDIRECT_URI` | OAuth callback URL | Public |
| `DATABASE_URL` | Database connection | Critical |
| `OAUTH_SERVER_URL` | Manus OAuth backend | Public |

**Secret Management:**
- All secrets stored as environment variables
- Managed by Manus platform secrets management
- Never committed to code repository
- Encrypted at rest by platform
- Access restricted to authorized personnel

---

## Appendix B: Security Contact Information

**Security Team:**
- Security Incidents: [security@company.com]
- General Security Questions: [security-team@company.com]

**Escalation Path:**
1. Development Team Lead
2. CTO / Technical Director
3. Legal Counsel (for compliance issues)
4. Executive Team (for critical incidents)

---

## Appendix C: Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-15 | Manus AI | Initial security documentation |

---

## Appendix D: Security Certifications & Audits

**Planned Security Activities:**
- [ ] Third-party security audit
- [ ] Penetration testing
- [ ] SOC 2 Type II compliance (if required)
- [ ] Annual security review
- [ ] Vulnerability scanning

**Current Status:**
- ✅ Automated security testing implemented
- ✅ OAuth 2.0 standard compliance
- ✅ Encryption at rest and in transit
- ✅ Comprehensive audit logging
- ✅ Role-based access control

---

**Document Classification:** Internal - Confidential  
**Distribution:** Directors, Legal Counsel, Development Team, Security Team  
**Review Cycle:** Quarterly or upon significant security changes

---

*This document contains sensitive security information. Distribution should be limited to authorized personnel only.*
