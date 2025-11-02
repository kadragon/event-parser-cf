# SJAC Parser - Design Document

Trace: SPEC-SJAC-PARSER-001

## Context

SJAC (세종예술의전당) publishes ticket open schedules on a board list page. The page uses a standard HTML table structure with rows containing:
- Event number
- Event title (with link to detail page)
- Ticket open date

Existing parsers:
- BloodinfoParser: Parses bloodinfo.net events with data-id attributes
- KtcuParser: Parses KTCU events with CSS class-based selectors

## Approach

### Selected Approach: Table Row Parsing

**Pros**:
- Simple and reliable HTML structure (standard table)
- Clear data separation (num, title, date columns)
- performanceNo in URL is stable unique identifier
- Consistent with existing parser patterns

**Cons**:
- Dependent on specific table structure
- Requires URL parameter extraction

### Alternative Considered: API-based Approach

**Pros**:
- More resilient to HTML changes
- Potentially faster

**Cons**:
- No public API available
- Would require reverse engineering

## Implementation Details

### HTML Structure

```html
<tbody>
  <tr>
    <td class="num">176</td>
    <td class="tit">
      <a href="...performanceNo=585..." target="_blank">
        Event Title<em class="new_mark">N</em>
      </a>
    </td>
    <td class="date">
      <span>티켓오픈일</span>
      2025.11.03
    </td>
  </tr>
</tbody>
```

### Parsing Strategy

1. **Select rows**: `$('tbody tr')`
2. **Extract eventId**: Parse `performanceNo` parameter from href
3. **Extract title**: Get anchor text, remove `<em>` tags, normalize
4. **Extract date**: Get date column text, remove label
5. **Build sourceUrl**: Use full href from anchor tag

### Data Flow

```
fetchAndParseSjacEvents()
  → fetchWithTimeout(CONFIG.sjac.siteUrl)
  → parseSjacEvents(html)
    → load HTML with cheerio
    → iterate tbody tr elements
    → extract fields from each row
    → skip invalid rows
    → return SjacEvent[]
  → map to SiteEvent[]
```

## Diagram (C4 Level 3)

```
[SjacParser]
    |
    ├─→ fetchAndParseSjacEvents()
    |       |
    |       ├─→ fetchWithTimeout() [utils/fetch]
    |       └─→ parseSjacEvents()
    |               |
    |               ├─→ load() [cheerio]
    |               ├─→ normalizeText() [utils/sanitize]
    |               └─→ extractPerformanceNo() (internal)
    |
    └─→ fetchAndParse() [SiteParser interface]
            └─→ maps SjacEvent[] to SiteEvent[]
```

## Fallback/Rollback

If parser fails:
1. Error is logged with descriptive message
2. Telegram notification sent with error details
3. Other site parsers continue unaffected
4. No partial data is stored (all-or-nothing per site)

Rollback plan:
- Remove SjacParser from registry in src/index.ts
- Comment out CONFIG.sjac section
- No data migration needed (new feature)

## Security Considerations

- No authentication required (public page)
- HTTPS used for all requests
- No user input processing (read-only)
- HTML is loaded with cheerio (safe from XSS)
- performanceNo validated as numeric string

## Testing Approach

1. **Unit tests** with mocked HTML responses
2. **Integration tests** with real HTTP calls (optional, for manual testing)
3. **Error tests** with malformed HTML and network failures
4. **Edge cases**: empty tables, missing fields, HTML entities
