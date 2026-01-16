/**
 * Dotloop Multi-Account Authentication Management
 * 
 * Handles OAuth flow, token storage, and account switching using localStorage.
 * Supports multiple Dotloop accounts per user.
 */

export interface DotloopAccount {
  id: string; // Unique identifier for this account
  email: string;
  firstName: string;
  lastName: string;
  profileId: string; // Dotloop profile ID
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // Token expiration timestamp
  connectedAt: number; // When the account was connected
}

const STORAGE_KEY = 'dotloop_accounts';
const ACTIVE_ACCOUNT_KEY = 'dotloop_active_account_id';

/**
 * Safe localStorage wrapper to handle errors gracefully
 */
const storage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }
      return window.localStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
    }
  },
};

/**
 * Get all connected Dotloop accounts
 */
export function getAllAccounts(): DotloopAccount[] {
  const data = storage.getItem(STORAGE_KEY);
  if (!data) return [];
  
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing accounts from localStorage:', error);
    return [];
  }
}

/**
 * Get the currently active account
 */
export function getActiveAccount(): DotloopAccount | null {
  const activeId = storage.getItem(ACTIVE_ACCOUNT_KEY);
  if (!activeId) return null;
  
  const accounts = getAllAccounts();
  return accounts.find(acc => acc.id === activeId) || null;
}

/**
 * Store a new Dotloop account
 */
export function storeAccount(account: DotloopAccount): void {
  const accounts = getAllAccounts();
  
  // Check if account already exists (by email or profileId)
  const existingIndex = accounts.findIndex(
    acc => acc.email === account.email || acc.profileId === account.profileId
  );
  
  if (existingIndex >= 0) {
    // Update existing account
    accounts[existingIndex] = account;
  } else {
    // Add new account
    accounts.push(account);
  }
  
  storage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  
  // Set as active account
  setActiveAccount(account.id);
}

/**
 * Set the active account by ID
 */
export function setActiveAccount(accountId: string): void {
  storage.setItem(ACTIVE_ACCOUNT_KEY, accountId);
}

/**
 * Remove an account by ID
 */
export function removeAccount(accountId: string): void {
  const accounts = getAllAccounts();
  const filtered = accounts.filter(acc => acc.id !== accountId);
  
  storage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  
  // If we removed the active account, clear it or set to first available
  const activeId = storage.getItem(ACTIVE_ACCOUNT_KEY);
  if (activeId === accountId) {
    if (filtered.length > 0) {
      setActiveAccount(filtered[0].id);
    } else {
      storage.removeItem(ACTIVE_ACCOUNT_KEY);
    }
  }
}

/**
 * Clear all accounts (logout)
 */
export function clearAllAccounts(): void {
  storage.removeItem(STORAGE_KEY);
  storage.removeItem(ACTIVE_ACCOUNT_KEY);
}

/**
 * Check if any accounts are connected
 */
export function hasAccounts(): boolean {
  return getAllAccounts().length > 0;
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(): string {
  const clientId = import.meta.env.VITE_DOTLOOP_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_DOTLOOP_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    console.error('Missing Dotloop OAuth configuration');
    return '#';
  }
  
  // Use backend endpoint to initiate OAuth flow
  return `/api/dotloop/authorize`;
}

/**
 * Handle OAuth callback - extract account info from URL parameters
 */
export function handleOAuthCallback(): DotloopAccount | null {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  
  // Check if this is a Dotloop OAuth callback
  const dotloopConnected = params.get('dotloop_connected');
  if (dotloopConnected !== 'true') return null;
  
  // Extract account info from URL parameters
  const accessToken = params.get('access_token');
  const email = params.get('email');
  const firstName = params.get('first_name');
  const lastName = params.get('last_name');
  const profileId = params.get('profile_id');
  const refreshToken = params.get('refresh_token');
  
  if (!accessToken || !email || !profileId) {
    console.error('Missing required OAuth callback parameters');
    return null;
  }
  
  // Create account object
  const account: DotloopAccount = {
    id: profileId, // Use profileId as unique identifier
    email,
    firstName: firstName || '',
    lastName: lastName || '',
    profileId,
    accessToken,
    refreshToken: refreshToken || undefined,
    connectedAt: Date.now(),
  };
  
  // Store the account
  storeAccount(account);
  
  // Clean up URL parameters
  window.history.replaceState({}, '', window.location.pathname);
  
  return account;
}

/**
 * Revoke access token on the backend
 */
export async function revokeToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch('/api/dotloop/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: accessToken }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error revoking token:', error);
    return false;
  }
}
