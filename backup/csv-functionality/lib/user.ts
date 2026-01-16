/**
 * User Profile Module
 * 
 * Provides utilities for accessing and managing user context throughout the application.
 * Integrates with the authentication system to provide user information and preferences.
 */

import { useAuth } from '@/_core/hooks/useAuth';

/**
 * User profile interface
 */
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role?: 'user' | 'admin';
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Hook to access current user profile and authentication state
 * 
 * @returns User profile, loading state, error, and authentication status
 */
export function useUser() {
  const { user, loading, error, isAuthenticated } = useAuth();

  return {
    user: user as UserProfile | null,
    isLoading: loading,
    error,
    isAuthenticated,
  };
}

/**
 * Hook to check if current user is an admin
 * 
 * @returns True if user is authenticated and has admin role
 */
export function useIsAdmin(): boolean {
  const { user } = useUser();
  return (user?.role === 'admin') || false;
}

/**
 * Hook to check if user has specific role
 * 
 * @param role - Role to check for
 * @returns True if user has the specified role
 */
export function useHasRole(role: 'user' | 'admin'): boolean {
  const { user } = useUser();
  return (user?.role === role) || false;
}

/**
 * Get user initials for avatar display
 * 
 * @param user - User profile
 * @returns Two-letter initials (e.g., "JD" for John Doe)
 */
export function getUserInitials(user: UserProfile | null): string {
  if (!user?.name) return 'U';
  
  const parts = user.name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  
  return user.name.substring(0, 2).toUpperCase();
}

/**
 * Format user display name
 * 
 * @param user - User profile
 * @returns Formatted name or email fallback
 */
export function formatUserName(user: UserProfile | null): string {
  return user?.name || user?.email || 'Unknown User';
}
