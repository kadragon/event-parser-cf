# SJAC Parser - Acceptance Criteria

Trace: SPEC-SJAC-PARSER-001

## Acceptance Criteria

- AC-1: Fetch HTML from SJAC board list URL successfully
- AC-2: Extract performanceNo from href URL as eventId
- AC-3: Extract and normalize event title from anchor text
- AC-4: Extract ticket open date in YYYY.MM.DD format
- AC-5: Use performanceNo as unique eventId
- AC-6: Return SiteEvent[] with siteId='sjac', siteName='세종예술의전당'
- AC-7: Throw descriptive errors on fetch/parse failures

## Test Strategy

- Unit tests for HTML parsing (parseSjacEvents)
- Integration tests for fetch and parse (fetchAndParseSjacEvents)
- Error handling tests for network failures and malformed HTML

## Coverage Target

- Lines: 80%
- Branches: 70%

## Test Cases

1. **Valid HTML parsing**: Parse sample HTML with multiple events
2. **Event ID extraction**: Extract performanceNo from various URL formats
3. **Title normalization**: Handle HTML entities, whitespace, new markers
4. **Date extraction**: Parse date from table cells
5. **Missing fields**: Skip events with missing eventId, title, or date
6. **Empty HTML**: Return empty array for no events
7. **Fetch errors**: Handle HTTP errors, timeouts
8. **Parse errors**: Handle malformed HTML gracefully
