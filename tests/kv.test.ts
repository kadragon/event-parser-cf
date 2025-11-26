// GENERATED FROM SPEC-EVENT-COLLECTOR-001
// TRACE: SPEC-KV-COVERAGE-001
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  filterNewEvents,
  getSentEvents,
  isEventSent,
  markEventAsSent,
} from '../src/kv';
import { createMockKV } from './mocks/kv';

// Mock KV Store with proper typing
const mockKV = createMockKV();

describe('KV Store Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TEST-AC2-DUPLICATE-CHECK
  it('AC-2: Should return true if event was previously sent', async () => {
    vi.mocked(mockKV.get).mockResolvedValue(
      JSON.stringify({ sentAt: '2025-01-01T00:00:00Z', title: 'Test Event' })
    );

    const result = await isEventSent(mockKV, 'bloodinfo', '12345');

    expect(result).toBe(true);
    expect(mockKV.get).toHaveBeenCalledWith('sent:bloodinfo:12345');
  });

  it('AC-2: Should return false if event was not sent', async () => {
    vi.mocked(mockKV.get).mockResolvedValue(null);

    const result = await isEventSent(mockKV, 'bloodinfo', '99999');

    expect(result).toBe(false);
    expect(mockKV.get).toHaveBeenCalledWith('sent:bloodinfo:99999');
  });

  it('AC-2: Should treat any value as sent (even corrupted)', async () => {
    // If KV returns anything, it means the key exists
    vi.mocked(mockKV.get).mockResolvedValue('invalid json');

    const result = await isEventSent(mockKV, 'bloodinfo', '54321');

    // The function checks if record is not null, so any value = sent
    expect(result).toBe(true);
  });

  it('AC-3: Should mark event as sent with timestamp', async () => {
    const event = {
      eventId: '111',
      title: '헌혈 이벤트',
    };

    await markEventAsSent(mockKV, 'bloodinfo', event.eventId, event.title);

    expect(mockKV.put).toHaveBeenCalledWith(
      'sent:bloodinfo:111',
      expect.stringContaining(event.title),
      expect.objectContaining({
        expirationTtl: 60 * 24 * 60 * 60, // 60 days in seconds
      })
    );
  });

  it('AC-3: Should handle KV write failures gracefully', async () => {
    vi.mocked(mockKV.put).mockRejectedValue(new Error('KV write failed'));

    const result = await markEventAsSent(
      mockKV,
      'bloodinfo',
      '222',
      'Test'
    ).catch((err: Error) => err.message);

    expect(result).toBe('KV write failed');
  });
});

// SPEC-KV-COVERAGE-001: getSentEvents and filterNewEvents
describe('KV Advanced Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TEST-AC1-GET-SENT-EVENTS
  it('AC-1: SPEC-KV-COVERAGE-001 - Should return eventId array when KV list succeeds', async () => {
    const mockKeys = [
      { name: 'sent:bloodinfo:123' },
      { name: 'sent:ktcu:456' },
      { name: 'sent:bloodinfo:789' },
    ];

    vi.mocked(mockKV.list).mockResolvedValue({
      keys: mockKeys,
      list_complete: true,
      cacheStatus: null,
    });

    const result = await getSentEvents(mockKV);

    expect(result).toEqual(['bloodinfo:123', 'ktcu:456', 'bloodinfo:789']);
    expect(mockKV.list).toHaveBeenCalledWith({ prefix: 'sent:' });
  });

  // TEST-AC2-GET-SENT-EVENTS-ERROR
  it('AC-2: SPEC-KV-COVERAGE-001 - Should return empty array when KV list fails', async () => {
    vi.mocked(mockKV.list).mockRejectedValue(new Error('KV list failed'));

    const result = await getSentEvents(mockKV);

    expect(result).toEqual([]);
  });

  // TEST-AC3-FILTER-NEW-EVENTS
  it('AC-3: SPEC-KV-COVERAGE-001 - Should return only unsent events from mixed batch', async () => {
    const events = [
      { siteId: 'bloodinfo', eventId: '111' },
      { siteId: 'bloodinfo', eventId: '222' },
      { siteId: 'ktcu', eventId: '333' },
      { siteId: 'ktcu', eventId: '444' },
      { siteId: 'bloodinfo', eventId: '555' },
    ];

    // Mock: 111 and 333 were already sent
    vi.mocked(mockKV.get).mockImplementation(async (key: string) => {
      if (key === 'sent:bloodinfo:111' || key === 'sent:ktcu:333') {
        return JSON.stringify({ sentAt: '2025-01-01T00:00:00Z' });
      }
      return null;
    });

    const result = await filterNewEvents(mockKV, events);

    expect(result).toHaveLength(3);
    expect(result).toEqual([
      { siteId: 'bloodinfo', eventId: '222' },
      { siteId: 'ktcu', eventId: '444' },
      { siteId: 'bloodinfo', eventId: '555' },
    ]);
  });

  // TEST-AC4-FILTER-EMPTY
  it('AC-4: SPEC-KV-COVERAGE-001 - Should return empty array when input is empty', async () => {
    const result = await filterNewEvents(mockKV, []);

    expect(result).toEqual([]);
    expect(mockKV.get).not.toHaveBeenCalled();
  });

  // TEST-AC5-FILTER-KV-FAILURE
  it('AC-5: SPEC-KV-COVERAGE-001 - Should include events when KV read fails (resend fallback)', async () => {
    const events = [
      { siteId: 'bloodinfo', eventId: '111' },
      { siteId: 'bloodinfo', eventId: '222' },
    ];

    // Mock: 111 throws error, 222 returns null
    vi.mocked(mockKV.get).mockImplementation(async (key: string) => {
      if (key === 'sent:bloodinfo:111') {
        throw new Error('KV read failed');
      }
      return null;
    });

    const result = await filterNewEvents(mockKV, events);

    // Both should be included (111 due to error fallback, 222 due to not sent)
    expect(result).toHaveLength(2);
    expect(result).toEqual(events);
  });

  // TEST-AC6-IS-EVENT-SENT-ERROR
  it('AC-6: SPEC-KV-COVERAGE-001 - Should return false when KV.get throws error', async () => {
    vi.mocked(mockKV.get).mockRejectedValue(new Error('KV connection timeout'));

    const result = await isEventSent(mockKV, 'bloodinfo', '999');

    expect(result).toBe(false);
  });
});
