/**
 * Header Matching and Confidence Scoring
 * Intelligently matches CSV headers to standard Dotloop fields
 */

/**
 * Standard Dotloop field definitions
 */
export const STANDARD_FIELDS = {
  loopName: {
    aliases: ['loop name', 'loopname', 'property name', 'deal name', 'deal', 'transaction'],
    required: true,
  },
  address: {
    aliases: ['address', 'property address', 'street address', 'location'],
    required: true,
  },
  city: {
    aliases: ['city', 'municipality'],
    required: false,
  },
  state: {
    aliases: ['state', 'province', 'st'],
    required: false,
  },
  zip: {
    aliases: ['zip', 'zip code', 'postal code', 'zipcode'],
    required: false,
  },
  gci: {
    aliases: ['gci', 'gross commission income', 'commission', 'sale price'],
    required: false,
  },
  companyDollar: {
    aliases: ['company $', 'company dollar', 'company commission', 'broker commission'],
    required: false,
  },
  agentName: {
    aliases: ['agent name', 'agent', 'salesperson', 'realtor'],
    required: false,
  },
  status: {
    aliases: ['status', 'deal status', 'transaction status'],
    required: false,
  },
  closedDate: {
    aliases: ['closed date', 'closing date', 'close date', 'date closed'],
    required: false,
  },
  createdBy: {
    aliases: ['created by', 'created by user', 'entered by', 'input by'],
    required: false,
  },
};

/**
 * Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(a: string, b: string): number {
  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();

  if (aLower === bLower) return 0;

  const matrix: number[][] = [];

  for (let i = 0; i <= bLower.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= aLower.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bLower.length; i++) {
    for (let j = 1; j <= aLower.length; j++) {
      const cost = aLower[j - 1] === bLower[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i][j - 1] + 1,
        matrix[i - 1][j] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[bLower.length][aLower.length];
}

/**
 * Calculate similarity score between two strings (0-100)
 */
function calculateSimilarity(a: string, b: string): number {
  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  const similarity = 1 - distance / maxLength;
  return Math.max(0, Math.round(similarity * 100));
}

/**
 * Match a header to a standard field
 */
function matchHeaderToField(header: string): { field: string; confidence: number } | null {
  let bestMatch: { field: string; confidence: number } | null = null;

  for (const [fieldKey, fieldDef] of Object.entries(STANDARD_FIELDS)) {
    // Check exact matches first (highest confidence)
    const exactMatch = fieldDef.aliases.find(
      alias => alias.toLowerCase() === header.toLowerCase()
    );
    if (exactMatch) {
      return { field: fieldKey, confidence: 100 };
    }

    // Check fuzzy matches
    for (const alias of fieldDef.aliases) {
      const similarity = calculateSimilarity(header, alias);
      if (similarity > 70 && (!bestMatch || similarity > bestMatch.confidence)) {
        bestMatch = { field: fieldKey, confidence: similarity };
      }
    }
  }

  return bestMatch;
}

/**
 * Match result for a single header
 */
export interface HeaderMatch {
  originalHeader: string;
  matchedField: string | null;
  confidence: number;
  isRequired: boolean;
  needsMapping: boolean;
}

/**
 * Overall matching result
 */
export interface MatchingResult {
  matches: HeaderMatch[];
  overallConfidence: number;
  unmappedRequired: string[];
  unmappedOptional: string[];
  needsUserMapping: boolean;
  suggestedMappings: Record<string, string>;
}

/**
 * Match all headers in a CSV
 */
export function matchHeaders(headers: string[]): MatchingResult {
  const matches: HeaderMatch[] = [];
  const suggestedMappings: Record<string, string> = {};
  const unmappedRequired: string[] = [];
  const unmappedOptional: string[] = [];

  for (const header of headers) {
    const match = matchHeaderToField(header);

    if (match) {
      const fieldDef = STANDARD_FIELDS[match.field as keyof typeof STANDARD_FIELDS];
      matches.push({
        originalHeader: header,
        matchedField: match.field,
        confidence: match.confidence,
        isRequired: fieldDef.required,
        needsMapping: match.confidence < 90,
      });

      if (match.confidence < 90) {
        suggestedMappings[header] = match.field;
      }
    } else {
      // No match found
      const isRequired = Object.values(STANDARD_FIELDS).some(
        f => f.aliases.some(a => a.toLowerCase() === header.toLowerCase()) && f.required
      );

      matches.push({
        originalHeader: header,
        matchedField: null,
        confidence: 0,
        isRequired,
        needsMapping: true,
      });

      if (isRequired) {
        unmappedRequired.push(header);
      } else {
        unmappedOptional.push(header);
      }
    }
  }

  // Calculate overall confidence
  const requiredMatches = matches.filter(m => m.isRequired);
  const optionalMatches = matches.filter(m => !m.isRequired);

  let overallConfidence = 100;

  // Penalize unmapped required fields heavily
  if (unmappedRequired.length > 0) {
    overallConfidence -= unmappedRequired.length * 50;
  }

  // Penalize low-confidence matches
  const lowConfidenceMatches = matches.filter(m => m.confidence < 90 && m.confidence > 0);
  overallConfidence -= lowConfidenceMatches.length * 5;

  overallConfidence = Math.max(0, overallConfidence);

  // Determine if user mapping is needed
  const needsUserMapping =
    overallConfidence < 90 || unmappedRequired.length > 0 || lowConfidenceMatches.length > 2;

  return {
    matches,
    overallConfidence,
    unmappedRequired,
    unmappedOptional,
    needsUserMapping,
    suggestedMappings,
  };
}

/**
 * Get a signature for a CSV format (for caching)
 */
export function getFormatSignature(headers: string[]): string {
  const normalized = headers
    .map(h => h.toLowerCase().trim())
    .sort()
    .join('|');
  return Buffer.from(normalized).toString('base64');
}

/**
 * Validate that required fields are present
 */
export function validateRequiredFields(matches: HeaderMatch[]): boolean {
  const requiredFields = Object.entries(STANDARD_FIELDS)
    .filter(([_, def]) => def.required)
    .map(([key]) => key);

  const mappedFields = matches.filter(m => m.matchedField).map(m => m.matchedField);

  return requiredFields.every(field => mappedFields.includes(field));
}
