/**
 * Client-side Dotloop OAuth Token Management
 * 
 * Stores and retrieves OAuth tokens from localStorage
 * No server-side sessions or cookies needed
 */

const TOKEN_KEY = 'dotloop_access_token';
const REFRESH_TOKEN_KEY = 'dotloop_refresh_token';
const EXPIRES_AT_KEY = 'dotloop_token_expires_at';
const ACCOUNT_KEY = 'dotloop_account';

export interface DotloopToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

export interface DotloopAccount {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  defaultProfileId: number;
}

/**
 * Store OAuth tokens in localStorage
 */
export function storeTokens(accessToken: string, expiresIn: number, refreshToken?: string) {
  const expiresAt = Date.now() + (expiresIn * 1000);
  
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(EXPIRES_AT_KEY, expiresAt.toString());
  
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  
  console.log('[Dotloop Auth] Tokens stored in localStorage');
}

/**
 * Store account info in localStorage
 */
export function storeAccount(account: DotloopAccount) {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  console.log('[Dotloop Auth] Account info stored');
}

/**
 * Get stored account info
 */
export function getStoredAccount(): DotloopAccount | null {
  const accountStr = localStorage.getItem(ACCOUNT_KEY);
  if (!accountStr) return null;
  
  try {
    return JSON.parse(accountStr);
  } catch {
    return null;
  }
}

/**
 * Get stored tokens from localStorage
 */
export function getStoredTokens(): DotloopToken | null {
  const accessToken = localStorage.getItem(TOKEN_KEY);
  const expiresAtStr = localStorage.getItem(EXPIRES_AT_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || undefined;
  
  if (!accessToken || !expiresAtStr) {
    return null;
  }
  
  return {
    accessToken,
    refreshToken,
    expiresAt: parseInt(expiresAtStr, 10),
  };
}

/**
 * Check if stored token is valid (not expired)
 */
export function isTokenValid(): boolean {
  const tokens = getStoredTokens();
  
  if (!tokens) {
    return false;
  }
  
  // Add 5 minute buffer before actual expiration
  const bufferMs = 5 * 60 * 1000;
  return Date.now() < (tokens.expiresAt - bufferMs);
}

/**
 * Clear all stored tokens and account info
 */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
  localStorage.removeItem(ACCOUNT_KEY);
  console.log('[Dotloop Auth] Auth data cleared from localStorage');
}

/**
 * Extract tokens from URL parameters (after OAuth callback)
 * Returns true if tokens were found and stored
 */
export function handleOAuthCallback(): boolean {
  const params = new URLSearchParams(window.location.search);
  
  const accessToken = params.get('access_token');
  const expiresIn = params.get('expires_in');
  const refreshToken = params.get('refresh_token');
  const error = params.get('error');
  
  if (error) {
    console.error('[Dotloop Auth] OAuth error:', error);
    const details = params.get('details');
    if (details) {
      console.error('[Dotloop Auth] Error details:', details);
    }
    return false;
  }
  
  if (accessToken && expiresIn) {
    storeTokens(accessToken, parseInt(expiresIn, 10), refreshToken || undefined);
    
    // Clean URL by removing token parameters
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    
    return true;
  }
  
  return false;
}

/**
 * Make authenticated request to Dotloop API
 */
export async function fetchDotloopAPI(endpoint: string, options: RequestInit = {}) {
  const tokens = getStoredTokens();
  
  if (!tokens || !isTokenValid()) {
    throw new Error('No valid Dotloop token available');
  }
  
  const response = await fetch(`https://api-gateway.dotloop.com/public/v2${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dotloop API error: ${response.status} ${error}`);
  }
  
  return response.json();
}

/**
 * Fetch and store account details
 */
export async function fetchAndStoreAccount(): Promise<DotloopAccount> {
  const response = await fetchDotloopAPI('/account');
  const account: DotloopAccount = response.data;
  storeAccount(account);
  return account;
}
