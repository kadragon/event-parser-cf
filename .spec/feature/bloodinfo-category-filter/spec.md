# Bloodinfo Category Filter and Deduplication

Intent: Exclude category 1302 from bloodinfo event fetching and remove duplicate events across categories
Scope:
- In: Filter out mi=1302, deduplicate events by eventId across remaining categories (1301, 1303)
- Out: No changes to parsing logic, KV storage, or Telegram notification

Dependencies:
- src/parsers/bloodinfo.ts:fetchAllEvents()
- tests/parser.test.ts

## Behaviour (GWT)

- AC-1: GIVEN fetchAllEvents() is called WHEN fetching from bloodinfo THEN only mi=1301 and mi=1303 are fetched, mi=1302 is excluded
- AC-2: GIVEN events with same eventId from different categories WHEN deduplicating THEN keep only first occurrence and log duplicates removed
- AC-3: GIVEN unique events from 1301 and 1303 WHEN no duplicates exist THEN all events are returned without modification

## Examples (Tabular)

| Case | Input Categories | Duplicate eventId | Expected Result | Log Output |
|---|---|---|---|---|
| Normal | [1301, 1303] | None | All events from both | None |
| Duplicates | [1301, 1303] | "123" in both | One event with eventId="123" | "Removed N duplicate events" |
| Exclusion | Check miValues array | - | [1301, 1303] only | - |

## API (Summary)

Public surface:
- `fetchAllEvents()`: Returns `Promise<Event[]>` - now excludes 1302 and deduplicates by eventId
- Console logging: Outputs count of duplicates removed if any

Error contract: No changes - existing error handling preserved

## Data & State

Entities: Event interface (no changes)
Invariants:
- Each eventId appears only once in final result
- Order: First occurrence of duplicate is kept
Migrations: N

## Tracing

Spec-ID: SPEC-bloodinfo-filter-001
Trace-To:
- src/parsers/bloodinfo.ts:148 (fetchAllEvents)
- tests/parser.test.ts (new test cases)
Test-IDs: TEST-filter-1302, TEST-dedupe-events, TEST-no-duplicates
