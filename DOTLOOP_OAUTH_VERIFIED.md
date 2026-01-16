# Dotloop OAuth 2.0 Verification

**Source:** https://dotloop.github.io/public-api/

## Official OAuth Endpoints

### 1. Authorization Endpoint
```
https://auth.dotloop.com/oauth/authorize
```

**Parameters:**
- `response_type=code` (REQUIRED - only "code" is supported, NOT "token")
- `client_id=<client_id>` (REQUIRED - UUID from Dotloop)
- `redirect_uri=<redirect_url>` (REQUIRED - must match registered URL)
- `state=<random_string>` (OPTIONAL - recommended for CSRF protection)
- `redirect_on_deny=true|false` (OPTIONAL - default: false)

### 2. Token Exchange Endpoint
```
POST https://auth.dotloop.com/oauth/token
```

**For Authorization Code Exchange:**
```
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

### 3. Token Refresh Endpoint
```
POST https://auth.dotloop.com/oauth/token?grant_type=refresh_token&refresh_token=<refresh_token>

Authorization: Basic <base64(ClientID:ClientSecret)>
```

### 4. Token Revocation Endpoint
```
POST https://auth.dotloop.com/oauth/token/revoke?token=<access_token>
```

## Key Facts

1. **OAuth Flow:** 3-legged OAuth (authorization code flow)
2. **Token Lifetime:** Access tokens expire after ~12 hours
3. **Refresh Tokens:** Can be used to get new access tokens
4. **Authentication:** Uses HTTP Basic Auth with ClientID:ClientSecret
5. **API Base URL:** `https://api-gateway.dotloop.com/public/v2/`
6. **Authorization Header:** `Authorization: Bearer <access_token>`

## Important Notes

- **NEVER use `response_type=token`** - Dotloop only supports authorization code flow
- Access tokens must be refreshed every 12 hours
- When refreshing, old access tokens become invalid
- State parameter is recommended for CSRF protection
- Redirect URI must exactly match the registered URL

## Verification Status

✅ Authorization endpoint: `https://auth.dotloop.com/oauth/authorize`
✅ Token endpoint: `https://auth.dotloop.com/oauth/token`
✅ Response type: `code` (NOT `token`)
✅ Grant types: `authorization_code`, `refresh_token`
✅ Token revocation: `https://auth.dotloop.com/oauth/token/revoke`
