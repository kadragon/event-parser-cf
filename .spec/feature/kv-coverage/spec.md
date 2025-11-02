# KV Coverage Improvements

Intent: Increase test coverage for KV operations to meet 80% line / 70% branch targets
Scope In: getSentEvents, filterNewEvents, isEventSent error handling
Scope Out: Production code changes (only tests)
Dependencies: src/kv.ts, tests/kv.test.ts, tests/mocks/kv.ts

## Behaviour (GWT)

- AC-1: GIVEN KV list returns event keys WHEN getSentEvents is called THEN should return eventId array
- AC-2: GIVEN KV list fails WHEN getSentEvents is called THEN should return empty array
- AC-3: GIVEN mix of sent/unsent events WHEN filterNewEvents is called THEN should return only unsent events
- AC-4: GIVEN empty event array WHEN filterNewEvents is called THEN should return empty array
- AC-5: GIVEN KV read fails for some events WHEN filterNewEvents is called THEN should include failed events (resend)
- AC-6: GIVEN KV.get throws error WHEN isEventSent is called THEN should return false (fallback)

## Examples (Tabular)

| Case | Input | Steps | Expected |
|---|---|---|---|
| List success | KV has 3 keys | getSentEvents(kv) | ['bloodinfo:123', 'ktcu:456', 'bloodinfo:789'] |
| List failure | KV.list throws | getSentEvents(kv) | [] |
| Filter mix | 5 events (2 sent) | filterNewEvents(kv, events) | 3 unsent events |
| Filter empty | [] | filterNewEvents(kv, []) | [] |
| Read failure | KV.get rejects | isEventSent(kv, ...) | false |

## API (Summary)

Public surface:
- `getSentEvents(kv: KVNamespace): Promise<string[]>`
- `filterNewEvents(kv: KVNamespace, events: Array<{siteId, eventId}>): Promise<Array<{...}>>`
- `isEventSent(kv: KVNamespace, siteId: string, eventId: string): Promise<boolean>`

Error contract: All functions handle KV failures gracefully

## Data & State

Entities: None (test-only change)
Invariants: Coverage targets (80% line, 70% branch)
Migrations: N

## Tracing

Spec-ID: SPEC-KV-COVERAGE-001
Trace-To: tests/kv.test.ts, tests/mocks/kv.ts
