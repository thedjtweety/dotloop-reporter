/**
 * Dotloop User Manager
 * 
 * Handles user creation and lookup for Dotloop-authenticated users
 */

import { getDb } from './db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import type { DotloopProfile } from './dotloopApiClient';

export interface DotloopUser {
  id: number;
  dotloopUserId: string;
  name: string | null;
  email: string | null;
  role: 'user' | 'admin';
  tenantId: number;
}

/**
 * Find or create a user based on their Dotloop profile
 * @param profile - Dotloop profile from API
 * @returns User record from database
 */
export async function findOrCreateDotloopUser(profile: DotloopProfile): Promise<DotloopUser> {
  const dotloopUserId = profile.id.toString();
  
  // Try to find existing user by Dotloop ID
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.dotloopUserId, dotloopUserId))
    .limit(1);

  if (existingUsers.length > 0) {
    // Update last signed in timestamp
    await db
      .update(users)
      .set({ lastSignedIn: new Date().toISOString() })
      .where(eq(users.id, existingUsers[0].id));
    
    return existingUsers[0] as DotloopUser;
  }

  // Create new user
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  
  const result = await db.insert(users).values({
    tenantId: 1, // Default tenant for now (can be customized later)
    dotloopUserId,
    name: fullName,
    email: profile.email,
    loginMethod: 'dotloop',
    role: 'user',
    status: 'active',
    lastSignedIn: new Date().toISOString(),
  });

  // Fetch the newly created user
  const newUsers = await db
    .select()
    .from(users)
    .where(eq(users.dotloopUserId, dotloopUserId))
    .limit(1);

  if (newUsers.length === 0) {
    throw new Error('Failed to create user');
  }

  return newUsers[0] as DotloopUser;
}

/**
 * Find a user by their Dotloop user ID
 * @param dotloopUserId - Dotloop user ID
 * @returns User record or null if not found
 */
export async function findUserByDotloopId(dotloopUserId: string): Promise<DotloopUser | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(users)
    .where(eq(users.dotloopUserId, dotloopUserId))
    .limit(1);

  return result.length > 0 ? (result[0] as DotloopUser) : null;
}

/**
 * Find a user by their database ID
 * @param userId - Database user ID
 * @returns User record or null if not found
 */
export async function findUserById(userId: number): Promise<DotloopUser | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result.length > 0 ? (result[0] as DotloopUser) : null;
}
