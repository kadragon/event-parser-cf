// GENERATED FROM SPEC-EVENT-COLLECTOR-001

export interface SentRecord {
  sentAt: string; // ISO8601
  title: string;
  promtnSn: string;
}

/**
 * Check if an event was previously sent
 *
 * @param kv - Cloudflare KV namespace
 * @param promtnSn - Event identifier
 * @returns true if event was sent, false otherwise
 */
export async function isEventSent(kv: KVNamespace, promtnSn: string): Promise<boolean> {
  try {
    const key = `sent:${promtnSn}`;
    const record = await kv.get(key);
    return record !== null;
  } catch (error) {
    console.error('Error checking sent status:', error);
    // Fallback: assume not sent on error (will resend)
    return false;
  }
}

/**
 * Mark an event as sent by storing it in KV
 *
 * @param kv - Cloudflare KV namespace
 * @param promtnSn - Event identifier
 * @param title - Event title
 */
export async function markEventAsSent(kv: KVNamespace, promtnSn: string, title: string): Promise<void> {
  try {
    const key = `sent:${promtnSn}`;
    const record: SentRecord = {
      sentAt: new Date().toISOString(),
      title,
      promtnSn,
    };

    // 60 days TTL (in seconds)
    const ttl = 60 * 24 * 60 * 60;

    await kv.put(key, JSON.stringify(record), {
      expirationTtl: ttl,
    });
  } catch (error) {
    console.error('Error marking event as sent:', error);
    throw error;
  }
}

/**
 * Get all sent event IDs (for debugging/monitoring)
 *
 * @param kv - Cloudflare KV namespace
 * @returns List of promtnSn that were sent
 */
export async function getSentEvents(kv: KVNamespace): Promise<string[]> {
  try {
    const sentIds: string[] = [];
    const list = await kv.list({ prefix: 'sent:' });

    for (const item of list.keys) {
      const promtnSn = item.name.replace('sent:', '');
      sentIds.push(promtnSn);
    }

    return sentIds;
  } catch (error) {
    console.error('Error fetching sent events:', error);
    return [];
  }
}

/**
 * Filter events to only include new (unsent) ones
 *
 * @param kv - Cloudflare KV namespace
 * @param events - Events to filter
 * @returns Only new events
 */
export async function filterNewEvents(kv: KVNamespace, events: Array<{ promtnSn: string }>): Promise<Array<{ promtnSn: string }>> {
  const newEvents = [];

  for (const event of events) {
    const sent = await isEventSent(kv, event.promtnSn);
    if (!sent) {
      newEvents.push(event);
    }
  }

  return newEvents;
}
