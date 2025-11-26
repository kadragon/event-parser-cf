/**
 * SJAC (세종예술의전당) 사이트 파서
 * URL: https://www.sjac.or.kr/base/board/list?boardManagementNo=38&menuLevel=2&menuNo=223
 *
 * GENERATED FROM SPEC-SJAC-PARSER-001
 * Parses ticket open schedule from SJAC board list
 */

import { load } from 'cheerio';
import { CONFIG } from '../config';
import type { SiteEvent, SiteParser } from '../types/site-parser';
import { fetchWithTimeout } from '../utils/fetch';

export interface SjacEvent {
  eventId: string;
  title: string;
  date: string;
  sourceUrl: string;
}

/**
 * Extract performanceNo from URL
 * Format: https://www.sjac.or.kr/base/nrr/performance/read?performanceNo=585&...
 *
 * TRACE: SPEC-SJAC-PARSER-001, AC-2
 * @param url - URL string
 * @returns performanceNo or empty string
 */
function extractPerformanceNo(url: string | undefined): string {
  if (!url) return '';

  try {
    const urlObj = new URL(url, 'https://www.sjac.or.kr');
    const performanceNo = urlObj.searchParams.get('performanceNo');
    return performanceNo || '';
  } catch {
    return '';
  }
}

/**
 * Parse HTML from SJAC board list and extract events
 *
 * TRACE: SPEC-SJAC-PARSER-001
 * @param html - Raw HTML content
 * @returns Array of parsed events
 * @throws Error if HTML parsing fails
 */
export function parseSjacEvents(html: string): SjacEvent[] {
  const events: SjacEvent[] = [];

  try {
    const $ = load(html);

    // Find all event rows in tbody
    const rows = $(
      `${CONFIG.sjac.selectors.tableBody} ${CONFIG.sjac.selectors.tableRow}`
    );

    rows.each((_index, element) => {
      try {
        const $row = $(element);

        // AC-2: Extract eventId from performanceNo in URL
        const titleCell = $row.find(CONFIG.sjac.selectors.titleCell);
        const link = titleCell.find(CONFIG.sjac.selectors.titleLink);
        const href = link.attr('href');
        const eventId = extractPerformanceNo(href);

        if (!eventId) {
          return; // Skip if no eventId
        }

        // AC-3: Extract and normalize title
        // Remove new marker before getting text
        link.find(CONFIG.sjac.selectors.newMark).remove();
        // Use .text() to auto-decode HTML entities, then normalize whitespace
        const rawTitle = link.text() || '';
        const title = rawTitle.replace(/\s+/g, ' ').trim();

        if (!title) {
          return; // Skip if no title
        }

        // AC-4: Extract date
        const dateCell = $row.find(CONFIG.sjac.selectors.dateCell);
        // Remove the label span and get the date text
        dateCell.find('span').remove();
        const date = dateCell.text().trim();

        if (!date) {
          return; // Skip if no date
        }

        // Use full URL from href
        const sourceUrl = href?.startsWith('http')
          ? href
          : `https://www.sjac.or.kr${href}`;

        events.push({
          eventId,
          title,
          date,
          sourceUrl,
        });
      } catch (error) {
        console.error('Error parsing SJAC event item:', error);
        // Continue with next row
      }
    });
  } catch (error) {
    console.error('Error loading SJAC HTML:', error);
    throw new Error(
      `Failed to parse SJAC HTML: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return events;
}

/**
 * Fetch and parse events from SJAC site
 *
 * TRACE: SPEC-SJAC-PARSER-001, AC-7
 * @returns Promise resolving to array of parsed events
 * @throws Error if fetch fails (including timeout) or HTML parsing fails
 */
export async function fetchAndParseSjacEvents(): Promise<SjacEvent[]> {
  try {
    const response = await fetchWithTimeout(
      CONFIG.sjac.siteUrl,
      {},
      CONFIG.sjac.fetchTimeoutMs
    );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText} when fetching from ${CONFIG.sjac.siteUrl}`
      );
    }

    const html = await response.text();
    return parseSjacEvents(html);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to fetch/parse events from SJAC: ${errorMsg}`);
    throw new Error(`SJAC event collection failed: ${errorMsg}`);
  }
}

/**
 * SjacParser - implements SiteParser interface for SJAC
 *
 * TRACE: SPEC-SJAC-PARSER-001, AC-6
 * Provides ticket open schedule collection from SJAC website with SiteParser interface
 */
export class SjacParser implements SiteParser {
  siteId = 'sjac';
  siteName = '세종예술의전당';

  async fetchAndParse(): Promise<SiteEvent[]> {
    const events = await fetchAndParseSjacEvents();
    return events.map((event) => ({
      siteId: this.siteId,
      siteName: this.siteName,
      eventId: event.eventId,
      title: event.title,
      startDate: event.date, // Ticket open date as startDate
      endDate: event.date, // Use same date for endDate
      sourceUrl: event.sourceUrl,
    }));
  }
}
