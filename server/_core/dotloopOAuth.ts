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
const DOTLOOP_PROFILE_URL = 'https://api-gateway.dotloop.com/profile/v2';

interface DotloopTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

interface DotloopProfile {
  data: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  }[];
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
  const response = await fetch(DOTLOOP_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: ENV.DOTLOOP_CLIENT_ID,
      client_secret: ENV.DOTLOOP_CLIENT_SECRET,
      redirect_uri: ENV.DOTLOOP_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Fetch user profile from Dotloop API
 */
async function fetchProfile(accessToken: string): Promise<DotloopProfile> {
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
async function findOrCreateUser(profile: DotloopProfile['data'][0]) {
  const dotloopUserId = profile.id.toString();
  const email = profile.email;
  const name = `${profile.first_name} ${profile.last_name}`.trim();

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
    console.log('[Dotloop OAuth] Callback received');
    
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
    
    // Exchange code for token
    const tokenData = await exchangeCodeForToken(code);
    
    if (!tokenData.access_token) {
      console.error('[Dotloop OAuth] No access token in response');
      return res.redirect('/?dotloop_error=no_access_token');
    }

    console.log('[Dotloop OAuth] Fetching user profile...');
    
    // Fetch user profile
    const profileData = await fetchProfile(tokenData.access_token);
    
    if (!profileData.data || profileData.data.length === 0) {
      console.error('[Dotloop OAuth] No profile data received');
      return res.redirect('/?dotloop_error=no_profile');
    }

    const profile = profileData.data[0];
    
    console.log('[Dotloop OAuth] Creating/updating user...');
    
    // Find or create user
    const user = await findOrCreateUser(profile);
    
    console.log('[Dotloop OAuth] Storing tokens...');
    
    // Store tokens
    await storeTokens(
      user.id,
      tokenData.access_token,
      tokenData.refresh_token,
      tokenData.expires_in
    );

    console.log('[Dotloop OAuth] Creating session...');
    
    // Create session using Manus SDK
    const sessionToken = await sdk.createSessionToken(user.dotloopUserId || `dotloop_${user.id}`, {
      name: user.name || '',
      expiresInMs: ONE_YEAR_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

    console.log('[Dotloop OAuth] Success! Redirecting to homepage...');
    
    // Redirect to homepage with success parameter to show toast
    return res.redirect('/?login_success=true');

  } catch (error) {
    console.error('[Dotloop OAuth] Callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.redirect(`/?dotloop_error=callback_failed&error_details=${encodeURIComponent(errorMessage)}`);
  }
}

/**
 * Register OAuth routes
 */
export function registerDotloopOAuthRoutes(app: Express) {
  // OAuth callback
  app.get('/api/dotloop/callback', handleCallback);
  
  console.log('[Dotloop OAuth] Routes registered');
}
