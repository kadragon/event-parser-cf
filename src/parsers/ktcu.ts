/**
 * KTCU (한국교직원공제회) 사이트 파서
 * URL: https://www.ktcu.or.kr/PPW-WFA-100101
 *
 * GENERATED FROM SPEC-KTCU-PARSER-001
 * UPDATED: SPEC-KTCU-DUP-FIX-001 (Use title hash as eventId)
 * Parses The-K events from KTCU site and filters only ongoing events
 */

import { load } from 'cheerio';
import type { SiteParser, SiteEvent } from '../types/site-parser';
import { fetchWithTimeout } from '../utils/fetch';
import { normalizeText } from '../utils/sanitize';
import { CONFIG } from '../config';

/**
 * Generate SHA-256 hash of normalized title for eventId
 * TRACE: SPEC-KTCU-DUP-FIX-001
 *
 * @param title - Event title
 * @returns Hex string (first 16 characters)
 */
async function generateTitleHash(title: string): Promise<string> {
  const normalized = title.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16); // Use first 16 chars for shorter key
}

export interface KtcuEvent {
  eventId: string;
  title: string;
  startDate: string;
  endDate: string;
  sourceUrl: string;
}

/**
 * Extract event ID from onclick attribute
 * Format: fn_viewEvent('eventId')
 *
 * @param onclickAttr - onclick attribute value
 * @returns Event ID or empty string
 */
function extractEventIdFromOnclick(onclickAttr: string | undefined): string {
  if (!onclickAttr) return '';
  const match = onclickAttr.match(/fn_viewEvent\('([^']+)'\)/);
  return match ? match[1] : '';
}

/**
 * Parse date range from KTCU format
 * Format: YYYY-MM-DD(요일) ~ YYYY-MM-DD(요일)
 * Output: { startDate: YYYY.MM.DD, endDate: YYYY.MM.DD }
 *
 * @param dateRangeText - Raw date range text
 * @returns { startDate, endDate } in YYYY.MM.DD format
 */
function parseDateRange(dateRangeText: string): { startDate: string; endDate: string } | null {
  // Remove non-breaking spaces and normalize
  const normalized = dateRangeText.replace(/&nbsp;/g, ' ').trim();

  // Pattern: YYYY-MM-DD(요일) ~ YYYY-MM-DD(요일)
  // Also handle case where there's no parentheses (day of week)
  const match = normalized.match(/(\d{4})-(\d{2})-(\d{2})(?:\([^)]+\))?\s*~\s*(\d{4})-(\d{2})-(\d{2})(?:\([^)]+\))?/);

  if (!match) {
    return null;
  }

  const [, startYear, startMonth, startDay, endYear, endMonth, endDay] = match;

  return {
    startDate: `${startYear}.${startMonth}.${startDay}`,
    endDate: `${endYear}.${endMonth}.${endDay}`,
  };
}

/**
 * Check if event is still ongoing (endDate >= today)
 *
 * @param endDateStr - End date in YYYY.MM.DD format
 * @returns true if event is ongoing, false if ended
 */
function isEventOngoing(endDateStr: string): boolean {
  try {
    const [year, month, day] = endDateStr.split('.').map(Number);
    const endDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return endDate >= today;
  } catch {
    return true; // If parsing fails, include the event
  }
}

/**
 * Parse HTML from KTCU site and extract ongoing events
 *
 * TRACE: SPEC-KTCU-PARSER-001, SPEC-KTCU-DUP-FIX-001
 * @param html - Raw HTML content
 * @returns Promise<Array of parsed ongoing events>
 * @throws Error if HTML parsing fails
 */
export async function parseKtcuEvents(html: string): Promise<KtcuEvent[]> {
  const events: KtcuEvent[] = [];

  try {
    const $ = load(html);

    // Find all event boxes
    const eventElements = $(`.${CONFIG.ktcu.eventClass}`);

    // Process each element and collect promises
    const eventPromises: Promise<KtcuEvent | null>[] = [];

    eventElements.each((index, element) => {
      const promise = (async () => {
        try {
          const $el = $(element);

          // AC-2: Extract title from title selector
          const titleElement = $el.find(CONFIG.ktcu.selectors.title);
          const rawTitle = titleElement.html() || '';
          // Replace <br> tags with spaces for proper formatting
          const titleWithSpaces = rawTitle.replace(/<br\s*\/?>/gi, ' ');
          const title = normalizeText(titleWithSpaces);

          // AC-3: Extract and parse date range from date selector
          const dateElement = $el.find(CONFIG.ktcu.selectors.date);
          const dateRangeText = dateElement.text();

          if (!title || !dateRangeText) {
            return null; // Skip if missing required fields
          }

          const dateRange = parseDateRange(dateRangeText);
          if (!dateRange) {
            return null; // Skip if date parsing fails
          }

          // AC-5: Filter out ended events
          if (!isEventOngoing(dateRange.endDate)) {
            return null; // Skip if event has ended
          }

          // SPEC-KTCU-DUP-FIX-001: Use title hash as eventId
          const eventId = await generateTitleHash(title);

          // AC-6: Generate sourceUrl (using hash instead of onclick ID)
          const sourceUrl = `${CONFIG.ktcu.siteUrl}#${eventId}`;

          return {
            eventId,
            title,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            sourceUrl,
          };
        } catch (error) {
          console.error('Error parsing KTCU event item:', error);
          return null;
        }
      })();

      eventPromises.push(promise);
    });

    // Wait for all event parsing to complete
    const parsedEvents = await Promise.all(eventPromises);

    // Filter out nulls and add to events array
    parsedEvents.forEach(event => {
      if (event !== null) {
        events.push(event);
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
 * TRACE: SPEC-KTCU-PARSER-001, AC-7
 * @returns Promise resolving to array of parsed ongoing events
 * @throws Error if fetch fails (including timeout) or HTML parsing fails
 */
export async function fetchAndParseKtcuEvents(): Promise<KtcuEvent[]> {
  try {
    const response = await fetchWithTimeout(CONFIG.ktcu.siteUrl, {}, CONFIG.ktcu.fetchTimeoutMs);

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText} when fetching from ${CONFIG.ktcu.siteUrl}`
      );
    }

    const html = await response.text();
    return parseKtcuEvents(html);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to fetch/parse events from KTCU: ${errorMsg}`);
    throw new Error(`KTCU event collection failed: ${errorMsg}`);
  }
}

/**
 * KtcuParser - implements SiteParser interface for KTCU
 *
 * TRACE: SPEC-KTCU-PARSER-001, AC-8
 * Provides event collection from The-K website with SiteParser interface
 */
export class KtcuParser implements SiteParser {
  siteId = 'ktcu';
  siteName = '한국교직원공제회';

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
