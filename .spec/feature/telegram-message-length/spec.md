# Telegram Message Length Handling

**Intent**: Prevent "message is too long" errors by truncating messages to Telegram's 4096 character limit

**Scope**:
- In: Message length validation and truncation before sending
- Out: Changing message format structure, multi-message splitting

**Dependencies**:
- Existing `buildEventMessage()` in `src/telegram.ts:51-86`
- Telegram API limit: 4096 characters (per `.spec/event-collector/spec.md:150`)

---

## Behaviour (GWT)

- **AC-1**: GIVEN a message under 4096 chars WHEN sending to Telegram THEN message sends successfully without modification
- **AC-2**: GIVEN a message over 4096 chars WHEN building notification THEN message is truncated to ~4000 chars with "..." suffix AND HTML tags/entities are stripped to prevent parse errors
- **AC-3**: GIVEN a message exactly at limit WHEN sending THEN message sends without truncation
- **AC-4**: GIVEN a truncated message WHEN sent to Telegram THEN it uses plain text format (no parse_mode) to avoid HTML parsing errors

---

## Examples (Tabular)

| Case | Message Length | Expected Behaviour |
|------|----------------|-------------------|
| Normal | 2000 chars | Send as-is |
| Over limit | 5000 chars | Truncate to ~4000 + "..." |
| At limit | 4096 chars | Send as-is |
| Just over | 4100 chars | Truncate to ~4000 + "..." |

---

## API (Summary)

**Modified function**: `buildEventMessage(events: SiteEvent[]): { text: string; isTruncated: boolean }`
- Returns object with message text and truncation flag
- Add length check after building HTML-formatted message
- If exceeds 4096 chars:
  - Strip all HTML tags (using generic regex `/<[^>]+>/g` for future-proofing)
  - Decode HTML entities (order: `&lt;`, `&gt;`, `&quot;`, `&#x27;`, then `&amp;` last)
  - Truncate to 4000 chars and append "..."
  - Set `isTruncated: true`
- Otherwise: return original HTML message with `isTruncated: false`

**Modified function**: `sendEventNotification(botToken, chatId, events)`
- Calls `buildEventMessage()` and destructures `{ text, isTruncated }`
- Conditionally sets `parse_mode: 'HTML'` only when `isTruncated === false`
- Omits `parse_mode` for truncated messages (plain text) to prevent HTML parse errors

**Error contract**: No changes (still throws on Telegram API errors)

---

## Data & State

**Entities**: None (pure function modification)
**Invariants**: Output string length ≤ 4096
**Migrations**: N

---

## Tracing

**Spec-ID**: SPEC-TELEGRAM-LENGTH-001
**Trace-To**:
- Test: `tests/telegram.test.ts` (new test cases)
- Impl: `src/telegram.ts:buildEventMessage()`
