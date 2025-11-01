// GENERATED FROM SPEC-EVENT-COLLECTOR-001
import { load } from 'cheerio';
import { getRandomUserAgent } from '../utils/user-agent';
import type { SiteParser, SiteEvent } from '../types/site-parser';
import { CONFIG } from '../config';

export interface Event {
  eventId: string;
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

    // Find all event links
    const links = $(CONFIG.bloodinfo.selectors.eventLink);

    for (let i = 0; i < links.length; i++) {
      try {
        const $link = $(links[i]);
        const eventId = $link.attr('data-id');

        if (!eventId || processedIds.has(eventId)) {
          continue; // Skip if no eventId or already processed
        }

        // Extract title from the span (skipping date spans which contain ~)
        const text = $link.find(CONFIG.bloodinfo.selectors.span).text().trim();

        // Skip if this is a date range (contains ~)
        if (text.includes('~')) {
          continue;
        }

        const title = text;

        if (!title) {
          continue; // Skip if no title
        }

        // Find the next link with the same eventId that contains the date
        let dateText = '';
        for (let j = i + 1; j < links.length; j++) {
          const $nextLink = $(links[j]);
          const nextId = $nextLink.attr('data-id');

          if (nextId === eventId) {
            const nextText = $nextLink.find(CONFIG.bloodinfo.selectors.span).text().trim();
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
        const fullSourceUrl = `${CONFIG.bloodinfo.baseUrl}${CONFIG.bloodinfo.urlPath}?type=${CONFIG.bloodinfo.queryParams.type}&mi=${mi}`;

        events.push({
          eventId,
          title,
          startDate,
          endDate,
          sourceUrl: fullSourceUrl,
        });

        processedIds.add(eventId);
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
  const url = `${CONFIG.bloodinfo.baseUrl}${CONFIG.bloodinfo.urlPath}?type=${CONFIG.bloodinfo.queryParams.type}&mi=${mi}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Referer': `${CONFIG.bloodinfo.baseUrl}/`,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });

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
 * Fetch events from all promotion categories (excluding 1302)
 * Deduplicates events by eventId across categories
 *
 * @returns Combined array of all unique events from all categories
 */
export async function fetchAllEvents(): Promise<Event[]> {
  // GENERATED FROM SPEC-bloodinfo-filter-001
  // Use categories from config (excludes 1302 as per requirement)
  const miValues = CONFIG.bloodinfo.categories;
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

  // Deduplicate by eventId (keep first occurrence)
  const seen = new Set<string>();
  const uniqueEvents = allEvents.filter((event) => {
    if (seen.has(event.eventId)) {
      return false;
    }
    seen.add(event.eventId);
    return true;
  });

  const duplicateCount = allEvents.length - uniqueEvents.length;
  if (duplicateCount > 0) {
    console.log(`Removed ${duplicateCount} duplicate event(s) across categories`);
  }

  return uniqueEvents;
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
      eventId: event.eventId,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      sourceUrl: event.sourceUrl,
    }));
  }
}
