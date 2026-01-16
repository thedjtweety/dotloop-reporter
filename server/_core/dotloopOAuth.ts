/**
 * Dotloop OAuth Express Routes
 * 
 * Handles OAuth 2.0 callback from Dotloop
 */

import { Express, Request, Response } from 'express';
import { getDb } from '../db';
import { oauthTokens, tokenAuditLogs } from '../../drizzle/schema';
import { tokenEncryption } from '../lib/token-encryption';

const DOTLOOP_TOKEN_URL = 'https://auth.dotloop.com/oauth/token';

/**
 * Get Dotloop OAuth credentials from environment
 */
function getDotloopCredentials() {
  const clientId = process.env.DOTLOOP_CLIENT_ID;
  const clientSecret = process.env.DOTLOOP_CLIENT_SECRET;
  const redirectUri = process.env.DOTLOOP_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Dotloop OAuth credentials not configured. ' +
      'Please set DOTLOOP_CLIENT_ID, DOTLOOP_CLIENT_SECRET, and DOTLOOP_REDIRECT_URI'
    );
  }

  return { clientId, clientSecret, redirectUri };
}

/**
 * Create HTTP Basic Authorization header
 */
function createBasicAuthHeader(clientId: string, clientSecret: string): string {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Register Dotloop OAuth routes
 */
export function registerDotloopOAuthRoutes(app: Express) {
  /**
   * Handle OAuth callback from Dotloop
   * GET /api/dotloop/callback?code=xxx&state=xxx
   */
  app.get('/api/dotloop/callback', async (req: Request, res: Response) => {
    try {
      console.log('[DotloopOAuth] Callback received:', {
        query: req.query,
        url: req.url,
        headers: req.headers
      });
      
      const { code, state, error, error_description } = req.query;

      // Handle OAuth errors (user denied, etc.)
      if (error) {
        console.error('[DotloopOAuth] OAuth error:', error, error_description);
        return res.redirect(`/?dotloop_error=${encodeURIComponent(error as string)}`);
      }

      // Validate required parameters
      if (!code || typeof code !== 'string') {
        console.error('[DotloopOAuth] Missing authorization code');
        return res.redirect('/?dotloop_error=missing_code');
      }

      console.log('[DotloopOAuth] Authorization code received, exchanging for tokens...');
      
      // Exchange authorization code for tokens
      const { clientId, clientSecret, redirectUri } = getDotloopCredentials();
      console.log('[DotloopOAuth] Using credentials:', { clientId, redirectUri });
      
      const tokenResponse = await fetch(DOTLOOP_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Authorization': createBasicAuthHeader(clientId, clientSecret),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('[DotloopOAuth] Token exchange failed:', tokenResponse.status, errorText);
        return res.redirect('/?dotloop_error=token_exchange_failed');
      }

      console.log('[DotloopOAuth] Token exchange successful, parsing response...');
      const tokenData = await tokenResponse.json();
      console.log('[DotloopOAuth] Token data received:', { 
        has_access_token: !!tokenData.access_token,
        has_refresh_token: !!tokenData.refresh_token,
        expires_in: tokenData.expires_in 
      });
      
      const { access_token, refresh_token, expires_in } = tokenData;

      if (!access_token) {
        console.error('[DotloopOAuth] No access token in response');
        return res.redirect('/?dotloop_error=no_access_token');
      }

      console.log('[DotloopOAuth] ===== STEP 5: Fetching Dotloop profile =====');
      // Fetch user profile from Dotloop API
      const { fetchDotloopProfile } = await import('../dotloopApiClient');
      const { findOrCreateDotloopUser } = await import('../dotloopUserManager');
      const { createSession, getSessionCookieName, getSessionCookieOptions } = await import('../dotloopSessionManager');
      
      const profile = await fetchDotloopProfile(access_token);
      console.log('[DotloopOAuth] ===== STEP 6: Profile fetched successfully =====');
      console.log('[DotloopOAuth] Profile data:', { id: profile.id, email: profile.email });
      
      // Find or create user
      const user = await findOrCreateDotloopUser(profile);
      console.log('[DotloopOAuth] ===== STEP 7: User found/created =====');
      console.log('[DotloopOAuth] User data:', { userId: user.id, dotloopUserId: user.dotloopUserId });
      
      console.log('[DotloopOAuth] ===== STEP 8: Connecting to database =====');
      // Store tokens in database
      const db = await getDb();
      if (!db) {
        console.error('[DotloopOAuth] Database not available');
        return res.redirect('/?dotloop_error=database_error');
      }

      // Use the actual user ID from database
      const userId = user.id;
      const tenantId = user.tenantId;

      console.log('[DotloopOAuth] ===== STEP 9: Encrypting tokens =====');
      // Encrypt tokens before storage
      const encryptedAccessToken = tokenEncryption.encrypt(access_token);
      const encryptedRefreshToken = refresh_token ? tokenEncryption.encrypt(refresh_token) : null;
      const tokenHash = tokenEncryption.hashToken(access_token);

      const expiresAt = new Date(Date.now() + (expires_in * 1000));
      console.log('[DotloopOAuth] ===== STEP 10: Inserting tokens into database =====');

      await db.insert(oauthTokens).values({
        tenantId,
        userId,
        provider: 'dotloop',
        encryptedAccessToken,
        encryptedRefreshToken: encryptedRefreshToken || '',
        tokenHash,
        tokenExpiresAt: expiresAt.toISOString().slice(0, 19).replace('T', ' '),
      });

      console.log('[DotloopOAuth] ===== STEP 11: Token insert successful, creating audit log =====');
      
      // Log successful token creation
      await db.insert(tokenAuditLogs).values({
        tenantId,
        userId,
        tokenId: null,
        action: 'token_created',
        status: 'success',
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.get('user-agent') || null,
      });

      console.log('[DotloopOAuth] ===== STEP 12: Audit log created successfully =====');
      
      // Create session for the user
      console.log('[DotloopOAuth] ===== STEP 13: Creating session =====');
      const sessionToken = await createSession(user);
      const cookieOptions = getSessionCookieOptions();
      res.cookie(getSessionCookieName(), sessionToken, cookieOptions);
      console.log('[DotloopOAuth] ===== STEP 14: Session created and cookie set =====');
      
      console.log('[DotloopOAuth] ===== STEP 15: All operations completed, redirecting to success =====');

      // Redirect back to app with success message
      res.redirect('/?dotloop_connected=true');
    } catch (error) {
      console.error('\n\n========== DOTLOOP OAUTH CALLBACK ERROR ==========');
      console.error('[DotloopOAuth] Callback error:', error);
      console.error('[DotloopOAuth] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('[DotloopOAuth] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[DotloopOAuth] Error type:', typeof error);
      console.error('[DotloopOAuth] Error name:', error instanceof Error ? error.name : 'Unknown');
      
      // Try to extract more details
      if (error && typeof error === 'object') {
        console.error('[DotloopOAuth] Error keys:', Object.keys(error));
        console.error('[DotloopOAuth] Error properties:', Object.getOwnPropertyNames(error));
      }
      
      console.error('[DotloopOAuth] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('========== END ERROR ==========\n\n');
      res.redirect('/?dotloop_error=unknown');
    }
  });
}
