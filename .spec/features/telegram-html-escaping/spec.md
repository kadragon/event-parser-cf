# Telegram HTML 이스케이핑 취약점 수정

**Intent**: 사용자 제어 데이터를 HTML 형식 Telegram 메시지에 직접 삽입하는 XSS 취약점 제거

**Scope**:
- In: `buildEventMessage()`, `sendErrorNotification()` 함수의 메시지 생성 로직
- Out: 기타 Telegram API 호출, 에러 처리 로직은 유지

**Dependencies**:
- `xss` 라이브러리 (이미 설치됨: [commit 2826f62](https://github.com/kadragon/bloodinfo-event-parser-cf/commit/2826f62))
- Telegram HTML 파싱 모드

---

## Behaviour (GWT)

- **AC-1**: 이벤트 제목에 `<script>` 태그가 포함되면 HTML 이스케이프되어 전송된다
  - GIVEN 이벤트 제목: `"혈액 필요 <script>alert('xss')</script>"`
  - WHEN `buildEventMessage()` 호출
  - THEN 메시지에 `&lt;script&gt;...&lt;/script&gt;` 형태로 나타난다

- **AC-2**: 소스 URL에 악성 href가 있어도 안전하게 표시된다
  - GIVEN 이벤트 URL: `"javascript:alert('xss')"`
  - WHEN `buildEventMessage()` 호출
  - THEN URL이 HTML 이스케이프되어 링크로 실행되지 않는다

- **AC-3**: 에러 메시지에 `<` 또는 `>`가 포함되면 이스케이프된다
  - GIVEN 에러: `"Connection failed: <timeout>"`
  - WHEN `sendErrorNotification()` 호출
  - THEN 메시지에서 `&lt;timeout&gt;`으로 표시된다

---

## Examples (Tabular)

| Case | Field | Payload | Expected Output |
|------|-------|---------|-----------------|
| Normal event | title | `"헌혈 필요"` | `"헌혈 필요"` (no change) |
| XSS in title | title | `"<b>큰글자</b>"` | `"&lt;b&gt;큰글자&lt;/b&gt;"` |
| Script tag | title | `"test<script>alert(1)</script>"` | `"test&lt;script&gt;alert(1)&lt;/script&gt;"` |
| Dangerous URL | sourceUrl | `"javascript:void(0)"` | `"javascript:void(0)"` (escaped) |
| Error with tags | errorMessage | `"Failed: <connection timeout>"` | `"Failed: &lt;connection timeout&gt;"` |
| Ampersand | title | `"Blood & Organ"` | `"Blood &amp; Organ"` |

---

## API (Summary)

**Functions Modified**:
- `buildEventMessage(events: SiteEvent[]): string`
  - Escapes: `event.siteName`, `event.title`, `event.startDate`, `event.endDate`, `event.sourceUrl`
  - Returns: HTML-safe string (safe to send with `parse_mode: 'HTML'`)

- `sendErrorNotification(botToken, chatId, errorMessage): Promise<void>`
  - Escapes: `errorMessage` parameter
  - Returns: Promise, same API

---

## Data & State

- No schema changes
- No KV/database changes
- Telegram message format remains: HTML mode with escaped user data

---

## Implementation Notes

1. **Strategy**: Use `xss` library's `filterXSS()` function
   - Already in `package.json` (added in commit 2826f62)
   - Use default whitelist (blocks all tags) for safety

2. **Code locations**:
   - Line 62: `message += <b>${siteName}</b>`  → escape `siteName`
   - Line 65: `message += ${index + 1}. ${event.title}` → escape `title`
   - Line 66-67: escape `startDate`, `endDate`, `sourceUrl`
   - Line 137: `message = ...${errorMessage}` → escape `errorMessage`

3. **Test strategy**:
   - Add test cases for each AC
   - Verify Telegram API call still succeeds
   - Check escaped output matches expectations

---

## Tracing

**Spec-ID**: SPEC-TELEGRAM-ESCAPING-001
**Task-ID**: TASK-001
**Related Issue**: CodeQL High finding (HTML injection in Telegram messages)
**Test Files**: `tests/telegram.test.ts`
**Implementation Files**: `src/telegram.ts`
