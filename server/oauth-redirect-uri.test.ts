import { describe, it, expect, beforeEach } from 'vitest';

/**
 * OAuth Redirect URI Configuration Tests
 * 
 * Verifies that DOTLOOP_REDIRECT_URI is properly configured to point to the /oauth/callback route
 * This ensures Dotloop redirects users to the success/error page after OAuth authentication
 */

describe('OAuth Redirect URI Configuration', () => {
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    // Save original environment
    originalEnv = {
      DOTLOOP_REDIRECT_URI: process.env.DOTLOOP_REDIRECT_URI,
      DOTLOOP_CLIENT_ID: process.env.DOTLOOP_CLIENT_ID,
      DOTLOOP_CLIENT_SECRET: process.env.DOTLOOP_CLIENT_SECRET,
    };
  });

  it('should have DOTLOOP_REDIRECT_URI environment variable set', () => {
    const redirectUri = process.env.DOTLOOP_REDIRECT_URI;
    expect(redirectUri).toBeDefined();
    expect(redirectUri).not.toBe('');
  });

  it('should have DOTLOOP_REDIRECT_URI pointing to /oauth/callback route', () => {
    const redirectUri = process.env.DOTLOOP_REDIRECT_URI;
    expect(redirectUri).toContain('/oauth/callback');
  });

  it('should have DOTLOOP_REDIRECT_URI as a valid URL', () => {
    const redirectUri = process.env.DOTLOOP_REDIRECT_URI;
    expect(() => {
      new URL(redirectUri || '');
    }).not.toThrow();
  });

  it('should have DOTLOOP_REDIRECT_URI with https protocol', () => {
    const redirectUri = process.env.DOTLOOP_REDIRECT_URI;
    expect(redirectUri).toMatch(/^https:\/\//);
  });

  it('should have all required OAuth credentials configured', () => {
    const clientId = process.env.DOTLOOP_CLIENT_ID;
    const clientSecret = process.env.DOTLOOP_CLIENT_SECRET;
    const redirectUri = process.env.DOTLOOP_REDIRECT_URI;

    expect(clientId).toBeDefined();
    expect(clientSecret).toBeDefined();
    expect(redirectUri).toBeDefined();

    expect(clientId).not.toBe('');
    expect(clientSecret).not.toBe('');
    expect(redirectUri).not.toBe('');
  });

  it('should construct valid OAuth authorization URL with redirect URI', () => {
    const clientId = process.env.DOTLOOP_CLIENT_ID;
    const redirectUri = process.env.DOTLOOP_REDIRECT_URI;
    const scopes = 'account:read profile:* loop:* contact:* template:read';

    const authUrl = `https://auth.dotloop.com/oauth/authorize?response_type=code&client_id=${encodeURIComponent(clientId || '')}&redirect_uri=${encodeURIComponent(redirectUri || '')}&scope=${encodeURIComponent(scopes)}`;

    // Should be able to parse the URL
    expect(() => {
      new URL(authUrl);
    }).not.toThrow();

    // Should contain all required parameters
    expect(authUrl).toContain('response_type=code');
    expect(authUrl).toContain(`client_id=${encodeURIComponent(clientId || '')}`);
    expect(authUrl).toContain(`redirect_uri=${encodeURIComponent(redirectUri || '')}`);
    expect(authUrl).toContain(`scope=${encodeURIComponent(scopes)}`);
  });

  it('should have redirect URI matching the frontend VITE_DOTLOOP_REDIRECT_URI', () => {
    const backendRedirectUri = process.env.DOTLOOP_REDIRECT_URI;
    const frontendRedirectUri = process.env.VITE_DOTLOOP_REDIRECT_URI;

    // Both should be defined
    expect(backendRedirectUri).toBeDefined();
    expect(frontendRedirectUri).toBeDefined();

    // They should match (same redirect URI used on both sides)
    expect(backendRedirectUri).toBe(frontendRedirectUri);
  });

  it('should have redirect URI pointing to the correct domain', () => {
    const redirectUri = process.env.DOTLOOP_REDIRECT_URI;
    const url = new URL(redirectUri || '');

    // Should not be localhost (should be deployed domain)
    expect(url.hostname).not.toBe('localhost');
    expect(url.hostname).not.toBe('127.0.0.1');

    // Should be a valid domain
    expect(url.hostname).toMatch(/\./);
  });

  it('should have callback route accessible after OAuth redirect', () => {
    const redirectUri = process.env.DOTLOOP_REDIRECT_URI;
    const url = new URL(redirectUri || '');

    // Path should be /oauth/callback
    expect(url.pathname).toBe('/oauth/callback');

    // Should not have query parameters in the base redirect URI
    expect(url.search).toBe('');
  });
});
