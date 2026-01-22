import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getDotloopViewUrl,
  openInDotloop,
  openMultipleInDotloop,
  hasDotloopUrl,
  getDotloopSearchUrl,
  formatTransactionWithLink,
  getBatchDotloopUrls,
  createDotloopDeepLink,
} from './dotloopUtils';
import { DotloopRecord } from './csvParser';

describe('dotloopUtils', () => {
  // Mock window.open
  beforeEach(() => {
    global.window.open = vi.fn();
  });

  const mockRecord: DotloopRecord = {
    loopId: 'loop123',
    loopViewUrl: 'https://dotloop.com/loop/loop123',
    loopName: 'Test Transaction',
    loopStatus: 'Closed',
    createdDate: '2025-01-01',
    closingDate: '2025-01-15',
    listingDate: '2024-12-01',
    offerDate: '2025-01-05',
    address: '123 Main St',
    price: 500000,
    propertyType: 'Single Family',
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 2000,
    city: 'Springfield',
    state: 'IL',
    county: 'Sangamon',
    leadSource: 'MLS',
    earnestMoney: 10000,
    salePrice: 500000,
    commissionRate: 0.06,
    commissionTotal: 30000,
    agents: 'John Doe',
    createdBy: 'John Doe',
    buySideCommission: 15000,
    sellSideCommission: 15000,
    companyDollar: 15000,
    referralSource: 'Internal',
    referralPercentage: 0,
    complianceStatus: 'Compliant',
    tags: ['urgent', 'new'],
    originalPrice: 520000,
    yearBuilt: 2000,
    lotSize: 0.5,
    subdivision: 'Oakwood',
  };

  const mockRecordNoUrl: DotloopRecord = {
    ...mockRecord,
    loopViewUrl: '',
    loopId: 'loop456',
  };

  describe('getDotloopViewUrl', () => {
    it('should return loopViewUrl if available', () => {
      const url = getDotloopViewUrl(mockRecord);
      expect(url).toBe('https://dotloop.com/loop/loop123');
    });

    it('should construct URL from loopId if loopViewUrl is empty', () => {
      const url = getDotloopViewUrl(mockRecordNoUrl);
      expect(url).toBe('https://dotloop.com/loop/loop456');
    });

    it('should return null if no URL or loopId available', () => {
      const record = { ...mockRecord, loopViewUrl: '', loopId: '' };
      const url = getDotloopViewUrl(record);
      expect(url).toBeNull();
    });
  });

  describe('openInDotloop', () => {
    it('should open URL in new window', () => {
      openInDotloop(mockRecord);
      expect(window.open).toHaveBeenCalledWith(
        'https://dotloop.com/loop/loop123',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should not open if no URL available', () => {
      const record = { ...mockRecord, loopViewUrl: '', loopId: '' };
      openInDotloop(record);
      expect(window.open).not.toHaveBeenCalled();
    });
  });

  describe('openMultipleInDotloop', () => {
    it('should open multiple records in new windows', () => {
      const records = [mockRecord, mockRecordNoUrl];
      openMultipleInDotloop(records);
      expect(window.open).toHaveBeenCalledTimes(2);
    });

    it('should skip records without URLs', () => {
      const record = { ...mockRecord, loopViewUrl: '', loopId: '' };
      openMultipleInDotloop([record]);
      expect(window.open).not.toHaveBeenCalled();
    });
  });

  describe('hasDotloopUrl', () => {
    it('should return true if URL is available', () => {
      expect(hasDotloopUrl(mockRecord)).toBe(true);
    });

    it('should return true if loopId is available', () => {
      expect(hasDotloopUrl(mockRecordNoUrl)).toBe(true);
    });

    it('should return false if no URL available', () => {
      const record = { ...mockRecord, loopViewUrl: '', loopId: '' };
      expect(hasDotloopUrl(record)).toBe(false);
    });
  });

  describe('getDotloopSearchUrl', () => {
    it('should create search URL with agent parameter', () => {
      const url = getDotloopSearchUrl({ agent: 'John Doe' });
      expect(url).toContain('agent=John+Doe');
    });

    it('should create search URL with status parameter', () => {
      const url = getDotloopSearchUrl({ status: 'Closed' });
      expect(url).toContain('status=Closed');
    });

    it('should create search URL with date range parameters', () => {
      const from = new Date('2025-01-01');
      const to = new Date('2025-01-31');
      const url = getDotloopSearchUrl({ dateRange: { from, to } });
      expect(url).toContain('from=2025-01-01');
      expect(url).toContain('to=2025-01-31');
    });

    it('should create search URL with multiple parameters', () => {
      const url = getDotloopSearchUrl({
        agent: 'John Doe',
        status: 'Closed',
      });
      expect(url).toContain('agent=John+Doe');
      expect(url).toContain('status=Closed');
    });

    it('should return base URL if no criteria provided', () => {
      const url = getDotloopSearchUrl({});
      expect(url).toBe('https://dotloop.com/search?');
    });
  });

  describe('formatTransactionWithLink', () => {
    it('should format transaction with link information', () => {
      const result = formatTransactionWithLink(mockRecord);
      expect(result.name).toBe('Test Transaction');
      expect(result.url).toBe('https://dotloop.com/loop/loop123');
      expect(result.hasLink).toBe(true);
    });

    it('should indicate no link if URL not available', () => {
      const record = { ...mockRecord, loopViewUrl: '', loopId: '' };
      const result = formatTransactionWithLink(record);
      expect(result.hasLink).toBe(false);
      expect(result.url).toBeNull();
    });
  });

  describe('getBatchDotloopUrls', () => {
    it('should return array of URLs from multiple records', () => {
      const records = [mockRecord, mockRecordNoUrl];
      const urls = getBatchDotloopUrls(records);
      expect(urls).toHaveLength(2);
      expect(urls[0]).toBe('https://dotloop.com/loop/loop123');
      expect(urls[1]).toBe('https://dotloop.com/loop/loop456');
    });

    it('should filter out records without URLs', () => {
      const record = { ...mockRecord, loopViewUrl: '', loopId: '' };
      const records = [mockRecord, record];
      const urls = getBatchDotloopUrls(records);
      expect(urls).toHaveLength(1);
    });

    it('should return empty array if no records have URLs', () => {
      const record = { ...mockRecord, loopViewUrl: '', loopId: '' };
      const urls = getBatchDotloopUrls([record]);
      expect(urls).toHaveLength(0);
    });
  });

  describe('createDotloopDeepLink', () => {
    it('should create deep link with loopId', () => {
      const url = createDotloopDeepLink('loop123');
      expect(url).toBe('https://dotloop.com/loop/loop123');
    });

    it('should create deep link with parameters', () => {
      const url = createDotloopDeepLink('loop123', { tab: 'documents', view: 'list' });
      expect(url).toContain('https://dotloop.com/loop/loop123?');
      expect(url).toContain('tab=documents');
      expect(url).toContain('view=list');
    });

    it('should create deep link without parameters if not provided', () => {
      const url = createDotloopDeepLink('loop123', {});
      expect(url).toBe('https://dotloop.com/loop/loop123');
    });
  });
});
