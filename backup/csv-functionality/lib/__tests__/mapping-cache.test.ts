import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getCachedProfiles,
  getMappingBySignature,
  saveMappingProfile,
  deleteMappingProfile,
  clearMappingCache,
  getCacheStats,
} from '../mapping-cache';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Mapping Cache', () => {
  beforeEach(() => {
    clearMappingCache();
  });

  afterEach(() => {
    clearMappingCache();
  });

  describe('Save and Retrieve', () => {
    it('should save a new mapping profile', () => {
      const signature = 'sig1';
      const mappings = { 'Loop Name': 'loopName', 'Address': 'address' };

      saveMappingProfile(signature, mappings);

      const profiles = getCachedProfiles();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].signature).toBe(signature);
      expect(profiles[0].mappings).toEqual(mappings);
    });

    it('should retrieve a mapping by signature', () => {
      const signature = 'sig1';
      const mappings = { 'Loop Name': 'loopName' };

      saveMappingProfile(signature, mappings);
      const retrieved = getMappingBySignature(signature);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.mappings).toEqual(mappings);
    });

    it('should return null for non-existent signature', () => {
      const retrieved = getMappingBySignature('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('Update Existing Profile', () => {
    it('should update an existing profile', () => {
      const signature = 'sig1';
      const mappings1 = { 'Loop Name': 'loopName' };
      const mappings2 = { 'Loop Name': 'loopName', 'Address': 'address' };

      saveMappingProfile(signature, mappings1);
      saveMappingProfile(signature, mappings2);

      const profiles = getCachedProfiles();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].mappings).toEqual(mappings2);
    });

    it('should increment usage count on update', () => {
      const signature = 'sig1';
      const mappings = { 'Loop Name': 'loopName' };

      saveMappingProfile(signature, mappings);
      const profile1 = getMappingBySignature(signature);
      expect(profile1?.count).toBe(1);

      saveMappingProfile(signature, mappings);
      const profile2 = getMappingBySignature(signature);
      expect(profile2?.count).toBe(2);
    });

    it('should update lastUsed timestamp', () => {
      const signature = 'sig1';
      const mappings = { 'Loop Name': 'loopName' };

      saveMappingProfile(signature, mappings);
      const profile1 = getMappingBySignature(signature);
      const firstTime = profile1?.lastUsed || 0;

      // Wait a bit and save again
      setTimeout(() => {
        saveMappingProfile(signature, mappings);
        const profile2 = getMappingBySignature(signature);
        expect((profile2?.lastUsed || 0) >= firstTime).toBe(true);
      }, 10);
    });
  });

  describe('Delete Profile', () => {
    it('should delete a profile by signature', () => {
      const signature = 'sig1';
      const mappings = { 'Loop Name': 'loopName' };

      saveMappingProfile(signature, mappings);
      expect(getCachedProfiles()).toHaveLength(1);

      deleteMappingProfile(signature);
      expect(getCachedProfiles()).toHaveLength(0);
    });

    it('should not affect other profiles when deleting', () => {
      saveMappingProfile('sig1', { 'Loop Name': 'loopName' });
      saveMappingProfile('sig2', { 'Address': 'address' });

      deleteMappingProfile('sig1');

      const profiles = getCachedProfiles();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].signature).toBe('sig2');
    });
  });

  describe('Clear Cache', () => {
    it('should clear all profiles', () => {
      saveMappingProfile('sig1', { 'Loop Name': 'loopName' });
      saveMappingProfile('sig2', { 'Address': 'address' });

      expect(getCachedProfiles()).toHaveLength(2);

      clearMappingCache();
      expect(getCachedProfiles()).toHaveLength(0);
    });
  });

  describe('Cache Statistics', () => {
    it('should return empty stats when cache is empty', () => {
      const stats = getCacheStats();

      expect(stats.totalProfiles).toBe(0);
      expect(stats.oldestProfile).toBeNull();
      expect(stats.newestProfile).toBeNull();
      expect(stats.mostUsedProfile).toBeNull();
    });

    it('should calculate correct statistics', () => {
      saveMappingProfile('sig1', { 'Loop Name': 'loopName' });
      saveMappingProfile('sig2', { 'Address': 'address' });
      saveMappingProfile('sig3', { 'City': 'city' });

      // Use sig1 multiple times to make it most used
      saveMappingProfile('sig1', { 'Loop Name': 'loopName' });
      saveMappingProfile('sig1', { 'Loop Name': 'loopName' });

      const stats = getCacheStats();

      expect(stats.totalProfiles).toBe(3);
      expect(stats.oldestProfile).not.toBeNull();
      expect(stats.newestProfile).not.toBeNull();
      expect(stats.mostUsedProfile?.signature).toBe('sig1');
      expect(stats.mostUsedProfile?.count).toBe(3);
    });
  });

  describe('Max Profiles Limit', () => {
    it('should keep only the most recent profiles when exceeding limit', () => {
      // Save more than MAX_PROFILES (20)
      for (let i = 0; i < 25; i++) {
        saveMappingProfile(`sig${i}`, { [`col${i}`]: `field${i}` });
      }

      const profiles = getCachedProfiles();
      expect(profiles.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Persistence', () => {
    it('should persist data across cache retrievals', () => {
      const signature = 'sig1';
      const mappings = { 'Loop Name': 'loopName' };

      saveMappingProfile(signature, mappings);

      // Simulate new instance reading from localStorage
      const retrieved = getCachedProfiles();
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].signature).toBe(signature);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const profiles = getCachedProfiles();
      expect(profiles).toEqual([]);

      spy.mockRestore();
    });
  });
});
