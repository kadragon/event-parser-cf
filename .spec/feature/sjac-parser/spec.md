# SJAC Parser - 세종예술의전당 티켓오픈일정 파서

Intent: Parse ticket open schedules from SJAC (Sejong Arts Center) website
Scope:
- In: Fetch and parse ticket open schedules from SJAC board list
- Out: Filtering by performance date, detailed event information beyond title/date/link

Dependencies:
- cheerio (HTML parsing)
- fetchWithTimeout utility
- normalizeText utility
- CONFIG system

## Behaviour (GWT)

- AC-1: GIVEN SJAC board list page WHEN fetched THEN HTML is retrieved successfully
- AC-2: GIVEN HTML content WHEN parsed THEN extract event number from href URL parameter
- AC-3: GIVEN HTML content WHEN parsed THEN extract event title from anchor text
- AC-4: GIVEN HTML content WHEN parsed THEN extract ticket open date from date column
- AC-5: GIVEN parsed events WHEN eventId exists THEN use it as unique identifier
- AC-6: GIVEN parsed events WHEN all fields valid THEN create SiteEvent with siteId='sjac', siteName='세종예술의전당'
- AC-7: GIVEN fetch/parse errors WHEN occurred THEN throw descriptive error messages

## Examples (Tabular)

| Case | HTML Structure | Expected Output |
|---|---|---|
| Valid event | `<a href="...performanceNo=585...">Title</a>` + date `2025.11.03` | eventId: "585", title: "Title", date: "2025.11.03" |
| New mark | `Title<em class="new_mark">N</em>` | title: "Title" (N marker removed) |
| HTML entities | `&lt;Show Name&gt;` | title: "<Show Name>" (decoded) |
| Missing eventId | No performanceNo in URL | Skip event |
| Missing title | Empty anchor text | Skip event |
| Missing date | Empty date cell | Skip event |

## API (Summary)

Public surface:
- `class SjacParser implements SiteParser`
  - `siteId: string = 'sjac'`
  - `siteName: string = '세종예술의전당'`
  - `fetchAndParse(): Promise<SiteEvent[]>`

Internal functions:
- `parseSjacEvents(html: string): Promise<SjacEvent[]>` - Parse HTML to events
- `fetchAndParseSjacEvents(): Promise<SjacEvent[]>` - Fetch and parse

Error contract:
- HTTP errors: throw with status code and message
- Parse errors: throw with descriptive message
- Timeout: configured via CONFIG.sjac.fetchTimeoutMs

## Data & State

Entities:
```typescript
interface SjacEvent {
  eventId: string;      // Extracted from performanceNo parameter
  title: string;        // Event title (normalized, HTML decoded)
  date: string;         // Ticket open date (YYYY.MM.DD format)
  sourceUrl: string;    // Full URL to event detail page
}
```

Invariants:
- eventId must be non-empty numeric string
- title must be non-empty after normalization
- date must match YYYY.MM.DD format
- sourceUrl must be valid HTTPS URL

Migrations: N (new feature)

## Tracing

Spec-ID: SPEC-SJAC-PARSER-001
Trace-To:
- Implementation: src/parsers/sjac.ts
- Tests: src/parsers/sjac.test.ts (to be created)
- Config: src/config.ts (sjac section)
- Registration: src/parsers/index.ts, src/index.ts
