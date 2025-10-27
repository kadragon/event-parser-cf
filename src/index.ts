// GENERATED FROM SPEC-EVENT-COLLECTOR-001

import { BloodinfoParser } from './parser';
import { KtcuParser } from './parsers/ktcu';
import { filterNewEvents, markEventAsSent } from './kv';
import { sendEventNotification, sendErrorNotification } from './telegram';
import type { SiteParser, SiteEvent } from './types/site-parser';

interface Env {
  EVENTS_KV: KVNamespace;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

interface ScheduledEvent {
  cron: string;
}

/**
 * Site parser registry - add new parsers here
 * TRACE: SPEC-KTCU-PARSER-001
 */
const siteParserRegistry: SiteParser[] = [
  new BloodinfoParser(),
  new KtcuParser(),
];

/**
 * Main worker handler for scheduled events (cron)
 * Fetches events from all configured sites, filters new ones, and sends Telegram notification
 */
async function handleScheduled(event: ScheduledEvent, env: Env): Promise<void> {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;

  console.log(`[${new Date().toISOString()}] Starting event collection job`);

  try {
    // Step 1: Fetch events from all registered site parsers in parallel
    console.log(`Step 1: Fetching events from ${siteParserRegistry.length} site(s) in parallel...`);

    const parserResults = await Promise.allSettled(
      siteParserRegistry.map(async (parser) => {
        try {
          console.log(`  Fetching from ${parser.siteName} (${parser.siteId})...`);
          const events = await parser.fetchAndParse();
          console.log(`  Got ${events.length} event(s) from ${parser.siteName}`);
          return { parser, events, status: 'success' as const };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`  Error fetching from ${parser.siteName}: ${errorMsg}`);
          return { parser, events: [], status: 'failed' as const, error: errorMsg };
        }
      })
    );

    // Collect all events from successful parsers and track errors
    const allEvents: SiteEvent[] = [];
    const parserErrors: Array<{ parser: string; error: string }> = [];

    for (const result of parserResults) {
      if (result.status === 'fulfilled') {
        if (result.value.status === 'success') {
          allEvents.push(...result.value.events);
        } else {
          // Parser execution succeeded but returned 'failed' status
          parserErrors.push({
            parser: result.value.parser.siteName,
            error: result.value.error || 'Unknown error',
          });
        }
      } else {
        // Promise was rejected
        const parser = siteParserRegistry[parserResults.indexOf(result)];
        parserErrors.push({
          parser: parser?.siteName || 'Unknown',
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
      }
    }

    console.log(`Fetched ${allEvents.length} total events from all sites`);

    // Step 2.5: Check if all parsers failed
    if (allEvents.length === 0 && parserErrors.length === siteParserRegistry.length) {
      // All parsers failed - aggregate errors and send alert
      console.error(`All ${siteParserRegistry.length} parser(s) failed!`);

      const errorSummary = parserErrors
        .map((e) => `⚠️ ${e.parser}:\n${e.error}`)
        .join('\n\n');

      const message = `❌ 모든 파서 실패 (${parserErrors.length}개)\n\n${errorSummary}`;
      console.error(message);

      try {
        await sendErrorNotification(botToken, chatId, message);
        console.log('Sent all-parser-failure alert to Telegram');
      } catch (telegramError) {
        console.error('Failed to send all-parser-failure alert:', telegramError);
      }

      // Return early since there's nothing to process
      return;
    }

    // Step 2: Filter to only new events
    console.log('Step 2: Filtering new events...');
    const newEvents = await filterNewEvents(
      env.EVENTS_KV,
      allEvents.map((e) => ({ siteId: e.siteId, eventId: e.eventId }))
    );
    console.log(`Found ${newEvents.length} new event(s)`);

    // Step 3: Send notification if there are new events
    if (newEvents.length > 0) {
      console.log('Step 3: Sending Telegram notification...');

      // Get full event details for events marked as new
      const newEventIds = new Set(newEvents.map((e) => `${e.siteId}:${e.eventId}`));
      const eventsToSend = allEvents.filter((e) => newEventIds.has(`${e.siteId}:${e.eventId}`));

      await sendEventNotification(botToken, chatId, eventsToSend);

      // Step 4: Mark all sent events in KV Store
      console.log('Step 4: Marking events as sent in KV Store...');
      for (const event of eventsToSend) {
        await markEventAsSent(env.EVENTS_KV, event.siteId, event.eventId, event.title);
      }

      console.log(`Successfully sent ${eventsToSend.length} event notification(s)`);
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
