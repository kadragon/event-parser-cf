/**
 * Site event data structure
 */
export interface SiteEvent {
  siteId: string; // Unique site identifier (e.g., 'ktcu', 'sjac')
  siteName: string; // Display name (e.g., '한국교직원공제회')
  eventId: string; // Unique event identifier within site
  title: string;
  startDate: string;
  endDate: string;
  sourceUrl: string; // URL to access this event
}

/**
 * Parser interface for different sites
 */
export interface SiteParser {
  /**
   * Unique identifier for this site
   */
  siteId: string;

  /**
   * Display name for this site (Korean)
   */
  siteName: string;

  /**
   * Fetch and parse events from the site
   * @returns Array of parsed events
   */
  fetchAndParse(): Promise<SiteEvent[]>;
}
