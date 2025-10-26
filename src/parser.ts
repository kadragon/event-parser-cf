// GENERATED FROM SPEC-EVENT-COLLECTOR-001
import { load } from 'cheerio';

export interface Event {
  promtnSn: string;
  title: string;
  startDate: string;
  endDate: string;
  sourceUrl: string;
}

/**
 * Parse HTML from bloodinfo.net promotion list and extract events
 * Targets: <div class="promtnInfoBtn" data-id="...">
 *   <img src="...">
 *   <div>[Title]</div>
 *   <div>[YYYY.MM.DD ~ YYYY.MM.DD]</div>
 * </div>
 *
 * @param html - Raw HTML content
 * @param sourceUrl - Source identifier (e.g., 'mi=1301')
 * @returns Array of parsed events
 */
export function parseEvents(html: string, sourceUrl: string): Event[] {
  const events: Event[] = [];

  try {
    const $ = load(html);

    // Find all div elements with class "promtnInfoBtn"
    $('div.promtnInfoBtn').each((_index, element) => {
      try {
        // Extract promtnSn from data-id attribute
        const promtnSn = $(element).attr('data-id');

        if (!promtnSn) {
          return; // Skip if no promtnSn found
        }

        // Extract child divs: [img], [title], [date]
        const children = $(element).find('> div');

        if (children.length < 2) {
          return; // Skip if not enough child elements
        }

        // Title is in the first div
        const title = children.eq(0).text().trim();

        // Date range is in the second div
        const dateText = children.eq(1).text().trim();

        // Validate required fields
        if (!title || !dateText) {
          return; // Skip this item
        }

        // Parse date range: "YYYY.MM.DD ~ YYYY.MM.DD"
        const [startDate, endDate] = dateText.split('~').map((d) => d.trim());

        if (!startDate || !endDate) {
          return; // Skip if date parsing failed
        }

        events.push({
          promtnSn,
          title,
          startDate,
          endDate,
          sourceUrl,
        });
      } catch (error) {
        // Log and skip individual item errors
        console.error('Error parsing event item:', error);
      }
    });
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
    return parseEvents(html, `mi=${mi}`);
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
