// GENERATED FROM SPEC-EVENT-COLLECTOR-001
// TRACE: SPEC-BRANCH-COVERAGE-001
import { describe, it, expect, vi } from 'vitest';
import { parseEvents, fetchAllEvents, fetchAndParseEvents, BloodinfoParser } from '../src/parsers/bloodinfo';

describe('HTML Parser - parseEvents()', () => {
  // TEST-AC1-NEW-EVENTS
  it('AC-1: Should extract events with eventId, title, and date range', () => {
    const mockHtml = `
      <a href="javascript:" data-id="12345" class="promtnInfoBtn"><span>혈액 수급 지원 프로모션</span></a>
      <a href="javascript:" data-id="12345" class="promtnInfoBtn"><span>2025.01.01&nbsp;~&nbsp;2025.12.31</span></a>
    `;

    const events = parseEvents(mockHtml, 1301);

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      eventId: '12345',
      title: '혈액 수급 지원 프로모션',
      startDate: '2025.01.01',
      endDate: '2025.12.31',
      sourceUrl: 'https://www.bloodinfo.net/knrcbs/pr/promtn/progrsPromtnList.do?type=A&mi=1301',
    });
  });

  it('AC-1: Should extract multiple events from single page', () => {
    const mockHtml = `
      <a href="javascript:" data-id="111" class="promtnInfoBtn"><span>제목1</span></a>
      <a href="javascript:" data-id="111" class="promtnInfoBtn"><span>2025.01.01&nbsp;~&nbsp;2025.01.31</span></a>
      <a href="javascript:" data-id="222" class="promtnInfoBtn"><span>제목2</span></a>
      <a href="javascript:" data-id="222" class="promtnInfoBtn"><span>2025.02.01&nbsp;~&nbsp;2025.02.28</span></a>
    `;

    const events = parseEvents(mockHtml, 1302);

    expect(events).toHaveLength(2);
    expect(events[0].eventId).toBe('111');
    expect(events[1].eventId).toBe('222');
  });

  it('AC-1: Should handle missing data gracefully', () => {
    const mockHtml = '<div>No events</div>';

    const events = parseEvents(mockHtml, 1303);

    expect(events).toHaveLength(0);
  });

  it('AC-1: Should parse date range correctly', () => {
    const mockHtml = `
      <a href="javascript:" data-id="999" class="promtnInfoBtn"><span>Test Event</span></a>
      <a href="javascript:" data-id="999" class="promtnInfoBtn"><span>2025.06.15&nbsp;~&nbsp;2025.07.20</span></a>
    `;

    const events = parseEvents(mockHtml, 1301);

    expect(events[0].startDate).toBe('2025.06.15');
    expect(events[0].endDate).toBe('2025.07.20');
  });

  it('AC-1: Should extract title from span text', () => {
    const mockHtml = `
      <a href="javascript:" data-id="555" class="promtnInfoBtn"><span>온라인 헌혈 예약 이벤트</span></a>
      <a href="javascript:" data-id="555" class="promtnInfoBtn"><span>2025.01.01&nbsp;~&nbsp;2025.01.31</span></a>
    `;

    const events = parseEvents(mockHtml, 1301);

    expect(events[0].title).toBe('온라인 헌혈 예약 이벤트');
  });
});

// GENERATED FROM SPEC-bloodinfo-filter-001
describe('fetchAllEvents() - Category Filter and Deduplication', () => {
  // TEST-filter-1302
  it('AC-1: Should exclude mi=1302 and only fetch from 1301 and 1303', async () => {
    // Mock global fetch
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Mock responses for different mi values
    mockFetch.mockImplementation((url: string) => {
      const mockHtml = `
        <a href="javascript:" data-id="test-${url}" class="promtnInfoBtn"><span>Test Event</span></a>
        <a href="javascript:" data-id="test-${url}" class="promtnInfoBtn"><span>2025.01.01&nbsp;~&nbsp;2025.01.31</span></a>
      `;
      return Promise.resolve({
        ok: true,
        text: async () => mockHtml,
      } as Response);
    });

    await fetchAllEvents();

    // Verify fetch was called only for 1301 and 1303, NOT 1302
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('mi=1301'),
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('mi=1303'),
      expect.any(Object)
    );
    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.stringContaining('mi=1302'),
      expect.any(Object)
    );
  });

  // TEST-dedupe-events
  it('AC-2: Should deduplicate events with same eventId and log count', async () => {
    // Mock global fetch
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Mock console.log to capture deduplication message
    const consoleLogSpy = vi.spyOn(console, 'log');

    // Mock responses - same eventId "duplicate-123" in both categories
    mockFetch.mockImplementation((url: string) => {
      const mockHtml = `
        <a href="javascript:" data-id="duplicate-123" class="promtnInfoBtn"><span>Duplicate Event</span></a>
        <a href="javascript:" data-id="duplicate-123" class="promtnInfoBtn"><span>2025.01.01&nbsp;~&nbsp;2025.01.31</span></a>
      `;
      return Promise.resolve({
        ok: true,
        text: async () => mockHtml,
      } as Response);
    });

    const events = await fetchAllEvents();

    // Should only have 1 event (duplicate removed)
    expect(events).toHaveLength(1);
    expect(events[0].eventId).toBe('duplicate-123');

    // Should log the number of duplicates removed
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('duplicate')
    );

    consoleLogSpy.mockRestore();
  });

  // TEST-no-duplicates
  it('AC-3: Should return all events when no duplicates exist', async () => {
    // Mock global fetch
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      const mockHtml = `
        <a href="javascript:" data-id="unique-${callCount}" class="promtnInfoBtn"><span>Event ${callCount}</span></a>
        <a href="javascript:" data-id="unique-${callCount}" class="promtnInfoBtn"><span>2025.01.01&nbsp;~&nbsp;2025.01.31</span></a>
      `;
      return Promise.resolve({
        ok: true,
        text: async () => mockHtml,
      } as Response);
    });

    const events = await fetchAllEvents();

    // Should have 2 events (one from each category: 1301, 1303)
    expect(events).toHaveLength(2);
    expect(events[0].eventId).toBe('unique-1');
    expect(events[1].eventId).toBe('unique-2');
  });

  // SPEC-BRANCH-COVERAGE-001: Error handling tests
  // TEST-AC8-FETCH-FAILURE
  it('AC-8: Should log and throw error when fetchAndParseEvents fails', async () => {
    // Mock global fetch
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(fetchAndParseEvents(1301)).rejects.toThrow('Network error');

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  // TEST-AC9-CATEGORY-FAILURE-CONTINUES
  it('AC-9: Should continue with other categories when one category fetch fails', async () => {
    // Mock global fetch
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // First call (mi=1301) fails, second call (mi=1303) succeeds
    mockFetch
      .mockRejectedValueOnce(new Error('Failed for mi=1301'))
      .mockResolvedValueOnce({
        ok: true,
        text: async () => `
          <a href="javascript:" data-id="success-123" class="promtnInfoBtn"><span>Success Event</span></a>
          <a href="javascript:" data-id="success-123" class="promtnInfoBtn"><span>2025.01.01&nbsp;~&nbsp;2025.01.31</span></a>
        `,
      } as Response);

    const events = await fetchAllEvents();

    // Should have 1 event from the successful category
    expect(events).toHaveLength(1);
    expect(events[0].eventId).toBe('success-123');

    // Should log error for failed category
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to fetch events for mi=1301'),
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});

// SPEC-BRANCH-COVERAGE-001: BloodinfoParser interface test
describe('SPEC-BRANCH-COVERAGE-001: BloodinfoParser Interface', () => {
  // TEST-AC10-PARSER-INTERFACE
  it('AC-10: Should implement SiteParser interface correctly', async () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => `
        <a href="javascript:" data-id="parser-test-123" class="promtnInfoBtn"><span>Parser Test Event</span></a>
        <a href="javascript:" data-id="parser-test-123" class="promtnInfoBtn"><span>2025.01.01&nbsp;~&nbsp;2025.01.31</span></a>
      `,
    } as Response);

    const parser = new BloodinfoParser();

    expect(parser.siteId).toBe('bloodinfo');
    expect(parser.siteName).toBe('혈액정보');

    const events = await parser.fetchAndParse();

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      siteId: 'bloodinfo',
      siteName: '혈액정보',
      eventId: 'parser-test-123',
      title: 'Parser Test Event',
      startDate: '2025.01.01',
      endDate: '2025.01.31',
    });
  });
});

// SPEC-BRANCH-COVERAGE-001: Additional edge cases for branch coverage
describe('SPEC-BRANCH-COVERAGE-001: Edge Cases for Branch Coverage', () => {
  // TEST-AC11-NBSP-IN-DATE
  it('AC-11: Should handle &nbsp; in date text correctly', () => {
    const mockHtml = `
      <a href="javascript:" data-id="nbsp-test" class="promtnInfoBtn"><span>NBSP Test Event</span></a>
      <a href="javascript:" data-id="nbsp-test" class="promtnInfoBtn"><span>2025.01.01&nbsp;&nbsp;&nbsp;~&nbsp;&nbsp;&nbsp;2025.01.31</span></a>
    `;

    const events = parseEvents(mockHtml, 1301);

    expect(events).toHaveLength(1);
    expect(events[0].startDate).toBe('2025.01.01');
    expect(events[0].endDate).toBe('2025.01.31');
  });

  // TEST-AC12-INVALID-DATE-SPLIT
  it('AC-12: Should skip events with invalid date format (missing start or end)', () => {
    const mockHtml = `
      <a href="javascript:" data-id="invalid-date-1" class="promtnInfoBtn"><span>Invalid Date 1</span></a>
      <a href="javascript:" data-id="invalid-date-1" class="promtnInfoBtn"><span>2025.01.01</span></a>
      <a href="javascript:" data-id="invalid-date-2" class="promtnInfoBtn"><span>Invalid Date 2</span></a>
      <a href="javascript:" data-id="invalid-date-2" class="promtnInfoBtn"><span>~ 2025.01.31</span></a>
      <a href="javascript:" data-id="valid-event" class="promtnInfoBtn"><span>Valid Event</span></a>
      <a href="javascript:" data-id="valid-event" class="promtnInfoBtn"><span>2025.02.01 ~ 2025.02.28</span></a>
    `;

    const events = parseEvents(mockHtml, 1301);

    // Only the valid event should be parsed
    expect(events).toHaveLength(1);
    expect(events[0].eventId).toBe('valid-event');
    expect(events[0].title).toBe('Valid Event');
  });

  // TEST-AC13-MISSING-EVENTID
  it('AC-13: Should skip events without eventId attribute', () => {
    const mockHtml = `
      <a href="javascript:" class="promtnInfoBtn"><span>No Event ID</span></a>
      <a href="javascript:" class="promtnInfoBtn"><span>2025.01.01 ~ 2025.01.31</span></a>
      <a href="javascript:" data-id="with-id" class="promtnInfoBtn"><span>With ID</span></a>
      <a href="javascript:" data-id="with-id" class="promtnInfoBtn"><span>2025.02.01 ~ 2025.02.28</span></a>
    `;

    const events = parseEvents(mockHtml, 1301);

    // Only event with ID should be parsed
    expect(events).toHaveLength(1);
    expect(events[0].eventId).toBe('with-id');
  });

  // TEST-AC14-NO-DATE-LINK-FOUND
  it('AC-14: Should skip events when no matching date link is found', () => {
    const mockHtml = `
      <a href="javascript:" data-id="orphan-title" class="promtnInfoBtn"><span>Title Without Date</span></a>
      <a href="javascript:" data-id="different-id" class="promtnInfoBtn"><span>2025.01.01 ~ 2025.01.31</span></a>
      <a href="javascript:" data-id="complete" class="promtnInfoBtn"><span>Complete Event</span></a>
      <a href="javascript:" data-id="complete" class="promtnInfoBtn"><span>2025.02.01 ~ 2025.02.28</span></a>
    `;

    const events = parseEvents(mockHtml, 1301);

    // Only the complete event should be parsed
    expect(events).toHaveLength(1);
    expect(events[0].eventId).toBe('complete');
  });

  // TEST-AC15-HTTP-ERROR-RESPONSE
  it('AC-15: Should throw error when HTTP response is not ok', async () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    await expect(fetchAndParseEvents(1301)).rejects.toThrow('HTTP 404: Not Found');
  });
});
