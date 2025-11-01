// GENERATED FROM SPEC-EVENT-COLLECTOR-001
import { describe, it, expect, vi } from 'vitest';
import { parseEvents, fetchAllEvents } from '../src/parsers/bloodinfo';

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
});
