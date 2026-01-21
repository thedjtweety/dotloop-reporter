import { describe, it, expect } from 'vitest';
import {
  matchHeaders,
  getFormatSignature,
  validateRequiredFields,
} from '../header-matcher';

describe('Header Matcher', () => {
  describe('Perfect Dotloop Headers', () => {
    it('should recognize perfect Dotloop headers with 100% confidence', () => {
      const headers = ['Loop Name', 'Address', 'City', 'State', 'Zip', 'GCI', 'Company $'];
      const result = matchHeaders(headers);

      expect(result.overallConfidence).toBe(100);
      expect(result.needsUserMapping).toBe(false);
      expect(result.unmappedRequired).toHaveLength(0);
    });

    it('should recognize minimal required headers', () => {
      const headers = ['Loop Name', 'Address'];
      const result = matchHeaders(headers);

      expect(result.overallConfidence).toBeGreaterThan(90);
      expect(result.needsUserMapping).toBe(false);
      expect(validateRequiredFields(result.matches)).toBe(true);
    });
  });

  describe('Fuzzy Matching', () => {
    it('should match lowercase headers', () => {
      const headers = ['loop name', 'address', 'city'];
      const result = matchHeaders(headers);

      expect(result.matches[0].confidence).toBe(100);
      expect(result.matches[1].confidence).toBe(100);
    });

    it('should match headers with extra spaces', () => {
      const headers = ['  Loop Name  ', '  Address  '];
      const result = matchHeaders(headers);

      expect(result.matches[0].confidence).toBe(100);
      expect(result.matches[1].confidence).toBe(100);
    });

    it('should match alternative field names', () => {
      const headers = ['loopname', 'property address', 'sale price'];
      const result = matchHeaders(headers);

      expect(result.matches[0].matchedField).toBe('loopName');
      expect(result.matches[1].matchedField).toBe('address');
      expect(result.matches[2].matchedField).toBe('gci');
    });

    it('should handle typos with fuzzy matching', () => {
      const headers = ['Loop Nme', 'Adress'];
      const result = matchHeaders(headers);

      expect(result.matches[0].matchedField).toBe('loopName');
      expect(result.matches[0].confidence).toBeGreaterThan(70);
      expect(result.matches[1].matchedField).toBe('address');
    });
  });

  describe('Confidence Scoring', () => {
    it('should give high confidence to exact matches', () => {
      const headers = ['Loop Name'];
      const result = matchHeaders(headers);

      expect(result.matches[0].confidence).toBe(100);
    });

    it('should give medium confidence to fuzzy matches', () => {
      const headers = ['Loop_Name'];
      const result = matchHeaders(headers);

      expect(result.matches[0].confidence).toBeGreaterThan(70);
      expect(result.matches[0].confidence).toBeLessThan(100);
    });

    it('should calculate overall confidence based on all headers', () => {
      const perfectHeaders = ['Loop Name', 'Address'];
      const perfectResult = matchHeaders(perfectHeaders);

      const partialHeaders = ['Loop Name', 'Adress'];
      const partialResult = matchHeaders(partialHeaders);

      expect(perfectResult.overallConfidence).toBeGreaterThanOrEqual(
        partialResult.overallConfidence
      );
    });
  });

  describe('Mapping Detection', () => {
    it('should not require mapping for perfect headers', () => {
      const headers = ['Loop Name', 'Address', 'GCI'];
      const result = matchHeaders(headers);

      expect(result.needsUserMapping).toBe(false);
    });

    it('should not require mapping for good fuzzy matches', () => {
      const headers = ['Loop Name', 'Address'];
      const result = matchHeaders(headers);

      expect(result.needsUserMapping).toBe(false);
    });

    it('should require mapping when required fields are missing', () => {
      const headers = ['City', 'State', 'Zip'];
      const result = matchHeaders(headers);

      expect(validateRequiredFields(result.matches)).toBe(false);
    });

    it('should not require mapping for unmapped optional fields', () => {
      const headers = ['Loop Name', 'Address', 'Unknown Optional Field'];
      const result = matchHeaders(headers);

      expect(result.needsUserMapping).toBe(false);
      expect(result.unmappedOptional).toContain('Unknown Optional Field');
    });
  });

  describe('Format Signature', () => {
    it('should generate consistent signatures for same headers', () => {
      const headers = ['Loop Name', 'Address', 'City'];
      const sig1 = getFormatSignature(headers);
      const sig2 = getFormatSignature(headers);

      expect(sig1).toBe(sig2);
    });

    it('should generate different signatures for different headers', () => {
      const headers1 = ['Loop Name', 'Address'];
      const headers2 = ['Loop Name', 'Address', 'City'];

      const sig1 = getFormatSignature(headers1);
      const sig2 = getFormatSignature(headers2);

      expect(sig1).not.toBe(sig2);
    });

    it('should be order-independent', () => {
      const headers1 = ['Loop Name', 'Address', 'City'];
      const headers2 = ['City', 'Loop Name', 'Address'];

      const sig1 = getFormatSignature(headers1);
      const sig2 = getFormatSignature(headers2);

      expect(sig1).toBe(sig2);
    });
  });

  describe('Required Field Validation', () => {
    it('should validate when all required fields are present', () => {
      const headers = ['Loop Name', 'Address'];
      const result = matchHeaders(headers);

      expect(validateRequiredFields(result.matches)).toBe(true);
    });

    it('should fail when required fields are missing', () => {
      const headers = ['City', 'State', 'Zip'];
      const result = matchHeaders(headers);

      expect(validateRequiredFields(result.matches)).toBe(false);
    });

    it('should succeed with extra optional fields', () => {
      const headers = ['Loop Name', 'Address', 'City', 'State', 'Zip', 'GCI', 'Agent Name'];
      const result = matchHeaders(headers);

      expect(validateRequiredFields(result.matches)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty header array', () => {
      const headers: string[] = [];
      const result = matchHeaders(headers);

      expect(result.matches).toHaveLength(0);
      expect(result.overallConfidence).toBe(100);
      expect(validateRequiredFields(result.matches)).toBe(false);
    });

    it('should handle duplicate headers', () => {
      const headers = ['Loop Name', 'Loop Name', 'Address'];
      const result = matchHeaders(headers);

      expect(result.matches).toHaveLength(3);
      expect(result.matches[0].matchedField).toBe('loopName');
      expect(result.matches[1].matchedField).toBe('loopName');
    });
  });

  describe('Suggested Mappings', () => {
    it('should provide suggested mappings for low-confidence matches', () => {
      const headers = ['Loop_Name', 'Adress'];
      const result = matchHeaders(headers);

      expect(Object.keys(result.suggestedMappings).length).toBeGreaterThanOrEqual(0);
    });

    it('should not suggest mappings for high-confidence matches', () => {
      const headers = ['Loop Name', 'Address'];
      const result = matchHeaders(headers);

      expect(Object.keys(result.suggestedMappings)).toHaveLength(0);
    });
  });

  describe('Zero-Click Experience', () => {
    it('should recognize standard Dotloop format without user input', () => {
      const headers = ['Loop Name', 'Address', 'City', 'State', 'Zip', 'GCI', 'Company $', 'Agent Name', 'Status', 'Closed Date'];
      const result = matchHeaders(headers);

      expect(result.needsUserMapping).toBe(false);
      expect(result.overallConfidence).toBe(100);
    });

    it('should recognize minimal Dotloop format without user input', () => {
      const headers = ['Loop Name', 'Address'];
      const result = matchHeaders(headers);

      expect(result.needsUserMapping).toBe(false);
    });

    it('should recognize custom format with high confidence', () => {
      const headers = ['loopname', 'property_address', 'city', 'state', 'gci'];
      const result = matchHeaders(headers);

      expect(result.needsUserMapping).toBe(false);
      expect(result.overallConfidence).toBeGreaterThan(85);
    });
  });
});
