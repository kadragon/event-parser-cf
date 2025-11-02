# Branch Coverage Improvements

Intent: Increase branch coverage to 70% by testing error paths and edge cases
Scope In: Error handling branches in telegram.ts, ktcu.ts, bloodinfo.ts
Scope Out: Production code changes (only tests)
Dependencies: tests/telegram.test.ts, tests/ktcu.test.ts, tests/bloodinfo.test.ts

## Behaviour (GWT)

### Telegram (src/telegram.ts)
- AC-1: GIVEN Telegram API returns HTTP error WHEN sendErrorNotification is called THEN should throw error with HTTP details
- AC-2: GIVEN Telegram API returns ok:false WHEN sendErrorNotification is called THEN should throw error with description
- AC-3: GIVEN non-Error object thrown WHEN sendErrorNotification fails THEN should handle string conversion

### KTCU Parser (src/parsers/ktcu.ts)
- AC-4: GIVEN invalid HTML WHEN parseKtcuEvents is called THEN should throw parsing error
- AC-5: GIVEN HTTP error WHEN fetchAndParseKtcuEvents is called THEN should throw with HTTP status
- AC-6: GIVEN fetch timeout WHEN fetchAndParseKtcuEvents is called THEN should throw timeout error
- AC-7: GIVEN parsing error WHEN fetchAndParseKtcuEvents is called THEN should propagate error

### Bloodinfo Parser (src/parsers/bloodinfo.ts)
- AC-8: GIVEN fetch failure WHEN fetchAndParseEvents is called THEN should log and throw error
- AC-9: GIVEN category fetch fails WHEN fetchAllEvents is called THEN should continue with other categories
- AC-10: GIVEN BloodinfoParser.fetchAndParse called THEN should return SiteEvent array with correct fields

## Examples (Tabular)

| Case | Input | Steps | Expected |
|---|---|---|---|
| Telegram HTTP error | response.ok = false | sendErrorNotification(...) | Throws with HTTP status |
| Telegram API rejection | ok: false, description | sendErrorNotification(...) | Throws with description |
| Invalid HTML | Malformed cheerio input | parseKtcuEvents(html) | Throws parsing error |
| HTTP 500 | fetch returns 500 | fetchAndParseKtcuEvents() | Throws "HTTP 500" |
| Fetch timeout | fetch exceeds timeout | fetchAndParseKtcuEvents() | Throws timeout error |
| Category failure | mi=1301 fails | fetchAllEvents() | Continues, logs error |
| Parser interface | BloodinfoParser instance | fetchAndParse() | Returns SiteEvent[] |

## API (Summary)

Public surface: No API changes (test-only)
Error contract: All error paths must be tested

## Data & State

Entities: None (test-only change)
Invariants: Branch coverage >= 70%
Migrations: N

## Tracing

Spec-ID: SPEC-BRANCH-COVERAGE-001
Trace-To: tests/telegram.test.ts, tests/ktcu.test.ts, tests/bloodinfo.test.ts
