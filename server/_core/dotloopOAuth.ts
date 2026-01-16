/**
 * Dotloop OAuth 2.0 Implementation
 * 
 * Clean implementation following Dotloop API documentation:
 * https://dotloop.github.io/public-api/#authentication
 * 
 * OAuth Flow:
 * 1. User clicks "Login with Dotloop"
 * 2. Redirect to Dotloop authorization URL
 * 3. User authenticates on Dotloop (including 2FA if enabled)
 * 4. Dotloop redirects back to our callback with authorization code
 * 5. Exchange code for access token
 * 6. Fetch user profile from Dotloop API
 * 7. Create/update user in database
 * 8. Store encrypted tokens
 * 9. Create session and redirect to dashboard
 */

import { Express, Request, Response } from 'express';
import crypto from 'crypto';
import { ENV } from './env';
import { getDb } from '../db';
import { users, oauthTokens } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { tokenEncryption } from '../lib/token-encryption';
import { getSessionCookieOptions } from './cookies';
import { sdk } from './sdk';
import { COOKIE_NAME, ONE_YEAR_MS } from '@shared/const';

// OAuth configuration
const DOTLOOP_AUTH_URL = 'https://auth.dotloop.com/oauth/authorize';
const DOTLOOP_TOKEN_URL = 'https://auth.dotloop.com/oauth/token';
const DOTLOOP_PROFILE_URL = 'https://api-gateway.dotloop.com/public/v2/account';

interface DotloopTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

interface DotloopAccount {
  data: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    defaultProfileId: number;
  };
}

/**
 * Generate authorization URL for Dotloop OAuth
 */
export function getAuthorizationUrl(): string {
  const state = crypto.randomBytes(32).toString('hex');
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: ENV.DOTLOOP_CLIENT_ID,
    redirect_uri: ENV.DOTLOOP_REDIRECT_URI,
    state,
  });

  return `${DOTLOOP_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(code: string): Promise<DotloopTokenResponse> {
  // Create Basic Auth header: base64(client_id:client_secret)
  const credentials = Buffer.from(`${ENV.DOTLOOP_CLIENT_ID}:${ENV.DOTLOOP_CLIENT_SECRET}`).toString('base64');
  
  console.log('[Token Exchange] Starting token exchange...');
  console.log('[Token Exchange] Redirect URI:', ENV.DOTLOOP_REDIRECT_URI);
  
  const response = await fetch(DOTLOOP_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: ENV.DOTLOOP_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Token Exchange] Failed with status:', response.status);
    console.error('[Token Exchange] Error response:', error);
    throw new Error(`Token exchange failed: ${error}`);
  }
  
  console.log('[Token Exchange] Success! Token received.');

  return response.json();
}

/**
 * Fetch user profile from Dotloop API
 */
async function fetchAccount(accessToken: string): Promise<DotloopAccount> {
  const response = await fetch(DOTLOOP_PROFILE_URL, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Profile fetch failed: ${error}`);
  }

  return response.json();
}

/**
 * Find or create user from Dotloop profile
 */
async function findOrCreateUser(account: DotloopAccount['data']) {
  const dotloopUserId = account.id.toString();
  const email = account.email;
  const name = `${account.firstName} ${account.lastName}`.trim();

  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Try to find existing user by Dotloop user ID
  let user = await (db as any).query.users.findFirst({
    where: eq(users.dotloopUserId, dotloopUserId),
  });

  if (user) {
    // Update existing user
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await db.update(users)
      .set({
        name,
        email,
        lastSignedIn: now,
      })
      .where(eq(users.id, user.id));
    
    return user;
  }

  // Create new user
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const result = await db.insert(users).values({
    tenantId: 1, // Default tenant
    dotloopUserId,
    name,
    email,
    loginMethod: 'dotloop',
    role: 'user',
    status: 'active',
    lastSignedIn: now,
  });

  // Fetch the newly created user
  const newUser = await (db as any).query.users.findFirst({
    where: eq(users.dotloopUserId, dotloopUserId),
  });

  if (!newUser) throw new Error('Failed to create user');
  return newUser;
}

/**
 * Store encrypted OAuth tokens
 */
async function storeTokens(
  userId: number,
  accessToken: string,
  refreshToken: string | undefined,
  expiresIn: number
) {
  const encryptedAccessToken = tokenEncryption.encrypt(accessToken);
  const encryptedRefreshToken = refreshToken ? tokenEncryption.encrypt(refreshToken) : tokenEncryption.encrypt('N/A');
  const tokenHash = tokenEncryption.hashToken(accessToken);
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  const expiresAtStr = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Delete existing tokens for this user/provider
  await db.delete(oauthTokens)
    .where(
      and(
        eq(oauthTokens.userId, userId),
        eq(oauthTokens.provider, 'dotloop')
      )
    );

  // Insert new token
  await db.insert(oauthTokens).values({
    tenantId: 1,
    userId,
    provider: 'dotloop',
    encryptedAccessToken,
    encryptedRefreshToken,
    tokenExpiresAt: expiresAtStr,
    tokenHash,
    ipAddress: '0.0.0.0',
    userAgent: 'OAuth',
  });
}

/**
 * OAuth callback handler
 */
async function handleCallback(req: Request, res: Response) {
  try {
    console.log('[Dotloop OAuth] ========== CALLBACK START ==========');
    console.log('[Dotloop OAuth] Callback received');
    console.log('[Dotloop OAuth] Full URL:', req.url);
    console.log('[Dotloop OAuth] Query params:', JSON.stringify(req.query));
    
    const { code, state, error } = req.query;

    // Check for OAuth errors
    if (error) {
      console.error('[Dotloop OAuth] Authorization error:', error);
      return res.redirect(`/?dotloop_error=${error}`);
    }

    if (!code || typeof code !== 'string') {
      console.error('[Dotloop OAuth] No authorization code received');
      return res.redirect('/?dotloop_error=no_code');
    }

    console.log('[Dotloop OAuth] Exchanging code for token...');
    console.log('[Dotloop OAuth] Authorization code:', code.substring(0, 10) + '...');
    
    // Exchange code for token
    const tokenData = await exchangeCodeForToken(code);
    
    if (!tokenData.access_token) {
      console.error('[Dotloop OAuth] No access token in response');
      return res.redirect('/?dotloop_error=no_access_token');
    }

    console.log('[Dotloop OAuth] Fetching account info...');
    
    // Fetch account details from Dotloop API
    const account = await fetchAccount(tokenData.access_token);
    
    if (!account) {
      console.error('[Dotloop OAuth] Failed to fetch account');
      return res.redirect('/?dotloop_error=account_fetch_failed');
    }

    console.log('[Dotloop OAuth] ========== SUCCESS ==========');
    console.log('[Dotloop OAuth] Account:', account.data.email);
    console.log('[Dotloop OAuth] Token received, redirecting to frontend...');
    console.log('[Dotloop OAuth] ========== CALLBACK END ==========');
    
    // Redirect to frontend with token data AND account info as URL parameters
    // Frontend will extract and store in localStorage with multi-account support
    const params = new URLSearchParams({
      dotloop_connected: 'true',
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in.toString(),
      account_id: account.data.id.toString(),
      email: account.data.email,
      first_name: account.data.firstName,
      last_name: account.data.lastName,
      default_profile_id: account.data.defaultProfileId.toString(),
    });
    
    if (tokenData.refresh_token) {
      params.append('refresh_token', tokenData.refresh_token);
    }
    
    return res.redirect(`/?${params.toString()}`);

  } catch (error) {
    console.error('[Dotloop OAuth] ========== ERROR ==========');
    console.error('[Dotloop OAuth] Callback error:', error);
    console.error('[Dotloop OAuth] Error stack:', error instanceof Error ? error.stack : 'No stack');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Dotloop OAuth] Redirecting with error:', errorMessage);
    console.error('[Dotloop OAuth] ========== CALLBACK END (ERROR) ==========');
    return res.redirect(`/?dotloop_error=callback_failed&error_details=${encodeURIComponent(errorMessage)}`);
  }
}

/**
 * Authorize endpoint - redirects to Dotloop OAuth
 */
async function handleAuthorize(req: Request, res: Response) {
  try {
    console.log('[Dotloop OAuth] Authorize endpoint called');
    const authUrl = getAuthorizationUrl();
    console.log('[Dotloop OAuth] Redirecting to:', authUrl);
    res.redirect(authUrl);
  } catch (error) {
    console.error('[Dotloop OAuth] Authorize error:', error);
    res.redirect('/?dotloop_error=authorize_failed');
  }
}

/**
 * Register OAuth routes
 */
export function registerDotloopOAuthRoutes(app: Express) {
  // OAuth authorize endpoint
  app.get('/api/dotloop/authorize', handleAuthorize);
  
  // OAuth callback
  app.get('/api/dotloop/callback', handleCallback);
  
  console.log('[Dotloop OAuth] Routes registered');
}
