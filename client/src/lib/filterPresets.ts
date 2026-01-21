import { DateRange } from 'react-day-picker';

export interface FilterPreset {
  id: string;
  name: string;
  filters: {
    dateRange?: DateRange;
    statusFilter?: string;
    agentFilter?: string;
    priceRange?: { min: number; max: number };
  };
  createdAt: number;
  componentType: 'modal' | 'pipeline' | 'map';
}

const STORAGE_PREFIX = 'dotloop_filter_presets_';
const MAX_PRESETS = 15;

/**
 * Generate unique ID for preset
 */
function generatePresetId(): string {
  return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get storage key for component
 */
function getStorageKey(componentType: string): string {
  return `${STORAGE_PREFIX}${componentType}`;
}

/**
 * Save a new filter preset
 */
export function saveFilterPreset(
  name: string,
  filters: FilterPreset['filters'],
  componentType: 'modal' | 'pipeline' | 'map'
): FilterPreset | null {
  // Validate name
  if (!name || name.trim().length === 0) {
    console.error('Preset name cannot be empty');
    return null;
  }

  if (name.length > 50) {
    console.error('Preset name must be 50 characters or less');
    return null;
  }

  const storageKey = getStorageKey(componentType);
  const existingPresets = getFilterPresets(componentType);

  // Check for duplicate names
  if (existingPresets.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    console.error('A preset with this name already exists');
    return null;
  }

  // Check max presets limit
  if (existingPresets.length >= MAX_PRESETS) {
    console.error(`Maximum ${MAX_PRESETS} presets allowed`);
    return null;
  }

  const preset: FilterPreset = {
    id: generatePresetId(),
    name: name.trim(),
    filters,
    createdAt: Date.now(),
    componentType,
  };

  const allPresets = [...existingPresets, preset];
  localStorage.setItem(storageKey, JSON.stringify(allPresets));

  return preset;
}

/**
 * Get all filter presets for a component
 */
export function getFilterPresets(componentType: 'modal' | 'pipeline' | 'map'): FilterPreset[] {
  const storageKey = getStorageKey(componentType);
  const stored = localStorage.getItem(storageKey);

  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse filter presets', e);
    return [];
  }
}

/**
 * Delete a filter preset
 */
export function deleteFilterPreset(
  presetId: string,
  componentType: 'modal' | 'pipeline' | 'map'
): boolean {
  const storageKey = getStorageKey(componentType);
  const presets = getFilterPresets(componentType);
  const filtered = presets.filter(p => p.id !== presetId);

  if (filtered.length === presets.length) {
    console.error('Preset not found');
    return false;
  }

  localStorage.setItem(storageKey, JSON.stringify(filtered));
  return true;
}

/**
 * Update a filter preset
 */
export function updateFilterPreset(
  presetId: string,
  updates: Partial<Omit<FilterPreset, 'id' | 'componentType'>>,
  componentType: 'modal' | 'pipeline' | 'map'
): FilterPreset | null {
  const storageKey = getStorageKey(componentType);
  const presets = getFilterPresets(componentType);
  const presetIndex = presets.findIndex(p => p.id === presetId);

  if (presetIndex === -1) {
    console.error('Preset not found');
    return null;
  }

  const updated = {
    ...presets[presetIndex],
    ...updates,
  };

  presets[presetIndex] = updated;
  localStorage.setItem(storageKey, JSON.stringify(presets));

  return updated;
}

/**
 * Clear all presets for a component
 */
export function clearAllFilterPresets(componentType: 'modal' | 'pipeline' | 'map'): void {
  const storageKey = getStorageKey(componentType);
  localStorage.removeItem(storageKey);
}

/**
 * Format date for display
 */
export function formatPresetDate(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
}
