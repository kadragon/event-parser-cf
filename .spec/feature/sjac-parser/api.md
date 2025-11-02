# SJAC Parser - API Specification

Trace: SPEC-SJAC-PARSER-001

## Public API

### SjacParser Class

Implements `SiteParser` interface.

```typescript
class SjacParser implements SiteParser {
  siteId: string = 'sjac';
  siteName: string = '세종예술의전당';

  async fetchAndParse(): Promise<SiteEvent[]>
}
```

**Returns**: Array of `SiteEvent` objects
**Throws**: Error with descriptive message on failure

## Internal Functions

### parseSjacEvents(html: string): Promise<SjacEvent[]>

Parses HTML content from SJAC board list page.

**Parameters**:
- `html`: Raw HTML string from SJAC board list

**Returns**: Array of `SjacEvent` objects

**Throws**: Error if HTML parsing fails

**Behavior**:
1. Load HTML with cheerio
2. Find all `<tr>` elements in tbody
3. For each row:
   - Extract eventId from `<a>` href performanceNo parameter
   - Extract title from `<a>` text (normalized, HTML decoded)
   - Extract date from date column (YYYY.MM.DD)
   - Skip if any required field is missing
4. Return array of valid events

### fetchAndParseSjacEvents(): Promise<SjacEvent[]>

Fetches HTML from SJAC and parses events.

**Returns**: Array of `SjacEvent` objects

**Throws**: Error with HTTP status or fetch failure message

**Behavior**:
1. Fetch HTML from CONFIG.sjac.siteUrl with timeout
2. Check response status
3. Parse HTML with parseSjacEvents
4. Return events

## Error Types

- **Network errors**: `"SJAC event collection failed: [error message]"`
- **HTTP errors**: `"HTTP [status]: [statusText] when fetching from [url]"`
- **Parse errors**: `"Failed to parse SJAC HTML: [error message]"`

## Performance

- **Timeout**: 10 seconds (configurable via CONFIG.sjac.fetchTimeoutMs)
- **Expected response time**: < 3 seconds under normal conditions
- **Expected events per page**: 10-20 events
