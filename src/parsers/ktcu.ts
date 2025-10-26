/**
 * KTCU (농협은행) 사이트 파서
 * URL: https://www.ktcu.or.kr/PPW-WFA-100101
 *
 * IMPLEMENTATION NOTE:
 * - Replace with actual HTML parsing logic after inspecting the target site
 * - Update CSS selectors based on the actual site structure
 */

import { load } from 'cheerio';
import type { SiteParser, SiteEvent } from '../types/site-parser';

export interface KtcuEvent {
  eventId: string;
  title: string;
  startDate: string;
  endDate: string;
  sourceUrl: string;
}

/**
 * Parse HTML from KTCU site and extract events
 *
 * @param html - Raw HTML content
 * @returns Array of parsed events
 */
export function parseKtcuEvents(html: string): KtcuEvent[] {
  const events: KtcuEvent[] = [];

  try {
    const $ = load(html);

    // TODO: Update these selectors based on actual KTCU site structure
    // This is a placeholder - inspect the site and update accordingly
    const eventElements = $('div.event-item, tr.event-row, li.event-list-item');

    eventElements.each((index, element) => {
      try {
        const $el = $(element);

        // TODO: Extract event ID (use unique identifier from the site)
        const eventId = $el.attr('data-id') || $el.attr('data-event-id') || `event-${Date.now()}-${index}`;

        // TODO: Update selectors to match KTCU site
        const title = $el.find('.event-title, .title, h3').text().trim();
        const dateRange = $el.find('.event-date, .date, .period').text().trim();

        if (!title || !dateRange) {
          return; // Skip if missing required fields
        }

        // Parse date range (adjust format as needed)
        const [startDate, endDate] = dateRange.split(/~|-|→/).map((d) => d.trim());

        if (!startDate || !endDate) {
          return;
        }

        const sourceUrl = $el.find('a').attr('href') || '';

        events.push({
          eventId,
          title,
          startDate,
          endDate,
          sourceUrl,
        });
      } catch (error) {
        console.error('Error parsing KTCU event item:', error);
      }
    });
  } catch (error) {
    console.error('Error loading KTCU HTML:', error);
    throw new Error(`Failed to parse KTCU HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return events;
}

/**
 * Fetch and parse events from KTCU site
 *
 * @returns Array of parsed events
 */
export async function fetchAndParseKtcuEvents(): Promise<KtcuEvent[]> {
  const url = 'https://www.ktcu.or.kr/PPW-WFA-100101';

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    return parseKtcuEvents(html);
  } catch (error) {
    console.error(`Failed to fetch/parse events from KTCU:`, error);
    throw error;
  }
}

/**
 * KtcuParser - implements SiteParser interface for KTCU
 */
export class KtcuParser implements SiteParser {
  siteId = 'ktcu';
  siteName = '농협은행';

  async fetchAndParse(): Promise<SiteEvent[]> {
    const events = await fetchAndParseKtcuEvents();
    return events.map((event) => ({
      siteId: this.siteId,
      siteName: this.siteName,
      eventId: event.eventId,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      sourceUrl: event.sourceUrl,
    }));
  }
}
