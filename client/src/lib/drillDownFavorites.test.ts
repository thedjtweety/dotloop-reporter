import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getAllFavorites,
  getFavoriteById,
  saveFavorite,
  updateFavorite,
  deleteFavorite,
  loadFavorite,
  getMostRecentFavorites,
  getMostFrequentFavorites,
  getFavoritesByType,
  searchFavorites,
  clearAllFavorites,
  exportFavoritesAsJSON,
  importFavoritesFromJSON,
  getFavoritesStats,
  DrillDownFavorite,
} from './drillDownFavorites';

describe('Drill-Down Favorites', () => {
  beforeEach(() => {
    clearAllFavorites();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearAllFavorites();
  });

  describe('saveFavorite', () => {
    it('should save a new favorite', () => {
      const favorite = saveFavorite('High Value Deals', 'custom', undefined, { minPrice: 500000 });
      expect(favorite.name).toBe('High Value Deals');
      expect(favorite.filterType).toBe('custom');
      expect(favorite.usageCount).toBe(0);
      expect(favorite.id).toBeDefined();
    });

    it('should save favorite with description', () => {
      const favorite = saveFavorite(
        'Month-End Closings',
        'timeline',
        'month-end',
        undefined,
        'Deals closing at end of month'
      );
      expect(favorite.description).toBe('Deals closing at end of month');
    });
  });

  describe('getAllFavorites', () => {
    it('should return empty array initially', () => {
      const favorites = getAllFavorites();
      expect(favorites).toHaveLength(0);
    });

    it('should return all saved favorites', () => {
      saveFavorite('Fav 1', 'pipeline', 'Closed');
      saveFavorite('Fav 2', 'timeline', 'month-end');
      const favorites = getAllFavorites();
      expect(favorites).toHaveLength(2);
    });
  });

  describe('getFavoriteById', () => {
    it('should return favorite by ID', () => {
      const saved = saveFavorite('Test', 'pipeline', 'Closed');
      const retrieved = getFavoriteById(saved.id);
      expect(retrieved?.name).toBe('Test');
    });

    it('should return null if favorite not found', () => {
      const retrieved = getFavoriteById('nonexistent');
      expect(retrieved).toBeNull();
    });
  });

  describe('updateFavorite', () => {
    it('should update favorite properties', () => {
      const saved = saveFavorite('Original', 'pipeline', 'Closed');
      const updated = updateFavorite(saved.id, { name: 'Updated' });
      expect(updated?.name).toBe('Updated');
      expect(updated?.filterValue).toBe('Closed');
    });

    it('should return null if favorite not found', () => {
      const result = updateFavorite('nonexistent', { name: 'Test' });
      expect(result).toBeNull();
    });
  });

  describe('deleteFavorite', () => {
    it('should delete favorite', () => {
      const saved = saveFavorite('To Delete', 'pipeline', 'Closed');
      const deleted = deleteFavorite(saved.id);
      expect(deleted).toBe(true);
      expect(getAllFavorites()).toHaveLength(0);
    });

    it('should return false if favorite not found', () => {
      const deleted = deleteFavorite('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('loadFavorite', () => {
    it('should increment usage count', () => {
      const saved = saveFavorite('Test', 'pipeline', 'Closed');
      const loaded = loadFavorite(saved.id);
      expect(loaded?.usageCount).toBe(1);
    });

    it('should update lastUsed timestamp', () => {
      const saved = saveFavorite('Test', 'pipeline', 'Closed');
      const before = Date.now();
      const loaded = loadFavorite(saved.id);
      const after = Date.now();
      expect(loaded?.lastUsed).toBeGreaterThanOrEqual(before);
      expect(loaded?.lastUsed).toBeLessThanOrEqual(after);
    });

    it('should return null if favorite not found', () => {
      const loaded = loadFavorite('nonexistent');
      expect(loaded).toBeNull();
    });
  });

  describe('getMostRecentFavorites', () => {
    it('should return favorites sorted by lastUsed', () => {
      const fav1 = saveFavorite('Fav 1', 'pipeline', 'Closed');
      const fav2 = saveFavorite('Fav 2', 'timeline', 'month-end');
      loadFavorite(fav1.id);
      const recent = getMostRecentFavorites(2);
      expect(recent[0].id).toBe(fav1.id);
    });

    it('should respect limit parameter', () => {
      saveFavorite('Fav 1', 'pipeline', 'Closed');
      saveFavorite('Fav 2', 'timeline', 'month-end');
      saveFavorite('Fav 3', 'leadSource', 'MLS');
      const recent = getMostRecentFavorites(2);
      expect(recent).toHaveLength(2);
    });
  });

  describe('getMostFrequentFavorites', () => {
    it('should return favorites sorted by usage count', () => {
      const fav1 = saveFavorite('Fav 1', 'pipeline', 'Closed');
      const fav2 = saveFavorite('Fav 2', 'timeline', 'month-end');
      loadFavorite(fav1.id);
      loadFavorite(fav1.id);
      loadFavorite(fav2.id);
      const frequent = getMostFrequentFavorites(2);
      expect(frequent[0].id).toBe(fav1.id);
      expect(frequent[0].usageCount).toBe(2);
    });
  });

  describe('getFavoritesByType', () => {
    it('should return favorites filtered by type', () => {
      saveFavorite('Pipeline 1', 'pipeline', 'Closed');
      saveFavorite('Pipeline 2', 'pipeline', 'Active');
      saveFavorite('Timeline 1', 'timeline', 'month-end');
      const pipeline = getFavoritesByType('pipeline');
      expect(pipeline).toHaveLength(2);
      const timeline = getFavoritesByType('timeline');
      expect(timeline).toHaveLength(1);
    });
  });

  describe('searchFavorites', () => {
    it('should search by name', () => {
      saveFavorite('High Value Deals', 'custom');
      saveFavorite('Low Value Deals', 'custom');
      const results = searchFavorites('High');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('High Value Deals');
    });

    it('should be case-insensitive', () => {
      saveFavorite('HIGH VALUE DEALS', 'custom');
      const results = searchFavorites('high');
      expect(results).toHaveLength(1);
    });
  });

  describe('clearAllFavorites', () => {
    it('should clear all favorites', () => {
      saveFavorite('Fav 1', 'pipeline', 'Closed');
      saveFavorite('Fav 2', 'timeline', 'month-end');
      clearAllFavorites();
      expect(getAllFavorites()).toHaveLength(0);
    });
  });

  describe('exportFavoritesAsJSON', () => {
    it('should export favorites as JSON string', () => {
      saveFavorite('Test', 'pipeline', 'Closed');
      const json = exportFavoritesAsJSON();
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].name).toBe('Test');
    });
  });

  describe('importFavoritesFromJSON', () => {
    it('should import favorites from JSON', () => {
      const original = saveFavorite('Test', 'pipeline', 'Closed');
      const json = exportFavoritesAsJSON();
      clearAllFavorites();
      const success = importFavoritesFromJSON(json);
      expect(success).toBe(true);
      expect(getAllFavorites()).toHaveLength(1);
    });

    it('should reject invalid JSON', () => {
      const success = importFavoritesFromJSON('invalid json');
      expect(success).toBe(false);
    });
  });

  describe('getFavoritesStats', () => {
    it('should calculate statistics', () => {
      saveFavorite('Fav 1', 'pipeline', 'Closed');
      saveFavorite('Fav 2', 'timeline', 'month-end');
      saveFavorite('Fav 3', 'pipeline', 'Active');
      const stats = getFavoritesStats();
      expect(stats.totalCount).toBe(3);
      expect(stats.byType.pipeline).toBe(2);
      expect(stats.byType.timeline).toBe(1);
    });

    it('should identify most used favorite', () => {
      const fav1 = saveFavorite('Fav 1', 'pipeline', 'Closed');
      const fav2 = saveFavorite('Fav 2', 'timeline', 'month-end');
      loadFavorite(fav1.id);
      loadFavorite(fav1.id);
      const stats = getFavoritesStats();
      expect(stats.mostUsed?.id).toBe(fav1.id);
      expect(stats.mostUsed?.usageCount).toBe(2);
    });
  });
});
