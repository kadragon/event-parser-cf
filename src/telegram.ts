// GENERATED FROM SPEC-EVENT-COLLECTOR-001
import type { Event } from './parser';
import type { SiteEvent } from './types/site-parser';

/**
 * Build Telegram message from events (supports both legacy Event and new SiteEvent)
 *
 * @param events - Events to notify about
 * @returns Formatted message text
 */
function buildEventMessage(events: Array<Event | SiteEvent>): string {
  if (events.length === 0) {
    return '새로운 이벤트가 없습니다.';
  }

  // Group events by site
  const eventsBySite: { [siteId: string]: Array<Event | SiteEvent> } = {};
  for (const event of events) {
    const siteId = (event as any).siteId || 'bloodinfo';
    if (!eventsBySite[siteId]) {
      eventsBySite[siteId] = [];
    }
    eventsBySite[siteId].push(event);
  }

  let message = '🩸 새로운 이벤트 안내\n\n';

  for (const siteId in eventsBySite) {
    const siteEvents = eventsBySite[siteId];
    const siteName = (siteEvents[0] as any).siteName || siteId;

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
 * @param botToken - Telegram Bot API token
 * @param chatId - Telegram chat ID
 * @param events - Events to notify about (supports both Event and SiteEvent)
 */
export async function sendEventNotification(botToken: string, chatId: string, events: Array<Event | SiteEvent>): Promise<void> {
  const message = buildEventMessage(events);

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as { ok: boolean; description?: string };
    if (!data.ok) {
      throw new Error(`Telegram error: ${data.description}`);
    }

    console.log(`Sent notification to Telegram with ${events.length} event(s)`);
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    throw error;
  }
}

/**
 * Send error notification to Telegram
 *
 * @param botToken - Telegram Bot API token
 * @param chatId - Telegram chat ID
 * @param errorMessage - Error description
 */
export async function sendErrorNotification(botToken: string, chatId: string, errorMessage: string): Promise<void> {
  const message = `⚠️ 혈액정보 수집 에러\n\n에러 메시지:\n${errorMessage}\n\n시간: ${new Date().toISOString()}`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as { ok: boolean; description?: string };
    if (!data.ok) {
      throw new Error(`Telegram error: ${data.description}`);
    }

    console.log('Sent error notification to Telegram');
  } catch (error) {
    console.error('Error sending error notification:', error);
    throw error;
  }
}
