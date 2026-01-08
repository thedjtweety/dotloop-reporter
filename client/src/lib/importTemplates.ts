/**
 * Import Template Manager
 * Saves and retrieves column mapping templates from localStorage
 */

export interface ImportTemplate {
  id: string;
  name: string;
  mapping: Record<string, string>;
  lastUsed: number;
}

const STORAGE_KEY = 'dotloop_import_templates';

/**
 * Get all saved templates
 */
export function getTemplates(): ImportTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored).sort((a: ImportTemplate, b: ImportTemplate) => b.lastUsed - a.lastUsed);
  } catch (e) {
    console.error('Error loading templates', e);
    return [];
  }
}

/**
 * Save a new template or update existing one
 */
export function saveTemplate(name: string, mapping: Record<string, string>): ImportTemplate {
  const templates = getTemplates();
  
  // Check if update existing
  const existingIndex = templates.findIndex(t => t.name === name);
  
  const newTemplate: ImportTemplate = {
    id: existingIndex >= 0 ? templates[existingIndex].id : crypto.randomUUID(),
    name,
    mapping,
    lastUsed: Date.now()
  };

  if (existingIndex >= 0) {
    templates[existingIndex] = newTemplate;
  } else {
    templates.push(newTemplate);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  return newTemplate;
}

/**
 * Delete a template by ID
 */
export function deleteTemplate(id: string) {
  const templates = getTemplates().filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

/**
 * Check if a mapping matches a saved template (heuristic)
 * Returns the template if > 80% of keys match
 */
export function findMatchingTemplate(headers: string[]): ImportTemplate | null {
  const templates = getTemplates();
  
  for (const template of templates) {
    const mappedHeaders = Object.values(template.mapping);
    const matchCount = mappedHeaders.filter(h => headers.includes(h)).length;
    
    // If more than 80% of the template's mapped columns exist in this file
    if (matchCount / mappedHeaders.length > 0.8) {
      return template;
    }
  }
  
  return null;
}
