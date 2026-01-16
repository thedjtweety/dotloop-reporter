/**
 * Dotloop API Client
 * 
 * Provides functions to interact with Dotloop API v2
 * Documentation: https://dotloop.github.io/public-api/
 */

import axios from 'axios';

const DOTLOOP_API_BASE = 'https://api-gateway.dotloop.com/public/v2';

export interface DotloopProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
}

export interface DotloopProfileResponse {
  data: DotloopProfile[];
}

/**
 * Fetch the authenticated user's Dotloop profile
 * @param accessToken - Dotloop OAuth access token
 * @returns User profile information
 */
export async function fetchDotloopProfile(accessToken: string): Promise<DotloopProfile> {
  try {
    const response = await axios.get<DotloopProfileResponse>(`${DOTLOOP_API_BASE}/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (!response.data.data || response.data.data.length === 0) {
      throw new Error('No profile data returned from Dotloop API');
    }

    // Return the first profile (primary profile)
    return response.data.data[0];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[DotloopAPI] Profile fetch failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(`Failed to fetch Dotloop profile: ${error.response?.status || error.message}`);
    }
    throw error;
  }
}

/**
 * Validate that an access token is still valid
 * @param accessToken - Dotloop OAuth access token
 * @returns true if token is valid, false otherwise
 */
export async function validateDotloopToken(accessToken: string): Promise<boolean> {
  try {
    await fetchDotloopProfile(accessToken);
    return true;
  } catch (error) {
    return false;
  }
}
