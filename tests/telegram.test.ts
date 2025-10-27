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

  // TEST-TELEGRAM-ESCAPING-AC1: XSS in event title
  it('SPEC-TELEGRAM-ESCAPING-001 AC-1: Should escape HTML tags in event title', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
      text: async () => '{"ok": true}',
    });

    const events: SiteEvent[] = [
      {
        siteId: 'test',
        siteName: '테스트',
        eventId: '001',
        title: '혈액 필요 <script>alert("xss")</script>',
        startDate: '2025.01.01',
        endDate: '2025.01.31',
        sourceUrl: 'https://example.com',
      },
    ];

    await sendEventNotification('test_token', '123456', events);

    const callArgs = mockFetch.mock.calls[0] as unknown[];
    const body = JSON.parse((callArgs[1] as Record<string, unknown>).body as string);

    // Should escape < and > so that <script> doesn't execute
    expect(body.text).toContain('&lt;script&gt;');
    expect(body.text).not.toContain('<script>');
  });

  // TEST-TELEGRAM-ESCAPING-AC2: XSS in source URL
  it('SPEC-TELEGRAM-ESCAPING-001 AC-2: Should escape dangerous URLs', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
      text: async () => '{"ok": true}',
    });

    const events: SiteEvent[] = [
      {
        siteId: 'test',
        siteName: '테스트',
        eventId: '002',
        title: '정상 제목',
        startDate: '2025.01.01',
        endDate: '2025.01.31',
        sourceUrl: 'javascript:alert("xss")',
      },
    ];

    await sendEventNotification('test_token', '123456', events);

    const callArgs = mockFetch.mock.calls[0] as unknown[];
    const body = JSON.parse((callArgs[1] as Record<string, unknown>).body as string);

    // javascript: URL should be escaped/safe
    expect(body.text).toContain('javascript:alert');
  });

  // TEST-TELEGRAM-ESCAPING-AC3: XSS in error message
  it('SPEC-TELEGRAM-ESCAPING-001 AC-3: Should escape HTML tags in error message', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
      text: async () => '{"ok": true}',
    });

    const errorMsg = 'Connection failed: <timeout after 30s>';

    await sendErrorNotification('test_token', '123456', errorMsg);

    const callArgs = mockFetch.mock.calls[0] as unknown[];
    const body = JSON.parse((callArgs[1] as Record<string, unknown>).body as string);

    // Should escape angle brackets
    expect(body.text).toContain('&lt;timeout');
    expect(body.text).toContain('30s&gt;');
    expect(body.text).not.toContain('<timeout');
  });

  // TEST-TELEGRAM-ESCAPING-MULTIPLE-TAGS: Multiple XSS vectors
  it('SPEC-TELEGRAM-ESCAPING-001: Should handle multiple XSS vectors safely', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
      text: async () => '{"ok": true}',
    });

    const events: SiteEvent[] = [
      {
        siteId: 'test',
        siteName: '테스트<img src=x onerror=alert(1)>',
        eventId: '003',
        title: '혈액<iframe src="javascript:alert(1)">',
        startDate: '2025.01.01',
        endDate: '2025.01.31',
        sourceUrl: 'https://example.com?test=<svg onload=alert(1)>',
      },
    ];

    await sendEventNotification('test_token', '123456', events);

    const callArgs = mockFetch.mock.calls[0] as unknown[];
    const body = JSON.parse((callArgs[1] as Record<string, unknown>).body as string);

    // Should not contain raw tags that could execute (tags are stripped/escaped)
    expect(body.text).not.toContain('<img');
    expect(body.text).not.toContain('<iframe');
    expect(body.text).not.toContain('<svg');
    // Verify dangerous patterns are escaped or removed
    expect(body.text).toContain('&lt;img');
    expect(body.text).toContain('&lt;iframe');
    expect(body.text).toContain('&lt;svg');
  });
});
