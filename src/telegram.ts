// GENERATED FROM SPEC-EVENT-COLLECTOR-001
// Trace: SPEC-TELEGRAM-LENGTH-001
import type { SiteEvent } from './types/site-parser';
import { filterXSS } from 'xss';

/**
 * Telegram API Configuration
 */
const TELEGRAM_CONFIG = {
  FETCH_TIMEOUT_MS: 15000, // 15 seconds for API calls
  MAX_MESSAGE_LENGTH: 4096, // Telegram's message length limit
  SAFE_TRUNCATE_LENGTH: 4000, // Truncate to this length to leave room for "..."
} as const;

/**
 * XSS filter options: escape all HTML tags to prevent any injection
 */
const XSS_FILTER_OPTIONS = {
  whiteList: {}, // Empty whitelist: allow no HTML tags
  stripLeadingAndTrailingWhitespace: false,
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
 * TRACE: SPEC-EVENT-COLLECTOR-001, SPEC-TELEGRAM-LENGTH-001
 * @param events - SiteEvents to notify about
 * @returns Object with message text (max 4096 chars) and truncation flag
 */
function buildEventMessage(events: SiteEvent[]): { text: string; isTruncated: boolean } {
  if (events.length === 0) {
    return { text: '새로운 이벤트가 없습니다.', isTruncated: false };
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
    const siteName = filterXSS(siteEvents[0]?.siteName || siteId, XSS_FILTER_OPTIONS as Parameters<typeof filterXSS>[1]);

    message += `<b>📍 ${siteName}</b>\n`;

    siteEvents.forEach((event, index) => {
      const escapedTitle = filterXSS(event.title, XSS_FILTER_OPTIONS as Parameters<typeof filterXSS>[1]);
      const escapedStartDate = filterXSS(event.startDate, XSS_FILTER_OPTIONS as Parameters<typeof filterXSS>[1]);
      const escapedEndDate = filterXSS(event.endDate, XSS_FILTER_OPTIONS as Parameters<typeof filterXSS>[1]);
      const escapedUrl = filterXSS(event.sourceUrl, XSS_FILTER_OPTIONS as Parameters<typeof filterXSS>[1]);

      message += `${index + 1}. ${escapedTitle}\n`;
      message += `   📅 ${escapedStartDate} ~ ${escapedEndDate}\n`;
      message += `   🔗 ${escapedUrl}\n\n`;
    });
  }

  // SPEC-TELEGRAM-LENGTH-001: Truncate if message exceeds Telegram's limit
  // AC-2 & AC-4: Strip HTML to prevent parse errors when truncated
  if (message.length > TELEGRAM_CONFIG.MAX_MESSAGE_LENGTH) {
    // Remove HTML tags and decode entities for safe plain-text truncation
    // Strategy: Decode entities first (except &amp;), then remove all tags, then decode &amp;
    // IMPORTANT: Decode &amp; LAST to prevent double-unescaping (CodeQL security issue)
    const plainMessage = message
      .replace(/&lt;/g, '<')  // Decode HTML entities first (so tags become recognizable)
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/<[^>]+>/g, '') // Remove all HTML tags (future-proof for <i>, <u>, <code>, etc.)
      .replace(/&amp;/g, '&'); // MUST be last to prevent double-unescaping

    return {
      text: plainMessage.substring(0, TELEGRAM_CONFIG.SAFE_TRUNCATE_LENGTH) + '...',
      isTruncated: true,
    };
  }

  return { text: message, isTruncated: false };
}

/**
 * Send notification about new events to Telegram
 *
 * TRACE: SPEC-EVENT-COLLECTOR-001, SPEC-TELEGRAM-LENGTH-001
 * @param botToken - Telegram Bot API token
 * @param chatId - Telegram chat ID
 * @param events - SiteEvents to notify about
 * @throws Error if notification fails
 */
export async function sendEventNotification(botToken: string, chatId: string, events: SiteEvent[]): Promise<void> {
  const { text, isTruncated } = buildEventMessage(events);
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  // AC-4: Use plain text mode for truncated messages to avoid HTML parse errors
  const requestBody: { chat_id: string; text: string; parse_mode?: string } = {
    chat_id: chatId,
    text: text,
  };

  // Only set parse_mode for non-truncated messages to preserve HTML formatting
  if (!isTruncated) {
    requestBody.parse_mode = 'HTML';
  }

  try {
    const response = await fetchWithTimeout(
      apiUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
  const escapedErrorMessage = filterXSS(errorMessage, XSS_FILTER_OPTIONS as Parameters<typeof filterXSS>[1]);
  const message = `⚠️ 이벤트 수집 오류\n\n오류 메시지:\n${escapedErrorMessage}\n\n발생 시간: ${new Date().toISOString()}`;
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
