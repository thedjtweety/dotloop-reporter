/**
 * Dotloop API Client
 * 
 * Handles all interactions with the Dotloop REST API
 * Documentation: https://dotloop.github.io/public-api/
 */

import { getDb } from '../db';
import { oauthTokens } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { tokenEncryption } from './token-encryption';

const DOTLOOP_API_BASE = 'https://api-gateway.dotloop.com/public/v2';

/**
 * Dotloop Profile (Account)
 */
export interface DotloopProfile {
  id: number;
  name: string;
  email: string;
  type: 'BROKERAGE' | 'TEAM' | 'AGENT';
}

/**
 * Dotloop Loop (Transaction)
 */
export interface DotloopLoop {
  id: number;
  name: string;
  status: string;
  transactionType: string;
  streetAddress: string;
  city: string;
  zipCode: string;
  state: string;
  country: string;
  mlsNumber: string | null;
  totalContractAmount: number;
  created: string;
  updated: string;
}

/**
 * Dotloop Participant
 */
export interface DotloopParticipant {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

/**
 * Get access token for a user
 */
async function getAccessToken(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const token = await (db as any).query.oauthTokens.findFirst({
    where: and(
      eq(oauthTokens.userId, userId),
      eq(oauthTokens.provider, 'dotloop')
    ),
  });

  if (!token) {
    throw new Error('No Dotloop access token found for user');
  }

  // Decrypt the access token
  return tokenEncryption.decrypt(token.encryptedAccessToken);
}

/**
 * Make authenticated request to Dotloop API
 */
async function dotloopRequest<T>(
  userId: number,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = await getAccessToken(userId);
  
  const url = `${DOTLOOP_API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Dotloop API] Error ${response.status}:`, errorText);
    throw new Error(`Dotloop API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get user's Dotloop profiles (accounts)
 */
export async function getProfiles(userId: number): Promise<DotloopProfile[]> {
  const response = await dotloopRequest<{ data: DotloopProfile[] }>(
    userId,
    '/profile'
  );
  return response.data;
}

/**
 * Get loops (transactions) for a profile
 */
export async function getLoops(
  userId: number,
  profileId: number,
  options: {
    batchNumber?: number;
    batchSize?: number;
  } = {}
): Promise<DotloopLoop[]> {
  const { batchNumber = 1, batchSize = 50 } = options;
  
  const params = new URLSearchParams({
    batch_number: batchNumber.toString(),
    batch_size: batchSize.toString(),
  });

  const response = await dotloopRequest<{ data: DotloopLoop[] }>(
    userId,
    `/profile/${profileId}/loop?${params}`
  );
  
  return response.data;
}

/**
 * Get all loops across all profiles
 */
export async function getAllLoops(userId: number): Promise<{
  profileId: number;
  profileName: string;
  loops: DotloopLoop[];
}[]> {
  const profiles = await getProfiles(userId);
  
  const results = await Promise.all(
    profiles.map(async (profile) => {
      try {
        const loops = await getLoops(userId, profile.id);
        return {
          profileId: profile.id,
          profileName: profile.name,
          loops,
        };
      } catch (error) {
        console.error(`[Dotloop API] Failed to fetch loops for profile ${profile.id}:`, error);
        return {
          profileId: profile.id,
          profileName: profile.name,
          loops: [],
        };
      }
    })
  );

  return results;
}

/**
 * Get loop details
 */
export async function getLoopDetails(
  userId: number,
  profileId: number,
  loopId: number
): Promise<DotloopLoop> {
  const response = await dotloopRequest<{ data: DotloopLoop }>(
    userId,
    `/profile/${profileId}/loop/${loopId}`
  );
  return response.data;
}

/**
 * Get loop participants
 */
export async function getLoopParticipants(
  userId: number,
  profileId: number,
  loopId: number
): Promise<DotloopParticipant[]> {
  const response = await dotloopRequest<{ data: DotloopParticipant[] }>(
    userId,
    `/profile/${profileId}/loop/${loopId}/participant`
  );
  return response.data;
}
