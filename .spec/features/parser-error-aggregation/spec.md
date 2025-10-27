# 파서 실패 무시 문제 해결

**Intent**: 모든 파서 실패 시 에러를 감지하고 운영자에게 알림

**Scope**:
- In: `src/index.ts` 의 `handleScheduled()` 함수에서 파서 에러 처리
- Out: 개별 파서 구현, Telegram 알림 로직 (기존 사용)

**Dependencies**:
- 기존 `sendErrorNotification()` 사용
- `Promise.allSettled()` 이미 사용 중

---

## Behaviour (GWT)

- **AC-1**: 모든 파서가 실패하면 에러 요약을 수집한다
  - GIVEN 모든 파서 fetch 실패 (네트워크 에러 등)
  - WHEN `handleScheduled()` 실행
  - THEN 에러들이 수집되어 기록된다

- **AC-2**: 모든 파서 실패 시 에러 요약을 Telegram으로 전송한다
  - GIVEN 2개 파서 모두 실패: "Connection timeout", "HTML parsing error"
  - WHEN 수집 완료
  - THEN Telegram에 에러 요약 알림 발송: "❌ 모든 파서 실패: 2개 에러 발생"

- **AC-3**: 일부 파서만 실패하면 정상 동작한다 (기존 동작 유지)
  - GIVEN 파서 A 성공, 파서 B 실패
  - WHEN `handleScheduled()` 실행
  - THEN 파서 A의 이벤트만 처리, 파서 B 에러는 로깅만 (알림 없음)

---

## Examples (Tabular)

| Case | Parser Results | Expected Behavior |
|------|---------------|----|
| All success | A: ✅, B: ✅ | Process all events, no error |
| One fails | A: ✅, B: ❌ "timeout" | Process A events, log B error |
| All fail | A: ❌ "net error", B: ❌ "timeout" | Collect errors, send error summary to Telegram |
| Empty events | A: ✅ [], B: ✅ [] | No events, no error (normal) |

---

## API (Summary)

**Changes to `handleScheduled()`**:
- Collect per-parser errors during `allSettled()` iteration
- Check if `allEvents.length === 0` AND there are parser errors
- If all parsers failed: aggregate errors and send summary
- Otherwise: continue as before

**Error Summary Format** (example):
```
❌ 모든 파서 실패 (2개)

⚠️ 혈액정보:
Connection timeout

⚠️ KTCU 혈액:
HTML parsing failed: Invalid <html>
```

---

## Data & State

- No schema changes
- No KV changes
- Error aggregation is in-memory during execution

---

## Implementation Notes

1. **Error Collection**:
   - During `Promise.allSettled()` loop, collect failed parser errors
   - Store as `Map<parserName, errorMessage>`

2. **Detection Logic**:
   - After all parsers complete: `if (allEvents.length === 0 && parserErrors.size > 0)`
   - This distinguishes "no events today" from "all parsers failed"

3. **Notification**:
   - Format error summary as readable text
   - Use existing `sendErrorNotification()` (already XSS-safe from TASK-001)
   - Send before throwing error (so Telegram gets the message)

4. **Code locations**:
   - Line 59-63: Extend error collection logic
   - Line 65-75: Add all-parser-failed check
   - Line 96-110: Keep existing error handler, but may already be triggered

---

## Tracing

**Spec-ID**: SPEC-PARSER-ERROR-AGGREGATION-001
**Task-ID**: TASK-002
**Related Issue**: CodeQL Medium finding (silent data loss on parser failure)
**Test Files**: `tests/index.test.ts`
**Implementation Files**: `src/index.ts`
