/**
 * Bookmark utilities for saving and loading filter configurations
 */

export interface FilterBookmark {
  id: string;
  name: string;
  type: 'transaction' | 'pipeline'; // Type of drill-down modal
  filters: {
    searchQuery?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    statusFilter?: string;
    dateRange?: {
      from?: string;
      to?: string;
    };
  };
  createdAt: number;
  updatedAt: number;
}

const BOOKMARKS_STORAGE_KEY = 'drillDownBookmarks';

/**
 * Get all bookmarks for a specific type
 */
export function getBookmarks(type: 'transaction' | 'pipeline'): FilterBookmark[] {
  try {
    const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!saved) return [];
    
    const allBookmarks: FilterBookmark[] = JSON.parse(saved);
    return allBookmarks.filter(b => b.type === type);
  } catch (e) {
    console.error('Failed to load bookmarks:', e);
    return [];
  }
}

/**
 * Save a new bookmark
 */
export function saveBookmark(bookmark: Omit<FilterBookmark, 'id' | 'createdAt' | 'updatedAt'>): FilterBookmark {
  try {
    const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    const allBookmarks: FilterBookmark[] = saved ? JSON.parse(saved) : [];
    
    const newBookmark: FilterBookmark = {
      ...bookmark,
      id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    allBookmarks.push(newBookmark);
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(allBookmarks));
    
    return newBookmark;
  } catch (e) {
    console.error('Failed to save bookmark:', e);
    throw e;
  }
}

/**
 * Update an existing bookmark
 */
export function updateBookmark(id: string, updates: Partial<FilterBookmark>): FilterBookmark | null {
  try {
    const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!saved) return null;
    
    const allBookmarks: FilterBookmark[] = JSON.parse(saved);
    const index = allBookmarks.findIndex(b => b.id === id);
    
    if (index === -1) return null;
    
    const updated: FilterBookmark = {
      ...allBookmarks[index],
      ...updates,
      id: allBookmarks[index].id, // Don't allow ID changes
      createdAt: allBookmarks[index].createdAt, // Don't allow creation date changes
      updatedAt: Date.now(),
    };
    
    allBookmarks[index] = updated;
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(allBookmarks));
    
    return updated;
  } catch (e) {
    console.error('Failed to update bookmark:', e);
    return null;
  }
}

/**
 * Delete a bookmark
 */
export function deleteBookmark(id: string): boolean {
  try {
    const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!saved) return false;
    
    const allBookmarks: FilterBookmark[] = JSON.parse(saved);
    const filtered = allBookmarks.filter(b => b.id !== id);
    
    if (filtered.length === allBookmarks.length) return false; // Not found
    
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.error('Failed to delete bookmark:', e);
    return false;
  }
}

/**
 * Get a specific bookmark by ID
 */
export function getBookmarkById(id: string): FilterBookmark | null {
  try {
    const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!saved) return null;
    
    const allBookmarks: FilterBookmark[] = JSON.parse(saved);
    return allBookmarks.find(b => b.id === id) || null;
  } catch (e) {
    console.error('Failed to get bookmark:', e);
    return null;
  }
}
