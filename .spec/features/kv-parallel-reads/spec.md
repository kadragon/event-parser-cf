# KV 조회 병렬화

**Intent**: 이벤트 필터링 시 개별 KV 조회를 병렬화하여 성능 개선

**Scope**:
- In: `src/kv.ts:88-95` 의 `filterNewEvents()` 함수
- Out: KV 저장소 구조, 필터 결과 포맷은 유지

**Dependencies**:
- 동시 실행 제한 유틸리티 (간단히 구현)
- 기존 `getEventKey()`, KV 조회 로직 유지

---

## Behaviour (GWT)

- **AC-1**: 이벤트 조회가 병렬로 처리된다 (동시 제한 있음)
  - GIVEN 50개 이벤트 필터링
  - WHEN `filterNewEvents()` 호출
  - THEN 최대 5개씩 병렬 조회 (동시 제한: 5)

- **AC-2**: 필터 결과는 순서대로 반환된다
  - GIVEN 입력 순서: [A, B, C, D, E]
  - WHEN 병렬 조회 완료
  - THEN 반환 순서도 [?, ?, ?, ?, ?] (비교: 입력과 동일한 순서)

- **AC-3**: 조회 실패해도 진행된다
  - GIVEN 10개 이벤트 중 1개 KV 오류
  - WHEN 조회 완료
  - THEN 나머지 9개는 정상 처리

---

## Examples (Tabular)

| Case | Events | Concurrency | Expected |
|------|--------|-------------|----------|
| Small batch | 5 | 5 | All parallel (no waiting) |
| Medium batch | 50 | 5 | 10 waves of 5 parallel |
| Large batch | 1000 | 5 | 200 waves, still O(N/5) |

---

## API (Summary)

**Changes to `filterNewEvents()`**:
- Implement parallel batch processing with concurrency limit
- Use `Promise.allSettled()` for each batch
- Maintain result order (input order = output order)
- Log any individual KV failures

**Concurrency limit**: 5 (tunable)

---

## Data & State

- No schema changes
- No KV changes
- Only query execution strategy differs

---

## Implementation Notes

1. **Current code** (line 88-95):
   ```typescript
   const results = [];
   for (const eventKey of eventKeys) {
     const isSent = await kvNamespace.get(eventKey);  // Sequential
     results.push({ siteId, eventId, isSent: !!isSent });
   }
   ```

2. **New code**:
   ```typescript
   const results = [];
   for (let i = 0; i < eventKeys.length; i += CONCURRENCY_LIMIT) {
     const batch = eventKeys.slice(i, i + CONCURRENCY_LIMIT);
     const batchResults = await Promise.allSettled(
       batch.map(key => kvNamespace.get(key))
     );
     // Append results maintaining order
     results.push(...batchResults.map((r, idx) => ({ ... })));
   }
   ```

3. **Concurrency limit**: 5 events per batch (tunable via constant)

---

## Tracing

**Spec-ID**: SPEC-KV-PARALLEL-READS-001
**Task-ID**: TASK-004
**Related Issue**: CodeQL Medium finding (sequential KV reads cause latency)
**Test Files**: `tests/kv.test.ts`
**Implementation Files**: `src/kv.ts`
