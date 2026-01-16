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

      console.log('[DotloopOAuth] Connecting to database...');
      // Store tokens in database
      const db = await getDb();
      if (!db) {
        console.error('[DotloopOAuth] Database not available');
        return res.redirect('/?dotloop_error=database_error');
      }

      // For now, store with a default tenant/user ID
      // TODO: Associate with actual logged-in user
      const tenantId = 'default';
      const userId = 'default';

      console.log('[DotloopOAuth] Encrypting tokens...');
      // Encrypt tokens before storage
      const encryptedAccessToken = tokenEncryption.encrypt(access_token);
      const encryptedRefreshToken = refresh_token ? tokenEncryption.encrypt(refresh_token) : null;
      const tokenHash = tokenEncryption.hashToken(access_token);

      const expiresAt = new Date(Date.now() + (expires_in * 1000));
      console.log('[DotloopOAuth] Tokens encrypted, inserting into database...');

      await db.insert(oauthTokens).values({
        tenantId: 1, // Default tenant ID
        userId: 1, // Default user ID
        provider: 'dotloop',
        encryptedAccessToken,
        encryptedRefreshToken: encryptedRefreshToken || '',
        tokenHash,
        tokenExpiresAt: expiresAt.toISOString().slice(0, 19).replace('T', ' '),
      });

      console.log('[DotloopOAuth] Token insert successful, creating audit log...');
      
      // Log successful token creation
      await db.insert(tokenAuditLogs).values({
        tenantId: 1,
        userId: 1,
        tokenId: null,
        action: 'token_created',
        status: 'success',
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.get('user-agent') || null,
      });

      console.log('[DotloopOAuth] Audit log created successfully');
      console.log('[DotloopOAuth] All operations completed, redirecting to success page...');

      // Redirect back to app with success message
      res.redirect('/?dotloop_connected=true');
    } catch (error) {
      console.error('[DotloopOAuth] Callback error:', error);
      console.error('[DotloopOAuth] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('[DotloopOAuth] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[DotloopOAuth] Error type:', typeof error);
      console.error('[DotloopOAuth] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      res.redirect('/?dotloop_error=unknown');
    }
  });
}
