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

/**
 * Safe localStorage wrapper to handle edge cases
 */
const storage = {
  getItem(key: string): string | null {
    try {
      if (typeof window === 'undefined') return null;
      if (!window.localStorage) return null;
      return window.localStorage.getItem(key);
    } catch (e) {
      console.error('[Storage] getItem error:', e);
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window === 'undefined') return;
      if (!window.localStorage) return;
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.error('[Storage] setItem error:', e);
    }
  },
  removeItem(key: string): void {
    try {
      if (typeof window === 'undefined') return;
      if (!window.localStorage) return;
      window.localStorage.removeItem(key);
    } catch (e) {
      console.error('[Storage] removeItem error:', e);
    }
  }
};

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
  
  storage.setItem(TOKEN_KEY, accessToken);
  storage.setItem(EXPIRES_AT_KEY, expiresAt.toString());
  
  if (refreshToken) {
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  
  console.log('[Dotloop Auth] Tokens stored in localStorage');
}

/**
 * Store account info in localStorage
 */
export function storeAccount(account: DotloopAccount) {
  storage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  console.log('[Dotloop Auth] Account info stored');
}

/**
 * Get stored account info
 */
export function getStoredAccount(): DotloopAccount | null {
  const accountStr = storage.getItem(ACCOUNT_KEY);
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
  const accessToken = storage.getItem(TOKEN_KEY);
  const expiresAtStr = storage.getItem(EXPIRES_AT_KEY);
  const refreshToken = storage.getItem(REFRESH_TOKEN_KEY) || undefined;
  
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
  storage.removeItem(TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
  storage.removeItem(EXPIRES_AT_KEY);
  storage.removeItem(ACCOUNT_KEY);
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
    
    // Extract and store account info from URL parameters
    const accountId = params.get('account_id');
    const email = params.get('email');
    const firstName = params.get('first_name');
    const lastName = params.get('last_name');
    const defaultProfileId = params.get('default_profile_id');
    
    if (accountId && email) {
      const account: DotloopAccount = {
        id: parseInt(accountId, 10),
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        defaultProfileId: defaultProfileId ? parseInt(defaultProfileId, 10) : 0,
      };
      storeAccount(account);
    }
    
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
  
  const response = await fetch(`/api/dotloop-proxy${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${tokens.accessToken}`,
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
