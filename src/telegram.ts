// GENERATED FROM SPEC-EVENT-COLLECTOR-001
import type { Event } from './parser';

/**
 * Build Telegram message from events
 *
 * @param events - Events to notify about
 * @returns Formatted message text
 */
function buildEventMessage(events: Event[]): string {
  if (events.length === 0) {
    return '새로운 이벤트가 없습니다.';
  }

  let message = '🩸 혈액정보 새 이벤트 안내\n\n';

  events.forEach((event, index) => {
    message += `📌 이벤트 ${index + 1}: ${event.title}\n`;
    message += `   기간: ${event.startDate} ~ ${event.endDate}\n`;
    message += `   링크: https://www.bloodinfo.net/knrcbs/pr/promtn/progrsPromtnList.do?${event.sourceUrl}\n\n`;
  });

  // Add a more direct link if single category
  const sourceUrls = [...new Set(events.map((e) => e.sourceUrl))];
  message += '🔗 상세보기:\n';
  sourceUrls.forEach((url) => {
    message += `- https://www.bloodinfo.net/knrcbs/pr/promtn/progrsPromtnList.do?${url}\n`;
  });

  return message;
}

/**
 * Send notification about new events to Telegram
 *
 * @param botToken - Telegram Bot API token
 * @param chatId - Telegram chat ID
 * @param events - Events to notify about
 */
export async function sendEventNotification(botToken: string, chatId: string, events: Event[]): Promise<void> {
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

    const data = await response.json();
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

    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Telegram error: ${data.description}`);
    }

    console.log('Sent error notification to Telegram');
  } catch (error) {
    console.error('Error sending error notification:', error);
    throw error;
  }
}
