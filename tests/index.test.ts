// GENERATED FROM SPEC-PARSER-ERROR-AGGREGATION-001
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SiteParser, SiteEvent } from '../src/types/site-parser';

// Mock implementations
const mockSiteParser = (siteName: string, siteId: string, behavior: 'success' | 'failure') => ({
  siteName,
  siteId,
  fetchAndParse: async () => {
    if (behavior === 'success') {
      return [
        {
          siteId,
          siteName,
          eventId: '001',
          title: `Event from ${siteName}`,
          startDate: '2025.01.01',
          endDate: '2025.01.31',
          sourceUrl: 'https://example.com',
        },
      ] as SiteEvent[];
    } else {
      throw new Error(`Failed to fetch from ${siteName}: Connection timeout`);
    }
  },
});

describe('Event Collection - Parser Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TEST-PARSER-ERROR-AC1: Error collection on all failures
  it('SPEC-PARSER-ERROR-AGGREGATION-001 AC-1: Should collect errors when all parsers fail', async () => {
    const parser1 = mockSiteParser('Site A', 'siteA', 'failure') as SiteParser;
    const parser2 = mockSiteParser('Site B', 'siteB', 'failure') as SiteParser;

    const results = await Promise.allSettled([parser1.fetchAndParse(), parser2.fetchAndParse()]);

    // Verify both failed
    const failures = results.filter((r) => r.status === 'rejected');
    expect(failures).toHaveLength(2);

    // Collect error messages
    const errors: Map<string, string> = new Map();
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const siteName = index === 0 ? 'Site A' : 'Site B';
        errors.set(siteName, result.reason.message);
      }
    });

    expect(errors.size).toBe(2);
    expect(errors.get('Site A')).toContain('Connection timeout');
    expect(errors.get('Site B')).toContain('Connection timeout');
  });

  // TEST-PARSER-ERROR-AC3: Partial failure handling
  it('SPEC-PARSER-ERROR-AGGREGATION-001 AC-3: Should handle partial parser failures', async () => {
    const parser1 = mockSiteParser('Site A', 'siteA', 'success') as SiteParser;
    const parser2 = mockSiteParser('Site B', 'siteB', 'failure') as SiteParser;

    const results = await Promise.allSettled([parser1.fetchAndParse(), parser2.fetchAndParse()]);

    // Collect successful events
    const allEvents: SiteEvent[] = [];
    const errors: Map<string, string> = new Map();

    results.forEach((result, index) => {
      const siteName = index === 0 ? 'Site A' : 'Site B';
      if (result.status === 'fulfilled') {
        allEvents.push(...result.value);
      } else {
        errors.set(siteName, result.reason.message);
      }
    });

    // Should have events from Site A
    expect(allEvents).toHaveLength(1);
    expect(allEvents[0].siteName).toBe('Site A');

    // Should have error from Site B
    expect(errors.size).toBe(1);
    expect(errors.get('Site B')).toBeDefined();
  });

  // TEST-PARSER-ERROR-DETECTION: Distinguish "no events" from "all failed"
  it('SPEC-PARSER-ERROR-AGGREGATION-001: Should distinguish empty results from all failures', async () => {
    // Case 1: All parsers succeed but return no events
    const successNoEvents = [Promise.resolve([]), Promise.resolve([])];
    const results1 = await Promise.allSettled(successNoEvents);

    const allEvents1: SiteEvent[] = [];
    const errors1: Map<string, string> = new Map();

    results1.forEach((result) => {
      if (result.status === 'fulfilled') {
        allEvents1.push(...result.value);
      }
    });

    expect(allEvents1).toHaveLength(0);
    expect(errors1.size).toBe(0); // No errors

    // Case 2: All parsers fail
    const failAll: Promise<SiteEvent[]>[] = [
      Promise.reject(new Error('Error 1')),
      Promise.reject(new Error('Error 2')),
    ];
    const results2 = await Promise.allSettled(failAll);

    const allEvents2: SiteEvent[] = [];
    const errors2: Map<string, string> = new Map();

    results2.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allEvents2.push(...result.value);
      } else {
        errors2.set(`Parser${index}`, result.reason.message);
      }
    });

    expect(allEvents2).toHaveLength(0);
    expect(errors2.size).toBe(2); // Has errors

    // Distinction: errors2.size > 0 means "all failed", errors1.size === 0 means "no events today"
    expect(errors2.size > 0).toBe(true);
    expect(errors1.size > 0).toBe(false);
  });
});
