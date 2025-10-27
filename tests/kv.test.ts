// GENERATED FROM SPEC-EVENT-COLLECTOR-001
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isEventSent, markEventAsSent } from '../src/kv';

// Mock KV Store - cast with vi.fn() to allow mock methods
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockKV = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  getWithMetadata: vi.fn(),
} as any as KVNamespace;

describe('KV Store Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TEST-AC2-DUPLICATE-CHECK
  it('AC-2: Should return true if event was previously sent', async () => {
    (mockKV.get as any).mockResolvedValue(JSON.stringify({ sentAt: '2025-01-01T00:00:00Z', title: 'Test Event' }));

    const result = await isEventSent(mockKV, 'bloodinfo', '12345');

    expect(result).toBe(true);
    expect(mockKV.get).toHaveBeenCalledWith('sent:bloodinfo:12345');
  });

  it('AC-2: Should return false if event was not sent', async () => {
    (mockKV.get as any).mockResolvedValue(null);

    const result = await isEventSent(mockKV, 'bloodinfo', '99999');

    expect(result).toBe(false);
    expect(mockKV.get).toHaveBeenCalledWith('sent:bloodinfo:99999');
  });

  it('AC-2: Should treat any value as sent (even corrupted)', async () => {
    // If KV returns anything, it means the key exists
    (mockKV.get as any).mockResolvedValue('invalid json');

    const result = await isEventSent(mockKV, 'bloodinfo', '54321');

    // The function checks if record is not null, so any value = sent
    expect(result).toBe(true);
  });

  it('AC-3: Should mark event as sent with timestamp', async () => {
    const event = {
      promtnSn: '111',
      title: '헌혈 이벤트',
    };

    await markEventAsSent(mockKV, 'bloodinfo', event.promtnSn, event.title);

    expect(mockKV.put).toHaveBeenCalledWith(
      'sent:bloodinfo:111',
      expect.stringContaining(event.title),
      expect.objectContaining({
        expirationTtl: 60 * 24 * 60 * 60, // 60 days in seconds
      })
    );
  });

  it('AC-3: Should handle KV write failures gracefully', async () => {
    (mockKV.put as any).mockRejectedValue(new Error('KV write failed'));

    const result = await markEventAsSent(mockKV, 'bloodinfo', '222', 'Test').catch((err: Error) => err.message);

    expect(result).toBe('KV write failed');
  });
});
