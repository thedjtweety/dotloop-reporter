/**
 * Mapping Cache Service
 * Stores and retrieves column mappings by format signature
 */

export interface MappingProfile {
  signature: string;
  mappings: Record<string, string | null>;
  createdAt: number;
  lastUsed: number;
  count: number; // Number of times this mapping was used
}

const CACHE_KEY = 'csv_mapping_cache';
const MAX_PROFILES = 20;

/**
 * Get all cached mapping profiles
 */
export function getCachedProfiles(): MappingProfile[] {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Error reading mapping cache:', error);
    return [];
  }
}

/**
 * Get a mapping profile by format signature
 */
export function getMappingBySignature(signature: string): MappingProfile | null {
  const profiles = getCachedProfiles();
  return profiles.find(p => p.signature === signature) || null;
}

/**
 * Save or update a mapping profile
 */
export function saveMappingProfile(
  signature: string,
  mappings: Record<string, string | null>
): void {
  try {
    let profiles = getCachedProfiles();

    // Check if profile already exists
    const existingIndex = profiles.findIndex(p => p.signature === signature);

    if (existingIndex >= 0) {
      // Update existing profile
      profiles[existingIndex] = {
        ...profiles[existingIndex],
        mappings,
        lastUsed: Date.now(),
        count: profiles[existingIndex].count + 1,
      };
    } else {
      // Create new profile
      const newProfile: MappingProfile = {
        signature,
        mappings,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        count: 1,
      };

      profiles.push(newProfile);

      // Keep only the most recent MAX_PROFILES
      if (profiles.length > MAX_PROFILES) {
        profiles = profiles
          .sort((a, b) => b.lastUsed - a.lastUsed)
          .slice(0, MAX_PROFILES);
      }
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error('Error saving mapping profile:', error);
  }
}

/**
 * Delete a mapping profile
 */
export function deleteMappingProfile(signature: string): void {
  try {
    const profiles = getCachedProfiles();
    const filtered = profiles.filter(p => p.signature !== signature);
    localStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting mapping profile:', error);
  }
}

/**
 * Clear all cached profiles
 */
export function clearMappingCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing mapping cache:', error);
  }
}

/**
 * Get statistics about cached profiles
 */
export function getCacheStats(): {
  totalProfiles: number;
  oldestProfile: number | null;
  newestProfile: number | null;
  mostUsedProfile: MappingProfile | null;
} {
  const profiles = getCachedProfiles();

  if (profiles.length === 0) {
    return {
      totalProfiles: 0,
      oldestProfile: null,
      newestProfile: null,
      mostUsedProfile: null,
    };
  }

  const sortedByDate = [...profiles].sort((a, b) => a.createdAt - b.createdAt);
  const sortedByUsage = [...profiles].sort((a, b) => b.count - a.count);

  return {
    totalProfiles: profiles.length,
    oldestProfile: sortedByDate[0].createdAt,
    newestProfile: sortedByDate[sortedByDate.length - 1].createdAt,
    mostUsedProfile: sortedByUsage[0],
  };
}
