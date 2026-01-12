/**
 * Dotloop OAuth Router
 * 
 * Handles OAuth 2.0 flow for Dotloop API integration:
 * - Authorization redirect
 * - Callback handling
 * - Token exchange and storage
 * - Token refresh
 * - Token revocation
 */

import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import { getDb } from './db';
import { oauthTokens, tokenAuditLogs } from '../drizzle/schema';
import { tokenEncryption } from './lib/token-encryption';
import { getTenantIdFromUser } from './lib/tenant-context';
import { eq, and } from 'drizzle-orm';

const DOTLOOP_AUTH_URL = 'https://auth.dotloop.com/oauth/authorize';
const DOTLOOP_TOKEN_URL = 'https://auth.dotloop.com/oauth/token';
const DOTLOOP_REVOKE_URL = 'https://auth.dotloop.com/oauth/token/revoke';

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
 * Log token audit event
 */
async function logTokenAudit(params: {
  tenantId: number;
  userId: number;
  tokenId?: number;
  action: 'token_created' | 'token_refreshed' | 'token_used' | 'token_revoked' | 'token_decryption_failed' | 'suspicious_access' | 'rate_limit_exceeded' | 'security_alert';
  status: 'success' | 'failure' | 'warning';
  errorMessage?: string;
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(tokenAuditLogs).values({
      tenantId: params.tenantId,
      userId: params.userId,
      tokenId: params.tokenId,
      action: params.action,
      status: params.status,
      errorMessage: params.errorMessage,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    });
  } catch (error) {
    console.error('[DotloopOAuth] Failed to log token audit:', error);
  }
}

export const dotloopOAuthRouter = router({
  /**
   * Get authorization URL for OAuth flow
   * Returns the URL to redirect the user to for authorization
   */
  getAuthorizationUrl: protectedProcedure
    .input(z.object({
      state: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { clientId, redirectUri } = getDotloopCredentials();
      
      // Generate CSRF state token if not provided
      const state = input.state || tokenEncryption.hashToken(
        `${Date.now()}-${Math.random()}`
      ).substring(0, 32);

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        state,
        redirect_on_deny: 'true',
      });

      return {
        url: `${DOTLOOP_AUTH_URL}?${params.toString()}`,
        state,
      };
    }),

  /**
   * Handle OAuth callback
   * Exchanges authorization code for access/refresh tokens
   */
  handleCallback: protectedProcedure
    .input(z.object({
      code: z.string(),
      state: z.string(),
      ipAddress: z.string(),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const { clientId, clientSecret, redirectUri } = getDotloopCredentials();
      const tenantId = await getTenantIdFromUser(ctx.user.id);

      try {
        // Exchange authorization code for tokens
        const tokenParams = new URLSearchParams({
          grant_type: 'authorization_code',
          code: input.code,
          redirect_uri: redirectUri,
          state: input.state,
        });

        const response = await fetch(`${DOTLOOP_TOKEN_URL}?${tokenParams.toString()}`, {
          method: 'POST',
          headers: {
            'Authorization': createBasicAuthHeader(clientId, clientSecret),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
        }

        const tokenData = await response.json();
        
        // Encrypt tokens before storage
        const encryptedAccessToken = tokenEncryption.encrypt(tokenData.access_token);
        const encryptedRefreshToken = tokenEncryption.encrypt(tokenData.refresh_token);
        const tokenHash = tokenEncryption.hashToken(tokenData.access_token);
        
        // Calculate expiration time
        const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

        // Store tokens in database
        const [result] = await db.insert(oauthTokens).values({
          tenantId,
          userId: ctx.user.id,
          provider: 'dotloop',
          encryptedAccessToken,
          encryptedRefreshToken,
          tokenExpiresAt: expiresAt,
          encryptionKeyVersion: tokenEncryption.getCurrentKeyVersion(),
          tokenHash,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        });

        const tokenId = Number(result.insertId);

        // Log successful token creation
        await logTokenAudit({
          tenantId,
          userId: ctx.user.id,
          tokenId,
          action: 'token_created',
          status: 'success',
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          metadata: {
            scope: tokenData.scope,
            expiresIn: tokenData.expires_in,
          },
        });

        return {
          success: true,
          tokenId,
          expiresAt: expiresAt.toISOString(),
          scope: tokenData.scope,
        };
      } catch (error) {
        // Log failed token creation
        await logTokenAudit({
          tenantId,
          userId: ctx.user.id,
          action: 'token_created',
          status: 'failure',
          errorMessage: error instanceof Error ? error.message : String(error),
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        });

        throw error;
      }
    }),

  /**
   * Refresh access token
   * Called automatically when token expires or manually by user
   */
  refreshToken: protectedProcedure
    .input(z.object({
      ipAddress: z.string(),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const { clientId, clientSecret } = getDotloopCredentials();
      const tenantId = await getTenantIdFromUser(ctx.user.id);

      try {
        // Get existing token
        const [existingToken] = await db
          .select()
          .from(oauthTokens)
          .where(
            and(
              eq(oauthTokens.tenantId, tenantId),
              eq(oauthTokens.userId, ctx.user.id),
              eq(oauthTokens.provider, 'dotloop')
            )
          )
          .limit(1);

        if (!existingToken) {
          throw new Error('No Dotloop token found. Please connect your account first.');
        }

        // Decrypt refresh token
        const refreshToken = tokenEncryption.decrypt(existingToken.encryptedRefreshToken);

        // Request new access token
        const tokenParams = new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        });

        const response = await fetch(`${DOTLOOP_TOKEN_URL}?${tokenParams.toString()}`, {
          method: 'POST',
          headers: {
            'Authorization': createBasicAuthHeader(clientId, clientSecret),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
        }

        const tokenData = await response.json();

        // Encrypt new tokens
        const encryptedAccessToken = tokenEncryption.encrypt(tokenData.access_token);
        const encryptedRefreshToken = tokenEncryption.encrypt(tokenData.refresh_token);
        const tokenHash = tokenEncryption.hashToken(tokenData.access_token);
        const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

        // Update token in database
        await db
          .update(oauthTokens)
          .set({
            encryptedAccessToken,
            encryptedRefreshToken,
            tokenExpiresAt: expiresAt,
            tokenHash,
            lastRefreshedAt: new Date(),
            lastUsedAt: new Date(),
          })
          .where(eq(oauthTokens.id, existingToken.id));

        // Log successful token refresh
        await logTokenAudit({
          tenantId,
          userId: ctx.user.id,
          tokenId: existingToken.id,
          action: 'token_refreshed',
          status: 'success',
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          metadata: {
            scope: tokenData.scope,
            expiresIn: tokenData.expires_in,
          },
        });

        return {
          success: true,
          expiresAt: expiresAt.toISOString(),
          scope: tokenData.scope,
        };
      } catch (error) {
        // Log failed token refresh
        await logTokenAudit({
          tenantId,
          userId: ctx.user.id,
          action: 'token_refreshed',
          status: 'failure',
          errorMessage: error instanceof Error ? error.message : String(error),
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        });

        throw error;
      }
    }),

  /**
   * Revoke Dotloop access
   * Disconnects the user's Dotloop account
   */
  revokeAccess: protectedProcedure
    .input(z.object({
      ipAddress: z.string(),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const { clientId, clientSecret } = getDotloopCredentials();
      const tenantId = await getTenantIdFromUser(ctx.user.id);

      try {
        // Get existing token
        const [existingToken] = await db
          .select()
          .from(oauthTokens)
          .where(
            and(
              eq(oauthTokens.tenantId, tenantId),
              eq(oauthTokens.userId, ctx.user.id),
              eq(oauthTokens.provider, 'dotloop')
            )
          )
          .limit(1);

        if (!existingToken) {
          throw new Error('No Dotloop token found');
        }

        // Decrypt access token
        const accessToken = tokenEncryption.decrypt(existingToken.encryptedAccessToken);

        // Revoke token with Dotloop
        const revokeParams = new URLSearchParams({
          token: accessToken,
        });

        const response = await fetch(`${DOTLOOP_REVOKE_URL}?${revokeParams.toString()}`, {
          method: 'POST',
          headers: {
            'Authorization': createBasicAuthHeader(clientId, clientSecret),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        if (!response.ok) {
          console.warn(`Token revocation failed: ${response.status}`);
          // Continue anyway to delete local token
        }

        // Delete token from database
        await db
          .delete(oauthTokens)
          .where(eq(oauthTokens.id, existingToken.id));

        // Log successful token revocation
        await logTokenAudit({
          tenantId,
          userId: ctx.user.id,
          tokenId: existingToken.id,
          action: 'token_revoked',
          status: 'success',
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        });

        return { success: true };
      } catch (error) {
        // Log failed token revocation
        await logTokenAudit({
          tenantId,
          userId: ctx.user.id,
          action: 'token_revoked',
          status: 'failure',
          errorMessage: error instanceof Error ? error.message : String(error),
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        });

        throw error;
      }
    }),

  /**
   * Get connection status
   * Returns whether the user has a valid Dotloop connection
   */
  getConnectionStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const tenantId = await getTenantIdFromUser(ctx.user.id);

      const [token] = await db
        .select({
          id: oauthTokens.id,
          expiresAt: oauthTokens.tokenExpiresAt,
          lastUsedAt: oauthTokens.lastUsedAt,
          lastRefreshedAt: oauthTokens.lastRefreshedAt,
          createdAt: oauthTokens.createdAt,
        })
        .from(oauthTokens)
        .where(
          and(
            eq(oauthTokens.tenantId, tenantId),
            eq(oauthTokens.userId, ctx.user.id),
            eq(oauthTokens.provider, 'dotloop')
          )
        )
        .limit(1);

      if (!token) {
        return {
          connected: false,
          message: 'Not connected to Dotloop',
        };
      }

      const now = new Date();
      const isExpired = token.expiresAt < now;

      return {
        connected: true,
        tokenId: token.id,
        expiresAt: token.expiresAt.toISOString(),
        isExpired,
        lastUsedAt: token.lastUsedAt?.toISOString(),
        lastRefreshedAt: token.lastRefreshedAt?.toISOString(),
        connectedAt: token.createdAt.toISOString(),
        message: isExpired 
          ? 'Token expired - will be refreshed automatically on next use'
          : 'Connected to Dotloop',
      };
    }),
});
