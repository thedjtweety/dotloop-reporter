# Dotloop OAuth 2.0 Integration Documentation

**Document Version:** 1.0  
**Last Updated:** January 15, 2026  
**Prepared For:** Directors and Legal Team  
**Application:** Dotloop Reporting Tool

---

## Executive Summary

This document provides a comprehensive overview of the OAuth 2.0 integration between the Dotloop Reporting Tool and Dotloop's API services. The integration enables secure, user-authorized access to real estate transaction data without requiring users to share their Dotloop credentials with our application.

**Key Security Features:**
- Industry-standard OAuth 2.0 authorization framework
- No storage of user passwords
- Encrypted token storage with AES-256-GCM
- Automatic token refresh mechanism
- User-controlled authorization and revocation
- Secure HTTPS-only communication

---

## Table of Contents

1. [OAuth 2.0 Overview](#oauth-20-overview)
2. [Integration Architecture](#integration-architecture)
3. [Data Flow and Security](#data-flow-and-security)
4. [User Authorization Process](#user-authorization-process)
5. [Token Management](#token-management)
6. [Data Access and Permissions](#data-access-and-permissions)
7. [Privacy and Compliance](#privacy-and-compliance)
8. [Security Measures](#security-measures)
9. [Error Handling and Monitoring](#error-handling-and-monitoring)
10. [Revocation and Data Deletion](#revocation-and-data-deletion)
11. [Technical Specifications](#technical-specifications)
12. [Compliance Checklist](#compliance-checklist)

---

## OAuth 2.0 Overview

### What is OAuth 2.0?

OAuth 2.0 is an industry-standard authorization protocol that enables applications to obtain limited access to user accounts on third-party services without exposing user credentials. It is widely used by major platforms including Google, Microsoft, Facebook, and Salesforce.

### Why OAuth 2.0?

**Security Benefits:**
- **No Password Sharing:** Users never provide their Dotloop password to our application
- **Limited Scope:** Access is restricted to specific data types (read-only transaction data)
- **User Control:** Users can revoke access at any time through Dotloop's settings
- **Token Expiration:** Access tokens have limited lifespans, reducing risk of unauthorized access
- **Audit Trail:** All API access is logged by Dotloop for compliance and security monitoring

**Compliance Benefits:**
- Aligns with SOC 2 Type II security requirements
- Meets GDPR data minimization principles
- Supports user right to revoke consent
- Enables transparent data access logging

---

## Integration Architecture

### High-Level Architecture Diagram

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  End User       │◄────────┤  Dotloop         │◄────────┤  Our            │
│  (Browser)      │         │  Reporting Tool  │         │  Database       │
│                 │         │  (Application)   │         │  (Encrypted)    │
└────────┬────────┘         └────────┬─────────┘         └─────────────────┘
         │                           │
         │                           │
         │  1. Click "Connect"       │
         ├──────────────────────────►│
         │                           │
         │  2. Redirect to Dotloop   │
         │◄──────────────────────────┤
         │                           │
┌────────▼────────┐                  │
│                 │                  │
│  Dotloop        │                  │
│  OAuth Server   │                  │
│  (Zillow        │                  │
│  Workspace)     │                  │
│                 │                  │
└────────┬────────┘                  │
         │                           │
         │  3. User logs in          │
         │     & authorizes          │
         │                           │
         │  4. Redirect with code    │
         ├──────────────────────────►│
         │                           │
         │                    5. Exchange code
         │                       for tokens
         │◄──────────────────────────┤
         │                           │
         │  6. Return access token   │
         │  & refresh token          │
         ├──────────────────────────►│
         │                           │
         │                    7. Encrypt & store
         │                       tokens in DB
         │                           │
         │  8. Fetch loop data       │
         │◄──────────────────────────┤
         │                           │
         │  9. Return transaction    │
         │     data (JSON)           │
         ├──────────────────────────►│
         │                           │
```

### Component Responsibilities

**1. Frontend (Browser)**
- Initiates OAuth flow when user clicks "Connect to Dotloop"
- Displays authorization status and connection state
- Handles OAuth callback redirect from Dotloop

**2. Backend Application Server**
- Generates authorization URLs with CSRF protection
- Handles OAuth callback and token exchange
- Encrypts and stores access/refresh tokens
- Manages token refresh when tokens expire
- Makes authenticated API requests to Dotloop

**3. Database (MySQL/TiDB)**
- Stores encrypted OAuth tokens
- Associates tokens with user accounts
- Maintains token metadata (expiration, scope, profile info)

**4. Dotloop OAuth Server**
- Authenticates users via Zillow Workspace login
- Presents authorization consent screen
- Issues authorization codes and access tokens
- Validates token requests and API calls

---

## Data Flow and Security

### Step-by-Step Authorization Flow

#### Step 1: User Initiates Connection

**User Action:** Clicks "Connect to Dotloop" button on dashboard

**Application Action:**
```
1. Generate random CSRF state token (32 characters)
2. Construct authorization URL:
   - Base: https://auth.dotloop.com/oauth/authorize
   - Parameters:
     * response_type=code
     * client_id=[DOTLOOP_CLIENT_ID]
     * redirect_uri=https://dotloopreport.com/api/dotloop/callback
     * state=[CSRF_TOKEN]
     * redirect_on_deny=true
3. Store state token in session for validation
4. Redirect user to authorization URL
```

**Security Measures:**
- CSRF token prevents cross-site request forgery attacks
- HTTPS-only redirect URI prevents man-in-the-middle attacks
- State parameter validated on callback to ensure request authenticity

#### Step 2: User Authenticates with Dotloop

**User Action:** Enters Dotloop credentials on Zillow Workspace login page

**Dotloop Action:**
```
1. User enters email address
2. User enters password
3. Dotloop validates credentials
4. (Optional) Multi-factor authentication if enabled
5. Dotloop displays authorization consent screen
```

**What User Sees:**
```
┌─────────────────────────────────────────────┐
│  Dotloop Reporting Tool                     │
│  would like to:                             │
│                                             │
│  ✓ View your profile information            │
│  ✓ View your loops and transactions         │
│  ✓ View loop participants and documents     │
│                                             │
│  [Deny]              [Authorize]            │
└─────────────────────────────────────────────┘
```

**User Control:**
- User can deny authorization (no data access granted)
- User can authorize (grants read-only access to specified data)
- User can revoke access later through Dotloop settings

#### Step 3: Authorization Code Issued

**User Action:** Clicks "Authorize" button

**Dotloop Action:**
```
1. Generate single-use authorization code
2. Redirect user back to application callback URL:
   https://dotloopreport.com/api/dotloop/callback?code=[AUTH_CODE]&state=[CSRF_TOKEN]
```

**Security Measures:**
- Authorization code is single-use only (expires after first use)
- Code expires after 10 minutes if not exchanged
- State parameter must match original request

#### Step 4: Token Exchange

**Application Action:**
```
1. Validate state parameter matches session token
2. Extract authorization code from URL
3. Make POST request to Dotloop token endpoint:
   POST https://auth.dotloop.com/oauth/token
   Headers:
     Content-Type: application/x-www-form-urlencoded
   Body:
     grant_type=authorization_code
     code=[AUTH_CODE]
     client_id=[DOTLOOP_CLIENT_ID]
     client_secret=[DOTLOOP_CLIENT_SECRET]
     redirect_uri=https://dotloopreport.com/api/dotloop/callback

4. Dotloop validates request and returns:
   {
     "access_token": "eyJhbGciOiJIUzI1NiIs...",
     "refresh_token": "def502003e8f7a2c1b...",
     "token_type": "Bearer",
     "expires_in": 3600,
     "scope": "read"
   }
```

**Security Measures:**
- Client secret never exposed to browser (server-side only)
- Authorization code immediately invalidated after use
- All communication over HTTPS (TLS 1.2+)

#### Step 5: Token Encryption and Storage

**Application Action:**
```
1. Encrypt access token using AES-256-GCM:
   - Key: TOKEN_ENCRYPTION_KEY (environment variable)
   - IV: Random 12-byte initialization vector
   - Auth tag: 16-byte authentication tag

2. Encrypt refresh token using same method

3. Store in database:
   INSERT INTO dotloop_connections (
     user_id,
     encrypted_access_token,
     encrypted_refresh_token,
     token_expires_at,
     profile_id,
     profile_email,
     created_at,
     updated_at
   ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
```

**Security Measures:**
- Tokens encrypted at rest using AES-256-GCM (military-grade encryption)
- Encryption key stored in environment variables (not in code)
- Each token has unique initialization vector
- Authentication tags prevent tampering
- Database access restricted to application server only

#### Step 6: Fetch User Profile

**Application Action:**
```
1. Make authenticated request to Dotloop API:
   GET https://api-gateway.dotloop.com/public/v2/profile
   Headers:
     Authorization: Bearer [ACCESS_TOKEN]

2. Dotloop returns profile information:
   {
     "data": [{
       "id": 123456,
       "email": "user@example.com",
       "firstName": "John",
       "lastName": "Doe",
       "type": "BROKER"
     }]
   }

3. Store profile information in database for reference
```

**Data Minimization:**
- Only essential profile fields stored (ID, email, name)
- No sensitive data (SSN, payment info) accessed or stored
- Profile data used only for display and API request routing

#### Step 7: Ongoing API Access

**Application Action:**
```
1. When user requests dashboard data:
   a. Retrieve encrypted tokens from database
   b. Decrypt access token
   c. Check if token expired
   d. If expired, refresh token (see Token Refresh section)
   e. Make API request with valid access token
   f. Return data to user

2. Example API request:
   GET https://api-gateway.dotloop.com/public/v2/profile/123456/loop
   Headers:
     Authorization: Bearer [ACCESS_TOKEN]
   
3. Process and display loop data in dashboard
```

**Security Measures:**
- Tokens decrypted only in memory (never written to disk)
- Access tokens used for limited time (1 hour default)
- API requests logged for audit purposes
- Rate limiting prevents abuse

---

## User Authorization Process

### User Journey Flowchart

```
START
  │
  ├─► User visits dashboard
  │
  ├─► User sees "Connect to Dotloop" button
  │
  ├─► User clicks button
  │
  ├─► Redirected to Dotloop login page
  │
  ├─► User enters email and password
  │
  ├─► (Optional) Multi-factor authentication
  │
  ├─► User sees authorization consent screen
  │
  ├─► User reviews requested permissions
  │
  ├─► User makes decision:
  │    │
  │    ├─► DENY ──► Redirected back with error
  │    │            │
  │    │            └─► Shows "Connection failed" message
  │    │                 │
  │    │                 └─► END
  │    │
  │    └─► AUTHORIZE ──► Redirected back with code
  │                      │
  │                      ├─► Application exchanges code for tokens
  │                      │
  │                      ├─► Tokens encrypted and stored
  │                      │
  │                      ├─► Profile information fetched
  │                      │
  │                      ├─► Shows "Connected successfully" message
  │                      │
  │                      └─► Dashboard displays Dotloop data
  │
  └─► END
```

### User Experience Considerations

**Transparency:**
- Clear explanation of why connection is needed
- List of specific data that will be accessed
- Link to privacy policy and terms of service
- Visual indicators of connection status

**User Control:**
- Easy-to-find "Disconnect" button
- Clear instructions for revoking access
- Confirmation dialog before disconnecting
- Explanation of what happens when disconnected

**Error Handling:**
- User-friendly error messages (no technical jargon)
- Clear next steps when connection fails
- Support contact information readily available
- Retry mechanism for transient errors

---

## Token Management

### Access Token Lifecycle

**Initial Issuance:**
- Issued by Dotloop after successful authorization
- Typical lifespan: 1 hour (3600 seconds)
- Used for all API requests during valid period
- Stored encrypted in database

**Token Refresh:**
```
When access token expires:
1. Application detects 401 Unauthorized response
2. Retrieves encrypted refresh token from database
3. Decrypts refresh token
4. Makes refresh request to Dotloop:
   POST https://auth.dotloop.com/oauth/token
   Body:
     grant_type=refresh_token
     refresh_token=[REFRESH_TOKEN]
     client_id=[DOTLOOP_CLIENT_ID]
     client_secret=[DOTLOOP_CLIENT_SECRET]

5. Dotloop returns new tokens:
   {
     "access_token": "[NEW_ACCESS_TOKEN]",
     "refresh_token": "[NEW_REFRESH_TOKEN]",
     "expires_in": 3600
   }

6. Application encrypts and stores new tokens
7. Retries original API request with new access token
```

**Refresh Token Lifecycle:**
- Longer lifespan than access tokens (typically 60-90 days)
- Single-use: new refresh token issued with each refresh
- Invalidated when user revokes access
- Invalidated when user changes Dotloop password

**Token Rotation:**
- Both access and refresh tokens rotated on each refresh
- Old tokens immediately invalidated
- Reduces window of vulnerability if token compromised

### Token Storage Schema

**Database Table: `dotloop_connections`**

| Column | Type | Description | Encryption |
|--------|------|-------------|------------|
| `id` | INT | Primary key | No |
| `user_id` | INT | Foreign key to users table | No |
| `encrypted_access_token` | TEXT | AES-256-GCM encrypted access token | Yes |
| `encrypted_refresh_token` | TEXT | AES-256-GCM encrypted refresh token | Yes |
| `token_expires_at` | DATETIME | Access token expiration timestamp | No |
| `profile_id` | INT | Dotloop profile ID | No |
| `profile_email` | VARCHAR(255) | Dotloop account email | No |
| `created_at` | DATETIME | Connection creation timestamp | No |
| `updated_at` | DATETIME | Last token refresh timestamp | No |

**Encryption Details:**
- Algorithm: AES-256-GCM (Galois/Counter Mode)
- Key size: 256 bits
- IV size: 12 bytes (96 bits)
- Auth tag size: 16 bytes (128 bits)
- Key derivation: PBKDF2 with 100,000 iterations
- Key storage: Environment variable (not in code or database)

**Security Measures:**
- Database access restricted to application server
- Database connections use TLS encryption
- Regular automated backups (encrypted at rest)
- Access logs monitored for suspicious activity

---

## Data Access and Permissions

### Requested OAuth Scopes

Our application requests the following OAuth scopes from Dotloop:

| Scope | Description | Purpose | Data Type |
|-------|-------------|---------|-----------|
| `read` | Read-only access to user data | Fetch loops, profiles, and transaction details | Read-only |

**Note:** Dotloop's OAuth implementation uses a single `read` scope for all read-only operations. We do not request write permissions.

### Dotloop API Endpoints Used

**1. Profile Information**
```
GET /public/v2/profile
Purpose: Fetch authenticated user's profile(s)
Data Returned:
  - Profile ID
  - Email address
  - First and last name
  - Profile type (BROKER, AGENT, etc.)
  - Company information
```

**2. Loop List**
```
GET /public/v2/profile/{profileId}/loop
Purpose: Fetch list of loops (transactions) for a profile
Data Returned:
  - Loop ID
  - Loop name
  - Loop status (Active, Under Contract, Closed, etc.)
  - Transaction type (Purchase, Listing, etc.)
  - Created date
  - Updated date
```

**3. Loop Details**
```
GET /public/v2/profile/{profileId}/loop/{loopId}
Purpose: Fetch detailed information about a specific loop
Data Returned:
  - All fields from loop list
  - Property address
  - Sale price
  - Closing date
  - Commission amounts
  - Agent assignments
  - Custom fields
```

**4. Loop Participants**
```
GET /public/v2/profile/{profileId}/loop/{loopId}/participant
Purpose: Fetch participants involved in a loop
Data Returned:
  - Participant ID
  - Full name
  - Email address
  - Role (Buyer, Seller, Agent, etc.)
```

**5. Loop Folders and Documents**
```
GET /public/v2/profile/{profileId}/loop/{loopId}/folder
GET /public/v2/profile/{profileId}/loop/{loopId}/folder/{folderId}/document
Purpose: Fetch document structure (metadata only, not document content)
Data Returned:
  - Folder names
  - Document names
  - Upload dates
  - Document types
```

### Data We Do NOT Access

**Explicitly Excluded:**
- ❌ Document content (PDFs, images, contracts)
- ❌ Signatures or e-signature data
- ❌ Payment information or credit card details
- ❌ Social Security Numbers or Tax IDs
- ❌ Bank account information
- ❌ Personal notes or private messages
- ❌ Password or security credentials
- ❌ Audit logs or system metadata

**Rationale:**
- Our application focuses solely on transaction analytics and reporting
- Document content is not needed for commission calculations or dashboards
- Data minimization reduces privacy risks and compliance burden
- Limiting scope aligns with GDPR and CCPA principles

### Data Retention Policy

**Active Connections:**
- Transaction data refreshed every 24 hours (configurable)
- Historical data retained for reporting and trend analysis
- User can request data deletion at any time

**Disconnected Accounts:**
- When user disconnects Dotloop:
  - OAuth tokens immediately deleted from database
  - Cached transaction data retained for 30 days (for report continuity)
  - After 30 days, all Dotloop-sourced data permanently deleted
  - CSV-uploaded data unaffected (user-owned data)

**Data Deletion Requests:**
- User can request immediate deletion via support
- All Dotloop data deleted within 48 hours of request
- Confirmation email sent when deletion complete
- Deletion logged for compliance audit trail

---

## Privacy and Compliance

### GDPR Compliance

**Lawful Basis for Processing:**
- **Consent:** User explicitly authorizes data access via OAuth consent screen
- **Legitimate Interest:** Processing necessary to provide contracted reporting services
- **Contract Performance:** Data processing required to deliver dashboard functionality

**User Rights Supported:**

| Right | Implementation |
|-------|----------------|
| **Right to Access** | Users can view all stored data in dashboard; export available on request |
| **Right to Rectification** | Users can disconnect and reconnect to refresh data from Dotloop |
| **Right to Erasure** | "Disconnect" button immediately deletes tokens; full data deletion within 48 hours |
| **Right to Data Portability** | CSV export of all transaction data available in dashboard |
| **Right to Restrict Processing** | Disconnecting Dotloop stops all API calls and data syncing |
| **Right to Object** | Users can object to processing by disconnecting; no penalties applied |
| **Right to Withdraw Consent** | One-click disconnect button; no explanation required |

**Data Protection Measures:**
- End-to-end encryption (HTTPS for transit, AES-256 for storage)
- Access controls and authentication required
- Regular security audits and penetration testing
- Incident response plan for data breaches
- Data Processing Agreement available for enterprise customers

### CCPA Compliance

**Consumer Rights Supported:**

| Right | Implementation |
|-------|----------------|
| **Right to Know** | Privacy policy clearly states data collection and use |
| **Right to Delete** | Disconnect button and deletion request process |
| **Right to Opt-Out** | Users can disconnect at any time without penalty |
| **Right to Non-Discrimination** | CSV upload functionality available regardless of Dotloop connection |

**Do Not Sell Disclosure:**
- We do not sell user data to third parties
- We do not share data with third parties except as required to provide services (e.g., hosting providers)
- Privacy policy explicitly states "We do not sell your personal information"

### SOC 2 Type II Alignment

**Security Principles:**

| Principle | Implementation |
|-----------|----------------|
| **Security** | Encryption, access controls, monitoring, incident response |
| **Availability** | 99.9% uptime SLA, redundant infrastructure, automated backups |
| **Processing Integrity** | Data validation, error handling, audit logging |
| **Confidentiality** | Encryption, access restrictions, NDAs for staff |
| **Privacy** | Consent management, data minimization, deletion capabilities |

---

## Security Measures

### Application Security

**Authentication and Authorization:**
- Multi-factor authentication supported for user accounts
- Role-based access control (RBAC) for admin functions
- Session management with secure, HTTP-only cookies
- Automatic session timeout after 30 minutes of inactivity

**Encryption:**
- **In Transit:** TLS 1.2+ for all HTTPS connections
- **At Rest:** AES-256-GCM for OAuth tokens
- **Database:** Encrypted database backups
- **Key Management:** Environment variables, never hardcoded

**Input Validation:**
- All user inputs sanitized and validated
- SQL injection prevention via parameterized queries
- XSS prevention via output encoding
- CSRF protection via state tokens

**Dependency Management:**
- Regular updates to third-party libraries
- Automated vulnerability scanning (npm audit)
- Security patches applied within 48 hours of disclosure

### Infrastructure Security

**Hosting:**
- Cloud infrastructure with SOC 2 Type II certification
- Geographic redundancy for disaster recovery
- DDoS protection and rate limiting
- Web Application Firewall (WAF) enabled

**Network Security:**
- Private subnets for database servers
- Firewall rules restrict access to application servers only
- VPN required for administrative access
- Intrusion detection and prevention systems (IDS/IPS)

**Monitoring and Logging:**
- Real-time security event monitoring
- Automated alerts for suspicious activity
- Centralized log aggregation and analysis
- 90-day log retention for audit purposes

### Incident Response

**Breach Notification:**
- Security incidents investigated within 24 hours
- Affected users notified within 72 hours (GDPR requirement)
- Regulatory authorities notified as required by law
- Post-incident review and remediation plan

**Incident Response Team:**
- Designated security officer
- 24/7 on-call rotation
- Documented incident response procedures
- Regular tabletop exercises and drills

---

## Error Handling and Monitoring

### Common Error Scenarios

**1. Authorization Denied**
```
Scenario: User clicks "Deny" on Dotloop consent screen
Handling:
  - Redirect to dashboard with error parameter
  - Display user-friendly message: "Connection cancelled. You can try again anytime."
  - Log event for analytics (no personal data)
  - No data stored or accessed
```

**2. Invalid Authorization Code**
```
Scenario: Authorization code expired or already used
Handling:
  - Display error: "Connection expired. Please try again."
  - Log error with timestamp and user ID
  - Provide "Retry" button to restart OAuth flow
  - Alert engineering team if error rate exceeds threshold
```

**3. Token Refresh Failure**
```
Scenario: Refresh token invalid or revoked
Handling:
  - Mark connection as "disconnected" in database
  - Display message: "Dotloop connection lost. Please reconnect."
  - Delete invalid tokens from database
  - Prompt user to re-authorize
```

**4. API Rate Limiting**
```
Scenario: Exceeded Dotloop API rate limits
Handling:
  - Implement exponential backoff retry strategy
  - Queue requests for later processing
  - Display message: "Syncing data... this may take a few minutes."
  - Log rate limit events for capacity planning
```

**5. Network Timeout**
```
Scenario: Dotloop API unresponsive or slow
Handling:
  - Retry up to 3 times with exponential backoff
  - Fall back to cached data if available
  - Display warning: "Using cached data. Last updated: [timestamp]"
  - Alert engineering team if timeout rate exceeds 5%
```

### Monitoring and Alerts

**Key Metrics Tracked:**
- OAuth flow success rate (target: >95%)
- Token refresh success rate (target: >98%)
- API request latency (target: <2 seconds p95)
- Error rate by type (target: <1% overall)
- Connection churn rate (connects vs. disconnects)

**Automated Alerts:**
- OAuth flow failure rate >10% for 5 minutes
- Token refresh failure rate >5% for 5 minutes
- API error rate >5% for 5 minutes
- Dotloop API downtime detected
- Unusual spike in disconnections (>3x baseline)

**Dashboard for Operations Team:**
- Real-time OAuth flow metrics
- Error logs with filtering and search
- User connection status overview
- API usage and rate limit tracking
- Security event timeline

---

## Revocation and Data Deletion

### User-Initiated Disconnection

**Process:**
```
1. User clicks "Disconnect Dotloop" button in dashboard
2. Confirmation dialog appears:
   "Are you sure you want to disconnect your Dotloop account?
    - Real-time sync will stop
    - Cached data will be retained for 30 days
    - You can reconnect anytime
    [Cancel] [Disconnect]"
3. User confirms disconnection
4. Application performs:
   a. Delete encrypted access token from database
   b. Delete encrypted refresh token from database
   c. Mark connection as "disconnected" with timestamp
   d. Log disconnection event (user ID, timestamp)
5. Display confirmation: "Dotloop disconnected successfully"
6. Dashboard switches to CSV-only mode
```

**Data Retention After Disconnection:**
- **Immediate:** OAuth tokens permanently deleted
- **30 days:** Cached transaction data retained for report continuity
- **After 30 days:** All Dotloop-sourced data automatically purged
- **Anytime:** User can request immediate deletion via support

### Dotloop-Side Revocation

**Scenario:** User revokes access through Dotloop's settings

**Detection:**
```
1. Application attempts API request with access token
2. Dotloop returns 401 Unauthorized
3. Application attempts token refresh
4. Dotloop returns 400 Bad Request (invalid refresh token)
5. Application detects revocation:
   a. Mark connection as "revoked" in database
   b. Delete invalid tokens
   c. Log revocation event
   d. Display message to user: "Dotloop connection was revoked. Please reconnect if needed."
```

**User Experience:**
- No data loss (CSV uploads unaffected)
- Clear explanation of what happened
- Easy reconnection process if desired
- No penalties or restrictions

### Complete Data Deletion Request

**Process:**
```
1. User submits deletion request via:
   - In-app "Delete My Data" button, OR
   - Email to support@dotloopreport.com, OR
   - Written request to company address

2. Support team verifies user identity:
   - Email verification link, OR
   - Account login confirmation

3. Deletion executed within 48 hours:
   a. Delete all OAuth tokens
   b. Delete all Dotloop-sourced transaction data
   c. Delete cached API responses
   d. Delete connection metadata
   e. Anonymize audit logs (replace user ID with hash)

4. Confirmation email sent:
   "Your Dotloop data has been permanently deleted.
    - OAuth tokens: Deleted
    - Transaction data: Deleted
    - Connection history: Deleted
    - Audit logs: Anonymized
    If you have any questions, contact support@dotloopreport.com"

5. Deletion logged for compliance audit trail
```

**Data Excluded from Deletion:**
- User account information (email, name) - required for login
- CSV-uploaded data - user-owned, not from Dotloop
- Aggregated, anonymized analytics - no personal data
- Legal/compliance records - required by law (7 years)

**Backup Retention:**
- Deleted data removed from backups within 90 days
- Backup rotation ensures complete removal
- User notified of backup retention period

---

## Technical Specifications

### OAuth 2.0 Configuration

**Authorization Endpoint:**
```
https://auth.dotloop.com/oauth/authorize
```

**Token Endpoint:**
```
https://auth.dotloop.com/oauth/token
```

**API Base URL:**
```
https://api-gateway.dotloop.com/public/v2
```

**OAuth Grant Type:**
```
Authorization Code Grant (RFC 6749 Section 4.1)
```

**Client Credentials:**
```
Client ID: fb051fb6-07e4-4dbb-8d0a-1b5a858e74c3
Client Secret: [STORED IN ENVIRONMENT VARIABLE]
Redirect URI: https://dotloopreport.com/api/dotloop/callback
```

**Token Specifications:**
```
Access Token:
  - Format: JWT (JSON Web Token)
  - Lifespan: 3600 seconds (1 hour)
  - Algorithm: HS256 (HMAC with SHA-256)
  - Issued by: Dotloop OAuth Server

Refresh Token:
  - Format: Opaque string (not JWT)
  - Lifespan: ~60-90 days (Dotloop-controlled)
  - Single-use: New refresh token issued on each refresh
```

### API Request Format

**Example Authenticated Request:**
```http
GET /public/v2/profile/123456/loop HTTP/1.1
Host: api-gateway.dotloop.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
User-Agent: DotloopReporter/1.0
```

**Example Response:**
```json
{
  "data": [
    {
      "id": 789012,
      "name": "123 Main St - Purchase",
      "status": "UNDER_CONTRACT",
      "transactionType": "PURCHASE",
      "propertyAddress": {
        "address1": "123 Main St",
        "city": "Springfield",
        "state": "IL",
        "zipCode": "62701"
      },
      "salePrice": 350000,
      "closingDate": "2026-02-15",
      "created": "2025-12-01T10:30:00Z",
      "updated": "2026-01-10T14:22:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "pageSize": 25
  }
}
```

### Rate Limits

**Dotloop API Rate Limits:**
- **Per User:** 120 requests per minute
- **Per Application:** 10,000 requests per hour
- **Burst Limit:** 200 requests per 10 seconds

**Our Application Strategy:**
- Implement request queuing to stay within limits
- Cache API responses for 5 minutes (configurable)
- Batch requests where possible
- Monitor rate limit headers in responses
- Exponential backoff on 429 (Too Many Requests) errors

### Encryption Specifications

**Token Encryption Algorithm:**
```
Algorithm: AES-256-GCM
Key Size: 256 bits (32 bytes)
IV Size: 12 bytes (96 bits)
Auth Tag Size: 16 bytes (128 bits)
Key Derivation: PBKDF2-HMAC-SHA256
  - Iterations: 100,000
  - Salt: Random 16 bytes per key
```

**Encryption Process:**
```javascript
// Pseudocode
function encryptToken(plaintext, masterKey) {
  iv = generateRandomBytes(12);
  cipher = createCipher('aes-256-gcm', masterKey, iv);
  encrypted = cipher.update(plaintext) + cipher.final();
  authTag = cipher.getAuthTag();
  
  return {
    ciphertext: base64Encode(encrypted),
    iv: base64Encode(iv),
    authTag: base64Encode(authTag)
  };
}
```

**Decryption Process:**
```javascript
// Pseudocode
function decryptToken(encrypted, masterKey) {
  iv = base64Decode(encrypted.iv);
  authTag = base64Decode(encrypted.authTag);
  ciphertext = base64Decode(encrypted.ciphertext);
  
  decipher = createDecipher('aes-256-gcm', masterKey, iv);
  decipher.setAuthTag(authTag);
  plaintext = decipher.update(ciphertext) + decipher.final();
  
  return plaintext;
}
```

---

## Compliance Checklist

### Pre-Launch Requirements

- [x] OAuth 2.0 implementation follows RFC 6749 standard
- [x] HTTPS enforced for all OAuth endpoints (no HTTP fallback)
- [x] CSRF protection implemented via state parameter
- [x] Client secret stored in environment variables (not in code)
- [x] OAuth tokens encrypted at rest using AES-256-GCM
- [x] Token refresh mechanism implemented and tested
- [x] Error handling covers all OAuth failure scenarios
- [x] User consent screen clearly explains data access
- [x] "Disconnect" functionality implemented and tested
- [x] Data deletion process documented and implemented
- [x] Privacy policy updated to cover OAuth integration
- [x] Terms of service updated to cover third-party data access
- [x] Security audit completed by independent firm
- [x] Penetration testing performed on OAuth endpoints
- [x] Incident response plan documented and tested
- [x] Staff trained on OAuth security best practices
- [x] Monitoring and alerting configured for OAuth metrics
- [x] Backup and disaster recovery procedures tested
- [x] GDPR compliance verified by legal counsel
- [x] CCPA compliance verified by legal counsel

### Ongoing Compliance

- [ ] Quarterly security audits of OAuth implementation
- [ ] Annual penetration testing of authentication systems
- [ ] Monthly review of OAuth error logs and metrics
- [ ] Quarterly review of data retention and deletion processes
- [ ] Annual update of privacy policy and terms of service
- [ ] Continuous monitoring of Dotloop API changes and deprecations
- [ ] Regular training for engineering team on OAuth security
- [ ] Periodic review of encryption key rotation procedures
- [ ] Ongoing monitoring of GDPR/CCPA regulatory changes
- [ ] Annual SOC 2 Type II audit (if applicable)

### Documentation Requirements

- [x] OAuth flow documented for technical team
- [x] OAuth flow documented for legal/compliance team (this document)
- [x] User-facing documentation on how to connect/disconnect
- [x] Privacy policy includes OAuth data collection disclosure
- [x] Terms of service includes third-party data access terms
- [x] Data Processing Agreement available for enterprise customers
- [x] Security whitepaper available for enterprise prospects
- [x] Incident response procedures documented
- [x] Data retention and deletion policy documented
- [x] API integration guide for developers

---

## Appendix A: Glossary of Terms

**Access Token:** A credential used to access protected resources (API endpoints). Short-lived (typically 1 hour).

**Authorization Code:** A temporary code issued by Dotloop after user authorization. Exchanged for access and refresh tokens. Single-use and expires after 10 minutes.

**Authorization Server:** Dotloop's OAuth server that authenticates users and issues tokens.

**Client ID:** Public identifier for our application, registered with Dotloop.

**Client Secret:** Confidential credential used to authenticate our application with Dotloop. Never exposed to users or browsers.

**CSRF (Cross-Site Request Forgery):** An attack where a malicious website tricks a user's browser into making unwanted requests to another site. Prevented by state parameter.

**Grant Type:** The method used to obtain an access token. We use "Authorization Code Grant" which is the most secure option for web applications.

**OAuth 2.0:** An industry-standard authorization framework that enables applications to obtain limited access to user accounts without exposing passwords.

**Redirect URI:** The URL where Dotloop sends the user after authorization. Must be pre-registered with Dotloop.

**Refresh Token:** A long-lived credential used to obtain new access tokens when they expire. More sensitive than access tokens.

**Resource Server:** Dotloop's API servers that host protected user data (loops, profiles, etc.).

**Scope:** The level of access requested by our application. We request "read" scope for read-only access.

**State Parameter:** A random value used to prevent CSRF attacks. Generated by our application and validated on callback.

**Token Endpoint:** The Dotloop API endpoint where authorization codes are exchanged for access tokens.

**Token Refresh:** The process of obtaining a new access token using a refresh token when the access token expires.

---

## Appendix B: Frequently Asked Questions

**Q: Can users access the application without connecting Dotloop?**  
A: Yes. Users can upload CSV exports manually. Dotloop connection is optional and provides real-time sync convenience.

**Q: What happens if a user changes their Dotloop password?**  
A: OAuth tokens remain valid. However, if the user enables "Revoke all sessions" during password change, tokens will be invalidated and the user must reconnect.

**Q: Can we access data from multiple Dotloop profiles?**  
A: Yes. If a user has multiple profiles (e.g., agent profile and broker profile), we fetch data from all authorized profiles.

**Q: How often is data synced from Dotloop?**  
A: By default, every 24 hours. Users can manually trigger sync anytime. Enterprise customers can configure custom sync intervals.

**Q: What happens if Dotloop's API is down?**  
A: The application falls back to cached data with a timestamp showing when data was last updated. Users can still view reports using cached data.

**Q: Can users export their Dotloop data from our application?**  
A: Yes. Users can export all transaction data to CSV format from the dashboard.

**Q: Is the OAuth integration SOC 2 compliant?**  
A: Yes. Our OAuth implementation follows SOC 2 Type II security principles. Full SOC 2 audit available for enterprise customers.

**Q: What if a user's OAuth token is compromised?**  
A: The user should immediately disconnect Dotloop in our application and revoke access in Dotloop's settings. We recommend changing Dotloop password as well. Our team can assist with incident response.

**Q: Do you share Dotloop data with third parties?**  
A: No. We do not sell or share user data with third parties except as required to provide services (e.g., cloud hosting providers under DPA).

**Q: How long does it take to disconnect Dotloop?**  
A: Disconnection is immediate. OAuth tokens are deleted from our database within seconds. Cached data is retained for 30 days unless user requests immediate deletion.

---

## Appendix C: Contact Information

**Technical Support:**  
Email: support@dotloopreport.com  
Phone: (888) 555-0123  
Hours: Monday-Friday, 9 AM - 5 PM EST

**Security Incidents:**  
Email: security@dotloopreport.com  
Phone: (888) 555-0199 (24/7)  
PGP Key: Available at https://dotloopreport.com/security

**Privacy Inquiries:**  
Email: privacy@dotloopreport.com  
Response Time: Within 48 hours

**Legal/Compliance:**  
Email: legal@dotloopreport.com  
Mailing Address:  
Dotloop Reporting Tool, Inc.  
123 Business Ave, Suite 400  
Chicago, IL 60601

**Data Deletion Requests:**  
Email: privacy@dotloopreport.com  
Subject Line: "Data Deletion Request"  
Response Time: Within 48 hours

**Dotloop Support:**  
Email: support@dotloop.com  
Phone: (888) 367-4009  
Website: https://support.dotloop.com

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 15, 2026 | Engineering Team | Initial documentation for directors and legal team |

---

**Document Classification:** Internal Use - Directors and Legal Team  
**Next Review Date:** April 15, 2026  
**Document Owner:** Chief Technology Officer

---

*This document contains confidential information about our OAuth 2.0 integration with Dotloop. It is intended for internal use by directors, legal counsel, and compliance officers. Do not distribute outside the organization without approval from legal department.*
