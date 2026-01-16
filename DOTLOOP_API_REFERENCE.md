# Dotloop API Reference - OAuth 2.0 Implementation Guide

**Document Version:** 1.0  
**Last Updated:** January 15, 2026  
**API Version:** Public API v2  
**Source:** https://dotloop.github.io/public-api/

---

## Table of Contents

1. [OAuth 2.0 Authentication Flow](#oauth-20-authentication-flow)
2. [Implementation Verification](#implementation-verification)
3. [API Endpoints Reference](#api-endpoints-reference)
4. [Error Handling](#error-handling)
5. [Best Practices](#best-practices)
6. [Webhooks](#webhooks)
7. [Rate Limiting](#rate-limiting)

---

## OAuth 2.0 Authentication Flow

### Overview

Dotloop's Public API v2 uses **OAuth 2.0 protocol** for authentication and authorization, supporting **3-legged OAuth** (web server applications only).

**Key Features:**
- Users control data access by third-party applications
- Users can revoke access at any time
- Access tokens expire after **12 hours**
- Refresh tokens allow obtaining new access tokens

---

### Step 1: Obtain Authorization Code

**Endpoint:**
```
https://auth.dotloop.com/oauth/authorize
```

**Method:** GET (User redirect)

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `response_type` | string | ✅ Required | Must be `code` |
| `client_id` | string | ✅ Required | Client ID (UUID) issued during registration |
| `redirect_uri` | string | ✅ Required | URL to redirect after user consent |
| `state` | string | ⚠️ Recommended | Random string for CSRF protection |
| `redirect_on_deny` | boolean | ❌ Optional | Whether to redirect on deny (default: false) |

**Example URL:**
```
https://auth.dotloop.com/oauth/authorize?response_type=code&client_id=69bcf590-71b7-41a4-a039-a1d290edca11&redirect_uri=https://dotloopreport.com/api/dotloop/callback&state=abc123&redirect_on_deny=true
```

**Success Response:**
```
HTTP/1.1 302 Found
Location: https://dotloopreport.com/api/dotloop/callback?code=<authorization_code>&state=abc123
```

**Denial Response:**
```
Location: https://dotloopreport.com/api/dotloop/callback?error=access_denied&state=abc123
```

---

### Step 2: Exchange Authorization Code for Tokens

**Endpoint:**
```
POST https://auth.dotloop.com/oauth/token
```

**Headers:**
```
Authorization: Basic <Base64(client_id:client_secret)>
Content-Type: application/x-www-form-urlencoded
```

**Body Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `grant_type` | string | ✅ Required | Must be `authorization_code` |
| `code` | string | ✅ Required | Authorization code from Step 1 |
| `redirect_uri` | string | ✅ Required | Must match the redirect_uri from Step 1 |

**Example Request:**
```http
POST https://auth.dotloop.com/oauth/token?grant_type=authorization_code&code=abc123&redirect_uri=https://dotloopreport.com/api/dotloop/callback
Authorization: Basic NjliY2Y1OTAtNzFiNy00MWE0LWEwMzktYTFkMjkwZWRjYTExOjM0MTVlMzgxLWJkYzQtNDliNy1iZGUyLTY5YjNjNWNkNjQ0Nw==
```

**Success Response:**
```json
{
  "access_token": "0b043f2f-2abe-4c9d-844a-3eb008dcba67",
  "token_type": "Bearer",
  "refresh_token": "19bfda68-ca62-480c-9c62-2ba408458fc7",
  "expires_in": 43145,
  "scope": "profile:*, loop:*"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `access_token` | string | Token for API requests (expires in 12 hours) |
| `token_type` | string | Always "Bearer" |
| `refresh_token` | string | Token for refreshing access |
| `expires_in` | integer | Seconds until access_token expires |
| `scope` | string | Granted permissions |

---

### Step 3: Refresh Access Token

**Endpoint:**
```
POST https://auth.dotloop.com/oauth/token
```

**Headers:**
```
Authorization: Basic <Base64(client_id:client_secret)>
Content-Type: application/x-www-form-urlencoded
```

**Body Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `grant_type` | string | ✅ Required | Must be `refresh_token` |
| `refresh_token` | string | ✅ Required | Refresh token from Step 2 |

**Example Request:**
```http
POST https://auth.dotloop.com/oauth/token?grant_type=refresh_token&refresh_token=19bfda68-ca62-480c-9c62-2ba408458fc7
Authorization: Basic NjliY2Y1OTAtNzFiNy00MWE0LWEwMzktYTFkMjkwZWRjYTExOjM0MTVlMzgxLWJkYzQtNDliNy1iZGUyLTY5YjNjNWNkNjQ0Nw==
```

**Success Response:**
```json
{
  "access_token": "86609772-aa95-4071-ad7f-25ad2d0be295",
  "token_type": "Bearer",
  "refresh_token": "19bfda68-ca62-480c-9c62-2ba408458fc7",
  "expires_in": 43199,
  "scope": "account:read, profile:*, loop:*, contact:*, template:read"
}
```

**⚠️ Important Notes:**
- Previous access tokens become **invalid** after refresh
- Share tokens across cluster instances to prevent race conditions
- Refresh tokens typically remain valid (check documentation for expiry)

---

### Step 4: Revoke Access Token

**Endpoint:**
```
POST https://auth.dotloop.com/oauth/token/revoke
```

**Headers:**
```
Authorization: Basic <Base64(client_id:client_secret)>
Content-Type: application/x-www-form-urlencoded
```

**Body Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | ✅ Required | Access token to revoke |

**Example Request:**
```http
POST https://auth.dotloop.com/oauth/token/revoke?token=0b043f2f-2abe-4c9d-844a-3eb008dcba67
Authorization: Basic NjliY2Y1OTAtNzFiNy00MWE0LWEwMzktYTFkMjkwZWRjYTExOjM0MTVlMzgxLWJkYzQtNDliNy1iZGUyLTY5YjNjNWNkNjQ0Nw==
```

---

## Implementation Verification

### ✅ Our Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Authorization URL Generation** | ✅ Correct | Uses `https://auth.dotloop.com/oauth/authorize` |
| **Required Parameters** | ✅ Correct | `response_type=code`, `client_id`, `redirect_uri`, `state` |
| **CSRF Protection** | ✅ Implemented | State parameter generated and validated |
| **Token Exchange Endpoint** | ✅ Correct | POST to `https://auth.dotloop.com/oauth/token` |
| **Basic Auth Header** | ✅ Correct | Base64(client_id:client_secret) |
| **Token Storage** | ✅ Encrypted | AES-256-CBC encryption before database storage |
| **Token Refresh** | ✅ Implemented | Automatic refresh on expiry |
| **Token Revocation** | ✅ Implemented | POST to `/oauth/token/revoke` |
| **Callback Handler** | ✅ Implemented | Express route at `/api/dotloop/callback` |
| **Error Handling** | ✅ Implemented | Handles `error` and `error_description` params |

---

### ⚠️ Discrepancies Found and Fixed

1. **Callback Route Type**
   - **Issue:** Initially used tRPC `protectedProcedure` (requires Manus auth)
   - **Fix:** Created Express route handler for direct OAuth callback
   - **Status:** ✅ Fixed

2. **Database Schema Mismatch**
   - **Issue:** Field names didn't match schema (`accessToken` vs `encryptedAccessToken`)
   - **Fix:** Updated to use correct field names from schema
   - **Status:** ✅ Fixed

3. **Token Expiry Format**
   - **Issue:** Used JavaScript Date object instead of MySQL datetime string
   - **Fix:** Convert to `YYYY-MM-DD HH:MM:SS` format
   - **Status:** ✅ Fixed

---

## API Endpoints Reference

### Base URL
```
https://api-gateway.dotloop.com/public/v2/
```

### Authentication Header
All API requests require:
```
Authorization: Bearer <access_token>
```

### Content Type
All requests and responses use:
```
Content-Type: application/json
```

---

### Key API Endpoints

#### 1. Get Account Details
```
GET /account
```

**Response:**
```json
{
  "data": {
    "id": 12345,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

---

#### 2. List All Profiles
```
GET /profile
```

**Response:**
```json
{
  "data": [
    {
      "id": 67890,
      "name": "John Doe's Profile",
      "email": "john@realestate.com"
    }
  ]
}
```

---

#### 3. List All Loops
```
GET /profile/{profileId}/loop
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `batch_number` | integer | Page number (default: 1) |
| `batch_size` | integer | Results per page (default: 50, max: 50) |
| `status` | string | Filter by status (e.g., "Active", "Archived") |

**Response:**
```json
{
  "data": [
    {
      "loop_id": 123456,
      "loop_name": "123 Main St Purchase",
      "loop_status": "Active",
      "loop_created": "2026-01-01T10:00:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "batch_number": 1,
    "batch_size": 50
  }
}
```

---

#### 4. Get Loop Details
```
GET /profile/{profileId}/loop/{loopId}/detail
```

**Response:**
```json
{
  "data": {
    "SALES_PRICE": "450000",
    "CLOSING_DATE": "2026-02-15",
    "PROPERTY_ADDRESS": "123 Main St",
    "PROPERTY_CITY": "San Francisco",
    "PROPERTY_STATE": "CA",
    "PROPERTY_ZIP": "94102"
  }
}
```

---

#### 5. List Loop Participants
```
GET /profile/{profileId}/loop/{loopId}/participant
```

**Response:**
```json
{
  "data": [
    {
      "id": 789,
      "full_name": "Jane Smith",
      "email": "jane@example.com",
      "role": "LISTING_AGENT"
    }
  ]
}
```

---

#### 6. List All Contacts
```
GET /contact
```

**Response:**
```json
{
  "data": [
    {
      "id": 456,
      "first_name": "Bob",
      "last_name": "Johnson",
      "email": "bob@example.com",
      "phone": "555-1234"
    }
  ]
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request successful, no content returned |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Invalid or expired access token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

### Error Response Format

```json
{
  "errors": [
    {
      "message": "Invalid access token",
      "code": "INVALID_TOKEN"
    }
  ]
}
```

---

### Common OAuth Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `invalid_request` | Missing required parameter | Check all required params are present |
| `invalid_client` | Invalid client credentials | Verify client_id and client_secret |
| `invalid_grant` | Invalid authorization code | Code may be expired or already used |
| `unauthorized_client` | Client not authorized | Check client registration |
| `unsupported_grant_type` | Invalid grant_type | Use `authorization_code` or `refresh_token` |
| `invalid_scope` | Invalid scope requested | Check available scopes |

---

## Best Practices

### 1. Token Management

✅ **DO:**
- Store tokens encrypted (AES-256-CBC)
- Refresh tokens before expiry (set refresh at 11 hours)
- Handle token refresh failures gracefully
- Log token operations for audit trail
- Use token hashing for quick lookups

❌ **DON'T:**
- Store tokens in plain text
- Share tokens across different users
- Expose tokens in client-side code
- Ignore token expiry
- Use expired tokens

---

### 2. Security

✅ **DO:**
- Use HTTPS for all requests
- Implement CSRF protection with `state` parameter
- Validate `state` parameter on callback
- Use secure random string generation
- Implement rate limiting
- Log suspicious activity

❌ **DON'T:**
- Expose client_secret in frontend
- Skip CSRF validation
- Use predictable state values
- Store credentials in code
- Ignore security warnings

---

### 3. Error Handling

✅ **DO:**
- Handle all OAuth error responses
- Implement retry logic with exponential backoff
- Log errors for debugging
- Provide user-friendly error messages
- Handle network failures gracefully

❌ **DON'T:**
- Ignore error responses
- Retry immediately without backoff
- Expose technical errors to users
- Assume requests always succeed

---

### 4. API Usage

✅ **DO:**
- Use pagination for large result sets
- Cache responses when appropriate
- Respect rate limits
- Use batch operations when available
- Implement proper timeout handling

❌ **DON'T:**
- Request all data at once
- Make unnecessary API calls
- Ignore rate limit headers
- Use polling when webhooks available
- Skip error handling

---

## Webhooks

### Overview

Dotloop Webhooks allow subscribing to specific events that occur in Dotloop. When an event occurs, Dotloop sends an HTTPS POST payload to the configured URL.

### Webhook Events

| Event Type | Description |
|------------|-------------|
| `loop.created` | New loop created |
| `loop.updated` | Loop details updated |
| `loop.status_changed` | Loop status changed |
| `participant.added` | Participant added to loop |
| `participant.removed` | Participant removed from loop |
| `document.uploaded` | Document uploaded to loop |
| `task.completed` | Task marked as complete |

### Webhook Payload Example

```json
{
  "event_id": "evt_123456",
  "event_type": "loop.updated",
  "timestamp": "2026-01-15T20:00:00Z",
  "data": {
    "loop_id": 123456,
    "profile_id": 67890,
    "changes": {
      "status": "Active"
    }
  }
}
```

---

## Rate Limiting

### Limits

- **Default:** 100 requests per minute per access token
- **Burst:** Up to 200 requests in short bursts

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642272000
```

### Handling Rate Limits

When rate limit is exceeded (HTTP 429):

1. Read `X-RateLimit-Reset` header
2. Wait until reset time
3. Implement exponential backoff
4. Consider caching responses

---

## Implementation Checklist

### OAuth Flow
- [x] Authorization URL generation with all required parameters
- [x] CSRF protection with state parameter
- [x] Token exchange with Basic Auth header
- [x] Encrypted token storage in database
- [x] Automatic token refresh before expiry
- [x] Token revocation support
- [x] Error handling for all OAuth errors
- [x] Audit logging for token operations

### API Integration
- [ ] Account details retrieval
- [ ] Profile listing
- [ ] Loop listing with pagination
- [ ] Loop details retrieval
- [ ] Participant listing
- [ ] Contact management
- [ ] Document operations
- [ ] Webhook subscription management

### Security
- [x] HTTPS for all requests
- [x] Client secret protection
- [x] Token encryption (AES-256-CBC)
- [x] CSRF validation
- [x] Audit logging
- [ ] Rate limiting implementation
- [ ] IP whitelisting (optional)

---

## Support & Resources

- **Developer Portal:** http://info.dotloop.com/developers
- **API Documentation:** https://dotloop.github.io/public-api/
- **OAuth 2.0 Spec:** https://tools.ietf.org/html/rfc6749
- **Support:** Contact Dotloop Developer Support

---

**Document Maintained By:** Dotloop Reporter Development Team  
**Last Review Date:** January 15, 2026  
**Next Review Date:** March 15, 2026
