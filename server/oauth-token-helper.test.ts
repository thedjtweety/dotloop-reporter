/**
 * OAuth Token Retrieval Helper Tests
 * 
 * Tests for:
 * - Token retrieval with caching
 * - Automatic token refresh
 * - Expiration checking
 * - Retry logic with exponential backoff
 * - Cache management
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getValidOAuthToken,
  invalidateTokenCache,
  clearTokenCache,
  getTokenCacheStats,
} from './lib/oauth-token-helper';

// Mock dependencies
let mockGetDb: any = vi.fn();

vi.mock('./db', () => ({
  getDb: () => mockGetDb(),
}));

vi.mock('./lib/token-encryption', () => ({
  tokenEncryption: {
    encrypt: vi.fn((text: string) => `encrypted_${text}`),
    decrypt: vi.fn((encrypted: string) => encrypted.replace('encrypted_', '')),
    hashToken: vi.fn((token: string) => `hash_${token}`),
  },
}));

describe('OAuth Token Retrieval Helper Tests', () => {
  let mockGetDb: any;
  let mockFetch: any;

  beforeEach(() => {
    // Clear cache before each test
    clearTokenCache();

    // Mock getDb
    mockGetDb = vi.fn();

    // Mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Set environment variables
    process.env.DOTLOOP_CLIENT_ID = 'test-client-id';
    process.env.DOTLOOP_CLIENT_SECRET = 'test-client-secret';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Token Retrieval', () => {
    it('should retrieve and decrypt valid token from database', async () => {
      const mockToken = {
        id: 1,
        userId: 100,
        tenantId: 1,
        provider: 'dotloop',
        encryptedAccessToken: 'encrypted_valid-access-token',
        encryptedRefreshToken: 'encrypted_valid-refresh-token',
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
        dotloopProfileId: 12345,
        dotloopAccountId: 67890,
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockToken]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
      };

      mockGetDb.mockResolvedValue(mockDb);

      const result = await getValidOAuthToken(100, 1);

      expect(result.accessToken).toBe('valid-access-token');
      expect(result.profileId).toBe(12345);
      expect(result.accountId).toBe(67890);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalled(); // Updates lastUsedAt
    });

    it('should throw error if no token found', async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]), // No token found
      };

      mockGetDb.mockResolvedValue(mockDb);

      await expect(getValidOAuthToken(100, 1)).rejects.toThrow(
        'No OAuth token found for user 100 and provider dotloop'
      );
    });

    it('should throw error if database connection fails', async () => {
      mockGetDb.mockResolvedValue(null);

      await expect(getValidOAuthToken(100, 1)).rejects.toThrow(
        'Database connection not available'
      );
    });
  });

  describe('Token Caching', () => {
    it('should cache token after first retrieval', async () => {
      const mockToken = {
        id: 1,
        userId: 100,
        tenantId: 1,
        provider: 'dotloop',
        encryptedAccessToken: 'encrypted_cached-token',
        encryptedRefreshToken: 'encrypted_refresh-token',
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockToken]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
      };

      mockGetDb.mockResolvedValue(mockDb);

      // First call - should hit database
      const result1 = await getValidOAuthToken(100, 1);
      expect(result1.accessToken).toBe('cached-token');
      expect(mockDb.select).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await getValidOAuthToken(100, 1);
      expect(result2.accessToken).toBe('cached-token');
      expect(mockDb.select).toHaveBeenCalledTimes(1); // Still only 1 call

      // Verify cache stats
      const stats = getTokenCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.entries[0].key).toBe('100-1');
    });

    it('should invalidate cache when requested', async () => {
      const mockToken = {
        id: 1,
        userId: 100,
        tenantId: 1,
        provider: 'dotloop',
        encryptedAccessToken: 'encrypted_token',
        encryptedRefreshToken: 'encrypted_refresh',
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockToken]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
      };

      mockGetDb.mockResolvedValue(mockDb);

      // First call - cache token
      await getValidOAuthToken(100, 1);
      expect(getTokenCacheStats().size).toBe(1);

      // Invalidate cache
      invalidateTokenCache(100, 1);
      expect(getTokenCacheStats().size).toBe(0);

      // Next call should hit database again
      await getValidOAuthToken(100, 1);
      expect(mockDb.select).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache entries', async () => {
      const mockToken = {
        id: 1,
        userId: 100,
        tenantId: 1,
        provider: 'dotloop',
        encryptedAccessToken: 'encrypted_token',
        encryptedRefreshToken: 'encrypted_refresh',
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockToken]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
      };

      mockGetDb.mockResolvedValue(mockDb);

      // Cache multiple tokens
      await getValidOAuthToken(100, 1);
      await getValidOAuthToken(101, 1);
      expect(getTokenCacheStats().size).toBe(2);

      // Clear all cache
      clearTokenCache();
      expect(getTokenCacheStats().size).toBe(0);
    });
  });

  describe('Token Refresh', () => {
    it('should automatically refresh expired token', async () => {
      const expiredToken = {
        id: 1,
        userId: 100,
        tenantId: 1,
        provider: 'dotloop',
        encryptedAccessToken: 'encrypted_expired-token',
        encryptedRefreshToken: 'encrypted_refresh-token',
        tokenExpiresAt: new Date(Date.now() - 1000).toISOString(), // Expired 1 second ago
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([expiredToken]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
      };

      mockGetDb.mockResolvedValue(mockDb);

      // Mock successful token refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
        }),
      });

      const result = await getValidOAuthToken(100, 1);

      expect(result.accessToken).toBe('new-access-token');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://auth.dotloop.com/oauth/token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
      expect(mockDb.update).toHaveBeenCalled(); // Token updated in database
    });

    it('should refresh token about to expire (within 5 minutes)', async () => {
      const expiringToken = {
        id: 1,
        userId: 100,
        tenantId: 1,
        provider: 'dotloop',
        encryptedAccessToken: 'encrypted_expiring-token',
        encryptedRefreshToken: 'encrypted_refresh-token',
        tokenExpiresAt: new Date(Date.now() + 4 * 60 * 1000).toISOString(), // Expires in 4 minutes
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([expiringToken]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
      };

      mockGetDb.mockResolvedValue(mockDb);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'refreshed-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
        }),
      });

      const result = await getValidOAuthToken(100, 1);

      expect(result.accessToken).toBe('refreshed-token');
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should retry token refresh on failure with exponential backoff', async () => {
      const expiredToken = {
        id: 1,
        userId: 100,
        tenantId: 1,
        provider: 'dotloop',
        encryptedAccessToken: 'encrypted_expired-token',
        encryptedRefreshToken: 'encrypted_refresh-token',
        tokenExpiresAt: new Date(Date.now() - 1000).toISOString(),
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([expiredToken]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
      };

      mockGetDb.mockResolvedValue(mockDb);

      // First two attempts fail, third succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'server_error' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'server_error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'retry-success-token',
            refresh_token: 'new-refresh-token',
            expires_in: 3600,
          }),
        });

      const result = await getValidOAuthToken(100, 1);

      expect(result.accessToken).toBe('retry-success-token');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries exceeded', async () => {
      const expiredToken = {
        id: 1,
        userId: 100,
        tenantId: 1,
        provider: 'dotloop',
        encryptedAccessToken: 'encrypted_expired-token',
        encryptedRefreshToken: 'encrypted_refresh-token',
        tokenExpiresAt: new Date(Date.now() - 1000).toISOString(),
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([expiredToken]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
      };

      mockGetDb.mockResolvedValue(mockDb);

      // All attempts fail
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'invalid_grant' }),
      });

      await expect(getValidOAuthToken(100, 1)).rejects.toThrow(
        'Failed to refresh token after 3 attempts'
      );
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing OAuth credentials', async () => {
      delete process.env.DOTLOOP_CLIENT_ID;
      delete process.env.DOTLOOP_CLIENT_SECRET;

      const expiredToken = {
        id: 1,
        userId: 100,
        tenantId: 1,
        provider: 'dotloop',
        encryptedAccessToken: 'encrypted_expired-token',
        encryptedRefreshToken: 'encrypted_refresh-token',
        tokenExpiresAt: new Date(Date.now() - 1000).toISOString(),
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([expiredToken]),
      };

      mockGetDb.mockResolvedValue(mockDb);

      await expect(getValidOAuthToken(100, 1)).rejects.toThrow(
        'Dotloop OAuth credentials not configured'
      );
    });

    it('should handle network errors during refresh', async () => {
      const expiredToken = {
        id: 1,
        userId: 100,
        tenantId: 1,
        provider: 'dotloop',
        encryptedAccessToken: 'encrypted_expired-token',
        encryptedRefreshToken: 'encrypted_refresh-token',
        tokenExpiresAt: new Date(Date.now() - 1000).toISOString(),
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([expiredToken]),
      };

      mockGetDb.mockResolvedValue(mockDb);

      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(getValidOAuthToken(100, 1)).rejects.toThrow(
        'Failed to refresh token after 3 attempts'
      );
    });
  });

  describe('Cache Statistics', () => {
    it('should provide accurate cache statistics', async () => {
      const mockToken1 = {
        id: 1,
        userId: 100,
        tenantId: 1,
        provider: 'dotloop',
        encryptedAccessToken: 'encrypted_token1',
        encryptedRefreshToken: 'encrypted_refresh1',
        tokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      };

      const mockToken2 = {
        id: 2,
        userId: 101,
        tenantId: 1,
        provider: 'dotloop',
        encryptedAccessToken: 'encrypted_token2',
        encryptedRefreshToken: 'encrypted_refresh2',
        tokenExpiresAt: new Date(Date.now() + 7200 * 1000).toISOString(),
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn()
          .mockResolvedValueOnce([mockToken1])
          .mockResolvedValueOnce([mockToken2]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
      };

      mockGetDb.mockResolvedValue(mockDb);

      // Cache two tokens
      await getValidOAuthToken(100, 1);
      await getValidOAuthToken(101, 1);

      const stats = getTokenCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.entries).toHaveLength(2);
      expect(stats.entries[0].key).toBe('100-1');
      expect(stats.entries[1].key).toBe('101-1');
      expect(stats.entries[0].expiresAt).toBeDefined();
      expect(stats.entries[0].cachedAt).toBeDefined();
    });
  });
});
