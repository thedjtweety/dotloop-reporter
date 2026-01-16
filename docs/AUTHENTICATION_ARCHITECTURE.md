# Authentication Architecture Documentation

**Document Version:** 1.0  
**Last Updated:** January 15, 2026  
**Author:** Manus AI  
**Audience:** Development Team, Security Team, Technical Leadership

---

## Executive Summary

The Dotloop Reporting Tool has transitioned from a closed, Manus-only authentication system to a public-facing application using **Dotloop OAuth 2.0 as the primary authentication mechanism**. This architectural change enables real estate professionals to access the reporting tool using their existing Dotloop credentials, eliminating the need for separate account creation while maintaining enterprise-grade security standards.

---

## Authentication Flow Architecture

### Overview

The application implements a dual-authentication system with Dotloop OAuth as the primary method and Manus authentication as a fallback for internal users. The authentication flow follows OAuth 2.0 Authorization Code Grant with PKCE-equivalent security through state parameter validation.

### Complete Authentication Sequence

The authentication process consists of several interconnected stages that work together to establish a secure user session. When a user initiates login, the system generates a cryptographically secure state parameter for CSRF protection and redirects the browser to Dotloop's authorization server. The user authenticates with their Dotloop credentials on Dotloop's platform, which then redirects back to our callback endpoint with an authorization code.

Upon receiving the callback, the server validates the state parameter to prevent CSRF attacks, exchanges the authorization code for access and refresh tokens, and fetches the user's profile information from Dotloop's API. The system then creates or updates the user record in the database, stores the encrypted OAuth tokens, generates a JWT session token, and sets a secure HTTP-only cookie before redirecting the user to the dashboard.

### Security Measures

**CSRF Protection:** Every OAuth flow includes a randomly generated state parameter that must match between initiation and callback, preventing cross-site request forgery attacks.

**Token Encryption:** OAuth access and refresh tokens are encrypted using AES-256-GCM before storage in the database, with encryption keys managed through environment variables and versioned for rotation support.

**Secure Session Management:** Session JWTs are signed using HS256 with a secret key, set as HTTP-only cookies to prevent XSS attacks, configured with SameSite=Lax for CSRF protection, and include 7-day expiration with automatic refresh capability.

**Database Security:** User passwords are never stored (authentication delegated to Dotloop), OAuth tokens are encrypted at rest, and database connections use SSL/TLS encryption with prepared statements preventing SQL injection.

---

## Data Storage and Management

### User Data Schema

The `users` table has been extended to support Dotloop authentication while maintaining backward compatibility with Manus users. The schema includes standard fields such as `id` (primary key, auto-increment), `email` (user's email from Dotloop profile), `name` (user's full name from Dotloop profile), and `role` (enum: 'admin' | 'user' for access control).

For Dotloop-specific authentication, the schema includes `dotloopUserId` (unique identifier from Dotloop, indexed for fast lookups), while Manus compatibility is maintained through `openId` (Manus user ID, now nullable) and `tenantId` (multi-tenancy support, now nullable). Timestamps are tracked via `createdAt` and `updatedAt` fields.

### OAuth Token Storage

The `dotloop_oauth_tokens` table securely stores encrypted OAuth credentials with the following structure. Each record includes `id` (primary key), `userId` (foreign key to users table), and `dotloopUserId` (redundant for query optimization). Token data is stored as `accessToken` (encrypted, used for API calls), `refreshToken` (encrypted, used for token renewal), `tokenType` (typically "Bearer"), and `expiresAt` (timestamp for expiration tracking).

Metadata fields include `scope` (OAuth permissions granted), `createdAt` (initial token creation time), and `lastUsedAt` (tracks token usage for analytics). Security audit fields capture `ipAddress` (last connection IP) and `userAgent` (last connection browser/device).

### Data Retention and Cleanup

The system implements automatic cleanup of expired tokens older than 90 days, maintains audit logs of all authentication events for 1 year, and provides user-initiated data deletion through the "Disconnect" feature that removes all OAuth tokens while preserving transaction history.

---

## Session Management

### JWT Token Structure

Session tokens are JSON Web Tokens containing essential user information. The payload includes `userId` (database primary key), `dotloopUserId` (Dotloop account ID), `email` (user's email address), `name` (user's display name), `role` (user's permission level), `iat` (issued at timestamp), and `exp` (expiration timestamp, 7 days from issuance).

### Cookie Configuration

Session cookies are configured with security-first settings. The cookie name is `dotloop_session`, set as HTTP-only to prevent JavaScript access, uses Secure flag in production (HTTPS only), implements SameSite=Lax for CSRF protection without breaking OAuth redirects, has a 7-day max age, and is scoped to the root path for application-wide access.

### Session Validation

Every API request undergoes session validation through the tRPC context middleware. The process extracts the session cookie from the request, verifies the JWT signature and expiration, fetches the full user record from the database, and attaches the user object to the request context. If validation fails, the request proceeds as unauthenticated, allowing access only to public procedures.

---

## API Integration

### Dotloop API Client

The application integrates with Dotloop's REST API v2 for user profile retrieval and future data synchronization. The base URL is `https://api.dotloop.com/v2`, authentication uses Bearer tokens from OAuth flow, and the client implements automatic retry logic with exponential backoff.

### Profile Endpoint

User profiles are fetched via `GET /profile` with the access token in the Authorization header. The response includes `id` (Dotloop user ID), `email`, `first_name`, `last_name`, `account_type`, and `created` timestamp. Error handling covers token expiration (triggers automatic refresh), network failures (retry with backoff), and API rate limiting (respects Retry-After headers).

### Token Refresh Mechanism

When an access token expires, the system automatically refreshes it without user intervention. The process sends a POST request to Dotloop's token endpoint with the refresh token, receives a new access token and refresh token, updates the encrypted tokens in the database, and continues the original API request seamlessly.

---

## Security Considerations

### Threat Model

The system is designed to mitigate several key threats. **CSRF attacks** are prevented through state parameter validation in OAuth flow and SameSite cookie attributes. **XSS attacks** are mitigated by HTTP-only cookies preventing JavaScript access and JWT tokens never exposed to client-side code. **Token theft** is addressed through encryption at rest, HTTPS-only transmission, and short-lived access tokens with refresh capability. **Session hijacking** is prevented via secure cookie flags, IP address tracking for anomaly detection, and user agent validation.

### Compliance Considerations

The authentication system is designed with regulatory compliance in mind. For **GDPR compliance**, users can request data deletion, OAuth tokens are encrypted, and audit logs track all access. **CCPA compliance** is supported through clear privacy policy disclosure and user consent for data collection. **SOC 2 considerations** include audit logging of authentication events, encryption of sensitive data at rest and in transit, and regular security reviews.

### Recommended Security Enhancements

To further strengthen the system, consider implementing the following enhancements. **Multi-factor authentication** could be added by leveraging Dotloop's MFA if available or implementing application-level TOTP. **Rate limiting** should be applied to login attempts, token refresh requests, and API calls. **Anomaly detection** could monitor for unusual login patterns, geographic location changes, and suspicious API usage. **Security headers** should include Content-Security-Policy, X-Frame-Options, and X-Content-Type-Options.

---

## Migration Path

### Transitioning from Manus Authentication

The current implementation supports both authentication methods during the transition period. Existing Manus users continue to work without interruption, while new users are directed to Dotloop OAuth. The system validates Dotloop sessions first, then falls back to Manus authentication if no Dotloop session exists.

### Future Deprecation Plan

Once Dotloop authentication is proven stable and all users have migrated, the Manus authentication fallback can be removed. The deprecation process involves announcing the transition timeline to existing users, providing a grace period for migration, removing Manus auth code from `context.ts`, and cleaning up unused Manus-specific database fields.

---

## Monitoring and Observability

### Key Metrics to Track

Monitor the following metrics to ensure system health: **Authentication success rate** (target: >99%), **Token refresh success rate** (target: >99%), **Average login time** (target: <2 seconds), **Failed login attempts** (alert threshold: >10/minute from single IP), and **Session duration** (average time users stay logged in).

### Logging Strategy

Comprehensive logging captures all authentication events. **Successful logins** log timestamp, user ID, IP address, and user agent. **Failed logins** log timestamp, attempted email, IP address, and failure reason. **Token refreshes** log timestamp, user ID, and success/failure status. **OAuth errors** log timestamp, error code, error description, and user ID if available.

### Alerting

Set up alerts for critical security events including multiple failed login attempts from the same IP, unusual geographic login patterns, token refresh failures exceeding threshold, and database connection errors affecting authentication.

---

## Development Guidelines

### Adding New Authentication Features

When extending the authentication system, follow these guidelines. Always validate user input and sanitize data, use parameterized queries to prevent SQL injection, encrypt sensitive data before storage, log all authentication events for audit trails, and write unit tests for all authentication logic.

### Testing Authentication Flow

Comprehensive testing should cover successful login with valid Dotloop credentials, failed login with invalid credentials, token refresh on expiration, session validation on API requests, logout and cookie cleanup, and CSRF protection via state parameter validation.

### Common Pitfalls to Avoid

Avoid these common mistakes: never log sensitive data (tokens, passwords), never expose JWT secrets in client-side code, never trust client-side session validation, never skip CSRF protection, and never store tokens in localStorage (use HTTP-only cookies).

---

## Technical Reference

### Environment Variables

The following environment variables are required for authentication:

| Variable | Description | Example |
|----------|-------------|---------|
| `DOTLOOP_CLIENT_ID` | OAuth client ID from Dotloop | `abc123...` |
| `DOTLOOP_CLIENT_SECRET` | OAuth client secret from Dotloop | `secret123...` |
| `DOTLOOP_REDIRECT_URI` | OAuth callback URL | `https://app.example.com/api/dotloop/callback` |
| `JWT_SECRET` | Secret key for signing session JWTs | `random-256-bit-key` |
| `TOKEN_ENCRYPTION_KEY` | AES-256 key for encrypting OAuth tokens | `random-256-bit-key` |
| `DATABASE_URL` | MySQL/TiDB connection string | `mysql://user:pass@host:3306/db` |

### API Endpoints

The authentication system exposes the following endpoints:

**GET `/api/dotloop/authorize`** - Initiates OAuth flow, redirects to Dotloop authorization page.

**GET `/api/dotloop/callback`** - OAuth callback endpoint, exchanges code for tokens, creates session.

**POST `/api/trpc/auth.logout`** - Logs out user, clears session cookies.

**GET `/api/trpc/auth.me`** - Returns current user information from session.

### Database Indexes

Ensure the following indexes exist for optimal performance:

- `users.dotloopUserId` (unique) - Fast user lookup by Dotloop ID
- `users.email` (unique) - Fast user lookup by email
- `dotloop_oauth_tokens.userId` - Fast token lookup by user
- `dotloop_oauth_tokens.dotloopUserId` - Fast token lookup by Dotloop ID

---

## Conclusion

The Dotloop OAuth authentication system provides a secure, scalable, and user-friendly authentication mechanism that aligns with industry best practices. By leveraging OAuth 2.0, the application delegates credential management to Dotloop while maintaining full control over session management and authorization. The dual-authentication approach ensures a smooth transition period while the system proves its stability in production.

For questions or concerns about this architecture, contact the development team or security team.

---

**Document Control:**
- **Version:** 1.0
- **Last Review:** January 15, 2026
- **Next Review:** April 15, 2026
- **Owner:** Development Team
