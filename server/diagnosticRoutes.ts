/**
 * Diagnostic Routes for OAuth Debugging
 * 
 * Temporary endpoints to help diagnose database schema issues
 */

import { Express, Request, Response } from 'express';
import { getDb } from './db';

export function registerDiagnosticRoutes(app: Express) {
  /**
   * Check oauth_tokens table schema
   * GET /api/diagnostic/oauth-schema
   */
  app.get('/api/diagnostic/oauth-schema', async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: 'Database not available' });
      }

      // Get table schema
      const schemaQuery = `
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          COLUMN_DEFAULT,
          COLUMN_KEY,
          EXTRA
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'oauth_tokens'
        ORDER BY ORDINAL_POSITION
      `;

      const schema = await db.execute(schemaQuery);

      // Get indexes
      const indexQuery = `
        SHOW INDEX FROM oauth_tokens
      `;

      const indexes = await db.execute(indexQuery);

      // Count existing tokens
      const countQuery = `SELECT COUNT(*) as count FROM oauth_tokens`;
      const countResult = await db.execute(countQuery);

      res.json({
        success: true,
        schema: schema,
        indexes: indexes,
        tokenCount: countResult,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Diagnostic] Schema check error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });

  /**
   * Test token insertion with dummy data
   * GET /api/diagnostic/test-insert
   */
  app.get('/api/diagnostic/test-insert', async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: 'Database not available' });
      }

      const { oauthTokens } = await import('../drizzle/schema');

      // Try to insert a test token
      const testData = {
        tenantId: 999,
        userId: 999,
        provider: 'test',
        encryptedAccessToken: 'test_token_' + Date.now(),
        encryptedRefreshToken: 'test_refresh_' + Date.now(),
        tokenHash: 'test_hash_' + Date.now(),
        tokenExpiresAt: new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' '),
        ipAddress: '127.0.0.1',
        userAgent: 'diagnostic-test',
      };

      console.log('[Diagnostic] Attempting test insert with data:', testData);

      const result = await db.insert(oauthTokens).values(testData);

      res.json({
        success: true,
        message: 'Test insert successful',
        testData,
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Diagnostic] Test insert error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorKeys: error && typeof error === 'object' ? Object.keys(error) : []
      });
    }
  });

  /**
   * Clean up test tokens
   * GET /api/diagnostic/cleanup-test
   */
  app.get('/api/diagnostic/cleanup-test', async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: 'Database not available' });
      }

      const deleteQuery = `DELETE FROM oauth_tokens WHERE provider = 'test' OR tenantId = 999`;
      const result = await db.execute(deleteQuery);

      res.json({
        success: true,
        message: 'Test tokens cleaned up',
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Diagnostic] Cleanup error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}
