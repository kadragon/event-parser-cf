// GENERATED FROM SPEC-EVENT-COLLECTOR-001
import { CONFIG } from './config';

export interface SentRecord {
  sentAt: string; // ISO8601
  title: string;
  eventId: string;
}

/**
 * Check if an event was previously sent
 *
 * @param kv - Cloudflare KV namespace
 * @param siteId - Site identifier (e.g., 'bloodinfo', 'ktcu')
 * @param eventId - Event identifier
 * @returns true if event was sent, false otherwise
 */
export async function isEventSent(
  kv: KVNamespace,
  siteId: string,
  eventId: string
): Promise<boolean> {
  try {
    const key = `${CONFIG.kv.keyPrefix}${siteId}:${eventId}`;
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
 * @param siteId - Site identifier (e.g., 'bloodinfo', 'ktcu')
 * @param eventId - Event identifier
 * @param title - Event title
 */
export async function markEventAsSent(
  kv: KVNamespace,
  siteId: string,
  eventId: string,
  title: string
): Promise<void> {
  try {
    const key = `${CONFIG.kv.keyPrefix}${siteId}:${eventId}`;
    const record: SentRecord = {
      sentAt: new Date().toISOString(),
      title,
      eventId: eventId,
    };

    // TTL from config (in seconds)
    const ttl = CONFIG.kv.ttlDays * 24 * 60 * 60;

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
 * @returns List of event IDs that were sent
 */
export async function getSentEvents(kv: KVNamespace): Promise<string[]> {
  try {
    const sentIds: string[] = [];
    const list = await kv.list({ prefix: CONFIG.kv.keyPrefix });

    for (const item of list.keys) {
      const eventId = item.name.replace(CONFIG.kv.keyPrefix, '');
      sentIds.push(eventId);
    }

    return sentIds;
  } catch (error) {
    console.error('Error fetching sent events:', error);
    return [];
  }
}

/**
 * Filter events to only include new (unsent) ones with parallel KV reads
 *
 * @param kv - Cloudflare KV namespace
 * @param events - Events to filter (must have siteId and eventId)
 * @returns Only new events (in original order)
 * TRACE: SPEC-KV-PARALLEL-READS-001
 */
export async function filterNewEvents(
  kv: KVNamespace,
  events: Array<{ siteId: string; eventId: string }>
): Promise<Array<{ siteId: string; eventId: string }>> {
  if (events.length === 0) {
    return [];
  }

  const newEvents: Array<{ siteId: string; eventId: string }> = [];

  // Process events in batches with concurrency limit from config
  for (let i = 0; i < events.length; i += CONFIG.kv.readConcurrency) {
    const batch = events.slice(i, i + CONFIG.kv.readConcurrency);

    // Fetch sent status for all events in batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map((event) => isEventSent(kv, event.siteId, event.eventId))
    );

    // Collect new events from this batch (maintaining order)
    batchResults.forEach((result, idx) => {
      const event = batch[idx];
      if (result.status === 'fulfilled') {
        if (!result.value) {
          // Event not sent yet
          newEvents.push(event);
        }
      } else {
        // KV read failed - treat as not sent (resend)
        console.error(
          `Failed to check sent status for ${event.siteId}:${event.eventId}: ${result.reason}`
        );
        newEvents.push(event);
      }
    });
  }

  return newEvents;
}
