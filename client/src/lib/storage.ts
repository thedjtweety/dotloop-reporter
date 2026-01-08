/**
 * Storage Utility using IndexedDB
 * Handles persistent storage of large datasets (Recent Uploads)
 * Uses idb-keyval for simple key-value storage in IndexedDB
 */

import { get, set, del, update } from 'idb-keyval';
import { DotloopRecord } from './csvParser';
import { RecentFile } from '@/components/RecentUploads';

const STORAGE_KEY = 'dotloop_recent_files';
const MAX_FILES = 5; // Increased from 3 since we have more space

export async function getRecentFiles(): Promise<RecentFile[]> {
  try {
    const files = await get<RecentFile[]>(STORAGE_KEY);
    return files || [];
  } catch (error) {
    console.error('Failed to load recent files from IndexedDB:', error);
    return [];
  }
}

export async function saveRecentFile(name: string, records: DotloopRecord[]): Promise<RecentFile[]> {
  try {
    const newFile: RecentFile = {
      id: crypto.randomUUID(),
      name,
      date: Date.now(),
      recordCount: records.length,
      data: records
    };

    let updatedFiles: RecentFile[] = [];

    await update(STORAGE_KEY, (oldFiles: RecentFile[] | undefined) => {
      const current = oldFiles || [];
      // Add new file to top, remove duplicates by name if any
      const filtered = current.filter(f => f.name !== name);
      const updated = [newFile, ...filtered].slice(0, MAX_FILES);
      updatedFiles = updated;
      return updated;
    });

    return updatedFiles;
  } catch (error) {
    console.error('Failed to save recent file to IndexedDB:', error);
    throw error;
  }
}

export async function deleteRecentFile(id: string): Promise<RecentFile[]> {
  try {
    let updatedFiles: RecentFile[] = [];
    
    await update(STORAGE_KEY, (oldFiles: RecentFile[] | undefined) => {
      const current = oldFiles || [];
      const updated = current.filter(f => f.id !== id);
      updatedFiles = updated;
      return updated;
    });

    return updatedFiles;
  } catch (error) {
    console.error('Failed to delete recent file from IndexedDB:', error);
    throw error;
  }
}

export async function clearRecentFiles(): Promise<void> {
  try {
    await del(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear recent files from IndexedDB:', error);
    throw error;
  }
}
