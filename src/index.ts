// GENERATED FROM SPEC-EVENT-COLLECTOR-001

import { fetchAllEvents } from './parser';
import { filterNewEvents, markEventAsSent } from './kv';
import { sendEventNotification, sendErrorNotification } from './telegram';

interface Env {
  BLOODINFO_EVENTS_KV: KVNamespace;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

interface ScheduledEvent {
  cron: string;
}

/**
 * Main worker handler for scheduled events (cron)
 * Fetches events, filters new ones, and sends Telegram notification
 */
async function handleScheduled(event: ScheduledEvent, env: Env): Promise<void> {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;

  console.log(`[${new Date().toISOString()}] Starting event collection job`);

  try {
    // Step 1: Fetch all events from all three categories
    console.log('Step 1: Fetching events from bloodinfo.net...');
    const allEvents = await fetchAllEvents();
    console.log(`Fetched ${allEvents.length} total events`);

    // Step 2: Filter to only new events
    console.log('Step 2: Filtering new events...');
    const newEvents = await filterNewEvents(env.BLOODINFO_EVENTS_KV, allEvents);
    console.log(`Found ${newEvents.length} new event(s)`);

    // Step 3: Send notification if there are new events
    if (newEvents.length > 0) {
      console.log('Step 3: Sending Telegram notification...');

      // Cast to Event type for Telegram module
      const eventsForTelegram = newEvents as any[];
      await sendEventNotification(botToken, chatId, eventsForTelegram);

      // Step 4: Mark all sent events in KV Store
      console.log('Step 4: Marking events as sent in KV Store...');
      for (const event of newEvents) {
        const e = event as any;
        await markEventAsSent(env.BLOODINFO_EVENTS_KV, e.promtnSn, e.title);
      }

      console.log(`Successfully sent ${newEvents.length} event notification(s)`);
    } else {
      console.log('No new events to send - skipping notification');
    }
  } catch (error) {
    console.error('Error during event collection:', error);

    // Send error notification to Telegram
    const errorMessage = error instanceof Error ? error.message : String(error);

    try {
      await sendErrorNotification(botToken, chatId, errorMessage);
      console.log('Sent error notification to Telegram');
    } catch (telegramError) {
      console.error('Failed to send error notification:', telegramError);
    }

    // Re-throw to signal failure to Workers
    throw error;
  }
}

/**
 * Export the scheduled handler
 */
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleScheduled(event, env));
  },
};
