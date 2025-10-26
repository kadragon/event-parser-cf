# Bloodinfo Event Collector

**Intent**: Automatically collect new blood donation promotion events from bloodinfo.net and notify via Telegram once daily (KST).

**Scope**:
- **In**: Scrape 3 URLs (mi=1301, 1302, 1303), extract events, track sent events, deliver Telegram notifications
- **Out**: Event detail pages, manual Telegram setup, user consent management

**Dependencies**:
- Cloudflare Workers (runtime)
- Cloudflare KV Store (state persistence)
- Telegram Bot API
- HTML parsing library (cheerio)

---

## Behaviour (Given-When-Then)

**AC-1: New Events Detection**
- GIVEN: An event with a unique `promtnSn` exists on bloodinfo.net
- WHEN: The daily cron job executes (KST 00:00)
- THEN: The event is extracted and marked as a candidate for notification

**AC-2: Duplicate Prevention**
- GIVEN: An event with `promtnSn` has been previously sent to Telegram
- WHEN: The daily cron job executes
- THEN: The event is NOT sent again (cross-check KV Store)

**AC-3: Batch Telegram Notification**
- GIVEN: One or more new events are detected
- WHEN: All events are collected
- THEN: A single Telegram message is sent containing all new events with their titles, date ranges, and promtnSn-based links

**AC-4: Error Notification**
- GIVEN: HTML parsing or API call fails
- WHEN: An unrecoverable error occurs
- THEN: A Telegram error notification is sent to the user immediately

**AC-5: Silent Success**
- GIVEN: No new events are detected
- WHEN: The daily cron job executes
- THEN: No Telegram message is sent (silent termination)

---

## Examples (Tabular)

| Scenario | Input | Expected Output |
|----------|-------|-----------------|
| 2 new events | `promtnSn: [A, B]` | 1 Telegram msg with both events |
| 0 new events | `promtnSn: []` (all already sent) | Silent (no msg) |
| Parse error | Invalid HTML / network failure | 1 error Telegram msg |
| Mixed (1 new, 2 old) | `promtnSn: [A, B, C]` where B,C sent | 1 msg with only A |

---

## API (Summary)

### HTML Structure (Actual)
```html
<!-- Title Link -->
<a href="javascript:" data-id="189889" class="promtnInfoBtn">
  <span>대한적십자사 창립 120주년 기념 프로모션</span>
</a>
<!-- Date Range Link -->
<a href="javascript:" data-id="189889" class="promtnInfoBtn">
  <span style='font-weight:500;'>2025.10.01 ~ 2025.10.31</span>
</a>
```

### Telegram Message Format
```
🩸 혈액정보 새 이벤트 안내

📌 이벤트 1: [Title]
   기간: YYYY.MM.DD ~ YYYY.MM.DD
   링크: https://www.bloodinfo.net/...?mi=1301

📌 이벤트 2: [Title]
   기간: YYYY.MM.DD ~ YYYY.MM.DD
   링크: https://www.bloodinfo.net/...?mi=1302

🔗 상세보기:
- https://www.bloodinfo.net/knrcbs/pr/promtn/progrsPromtnList.do?type=A&mi=1301
- https://www.bloodinfo.net/knrcbs/pr/promtn/progrsPromtnList.do?type=A&mi=1302
- https://www.bloodinfo.net/knrcbs/pr/promtn/progrsPromtnList.do?type=A&mi=1303
```

### Environment Variables
```
TELEGRAM_BOT_TOKEN: "bot_token"
TELEGRAM_CHAT_ID: "chat_id"
```

### KV Store Operations
- **Key**: `sent:${promtnSn}`
- **Value**: JSON `{ sentAt: ISO8601, title: string }`
- **TTL**: 60 days (auto-cleanup)

---

## Data & State

### Event Entity
```typescript
interface Event {
  promtnSn: string;        // data-id from <a class="promtnInfoBtn">
  title: string;           // Event title
  startDate: string;       // YYYY.MM.DD
  endDate: string;         // YYYY.MM.DD
  sourceUrl: string;       // Original URL (mi value)
}
```

### Sent Event Tracking
```typescript
interface SentRecord {
  sentAt: string;         // ISO8601 timestamp
  title: string;
  promtnSn: string;
}
```

### Invariants
- Each event must have a unique `promtnSn` per URL
- Duplicate check is case-insensitive on `promtnSn`
- Date range must be valid (startDate <= endDate)

---

## Errors & Resilience

| Error | Handling |
|-------|----------|
| Network timeout (fetch) | Retry once, then send error msg |
| Invalid HTML structure | Send error msg with context |
| Telegram API rate limit | Retry with exponential backoff |
| Missing env vars | Fail fast with error msg |
| KV Store unavailable | Fallback: send all events (risk duplicate) |

---

## Performance & Constraints

| Constraint | Target | Rationale |
|-----------|--------|-----------|
| Max execution time | < 30s | Workers free tier limit |
| Event count per URL | ~50 (estimate) | Typical promo list size |
| KV queries | ≤ 150 (3 URLs × ~50 events) | Acceptable for free tier |
| Telegram msg size | < 4096 chars | Telegram API limit |

---

## Tracing

**Spec-ID**: `SPEC-EVENT-COLLECTOR-001`

**Test IDs**:
- TEST-AC1-NEW-EVENTS
- TEST-AC2-DUPLICATE-CHECK
- TEST-AC3-BATCH-NOTIFICATION
- TEST-AC4-ERROR-NOTIFICATION
- TEST-AC5-SILENT-SUCCESS

**Implementation Files**:
- `src/index.ts` (main worker)
- `src/parser.ts` (HTML parsing)
- `src/telegram.ts` (Telegram integration)
- `src/kv.ts` (KV Store operations)
- `tests/parser.test.ts`
- `tests/kv.test.ts`
- `tests/telegram.test.ts`
