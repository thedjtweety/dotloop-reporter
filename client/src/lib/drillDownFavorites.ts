/**
 * Drill-Down Favorites/Bookmarks Utility Module
 * Manages saved drill-down filter configurations
 */

/**
 * Favorite filter configuration
 */
export interface DrillDownFavorite {
  id: string;
  name: string;
  description?: string;
  filterType: 'pipeline' | 'timeline' | 'leadSource' | 'propertyType' | 'geographic' | 'agent' | 'custom';
  filterValue?: string;
  customFilters?: Record<string, any>;
  createdAt: number;
  lastUsed?: number;
  usageCount: number;
}

const FAVORITES_STORAGE_KEY = 'dotloop_drilldown_favorites';

/**
 * Get all saved favorites
 */
export function getAllFavorites(): DrillDownFavorite[] {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
}

/**
 * Get a specific favorite by ID
 */
export function getFavoriteById(id: string): DrillDownFavorite | null {
  const favorites = getAllFavorites();
  return favorites.find(fav => fav.id === id) || null;
}

/**
 * Save a new favorite
 */
export function saveFavorite(
  name: string,
  filterType: DrillDownFavorite['filterType'],
  filterValue?: string,
  customFilters?: Record<string, any>,
  description?: string
): DrillDownFavorite {
  const favorites = getAllFavorites();
  
  // Check for duplicate names
  const existingIndex = favorites.findIndex(fav => fav.name === name);
  
  const favorite: DrillDownFavorite = {
    id: existingIndex >= 0 ? favorites[existingIndex].id : generateId(),
    name,
    description,
    filterType,
    filterValue,
    customFilters,
    createdAt: existingIndex >= 0 ? favorites[existingIndex].createdAt : Date.now(),
    lastUsed: Date.now(),
    usageCount: existingIndex >= 0 ? favorites[existingIndex].usageCount : 0,
  };
  
  if (existingIndex >= 0) {
    favorites[existingIndex] = favorite;
  } else {
    favorites.push(favorite);
  }
  
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  return favorite;
}

/**
 * Update an existing favorite
 */
export function updateFavorite(
  id: string,
  updates: Partial<DrillDownFavorite>
): DrillDownFavorite | null {
  const favorites = getAllFavorites();
  const index = favorites.findIndex(fav => fav.id === id);
  
  if (index === -1) return null;
  
  const updated = { ...favorites[index], ...updates, id };
  favorites[index] = updated;
  
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  return updated;
}

/**
 * Delete a favorite
 */
export function deleteFavorite(id: string): boolean {
  const favorites = getAllFavorites();
  const filtered = favorites.filter(fav => fav.id !== id);
  
  if (filtered.length === favorites.length) return false;
  
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Load a favorite (increment usage count and update lastUsed)
 */
export function loadFavorite(id: string): DrillDownFavorite | null {
  const favorite = getFavoriteById(id);
  if (!favorite) return null;
  
  return updateFavorite(id, {
    lastUsed: Date.now(),
    usageCount: favorite.usageCount + 1,
  });
}

/**
 * Get most recently used favorites
 */
export function getMostRecentFavorites(limit: number = 5): DrillDownFavorite[] {
  const favorites = getAllFavorites();
  return favorites
    .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))
    .slice(0, limit);
}

/**
 * Get most frequently used favorites
 */
export function getMostFrequentFavorites(limit: number = 5): DrillDownFavorite[] {
  const favorites = getAllFavorites();
  return favorites
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit);
}

/**
 * Get favorites by filter type
 */
export function getFavoritesByType(
  filterType: DrillDownFavorite['filterType']
): DrillDownFavorite[] {
  const favorites = getAllFavorites();
  return favorites.filter(fav => fav.filterType === filterType);
}

/**
 * Search favorites by name
 */
export function searchFavorites(query: string): DrillDownFavorite[] {
  const favorites = getAllFavorites();
  const lowerQuery = query.toLowerCase();
  
  return favorites.filter(fav =>
    fav.name.toLowerCase().includes(lowerQuery) ||
    (fav.description && fav.description.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Clear all favorites
 */
export function clearAllFavorites(): void {
  localStorage.removeItem(FAVORITES_STORAGE_KEY);
}

/**
 * Export favorites as JSON
 */
export function exportFavoritesAsJSON(): string {
  const favorites = getAllFavorites();
  return JSON.stringify(favorites, null, 2);
}

/**
 * Import favorites from JSON
 */
export function importFavoritesFromJSON(jsonString: string): boolean {
  try {
    const favorites = JSON.parse(jsonString);
    
    if (!Array.isArray(favorites)) {
      console.error('Invalid favorites format: expected array');
      return false;
    }
    
    // Validate structure
    const valid = favorites.every(fav =>
      fav.id && fav.name && fav.filterType && typeof fav.createdAt === 'number'
    );
    
    if (!valid) {
      console.error('Invalid favorites structure');
      return false;
    }
    
    localStorage.setItem(FAVORITES_STORAGE_KEY, jsonString);
    return true;
  } catch (error) {
    console.error('Error importing favorites:', error);
    return false;
  }
}

/**
 * Get favorites statistics
 */
export function getFavoritesStats(): {
  totalCount: number;
  byType: Record<string, number>;
  mostUsed: DrillDownFavorite | null;
  mostRecent: DrillDownFavorite | null;
} {
  const favorites = getAllFavorites();
  
  const byType: Record<string, number> = {};
  favorites.forEach(fav => {
    byType[fav.filterType] = (byType[fav.filterType] || 0) + 1;
  });
  
  const mostUsed = favorites.length > 0
    ? favorites.reduce((max, fav) => (fav.usageCount > max.usageCount ? fav : max))
    : null;
  
  const mostRecent = favorites.length > 0
    ? favorites.reduce((max, fav) => ((fav.lastUsed || 0) > (max.lastUsed || 0) ? fav : max))
    : null;
  
  return {
    totalCount: favorites.length,
    byType,
    mostUsed,
    mostRecent,
  };
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
