/**
 * Multi-Account Dotloop OAuth Management
 * 
 * Supports multiple Dotloop accounts with account switching
 * Stores all accounts in localStorage with active account tracking
 */

const ACCOUNTS_KEY = 'dotloop_accounts';
const ACTIVE_ACCOUNT_ID_KEY = 'dotloop_active_account_id';

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

export interface DotloopAccount {
  id: string; // Unique ID for this account (using email as ID)
  accountId: number; // Dotloop account ID
  email: string;
  firstName: string;
  lastName: string;
  defaultProfileId: number;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp in milliseconds
  connectedAt: number; // When this account was connected
}

export interface MultiAccountStore {
  accounts: DotloopAccount[];
  activeAccountId: string | null;
}

/**
 * Get all stored accounts
 */
export function getAllAccounts(): DotloopAccount[] {
  const storeStr = storage.getItem(ACCOUNTS_KEY);
  if (!storeStr) return [];
  
  try {
    const accounts: DotloopAccount[] = JSON.parse(storeStr);
    return accounts;
  } catch {
    return [];
  }
}

/**
 * Get active account ID
 */
export function getActiveAccountId(): string | null {
  return storage.getItem(ACTIVE_ACCOUNT_ID_KEY);
}

/**
 * Get active account
 */
export function getActiveAccount(): DotloopAccount | null {
  const activeId = getActiveAccountId();
  if (!activeId) return null;
  
  const accounts = getAllAccounts();
  return accounts.find(acc => acc.id === activeId) || null;
}

/**
 * Set active account
 */
export function setActiveAccount(accountId: string): boolean {
  const accounts = getAllAccounts();
  const account = accounts.find(acc => acc.id === accountId);
  
  if (!account) {
    console.error('[Multi-Auth] Account not found:', accountId);
    return false;
  }
  
  storage.setItem(ACTIVE_ACCOUNT_ID_KEY, accountId);
  console.log('[Multi-Auth] Active account set to:', account.email);
  return true;
}

/**
 * Add or update an account
 */
export function addOrUpdateAccount(accountData: {
  accountId: number;
  email: string;
  firstName: string;
  lastName: string;
  defaultProfileId: number;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}): DotloopAccount {
  const accounts = getAllAccounts();
  const accountId = accountData.email; // Use email as unique ID
  
  const expiresAt = Date.now() + (accountData.expiresIn * 1000);
  
  // Check if account already exists
  const existingIndex = accounts.findIndex(acc => acc.id === accountId);
  
  const account: DotloopAccount = {
    id: accountId,
    accountId: accountData.accountId,
    email: accountData.email,
    firstName: accountData.firstName,
    lastName: accountData.lastName,
    defaultProfileId: accountData.defaultProfileId,
    accessToken: accountData.accessToken,
    refreshToken: accountData.refreshToken,
    expiresAt,
    connectedAt: existingIndex >= 0 ? accounts[existingIndex].connectedAt : Date.now(),
  };
  
  if (existingIndex >= 0) {
    // Update existing account
    accounts[existingIndex] = account;
    console.log('[Multi-Auth] Account updated:', account.email);
  } else {
    // Add new account
    accounts.push(account);
    console.log('[Multi-Auth] Account added:', account.email);
  }
  
  // Save accounts
  storage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  
  // Set as active if it's the only account or if no active account is set
  const activeId = getActiveAccountId();
  if (!activeId || accounts.length === 1) {
    setActiveAccount(accountId);
  }
  
  return account;
}

/**
 * Remove an account
 */
export function removeAccount(accountId: string): boolean {
  const accounts = getAllAccounts();
  const filteredAccounts = accounts.filter(acc => acc.id !== accountId);
  
  if (filteredAccounts.length === accounts.length) {
    console.error('[Multi-Auth] Account not found:', accountId);
    return false;
  }
  
  storage.setItem(ACCOUNTS_KEY, JSON.stringify(filteredAccounts));
  console.log('[Multi-Auth] Account removed:', accountId);
  
  // If removed account was active, switch to first remaining account
  const activeId = getActiveAccountId();
  if (activeId === accountId) {
    if (filteredAccounts.length > 0) {
      setActiveAccount(filteredAccounts[0].id);
    } else {
      storage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
    }
  }
  
  return true;
}

/**
 * Check if active account token is valid
 */
export function isActiveTokenValid(): boolean {
  const account = getActiveAccount();
  if (!account) return false;
  
  // Add 5 minute buffer before actual expiration
  const bufferMs = 5 * 60 * 1000;
  return Date.now() < (account.expiresAt - bufferMs);
}

/**
 * Clear all accounts
 */
export function clearAllAccounts() {
  storage.removeItem(ACCOUNTS_KEY);
  storage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
  console.log('[Multi-Auth] All accounts cleared');
}

/**
 * Make authenticated request to Dotloop API using active account
 */
export async function fetchDotloopAPI(endpoint: string, options: RequestInit = {}) {
  const account = getActiveAccount();
  
  if (!account || !isActiveTokenValid()) {
    throw new Error('No valid Dotloop token available');
  }
  
  const response = await fetch(`/api/dotloop-proxy${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${account.accessToken}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dotloop API error: ${response.status} ${error}`);
  }
  
  return response.json();
}

/**
 * Revoke token for an account (calls Dotloop revoke endpoint)
 */
export async function revokeAccountToken(accountId: string): Promise<boolean> {
  const accounts = getAllAccounts();
  const account = accounts.find(acc => acc.id === accountId);
  
  if (!account) {
    console.error('[Multi-Auth] Account not found for revocation:', accountId);
    return false;
  }
  
  try {
    const response = await fetch('/api/dotloop-proxy/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: account.accessToken,
      }),
    });
    
    if (!response.ok) {
      console.error('[Multi-Auth] Token revocation failed:', response.status);
      return false;
    }
    
    console.log('[Multi-Auth] Token revoked successfully for:', account.email);
    return true;
  } catch (error) {
    console.error('[Multi-Auth] Token revocation error:', error);
    return false;
  }
}

/**
 * Handle OAuth callback and add account
 */
export function handleOAuthCallback(): DotloopAccount | null {
  const params = new URLSearchParams(window.location.search);
  
  const accessToken = params.get('access_token');
  const expiresIn = params.get('expires_in');
  const refreshToken = params.get('refresh_token');
  const accountId = params.get('account_id');
  const email = params.get('email');
  const firstName = params.get('first_name');
  const lastName = params.get('last_name');
  const defaultProfileId = params.get('default_profile_id');
  const error = params.get('error');
  
  if (error) {
    console.error('[Multi-Auth] OAuth error:', error);
    const details = params.get('details');
    if (details) {
      console.error('[Multi-Auth] Error details:', details);
    }
    return null;
  }
  
  if (accessToken && expiresIn && accountId && email && firstName && lastName && defaultProfileId) {
    const account = addOrUpdateAccount({
      accountId: parseInt(accountId, 10),
      email,
      firstName,
      lastName,
      defaultProfileId: parseInt(defaultProfileId, 10),
      accessToken,
      refreshToken: refreshToken || undefined,
      expiresIn: parseInt(expiresIn, 10),
    });
    
    // Clean URL by removing token parameters
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    
    return account;
  }
  
  return null;
}
