# KV 쓰기 순차 처리 문제 해결

**Intent**: 이벤트 KV 쓰기를 병렬화하여 신뢰성 개선

**Scope**:
- In: `src/index.ts:87-89` 의 `markEventAsSent()` 순차 호출
- Out: KV 저장소 구조, 개별 이벤트 처리는 유지

**Dependencies**:
- 기존 `markEventAsSent()` 함수 사용
- `Promise.allSettled()` 활용

---

## Behaviour (GWT)

- **AC-1**: 모든 이벤트 KV 쓰기가 병렬로 처리된다
  - GIVEN 5개 이벤트 전송 완료
  - WHEN `markEventAsSent()` 호출
  - THEN 5개 모두 동시에 KV에 쓰기 (순차 아님)

- **AC-2**: 일부 KV 쓰기 실패해도 나머지 처리된다
  - GIVEN 3개 이벤트, 2번째 이벤트 KV 실패
  - WHEN `markEventAsSent()` 순환 처리
  - THEN 1번, 3번 이벤트는 성공, 2번은 로깅되고 계속 진행

- **AC-3**: 모든 KV 쓰기 결과가 로깅된다
  - GIVEN 5개 이벤트 중 2개 실패
  - WHEN 쓰기 완료
  - THEN 성공 3개, 실패 2개 모두 로깅

---

## Examples (Tabular)

| Case | Events | KV Result | Expected |
|------|--------|-----------|----------|
| All success | 5 events | all ✅ | Log 5 successes, continue |
| One fails | 5 events | 1 ❌, 4 ✅ | Log per-failure, continue |
| All fail | 5 events | all ❌ | Log all failures, still continue |

---

## API (Summary)

**Changes to `handleScheduled()`**:
- Replace sequential `for` loop with `Promise.allSettled()`
- Log individual success/failure for each event
- Continue processing even if some KV writes fail
- No throwing on partial KV failure

---

## Data & State

- No schema changes
- No KV changes
- Only execution strategy differs

---

## Implementation Notes

1. **Current code** (line 87-89):
   ```typescript
   for (const event of eventsToSend) {
     await markEventAsSent(...)  // Sequential
   }
   ```

2. **New code**:
   ```typescript
   const markResults = await Promise.allSettled(
     eventsToSend.map(e => markEventAsSent(...))
   );
   markResults.forEach((result, idx) => {
     if (result.status === 'fulfilled') {
       console.log(`Marked ${eventsToSend[idx].title} as sent`);
     } else {
       console.error(`Failed to mark ${eventsToSend[idx].title}: ${result.reason}`);
     }
   });
   ```

---

## Tracing

**Spec-ID**: SPEC-KV-WRITE-BATCHING-001
**Task-ID**: TASK-003
**Related Issue**: CodeQL Medium finding (KV write failure blocking entire run)
**Test Files**: `tests/index.test.ts`
**Implementation Files**: `src/index.ts`
