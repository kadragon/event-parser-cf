// GENERATED FROM SPEC-EVENT-COLLECTOR-001
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEventNotification, sendErrorNotification } from '../src/telegram';
import type { SiteEvent } from '../src/types/site-parser';

// Mock fetch
const mockFetch = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).fetch = mockFetch;

describe('Telegram Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TEST-AC3-BATCH-NOTIFICATION
  it('AC-3: Should send batch notification with multiple events', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
      text: async () => '{"ok": true}',
    });

    const events: SiteEvent[] = [
      {
        siteId: 'bloodinfo',
        siteName: '혈액정보',
        eventId: '111',
        title: '이벤트 1',
        startDate: '2025.01.01',
        endDate: '2025.01.31',
        sourceUrl: 'https://www.bloodinfo.net/?mi=1301',
      },
      {
        siteId: 'bloodinfo',
        siteName: '혈액정보',
        eventId: '222',
        title: '이벤트 2',
        startDate: '2025.02.01',
        endDate: '2025.02.28',
        sourceUrl: 'https://www.bloodinfo.net/?mi=1302',
      },
    ];

    await sendEventNotification('test_token', '123456', events);

    expect(mockFetch).toHaveBeenCalled();
    const callArgs = mockFetch.mock.calls[0] as unknown[];
    const body = JSON.parse((callArgs[1] as Record<string, unknown>).body as string);

    expect(body.text).toContain('이벤트 1');
    expect(body.text).toContain('이벤트 2');
    expect(body.text).toContain('2025.01.01');
    expect(body.text).toContain('2025.02.28');
  });

  it('AC-3: Should include event links in message', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
      text: async () => '{"ok": true}',
    });

    const events: SiteEvent[] = [
      {
        siteId: 'bloodinfo',
        siteName: '혈액정보',
        eventId: '999',
        title: 'Test Event',
        startDate: '2025.01.01',
        endDate: '2025.01.31',
        sourceUrl: 'https://www.bloodinfo.net/?mi=1301',
      },
    ];

    await sendEventNotification('test_token', '123456', events);

    const callArgs = mockFetch.mock.calls[0] as unknown[];
    const body = JSON.parse((callArgs[1] as Record<string, unknown>).body as string);

    expect(body.text).toContain('https://www.bloodinfo.net/?mi=1301');
  });

  // TEST-AC4-ERROR-NOTIFICATION
  it('AC-4: Should send error notification on parse failure', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
      text: async () => '{"ok": true}',
    });

    await sendErrorNotification('test_token', '123456', 'HTML parsing failed');

    expect(mockFetch).toHaveBeenCalled();
    const callArgs = mockFetch.mock.calls[0] as unknown[];
    const body = JSON.parse((callArgs[1] as Record<string, unknown>).body as string);

    expect(body.text).toContain('오류');
    expect(body.text).toContain('HTML parsing failed');
  });

  it('AC-4: Should handle Telegram API errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => '{"ok": false, "error_code": 429}',
    });

    const events = [
      { promtnSn: '111', title: 'Test', startDate: '2025.01.01', endDate: '2025.01.31', sourceUrl: 'mi=1301' },
    ];

    const result = await sendEventNotification('test_token', '123456', events).catch((err: Error) => err);

    expect(result).toBeDefined();
  });
});
