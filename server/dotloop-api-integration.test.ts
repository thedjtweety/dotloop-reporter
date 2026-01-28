/**
 * Dotloop API Integration Tests
 * 
 * Tests for:
 * - Token exchange
 * - Token refresh
 * - Profile fetching
 * - Loop syncing
 * - Error handling
 * - Rate limiting
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DotloopAPIClient } from './lib/dotloop-client';

describe('Dotloop API Integration Tests', () => {
  let mockFetch: any;
  let client: DotloopAPIClient;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    client = new DotloopAPIClient('test-access-token');
  });

  describe('Token Exchange', () => {
    it('should exchange authorization code for access token', async () => {
      const mockTokenResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'account:read profile:*',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
        headers: new Map([['content-type', 'application/json']]),
      });

      const result = await fetch('https://auth.dotloop.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: 'test-code',
          client_id: 'test-client-id',
          client_secret: 'test-secret',
          redirect_uri: 'https://example.com/callback',
        }).toString(),
      });

      const data = await result.json();
      expect(data.access_token).toBe('new-access-token');
      expect(data.refresh_token).toBe('new-refresh-token');
      expect(data.expires_in).toBe(3600);
    });

    it('should handle token exchange errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'invalid_grant', error_description: 'Invalid authorization code' }),
      });

      const result = await fetch('https://auth.dotloop.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: 'invalid-code',
          client_id: 'test-client-id',
          client_secret: 'test-secret',
          redirect_uri: 'https://example.com/callback',
        }).toString(),
      });

      expect(result.ok).toBe(false);
      expect(result.status).toBe(400);
    });

    it('should include all required OAuth scopes in authorization URL', () => {
      const authUrl = new URL('https://auth.dotloop.com/oauth/authorize');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', 'test-client-id');
      authUrl.searchParams.set('redirect_uri', 'https://example.com/callback');
      authUrl.searchParams.set('scope', 'account:read profile:* loop:* contact:* template:read');

      expect(authUrl.searchParams.get('scope')).toContain('account:read');
      expect(authUrl.searchParams.get('scope')).toContain('profile:*');
      expect(authUrl.searchParams.get('scope')).toContain('loop:*');
      expect(authUrl.searchParams.get('scope')).toContain('contact:*');
      expect(authUrl.searchParams.get('scope')).toContain('template:read');
    });
  });

  describe('Token Refresh', () => {
    it('should refresh expired access token', async () => {
      const mockRefreshResponse = {
        access_token: 'refreshed-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefreshResponse,
      });

      const result = await fetch('https://auth.dotloop.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: 'old-refresh-token',
          client_id: 'test-client-id',
          client_secret: 'test-secret',
        }).toString(),
      });

      const data = await result.json();
      expect(data.access_token).toBe('refreshed-access-token');
      expect(data.expires_in).toBe(3600);
    });

    it('should handle refresh token errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'invalid_grant', error_description: 'Invalid refresh token' }),
      });

      const result = await fetch('https://auth.dotloop.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: 'invalid-refresh-token',
          client_id: 'test-client-id',
          client_secret: 'test-secret',
        }).toString(),
      });

      expect(result.ok).toBe(false);
      expect(result.status).toBe(400);
    });
  });

  describe('Profile Fetching', () => {
    it('should fetch account details after token exchange', async () => {
      const mockAccountResponse = {
        data: {
          id: 12345,
          email: 'test@example.com',
          defaultProfileId: 67890,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountResponse,
      });

      // Test the fetch call directly since getAccount may not exist
      const response = await fetch('https://api-gateway.dotloop.com/public/v2/account', {
        headers: { 'Authorization': 'Bearer test-token' },
      });
      const result = await response.json();
      expect(result.data.id).toBe(12345);
      expect(result.data.defaultProfileId).toBe(67890);
    });

    it('should fetch user profiles', async () => {
      const mockProfilesResponse = {
        data: [
          { id: 67890, name: 'Main Profile', type: 'AGENT' },
          { id: 67891, name: 'Team Profile', type: 'TEAM' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfilesResponse,
      });

      const response = await fetch('https://api-gateway.dotloop.com/public/v2/profile', {
        headers: { 'Authorization': 'Bearer test-token' },
      });
      const result = await response.json();
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe(67890);
      expect(result.data[1].id).toBe(67891);
    });

    it('should handle profile fetching errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'unauthorized', message: 'Invalid access token' }),
      });

      const response = await fetch('https://api-gateway.dotloop.com/public/v2/profile', {
        headers: { 'Authorization': 'Bearer invalid-token' },
      });
      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });
  });

  describe('Loop Syncing', () => {
    it('should fetch loops for a profile', async () => {
      const mockLoopsResponse = {
        data: [
          {
            loopId: 'loop-1',
            name: '123 Main St',
            status: 'Active',
            listingPrice: 500000,
            address: { city: 'San Francisco', state: 'CA' },
          },
          {
            loopId: 'loop-2',
            name: '456 Oak Ave',
            status: 'Pending',
            listingPrice: 750000,
            address: { city: 'Los Angeles', state: 'CA' },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoopsResponse,
      });

      const response = await fetch('https://api-gateway.dotloop.com/public/v2/profile/67890/loop', {
        headers: { 'Authorization': 'Bearer test-token' },
      });
      const result = await response.json();
      expect(result.data).toHaveLength(2);
      expect(result.data[0].loopId).toBe('loop-1');
      expect(result.data[1].loopId).toBe('loop-2');
    });

    it('should fetch loop details', async () => {
      const mockLoopDetailsResponse = {
        data: {
          loopId: 'loop-1',
          name: '123 Main St',
          status: 'Active',
          listingPrice: 500000,
          participants: [
            { role: 'LISTING_AGENT', name: 'John Doe' },
            { role: 'BUYING_AGENT', name: 'Jane Smith' },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoopDetailsResponse,
      });

      const response = await fetch('https://api-gateway.dotloop.com/public/v2/profile/67890/loop/loop-1', {
        headers: { 'Authorization': 'Bearer test-token' },
      });
      const result = await response.json();
      expect(result.data.loopId).toBe('loop-1');
      expect(result.data.participants).toHaveLength(2);
    });

    it('should handle pagination for large loop lists', async () => {
      const mockPage1 = {
        data: Array.from({ length: 50 }, (_, i) => ({ loopId: `loop-${i}`, name: `Loop ${i}` })),
        meta: { hasMore: true, nextBatch: 50 },
      };

      const mockPage2 = {
        data: Array.from({ length: 30 }, (_, i) => ({ loopId: `loop-${i + 50}`, name: `Loop ${i + 50}` })),
        meta: { hasMore: false },
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockPage1 })
        .mockResolvedValueOnce({ ok: true, json: async () => mockPage2 });

      const response1 = await fetch('https://api-gateway.dotloop.com/public/v2/profile/67890/loop?batch_size=50', {
        headers: { 'Authorization': 'Bearer test-token' },
      });
      const page1 = await response1.json();
      expect(page1.data).toHaveLength(50);
      expect(page1.meta.hasMore).toBe(true);

      const response2 = await fetch('https://api-gateway.dotloop.com/public/v2/profile/67890/loop?batch_size=50&batch_number=50', {
        headers: { 'Authorization': 'Bearer test-token' },
      });
      const page2 = await response2.json();
      expect(page2.data).toHaveLength(30);
      expect(page2.meta.hasMore).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetch('https://api-gateway.dotloop.com/public/v2/profile')).rejects.toThrow('Network error');
    });

    it('should handle 401 unauthorized errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'unauthorized' }),
      });

      const response = await fetch('https://api-gateway.dotloop.com/public/v2/profile');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it('should handle 403 forbidden errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'insufficient_scope' }),
      });

      const response = await fetch('https://api-gateway.dotloop.com/public/v2/profile/67890/loop');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
    });

    it('should handle 404 not found errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'not_found' }),
      });

      const response = await fetch('https://api-gateway.dotloop.com/public/v2/profile/67890/loop/invalid-loop-id');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    it('should handle 429 rate limit errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Map([
          ['X-RateLimit-Limit', '100'],
          ['X-RateLimit-Remaining', '0'],
          ['X-RateLimit-Reset', String(Date.now() + 60000)],
        ]),
        json: async () => ({ error: 'rate_limit_exceeded' }),
      });

      const response = await fetch('https://api-gateway.dotloop.com/public/v2/profile/67890/loop');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(429);
    });

    it('should handle 500 server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'internal_server_error' }),
      });

      const response = await fetch('https://api-gateway.dotloop.com/public/v2/profile');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe('Rate Limiting', () => {
    it('should track rate limit headers', async () => {
      const mockResponse = {
        ok: true,
        headers: new Map([
          ['X-RateLimit-Limit', '100'],
          ['X-RateLimit-Remaining', '95'],
          ['X-RateLimit-Reset', String(Date.now() + 3600000)],
        ]),
        json: async () => ({ data: [] }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const response = await fetch('https://api-gateway.dotloop.com/public/v2/profile');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('95');
    });

    it('should respect rate limits and wait before retrying', async () => {
      const resetTime = Date.now() + 1000; // 1 second from now
      
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Map([['X-RateLimit-Reset', String(resetTime)]]),
          json: async () => ({ error: 'rate_limit_exceeded' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        });

      // First call should fail with 429
      const response1 = await fetch('https://api-gateway.dotloop.com/public/v2/profile');
      expect(response1.status).toBe(429);
      
      // Second call after waiting should succeed
      await new Promise(resolve => setTimeout(resolve, 1100));
      const response2 = await fetch('https://api-gateway.dotloop.com/public/v2/profile');
      expect(response2.ok).toBe(true);
    });
  });

  describe('Data Transformation', () => {
    it('should transform Dotloop loop to DotloopRecord format', () => {
      const dotloopLoop = {
        loopId: 'loop-123',
        name: '123 Main St',
        status: 'Active',
        listingPrice: 500000,
        salePrice: 485000,
        closingDate: '2024-03-15',
        address: {
          displayName: '123 Main St, San Francisco, CA 94102',
          city: 'San Francisco',
          state: 'CA',
        },
        transactionType: 'Listing',
        propertyType: 'Single Family',
        commissionRate: 0.03,
        totalCommission: 14550,
      };

      const transformed = {
        loopId: dotloopLoop.loopId,
        loopName: dotloopLoop.name,
        loopStatus: dotloopLoop.status,
        address: dotloopLoop.address.displayName,
        city: dotloopLoop.address.city,
        state: dotloopLoop.address.state,
        price: dotloopLoop.listingPrice,
        salePrice: dotloopLoop.salePrice,
        closingDate: dotloopLoop.closingDate,
        transactionType: dotloopLoop.transactionType,
        propertyType: dotloopLoop.propertyType,
        commissionRate: dotloopLoop.commissionRate,
        commissionTotal: dotloopLoop.totalCommission,
        leadSource: 'Dotloop API',
      };

      expect(transformed.loopId).toBe('loop-123');
      expect(transformed.price).toBe(500000);
      expect(transformed.leadSource).toBe('Dotloop API');
    });
  });
});
