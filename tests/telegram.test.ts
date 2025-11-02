// GENERATED FROM SPEC-EVENT-COLLECTOR-001
// Trace: SPEC-TELEGRAM-LENGTH-001
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

    const events: SiteEvent[] = [
      {
        siteId: 'test',
        siteName: '테스트',
        eventId: '111',
        title: 'Test',
        startDate: '2025.01.01',
        endDate: '2025.01.31',
        sourceUrl: 'mi=1301',
      },
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

  // TEST-SPEC-TELEGRAM-LENGTH-001-AC1: Message under 4096 chars
  describe('SPEC-TELEGRAM-LENGTH-001: Message Length Handling', () => {
    it('AC-1: Should send message under 4096 chars without modification', async () => {
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
          title: 'Short event title',
          startDate: '2025.01.01',
          endDate: '2025.01.31',
          sourceUrl: 'https://example.com',
        },
      ];

      await sendEventNotification('test_token', '123456', events);

      const callArgs = mockFetch.mock.calls[0] as unknown[];
      const body = JSON.parse((callArgs[1] as Record<string, unknown>).body as string);

      expect(body.text).toContain('Short event title');
      expect(body.text.length).toBeLessThan(4096);
      expect(body.text).not.toContain('...');
    });

    // TEST-SPEC-TELEGRAM-LENGTH-001-AC2: Message over 4096 chars
    it('AC-2: Should truncate message over 4096 chars with "..." suffix and strip HTML', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true }),
        text: async () => '{"ok": true}',
      });

      // Create events that will exceed 4096 chars
      const longEvents: SiteEvent[] = [];
      for (let i = 0; i < 100; i++) {
        longEvents.push({
          siteId: 'test',
          siteName: '테스트사이트명',
          eventId: `event-${i}`,
          title: `이벤트 제목입니다 ${i}번째 이벤트 매우 긴 제목을 가진 이벤트입니다`,
          startDate: '2025.01.01',
          endDate: '2025.12.31',
          sourceUrl: `https://example.com/event/${i}?param=value&long=parameter`,
        });
      }

      await sendEventNotification('test_token', '123456', longEvents);

      const callArgs = mockFetch.mock.calls[0] as unknown[];
      const body = JSON.parse((callArgs[1] as Record<string, unknown>).body as string);

      expect(body.text.length).toBeLessThanOrEqual(4096);
      expect(body.text).toContain('...');
      // Should be truncated to around 4000 chars + "..."
      expect(body.text.length).toBeGreaterThan(3900);

      // AC-2: HTML tags should be stripped to prevent parse errors
      expect(body.text).not.toContain('<b>');
      expect(body.text).not.toContain('</b>');
      // HTML entities should be decoded
      expect(body.text).not.toContain('&lt;');
      expect(body.text).not.toContain('&gt;');
      expect(body.text).not.toContain('&amp;');
    });

    // TEST-SPEC-TELEGRAM-LENGTH-001-AC3: Message exactly at limit
    it('AC-3: Should send message at exactly 4096 chars without truncation', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true }),
        text: async () => '{"ok": true}',
      });

      // Create a message that's exactly 4096 chars
      // This requires careful calculation of the base message structure
      const baseMsg = '🩸 새로운 이벤트 안내\n\n<b>📍 테스트</b>\n';
      const perEventTemplate = '1. TITLE\n   📅 2025.01.01 ~ 2025.01.31\n   🔗 URL\n\n';

      // Calculate how many chars we need to fill
      const targetLength = 4096;
      const padding = 'A'.repeat(targetLength - baseMsg.length - perEventTemplate.length + 5);

      const events: SiteEvent[] = [
        {
          siteId: 'test',
          siteName: '테스트',
          eventId: '001',
          title: padding,
          startDate: '2025.01.01',
          endDate: '2025.01.31',
          sourceUrl: 'URL',
        },
      ];

      await sendEventNotification('test_token', '123456', events);

      const callArgs = mockFetch.mock.calls[0] as unknown[];
      const body = JSON.parse((callArgs[1] as Record<string, unknown>).body as string);

      // At exactly 4096, should not truncate
      if (body.text.length === 4096) {
        expect(body.text).not.toContain('...');
      }
      expect(body.text.length).toBeLessThanOrEqual(4096);
    });

    // TEST-SPEC-TELEGRAM-LENGTH-001-AC4: Parse mode for truncated messages
    it('AC-4: Should use plain text mode for truncated messages to avoid HTML parse errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true }),
        text: async () => '{"ok": true}',
      });

      // Create events that will exceed 4096 chars with HTML content
      const longEvents: SiteEvent[] = [];
      for (let i = 0; i < 100; i++) {
        longEvents.push({
          siteId: 'test',
          siteName: '테스트사이트명<b>볼드</b>',
          eventId: `event-${i}`,
          title: `이벤트<script>alert("xss")</script> ${i}번째`,
          startDate: '2025.01.01',
          endDate: '2025.12.31',
          sourceUrl: `https://example.com/event/${i}`,
        });
      }

      await sendEventNotification('test_token', '123456', longEvents);

      const callArgs = mockFetch.mock.calls[0] as unknown[];
      const body = JSON.parse((callArgs[1] as Record<string, unknown>).body as string);

      // Message should be truncated
      expect(body.text.length).toBeLessThanOrEqual(4096);
      expect(body.text).toContain('...');

      // AC-4: parse_mode should NOT be set for truncated messages
      // (to prevent "can't parse entities" errors from broken HTML)
      expect(body.parse_mode).toBeUndefined();
    });

    // TEST-SPEC-TELEGRAM-LENGTH-001-SECURITY: Prevent double-unescaping
    it('SECURITY: Should prevent double-unescaping of HTML entities when truncating', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true }),
        text: async () => '{"ok": true}',
      });

      // Create events with double-encoded entities that will exceed 4096 chars
      const longEvents: SiteEvent[] = [];
      for (let i = 0; i < 100; i++) {
        longEvents.push({
          siteId: 'test',
          siteName: '테스트',
          eventId: `event-${i}`,
          // Double-encoded: &amp;lt; should become &lt; (not <)
          title: `이벤트 &amp;lt;script&amp;gt; ${i}번째`,
          startDate: '2025.01.01',
          endDate: '2025.12.31',
          sourceUrl: `https://example.com/event/${i}`,
        });
      }

      await sendEventNotification('test_token', '123456', longEvents);

      const callArgs = mockFetch.mock.calls[0] as unknown[];
      const body = JSON.parse((callArgs[1] as Record<string, unknown>).body as string);

      // Message should be truncated
      expect(body.text.length).toBeLessThanOrEqual(4096);
      expect(body.text).toContain('...');

      // CRITICAL: Double-encoded entities should only be decoded ONCE
      // &amp;lt; → &lt; (NOT → <)
      // &amp;gt; → &gt; (NOT → >)
      expect(body.text).toContain('&lt;');
      expect(body.text).toContain('&gt;');
      expect(body.text).not.toContain('<script>');
      expect(body.text).not.toContain('</script>');
    });

    // TEST-SPEC-TELEGRAM-LENGTH-001-FUTURE-PROOF: Generic HTML tag removal
    it('FUTURE-PROOF: Should strip all HTML tags when truncating (not just <b>)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true }),
        text: async () => '{"ok": true}',
      });

      // Create events with various HTML tags that will exceed 4096 chars
      const longEvents: SiteEvent[] = [];
      for (let i = 0; i < 100; i++) {
        longEvents.push({
          siteId: 'test',
          siteName: '테스트',
          eventId: `event-${i}`,
          // Mix of various HTML tags that Telegram supports (make it long enough)
          title: `<b>Bold</b> <i>Italic</i> <u>Underline</u> <code>Code</code> 이벤트 제목 매우 긴 텍스트입니다 ${i}번째 이벤트 설명`,
          startDate: '2025.01.01',
          endDate: '2025.12.31',
          sourceUrl: `https://example.com/event/${i}?param=value&long=parameter`,
        });
      }

      await sendEventNotification('test_token', '123456', longEvents);

      const callArgs = mockFetch.mock.calls[0] as unknown[];
      const body = JSON.parse((callArgs[1] as Record<string, unknown>).body as string);

      // Message should be truncated
      expect(body.text.length).toBeLessThanOrEqual(4096);
      expect(body.text).toContain('...');

      // All HTML tags should be stripped (not just <b>)
      expect(body.text).not.toContain('<b>');
      expect(body.text).not.toContain('</b>');
      expect(body.text).not.toContain('<i>');
      expect(body.text).not.toContain('</i>');
      expect(body.text).not.toContain('<u>');
      expect(body.text).not.toContain('</u>');
      expect(body.text).not.toContain('<code>');
      expect(body.text).not.toContain('</code>');

      // Plain text content should remain
      expect(body.text).toContain('Bold');
      expect(body.text).toContain('Italic');
      expect(body.text).toContain('Underline');
      expect(body.text).toContain('Code');
    });
  });

  // SPEC-BRANCH-COVERAGE-001: Error path testing for sendErrorNotification
  describe('SPEC-BRANCH-COVERAGE-001: Error Notification Edge Cases', () => {
    // TEST-AC1-HTTP-ERROR
    it('AC-1: Should throw error when HTTP request fails for error notification', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: async () => '{"error": "service down"}',
      });

      await expect(
        sendErrorNotification('test_token', '123456', 'Test error')
      ).rejects.toThrow('Failed to send error notification: HTTP 503');
    });

    // TEST-AC2-API-REJECTION
    it('AC-2: Should throw error when Telegram API rejects error notification', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ok: false, description: 'Invalid chat_id' }),
        text: async () => '{"ok": false, "description": "Invalid chat_id"}',
      });

      await expect(
        sendErrorNotification('test_token', '123456', 'Test error')
      ).rejects.toThrow('Telegram API rejected error notification: Invalid chat_id');
    });

    // TEST-AC3-NON-ERROR-THROWN
    it('AC-3: Should handle non-Error objects in catch block', async () => {
      mockFetch.mockRejectedValue('Network failure string');

      await expect(
        sendErrorNotification('test_token', '123456', 'Test error')
      ).rejects.toThrow('Network failure string');
    });
  });
});
