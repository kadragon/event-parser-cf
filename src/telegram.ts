// GENERATED FROM SPEC-EVENT-COLLECTOR-001
// Trace: SPEC-TELEGRAM-LENGTH-001

import { CONFIG } from './config';
import type { SiteEvent } from './types/site-parser';
import { fetchWithTimeout } from './utils/fetch';
import { sanitizeText, stripHtmlForPlainText } from './utils/sanitize';

/**
 * Build Telegram message from events
 *
 * TRACE: SPEC-EVENT-COLLECTOR-001, SPEC-TELEGRAM-LENGTH-001
 * @param events - SiteEvents to notify about
 * @returns Object with message text (max 4096 chars) and truncation flag
 */
function buildEventMessage(events: SiteEvent[]): {
  text: string;
  isTruncated: boolean;
} {
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
    const siteName = sanitizeText(siteEvents[0]?.siteName || siteId);

    message += `<b>📍 ${siteName}</b>\n`;

    siteEvents.forEach((event, index) => {
      const escapedTitle = sanitizeText(event.title);
      const escapedStartDate = sanitizeText(event.startDate);
      const escapedEndDate = sanitizeText(event.endDate);
      const escapedUrl = sanitizeText(event.sourceUrl);

      message += `${index + 1}. ${escapedTitle}\n`;
      message += `   📅 ${escapedStartDate} ~ ${escapedEndDate}\n`;
      message += `   🔗 ${escapedUrl}\n\n`;
    });
  }

  // SPEC-TELEGRAM-LENGTH-001: Truncate if message exceeds Telegram's limit
  // AC-2 & AC-4: Strip HTML to prevent parse errors when truncated
  if (message.length > CONFIG.telegram.maxMessageLength) {
    // Use centralized security function to strip HTML safely
    // SECURITY: Handles nested tags and entity decoding in correct order
    const plainMessage = stripHtmlForPlainText(message);

    return {
      text: `${plainMessage.substring(0, CONFIG.telegram.safeTruncateLength)}...`,
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
export async function sendEventNotification(
  botToken: string,
  chatId: string,
  events: SiteEvent[]
): Promise<void> {
  const { text, isTruncated } = buildEventMessage(events);
  const apiUrl = `${CONFIG.telegram.apiBaseUrl}/bot${botToken}/sendMessage`;

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
      CONFIG.telegram.fetchTimeoutMs
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to send Telegram message: HTTP ${response.status} (${response.statusText}). ` +
          `Response: ${errorText}`
      );
    }

    const data = (await response.json()) as {
      ok: boolean;
      description?: string;
    };
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
export async function sendErrorNotification(
  botToken: string,
  chatId: string,
  errorMessage: string
): Promise<void> {
  const escapedErrorMessage = sanitizeText(errorMessage);
  const message = `⚠️ 이벤트 수집 오류\n\n오류 메시지:\n${escapedErrorMessage}\n\n발생 시간: ${new Date().toISOString()}`;
  const apiUrl = `${CONFIG.telegram.apiBaseUrl}/bot${botToken}/sendMessage`;

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
      CONFIG.telegram.fetchTimeoutMs
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to send error notification: HTTP ${response.status} (${response.statusText}). ` +
          `Response: ${errorText}`
      );
    }

    const data = (await response.json()) as {
      ok: boolean;
      description?: string;
    };
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
