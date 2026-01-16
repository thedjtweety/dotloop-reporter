import { describe, it, expect, beforeAll } from 'vitest';
import { dotloopOAuthRouter } from './dotloopOAuthRouter';

describe('Dotloop OAuth Configuration', () => {
  beforeAll(() => {
    // Verify environment variables are set
    if (!process.env.DOTLOOP_CLIENT_ID) {
      throw new Error('DOTLOOP_CLIENT_ID not set');
    }
    if (!process.env.DOTLOOP_CLIENT_SECRET) {
      throw new Error('DOTLOOP_CLIENT_SECRET not set');
    }
    if (!process.env.DOTLOOP_REDIRECT_URI) {
      throw new Error('DOTLOOP_REDIRECT_URI not set');
    }
  });

  it('should have valid Dotloop credentials configured', () => {
    expect(process.env.DOTLOOP_CLIENT_ID).toBeDefined();
    expect(process.env.DOTLOOP_CLIENT_ID).not.toBe('');
    expect(process.env.DOTLOOP_CLIENT_SECRET).toBeDefined();
    expect(process.env.DOTLOOP_CLIENT_SECRET).not.toBe('');
    expect(process.env.DOTLOOP_REDIRECT_URI).toBeDefined();
    expect(process.env.DOTLOOP_REDIRECT_URI).not.toBe('');
  });

  it('should have properly formatted redirect URI', () => {
    const redirectUri = process.env.DOTLOOP_REDIRECT_URI!;
    
    // Should be a valid URL
    expect(() => new URL(redirectUri)).not.toThrow();
    
    // Should use HTTPS
    expect(redirectUri).toMatch(/^https:\/\//);
    
    // Should end with /api/dotloop/callback
    expect(redirectUri).toMatch(/\/api\/dotloop\/callback$/);
  });

  it('should generate valid authorization URL', async () => {
    // Create a mock context with user
    const mockCtx = {
      user: {
        id: 1,
        openId: 'test-user',
        name: 'Test User',
        role: 'user' as const,
      },
    };

    const caller = dotloopOAuthRouter.createCaller(mockCtx as any);
    
    const result = await caller.getAuthorizationUrl({ state: 'test-state' });

    // Should return URL and state
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('state');
    expect(result.state).toBe('test-state');

    // URL should be properly formatted
    const url = new URL(result.url);
    expect(url.hostname).toBe('auth.dotloop.com');
    expect(url.pathname).toBe('/oauth/authorize');
    
    // Should have required query parameters
    const params = url.searchParams;
    expect(params.get('response_type')).toBe('code');
    expect(params.get('client_id')).toBe(process.env.DOTLOOP_CLIENT_ID);
    expect(params.get('redirect_uri')).toBe(process.env.DOTLOOP_REDIRECT_URI);
    expect(params.get('state')).toBe('test-state');
    expect(params.get('redirect_on_deny')).toBe('true');
  });

  it('should have client ID in expected format', () => {
    const clientId = process.env.DOTLOOP_CLIENT_ID!;
    
    // Dotloop client IDs are typically alphanumeric strings
    expect(clientId).toMatch(/^[a-zA-Z0-9_-]+$/);
    expect(clientId.length).toBeGreaterThan(10);
  });

  it('should have client secret in expected format', () => {
    const clientSecret = process.env.DOTLOOP_CLIENT_SECRET!;
    
    // Client secrets should be sufficiently long
    expect(clientSecret.length).toBeGreaterThan(20);
  });
});
