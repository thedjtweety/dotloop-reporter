# Dotloop OAuth 2.0 Flow Documentation

## Overview

Dotloop uses OAuth 2.0 for authentication and authorization. Access tokens expire after **12 hours** and must be refreshed.

## OAuth Endpoints

- **Authorization**: `https://auth.dotloop.com/oauth/authorize`
- **Token Exchange**: `https://auth.dotloop.com/oauth/token`
- **Token Revocation**: `https://auth.dotloop.com/oauth/token/revoke`
- **API Base URL**: `https://api-gateway.dotloop.com/public/v2/`

## OAuth Flow Steps

### Step 1: Obtain Authorization Code

Redirect user to:
```
https://auth.dotloop.com/oauth/authorize?response_type=code&client_id=<client_id>&redirect_uri=<redirect_url>&state=<state>&redirect_on_deny=true
```

**Parameters:**
- `response_type`: Always `code`
- `client_id`: Your application's client ID
- `redirect_uri`: Your callback URL (must be registered)
- `state`: CSRF protection token (recommended)
- `redirect_on_deny`: Whether to redirect on user denial

**Response:**
User is redirected back to `<redirect_url>?code=<code>&state=<state>`

### Step 2: Exchange Code for Access Token

```http
POST https://auth.dotloop.com/oauth/token?grant_type=authorization_code&code=<code>&redirect_uri=<redirect_url>&state=<state>
Authorization: Basic <base64(ClientID:ClientSecret)>
```

**Response:**
```json
{
  "access_token": "0b043f2f-2abe-4c9d-844a-3eb008dcba67",
  "token_type": "Bearer",
  "refresh_token": "19bfda68-ca62-480c-9c62-2ba408458fc7",
  "expires_in": 43145,
  "scope": "profile:*, loop:*"
}
```

### Step 3: Refresh Access Token

Access tokens expire after 12 hours. Refresh proactively or on `401 Unauthorized`:

```http
POST https://auth.dotloop.com/oauth/token?grant_type=refresh_token&refresh_token=<refresh_token>
Authorization: Basic <base64(ClientID:ClientSecret)>
```

**Response:**
```json
{
  "access_token": "86609772-aa95-4071-ad7f-25ad2d0be295",
  "token_type": "Bearer",
  "refresh_token": "19bfda68-ca62-480c-9c62-2ba408458fc7",
  "expires_in": 43199,
  "scope": "account:read, profile:*, loop:*, contact:*, template:read"
}
```

**Important:** When refreshing, any previously issued access token becomes invalid.

### Step 4: Revoke Access

```http
POST https://auth.dotloop.com/oauth/token/revoke?token=<access_token>
Authorization: Basic <base64(ClientID:ClientSecret)>
```

## Using Access Tokens

Include the access token in the `Authorization` header for all API requests:

```http
GET https://api-gateway.dotloop.com/public/v2/account
Authorization: Bearer <access_token>
```

## Security Considerations

1. **CSRF Protection**: Always use the `state` parameter
2. **Token Storage**: Store tokens encrypted in the database
3. **Token Refresh**: Handle race conditions in clustered environments
4. **Expiration**: Tokens expire after 12 hours - implement automatic refresh
5. **Revocation**: Implement token revocation when users disconnect

## Implementation Notes

- Client credentials must be registered at http://info.dotloop.com/developers
- Redirect URI must match exactly what was registered
- Use HTTP Basic Authentication for token endpoint (Base64 encode `ClientID:ClientSecret`)
- Store refresh tokens securely - they don't expire unless revoked
