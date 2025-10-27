// GENERATED FROM SPEC-EVENT-COLLECTOR-001
import type { SiteEvent } from './types/site-parser';

/**
 * Telegram API Configuration
 */
const TELEGRAM_CONFIG = {
  FETCH_TIMEOUT_MS: 15000, // 15 seconds for API calls
} as const;

/**
 * Fetch with timeout support for API calls
 *
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds
 * @returns Response promise
 * @throws Error if fetch times out or fails
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Build Telegram message from events
 *
 * TRACE: SPEC-EVENT-COLLECTOR-001
 * @param events - SiteEvents to notify about
 * @returns Formatted message text
 */
function buildEventMessage(events: SiteEvent[]): string {
  if (events.length === 0) {
    return '새로운 이벤트가 없습니다.';
  }

  // Group events by site
  const eventsBySite: { [siteId: string]: SiteEvent[] } = {};
  for (const event of events) {
    if (!eventsBySite[event.siteId]) {
      eventsBySite[event.siteId] = [];
    }
    eventsBySite[event.siteId].push(event);
  }

  let message = '🩸 새로운 이벤트 안내\n\n';

  for (const siteId in eventsBySite) {
    const siteEvents = eventsBySite[siteId];
    const siteName = siteEvents[0]?.siteName || siteId;

    message += `<b>📍 ${siteName}</b>\n`;

    siteEvents.forEach((event, index) => {
      message += `${index + 1}. ${event.title}\n`;
      message += `   📅 ${event.startDate} ~ ${event.endDate}\n`;
      message += `   🔗 ${event.sourceUrl}\n\n`;
    });
  }

  return message;
}

/**
 * Send notification about new events to Telegram
 *
 * TRACE: SPEC-EVENT-COLLECTOR-001
 * @param botToken - Telegram Bot API token
 * @param chatId - Telegram chat ID
 * @param events - SiteEvents to notify about
 * @throws Error if notification fails
 */
export async function sendEventNotification(botToken: string, chatId: string, events: SiteEvent[]): Promise<void> {
  const message = buildEventMessage(events);
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetchWithTimeout(
      apiUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      },
      TELEGRAM_CONFIG.FETCH_TIMEOUT_MS
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to send Telegram message: HTTP ${response.status} (${response.statusText}). ` +
          `Response: ${errorText}`
      );
    }

    const data = (await response.json()) as { ok: boolean; description?: string };
    if (!data.ok) {
      throw new Error(
        `Telegram API rejected request: ${data.description || 'unknown error'}`
      );
    }

    console.log(`Sent notification to Telegram with ${events.length} event(s)`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to send event notification: ${errorMsg}`);
    throw error;
  }
}

/**
 * Send error notification to Telegram
 *
 * TRACE: SPEC-EVENT-COLLECTOR-001
 * @param botToken - Telegram Bot API token
 * @param chatId - Telegram chat ID
 * @param errorMessage - Error description
 * @throws Error if notification fails
 */
export async function sendErrorNotification(botToken: string, chatId: string, errorMessage: string): Promise<void> {
  const message = `⚠️ 이벤트 수집 오류\n\n오류 메시지:\n${errorMessage}\n\n발생 시간: ${new Date().toISOString()}`;
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetchWithTimeout(
      apiUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      },
      TELEGRAM_CONFIG.FETCH_TIMEOUT_MS
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to send error notification: HTTP ${response.status} (${response.statusText}). ` +
          `Response: ${errorText}`
      );
    }

    const data = (await response.json()) as { ok: boolean; description?: string };
    if (!data.ok) {
      throw new Error(
        `Telegram API rejected error notification: ${data.description || 'unknown error'}`
      );
    }

    console.log('Sent error notification to Telegram');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to send error notification: ${errorMsg}`);
    throw error;
  }
}
