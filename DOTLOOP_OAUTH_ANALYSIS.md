# Dotloop OAuth Scope Analysis

## Key Finding: **NO SCOPE PARAMETER IN AUTHORIZATION URL**

After deep diving into the official Dotloop API documentation, I found that:

### Authorization URL (Step 1)
```
https://auth.dotloop.com/oauth/authorize?response_type=code&client_id=<client_id>&redirect_uri=<redirect_url>[&state=<state>&redirect_on_deny=(true|false)]
```

**Parameters:**
- `response_type` - [required] only "code" is supported
- `client_id` - [required] client id (UUID)
- `redirect_uri` - [required] callback URL
- `state` - [optional] CSRF protection
- `redirect_on_deny` - [optional] redirect behavior on denial

**CRITICAL: There is NO `scope` parameter in the authorization URL!**

### Token Exchange (Step 2)
```
POST https://auth.dotloop.com/oauth/token?grant_type=authorization_code&code=<code>&redirect_uri=<redirect_url>&state=<state>
```

**Headers:**
- `Authorization: Basic <base64(ClientID:ClientSecret)>`

**Response includes scope:**
```json
{
  "access_token": "0b043f2f-2abe-4c9d-844a-3eb008dcba67",
  "token_type": "Bearer",
  "refresh_token": "19bfda68-ca62-480c-9c62-2ba408458fc7",
  "expires_in": 43145,
  "scope": "profile:*, loop:*"
}
```

### How Scopes Work in Dotloop

1. **Scopes are NOT requested in the authorization URL**
2. **Scopes are determined by your OAuth application configuration** in the Dotloop developer portal
3. **Scopes are returned in the token response** after successful authorization
4. **Each API endpoint requires specific scopes** (documented per endpoint)

### Available Scopes (from documentation)

**Read Scopes:**
- `account:read` - Get account details
- `profile:read` - List/get profiles
- `loop:read` - List/get loops, folders, documents, participants, tasks, activities
- `contact:read` - List/get contacts
- `template:read` - List/get loop templates

**Write Scopes:**
- `profile:write` - Create/update profiles
- `loop:write` - Create/update loops, folders, documents, participants
- `contact:write` - Create/update/delete contacts

**Wildcard Scopes:**
- `profile:*` - Full access to profiles (read + write)
- `loop:*` - Full access to loops (read + write)
- `contact:*` - Full access to contacts (read + write + delete)

### Example from Documentation

Token response shows:
```json
{
  "scope": "account:read, profile:*, loop:*, contact:*, template:read"
}
```

This means the OAuth application was configured in the Dotloop developer portal to have these permissions.

## Conclusion

**The `invalid_scope` error is NOT because we're missing a scope parameter in the authorization URL.**

The error is likely because:
1. Our OAuth application in Dotloop developer portal is not configured with the correct scopes
2. OR there's a mismatch between what we're requesting and what's allowed
3. OR Zillow Workspace OAuth integration requires different configuration

## Next Steps

1. **Remove the scope parameter from our authorization URL** (it's not part of Dotloop's OAuth spec)
2. **Check our OAuth application configuration** in the Dotloop developer portal
3. **Verify the scopes are properly configured** for our application
4. **Test the OAuth flow without scope parameter**
