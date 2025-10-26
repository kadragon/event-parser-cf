// GENERATED FROM SPEC-EVENT-COLLECTOR-001
import { describe, it, expect, vi } from 'vitest';
import { sendEventNotification, sendErrorNotification } from '../src/telegram';

// Mock fetch
global.fetch = vi.fn();

describe('Telegram Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TEST-AC3-BATCH-NOTIFICATION
  it('AC-3: Should send batch notification with multiple events', async () => {
    const mockFetch = global.fetch as any;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
      text: async () => '{"ok": true}',
    });

    const events = [
      { promtnSn: '111', title: '이벤트 1', startDate: '2025.01.01', endDate: '2025.01.31', sourceUrl: 'mi=1301' },
      { promtnSn: '222', title: '이벤트 2', startDate: '2025.02.01', endDate: '2025.02.28', sourceUrl: 'mi=1302' },
    ];

    await sendEventNotification('test_token', '123456', events);

    expect(mockFetch).toHaveBeenCalled();
    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);

    expect(body.text).toContain('이벤트 1');
    expect(body.text).toContain('이벤트 2');
    expect(body.text).toContain('2025.01.01');
    expect(body.text).toContain('2025.02.28');
  });

  it('AC-3: Should include event links in message', async () => {
    const mockFetch = global.fetch as any;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
      text: async () => '{"ok": true}',
    });

    const events = [
      { promtnSn: '999', title: 'Test Event', startDate: '2025.01.01', endDate: '2025.01.31', sourceUrl: 'mi=1301' },
    ];

    await sendEventNotification('test_token', '123456', events);

    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);

    expect(body.text).toContain('mi=1301');
  });

  // TEST-AC4-ERROR-NOTIFICATION
  it('AC-4: Should send error notification on parse failure', async () => {
    const mockFetch = global.fetch as any;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
      text: async () => '{"ok": true}',
    });

    await sendErrorNotification('test_token', '123456', 'HTML parsing failed');

    expect(mockFetch).toHaveBeenCalled();
    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);

    expect(body.text).toContain('에러');
    expect(body.text).toContain('HTML parsing failed');
  });

  it('AC-4: Should handle Telegram API errors', async () => {
    const mockFetch = global.fetch as any;
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => '{"ok": false, "error_code": 429}',
    });

    const events = [
      { promtnSn: '111', title: 'Test', startDate: '2025.01.01', endDate: '2025.01.31', sourceUrl: 'mi=1301' },
    ];

    const result = await sendEventNotification('test_token', '123456', events).catch(err => err);

    expect(result).toBeDefined();
  });
});
