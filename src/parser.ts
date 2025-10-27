// GENERATED FROM SPEC-EVENT-COLLECTOR-001
import { load } from 'cheerio';
import type { SiteParser, SiteEvent } from './types/site-parser';

export interface Event {
  promtnSn: string;
  title: string;
  startDate: string;
  endDate: string;
  sourceUrl: string;
}

/**
 * Parse HTML from bloodinfo.net promotion list and extract events
 * Targets: <a class="promtnInfoBtn" data-id="..."><span>Title</span>...</a>
 *          <a class="promtnInfoBtn" data-id="..."><span>YYYY.MM.DD ~ YYYY.MM.DD</span></a>
 *
 * @param html - Raw HTML content
 * @param mi - Promotion category ID (1301, 1302, 1303)
 * @returns Array of parsed events
 */
export function parseEvents(html: string, mi: number): Event[] {
  const events: Event[] = [];
  const processedIds = new Set<string>();

  try {
    const $ = load(html);

    // Find all <a class="promtnInfoBtn"> elements
    const links = $('a.promtnInfoBtn');

    for (let i = 0; i < links.length; i++) {
      try {
        const $link = $(links[i]);
        const promtnSn = $link.attr('data-id');

        if (!promtnSn || processedIds.has(promtnSn)) {
          continue; // Skip if no promtnSn or already processed
        }

        // Extract title from the span (skipping date spans which contain ~)
        const text = $link.find('> span').text().trim();

        // Skip if this is a date range (contains ~)
        if (text.includes('~')) {
          continue;
        }

        const title = text;

        if (!title) {
          continue; // Skip if no title
        }

        // Find the next link with the same promtnSn that contains the date
        let dateText = '';
        for (let j = i + 1; j < links.length; j++) {
          const $nextLink = $(links[j]);
          const nextId = $nextLink.attr('data-id');

          if (nextId === promtnSn) {
            const nextText = $nextLink.find('> span').text().trim();
            // Replace &nbsp; with space and clean up
            const cleanText = nextText.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

            if (cleanText.includes('~')) {
              dateText = cleanText;
              break;
            }
          }
        }

        if (!dateText) {
          continue; // Skip if no date found
        }

        // Parse date range: "YYYY.MM.DD ~ YYYY.MM.DD"
        const [startDate, endDate] = dateText.split('~').map((d) => d.trim());

        if (!startDate || !endDate) {
          continue; // Skip if date parsing failed
        }

        // Generate full URL for the event
        const fullSourceUrl = `https://www.bloodinfo.net/knrcbs/pr/promtn/progrsPromtnList.do?type=A&mi=${mi}`;

        events.push({
          promtnSn,
          title,
          startDate,
          endDate,
          sourceUrl: fullSourceUrl,
        });

        processedIds.add(promtnSn);
      } catch (error) {
        // Log and skip individual item errors
        console.error('Error parsing event item:', error);
      }
    }
  } catch (error) {
    console.error('Error loading HTML:', error);
    throw new Error(`Failed to parse HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return events;
}

/**
 * Fetch HTML from a single URL and parse events
 *
 * @param mi - Promotion category ID (1301, 1302, 1303)
 * @returns Array of parsed events
 */
export async function fetchAndParseEvents(mi: number): Promise<Event[]> {
  const url = `https://www.bloodinfo.net/knrcbs/pr/promtn/progrsPromtnList.do?type=A&mi=${mi}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    return parseEvents(html, mi);
  } catch (error) {
    console.error(`Failed to fetch/parse events from ${url}:`, error);
    throw error;
  }
}

/**
 * Fetch events from all three promotion categories
 *
 * @returns Combined array of all events from all categories
 */
export async function fetchAllEvents(): Promise<Event[]> {
  const miValues = [1301, 1302, 1303];
  const allEvents: Event[] = [];

  for (const mi of miValues) {
    try {
      const events = await fetchAndParseEvents(mi);
      allEvents.push(...events);
    } catch (error) {
      console.error(`Failed to fetch events for mi=${mi}:`, error);
      // Continue with next category on error
    }
  }

  return allEvents;
}

/**
 * BloodinfoParser - implements SiteParser interface for bloodinfo.net
 */
export class BloodinfoParser implements SiteParser {
  siteId = 'bloodinfo';
  siteName = '혈액정보';

  async fetchAndParse(): Promise<SiteEvent[]> {
    const events = await fetchAllEvents();
    return events.map((event) => ({
      siteId: this.siteId,
      siteName: this.siteName,
      eventId: event.promtnSn,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      sourceUrl: event.sourceUrl,
    }));
  }
}
